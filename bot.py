"""
bot.py
======
The Daily Personalized Learning Synthesizer — Telegram bot.

Responsibilities
----------------
* **Retrieval** — pull the most relevant passages for a topic from the
  ChromaDB store built by ``indexer.py``, grouped by source book.
* **Synthesis** — prompt Claude (Opus 4.8) to write a dense, multi-section,
  ~4,000–5,000 word "Deep-Dive Reading Packet" that actively compares and
  contrasts what different books say about the topic.
* **Delivery** — render the result to a clean Markdown + PDF document and send
  it to the user as a file attachment (Telegram caps plain messages at 4,096
  characters, so long-form content must be a document).
* **Triggers**
    - On-demand:  ``/teach <topic>``
    - Auto-mode:  a daily APScheduler job that walks a progressive curriculum
                  and broadcasts the packet to all subscribers.
* **State** — a small SQLite database tracks covered topics, subscribers, and
  per-user preferences.

Run with:  ``python bot.py``
"""

from __future__ import annotations

import asyncio
import datetime as dt
import html
import logging
import re
import sqlite3
from contextlib import closing
from pathlib import Path

import chromadb
from anthropic import AsyncAnthropic
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from chromadb.utils import embedding_functions
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
)

import config

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
log = logging.getLogger("synthesizer")

# A single shared Anthropic async client (reused across requests).
anthropic_client = AsyncAnthropic()  # reads ANTHROPIC_API_KEY from the env


# ======================================================================= #
# State (SQLite)
# ======================================================================= #
def init_db() -> None:
    """Create tables if they don't exist yet."""
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS covered_topics (
                topic       TEXT PRIMARY KEY,
                covered_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS subscribers (
                chat_id        INTEGER PRIMARY KEY,
                subscribed_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS preferences (
                chat_id  INTEGER PRIMARY KEY,
                key      TEXT,
                value    TEXT
            );
            """
        )
        conn.commit()


def mark_topic_covered(topic: str) -> None:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO covered_topics (topic, covered_at) VALUES (?, ?)",
            (topic.strip().lower(), dt.datetime.utcnow().isoformat()),
        )
        conn.commit()


def is_topic_covered(topic: str) -> bool:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        row = conn.execute(
            "SELECT 1 FROM covered_topics WHERE topic = ?",
            (topic.strip().lower(),),
        ).fetchone()
    return row is not None


def covered_topics() -> list[str]:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        rows = conn.execute(
            "SELECT topic FROM covered_topics ORDER BY covered_at"
        ).fetchall()
    return [r[0] for r in rows]


def add_subscriber(chat_id: int) -> None:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO subscribers (chat_id, subscribed_at) VALUES (?, ?)",
            (chat_id, dt.datetime.utcnow().isoformat()),
        )
        conn.commit()


def remove_subscriber(chat_id: int) -> None:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        conn.execute("DELETE FROM subscribers WHERE chat_id = ?", (chat_id,))
        conn.commit()


def all_subscribers() -> list[int]:
    with closing(sqlite3.connect(config.STATE_DB)) as conn:
        rows = conn.execute("SELECT chat_id FROM subscribers").fetchall()
    return [r[0] for r in rows]


# ======================================================================= #
# Retrieval
# ======================================================================= #
def _open_collection():
    """Open the persistent collection produced by indexer.py (read side)."""
    client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=config.EMBEDDING_MODEL
    )
    return client.get_collection(
        name=config.COLLECTION_NAME, embedding_function=embed_fn
    )


def _retrieve_sync(topic: str, top_k: int) -> dict[str, list[str]]:
    """
    Query the vector store for ``topic`` and return passages grouped by book.

    Returns a mapping of ``{book_name: [passage, ...]}``. Runs synchronously;
    callers should wrap it in ``asyncio.to_thread`` to avoid blocking the loop.
    """
    collection = _open_collection()
    result = collection.query(
        query_texts=[topic],
        n_results=top_k,
        include=["documents", "metadatas"],
    )

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]

    grouped: dict[str, list[str]] = {}
    for doc, meta in zip(documents, metadatas):
        book = (meta or {}).get("book", "Unknown source")
        grouped.setdefault(book, []).append(doc)
    return grouped


async def retrieve_context(topic: str) -> dict[str, list[str]]:
    return await asyncio.to_thread(_retrieve_sync, topic, config.RETRIEVAL_TOP_K)


def build_source_block(grouped: dict[str, list[str]]) -> str:
    """Format grouped passages into a labelled context block for the prompt."""
    parts: list[str] = []
    for book, passages in grouped.items():
        parts.append(f"### SOURCE: {book}")
        for i, passage in enumerate(passages, 1):
            parts.append(f"[Passage {i}]\n{passage}")
        parts.append("")  # blank line between books
    return "\n".join(parts)


# ======================================================================= #
# Synthesis engine (the most important part)
# ======================================================================= #
SYSTEM_PROMPT = """\
You are a master synthesizer and educator who writes dense, original, \
graduate-seminar-quality reading material. You are given verbatim passages \
extracted from a curated library of books, each labelled with its source. \
Your job is NOT to summarize a single book and NOT to write generic filler. \
Your job is to weave the DISTINCT perspectives, frameworks, terminology, and \
DISAGREEMENTS across the different books into one cohesive, high-density \
educational chapter on the requested topic.

Hard requirements:
- Length: a substantial chapter of roughly 4,000–5,000 words (15–20 pages). \
Do not pad; every paragraph must carry real information.
- Ground your claims in the supplied source passages. When a specific book \
contributes a framework, idea, or example, attribute it by name \
(e.g. "In <Book Title>, the author argues..."). Synthesize across at least \
several different sources.
- Actively surface CONTRAST and TENSION: where two books frame the same idea \
differently, or where they would disagree, say so explicitly and explore it.
- You may use your own expertise to connect, explain, and structure the \
material, but the unique frameworks must come from the sources, not invented.
- Write in clean Markdown.

Required structure (use these as ## section headers, adapting wording to the topic):
1. ## Introduction — frame the topic and why it matters; preview the journey.
2. ## Core Frameworks — the key models/ideas, attributed to their sources.
3. ## Contrasting Perspectives — explicitly compare how different books treat \
the topic (e.g. "Book A vs Book B"), including where they conflict.
4. ## Synthesis — reconcile or integrate the perspectives into a unified view.
5. ## Practical Applications — concrete, actionable ways to apply the ideas.
6. ## Key Takeaways — a tight bulleted distillation.

Begin the document with a single H1 title (# ...) for the topic.
"""

USER_PROMPT_TEMPLATE = """\
TOPIC FOR TODAY'S DEEP-DIVE READING PACKET:
{topic}

Below are passages retrieved from the library, grouped by source book. Use \
them as your primary raw material. Attribute frameworks to the books they \
came from and draw out the contrasts between sources.

================ SOURCE PASSAGES ================
{sources}
================ END SOURCE PASSAGES ============

Now write the complete ~4,000–5,000 word reading packet in Markdown, following \
the required structure. Do not include any preamble such as "Here is the \
packet" — start directly with the H1 title.
"""


async def synthesize_packet(topic: str) -> str:
    """
    Run the full retrieve → synthesize pipeline and return Markdown text.

    Uses streaming because ``max_tokens`` is large; the SDK refuses large
    non-streaming requests to avoid HTTP timeouts. ``get_final_message`` gives
    us the assembled response once the stream completes.
    """
    grouped = await retrieve_context(topic)
    if not grouped:
        raise RuntimeError(
            "No source material found. Have you run `python indexer.py` yet?"
        )

    sources = build_source_block(grouped)
    user_prompt = USER_PROMPT_TEMPLATE.format(topic=topic, sources=sources)

    log.info(
        "Synthesizing '%s' from %d source book(s)...", topic, len(grouped)
    )

    async with anthropic_client.messages.stream(
        model=config.SYNTHESIS_MODEL,
        max_tokens=config.SYNTHESIS_MAX_TOKENS,
        thinking={"type": "adaptive"},  # let Claude decide how deeply to think
        output_config={"effort": config.SYNTHESIS_EFFORT},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        message = await stream.get_final_message()

    # Concatenate all text blocks (skip thinking blocks).
    text = "".join(
        block.text for block in message.content if block.type == "text"
    ).strip()

    if not text:
        raise RuntimeError("The model returned no text content.")
    return text


async def propose_next_topic() -> str:
    """
    Pick the next Auto-Mode topic.

    Strategy: walk the static curriculum and return the first uncovered topic.
    If every curriculum item is covered, ask a cheap model to propose a fresh,
    progressive, non-repeating topic given the history.
    """
    for topic in config.CURRICULUM:
        if not is_topic_covered(topic):
            return topic

    # Curriculum exhausted — generate a novel topic that doesn't repeat history.
    history = covered_topics()
    history_block = "\n".join(f"- {t}" for t in history) or "(none yet)"
    resp = await anthropic_client.messages.create(
        model=config.PLANNER_MODEL,
        max_tokens=200,
        system=(
            "You design a progressive self-education curriculum. Propose ONE "
            "specific, substantive next topic that builds on what has been "
            "covered without repeating it. Reply with ONLY the topic, as a "
            "short phrase — no preamble, no quotes."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    "Topics already covered:\n"
                    f"{history_block}\n\n"
                    "Propose the next topic."
                ),
            }
        ],
    )
    topic = "".join(
        b.text for b in resp.content if b.type == "text"
    ).strip().strip('"')
    return topic or "Advanced applications of everything covered so far"


# ======================================================================= #
# Rendering (Markdown -> file, and Markdown -> PDF)
# ======================================================================= #
def _slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:60] or "packet"


def write_markdown(topic: str, body_md: str) -> Path:
    """Persist the raw Markdown packet to OUTPUT_DIR and return its path."""
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    date = dt.date.today().isoformat()
    path = config.OUTPUT_DIR / f"{date}_{_slugify(topic)}.md"
    path.write_text(body_md, encoding="utf-8")
    return path


def render_pdf(topic: str, body_md: str) -> Path | None:
    """
    Convert the Markdown packet to a styled PDF.

    Uses ``markdown2`` -> HTML -> ``xhtml2pdf`` (pure-Python, no system
    dependencies like wkhtmltopdf). Returns the PDF path, or ``None`` if PDF
    generation fails (the caller then falls back to sending the Markdown).
    """
    try:
        import markdown2
        from xhtml2pdf import pisa
    except Exception as exc:  # noqa: BLE001
        log.warning("PDF libraries unavailable (%s); will send Markdown.", exc)
        return None

    html_body = markdown2.markdown(
        body_md, extras=["fenced-code-blocks", "tables", "header-ids"]
    )
    date = dt.date.today().isoformat()
    styled = f"""\
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page {{ size: letter; margin: 2.2cm; }}
  body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11pt;
          line-height: 1.5; color: #1a1a1a; }}
  h1 {{ font-size: 22pt; color: #14213d; border-bottom: 2px solid #14213d;
        padding-bottom: 6px; }}
  h2 {{ font-size: 15pt; color: #14213d; margin-top: 22px; }}
  h3 {{ font-size: 12.5pt; color: #3a3a3a; }}
  blockquote {{ color: #444; border-left: 3px solid #ccc; padding-left: 10px; }}
  code {{ background: #f2f2f2; padding: 1px 3px; }}
  .meta {{ color: #888; font-size: 9pt; margin-bottom: 18px; }}
</style>
</head>
<body>
<div class="meta">Daily Deep-Dive Reading Packet &middot; {html.escape(date)}</div>
{html_body}
</body>
</html>
"""

    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = config.OUTPUT_DIR / f"{date}_{_slugify(topic)}.pdf"
    with open(pdf_path, "wb") as fh:
        result = pisa.CreatePDF(styled, dest=fh)
    if result.err:
        log.warning("xhtml2pdf reported errors; will send Markdown instead.")
        return None
    return pdf_path


async def deliver_packet(
    bot, chat_id: int, topic: str, body_md: str
) -> None:
    """Render the packet and send it to ``chat_id`` as a document."""
    md_path = write_markdown(topic, body_md)
    pdf_path = render_pdf(topic, body_md)

    caption = f"📚 Deep-Dive Reading Packet — {topic}"
    doc_path = pdf_path or md_path
    with open(doc_path, "rb") as fh:
        await bot.send_document(
            chat_id=chat_id,
            document=fh,
            filename=doc_path.name,
            caption=caption[:1024],
        )


# ======================================================================= #
# Core action: generate + deliver for one chat
# ======================================================================= #
async def generate_and_send(bot, chat_id: int, topic: str) -> None:
    """End-to-end: synthesize a packet for ``topic`` and send it to ``chat_id``."""
    await bot.send_chat_action(chat_id=chat_id, action=ChatAction.UPLOAD_DOCUMENT)
    body_md = await synthesize_packet(topic)
    await deliver_packet(bot, chat_id, topic, body_md)
    mark_topic_covered(topic)


# ======================================================================= #
# Telegram command handlers
# ======================================================================= #
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 *Welcome to your Daily Learning Synthesizer!*\n\n"
        "Every day I read across your library of books and write you a "
        "15–20 page deep-dive on one topic — synthesizing and contrasting "
        "what the different authors say.\n\n"
        "*Commands:*\n"
        "• /teach <topic> — generate a packet on any topic right now\n"
        "• /subscribe — get the automatic daily packet\n"
        "• /unsubscribe — stop daily packets\n"
        "• /topics — see what's been covered\n"
        "• /help — show this message",
        parse_mode="Markdown",
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await cmd_start(update, context)


async def cmd_teach(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """On-demand mode: /teach <topic>."""
    topic = " ".join(context.args).strip()
    if not topic:
        await update.message.reply_text(
            "Please give me a topic, e.g.\n`/teach the psychology of habits`",
            parse_mode="Markdown",
        )
        return

    chat_id = update.effective_chat.id
    await update.message.reply_text(
        f"🧠 Researching *{topic}* across your library and writing your "
        "packet… this can take a couple of minutes.",
        parse_mode="Markdown",
    )
    try:
        await generate_and_send(context.bot, chat_id, topic)
    except Exception as exc:  # noqa: BLE001
        log.exception("Failed to generate packet for '%s'", topic)
        await update.message.reply_text(f"⚠️ Something went wrong: {exc}")


async def cmd_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    add_subscriber(update.effective_chat.id)
    await update.message.reply_text(
        f"✅ Subscribed! You'll receive a fresh deep-dive every day at "
        f"{config.DAILY_HOUR:02d}:{config.DAILY_MINUTE:02d} ({config.TIMEZONE})."
    )


async def cmd_unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    remove_subscriber(update.effective_chat.id)
    await update.message.reply_text("🛑 Unsubscribed. You can /subscribe again anytime.")


async def cmd_topics(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    done = covered_topics()
    if not done:
        await update.message.reply_text("No topics covered yet — try /teach!")
        return
    lines = "\n".join(f"• {t}" for t in done[-30:])
    await update.message.reply_text(f"*Recently covered:*\n{lines}", parse_mode="Markdown")


# ======================================================================= #
# Auto-Mode: the daily scheduled job
# ======================================================================= #
async def daily_job(bot) -> None:
    """Pick the next curriculum topic and broadcast a packet to all subscribers."""
    subscribers = all_subscribers()
    if not subscribers:
        log.info("Daily job: no subscribers; skipping.")
        return

    topic = await propose_next_topic()
    log.info("Daily job: topic = '%s' for %d subscriber(s).", topic, len(subscribers))

    # Synthesize once, then fan the same packet out to everyone.
    try:
        body_md = await synthesize_packet(topic)
    except Exception:  # noqa: BLE001
        log.exception("Daily synthesis failed.")
        return

    for chat_id in subscribers:
        try:
            await deliver_packet(bot, chat_id, topic, body_md)
        except Exception:  # noqa: BLE001
            log.exception("Failed to deliver daily packet to %s", chat_id)

    mark_topic_covered(topic)


# ======================================================================= #
# Wiring & startup
# ======================================================================= #
def build_application() -> Application:
    application = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("teach", cmd_teach))
    application.add_handler(CommandHandler("subscribe", cmd_subscribe))
    application.add_handler(CommandHandler("unsubscribe", cmd_unsubscribe))
    application.add_handler(CommandHandler("topics", cmd_topics))
    return application


async def _post_init(application: Application) -> None:
    """Start the APScheduler daily job once the event loop is running."""
    scheduler = AsyncIOScheduler(timezone=config.TIMEZONE)
    scheduler.add_job(
        daily_job,
        trigger="cron",
        hour=config.DAILY_HOUR,
        minute=config.DAILY_MINUTE,
        args=[application.bot],
        id="daily_packet",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.start()
    # Keep a reference so it isn't garbage-collected.
    application.bot_data["scheduler"] = scheduler
    log.info(
        "Scheduler started: daily packet at %02d:%02d %s",
        config.DAILY_HOUR,
        config.DAILY_MINUTE,
        config.TIMEZONE,
    )


def main() -> None:
    config.assert_configured()
    init_db()

    application = build_application()
    application.post_init = _post_init

    log.info("Bot is starting (polling)…")
    # run_polling manages the event loop, startup, and graceful shutdown.
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
