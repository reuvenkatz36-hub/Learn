# 📚 Daily Personalized Learning Synthesizer (Telegram Bot)

A Telegram bot that reads across a library of your books and writes you a
**15–20 page ("~4,000–5,000 word") Deep-Dive Reading Packet** on a topic —
either on demand or automatically every morning. Instead of summarizing one
book, it actively pulls the **unique frameworks, perspectives, and
disagreements** from across the whole library and synthesizes them into one
cohesive, high-density educational chapter, delivered as a clean **PDF**.

---

## How it works

```
 books/ (PDF/TXT)  ──►  indexer.py  ──►  ChromaDB vector store
                                              │
   /teach <topic>  ─┐                         │ (semantic retrieval)
   daily scheduler ─┴─►  bot.py  ──►  retrieve passages, grouped by book
                                     ──►  Claude Opus 4.8 synthesizes a chapter
                                     ──►  render Markdown + PDF
                                     ──►  send as a Telegram document
```

| File              | Role                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `config.py`       | All settings, paths, and the progressive curriculum.                  |
| `indexer.py`      | Parses, chunks, embeds your books into the vector store (run once).   |
| `bot.py`          | Telegram handlers, retrieval, synthesis, PDF rendering, scheduling.   |
| `requirements.txt`| Python dependencies.                                                   |
| `.env.example`    | Template for your secrets/config.                                     |

---

## 1. Folder structure

```
learn/
├── books/            ← PUT YOUR 15 BOOKS HERE (.pdf, .txt, or .md)
│   ├── book-01.pdf
│   ├── book-02.pdf
│   └── ...
├── config.py
├── indexer.py
├── bot.py
├── requirements.txt
├── .env              ← you create this from .env.example
├── vector_store/     ← created automatically by indexer.py
└── packets/          ← created automatically (generated PDFs/Markdown)
```

Create the books folder and drop your files in:

```bash
mkdir -p books
# copy your PDFs/text files into ./books
```

> Any mix of `.pdf`, `.txt`, and `.md` works. Filenames are used as the source
> attribution in the packets, so name them readably
> (e.g. `Thinking-Fast-and-Slow.pdf`).

---

## 2. Install

Python **3.10+** is required.

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

> The first run downloads a small local embedding model
> (`all-MiniLM-L6-v2`, ~90 MB) — no embedding API key needed.

---

## 3. Add your API keys

1. **Telegram bot token** — message [@BotFather](https://t.me/BotFather) on
   Telegram, send `/newbot`, follow the prompts, and copy the token.
2. **Anthropic API key** — create one at
   [console.anthropic.com](https://console.anthropic.com/).

Then create your `.env`:

```bash
cp .env.example .env
# edit .env and paste in your real TELEGRAM_BOT_TOKEN and ANTHROPIC_API_KEY
```

(You can also just `export` these as environment variables instead of using a
`.env` file.)

---

## 4. Index your books (run once)

```bash
python indexer.py
```

This reads every book, chunks and embeds it, and writes the vector store to
`vector_store/`. It's **incremental** — re-running skips books already indexed.
Added/changed/removed a book? Re-index from scratch with:

```bash
python indexer.py --rebuild
```

---

## 5. Run the bot

```bash
python bot.py
```

The bot connects to Telegram via long-polling and starts the daily scheduler.
Open your bot in Telegram and send `/start`.

### Commands

| Command              | What it does                                                     |
| -------------------- | --------------------------------------------------------------- |
| `/teach <topic>`     | **On-demand:** generate a packet on any topic right now.        |
| `/subscribe`         | Receive the automatic daily packet.                            |
| `/unsubscribe`       | Stop daily packets.                                            |
| `/topics`            | List topics already covered.                                   |
| `/help`              | Show help.                                                     |

**Auto-Mode:** once you `/subscribe`, the bot sends a packet every day at the
time set by `DAILY_HOUR` / `DAILY_MINUTE` / `TIMEZONE`. It walks the
`CURRICULUM` list in `config.py` in order, and once that's exhausted it asks a
fast model to propose progressive new topics — tracking everything in
`state.db` so nothing repeats.

---

## 6. Customize

Everything tunable lives in `config.py` (overridable via `.env`):

- **`CURRICULUM`** — replace with topics that match *your* books. This drives
  Auto-Mode.
- **`SYNTHESIS_MODEL`** — defaults to `claude-opus-4-8` (most capable). For
  lower cost you could set `claude-sonnet-4-6`.
- **`RETRIEVAL_TOP_K`** — how many passages feed each synthesis (more sources →
  richer contrast, higher token cost).
- **`SYNTHESIS_MAX_TOKENS` / `SYNTHESIS_EFFORT`** — length/depth vs. cost.
- **`DAILY_HOUR` / `DAILY_MINUTE` / `TIMEZONE`** — when Auto-Mode fires.
- **The synthesis prompt** — `SYSTEM_PROMPT` in `bot.py` is where the
  "synthesize and contrast across books, no filler" behavior is enforced. Edit
  it to change the structure or tone of the packets.

---

## Notes & tips

- **Why a PDF and not chat messages?** Telegram caps a single message at 4,096
  characters; a 5,000-word packet would be ~30+ messages. The bot compiles the
  output into a styled PDF (falling back to Markdown if PDF rendering fails)
  and sends it as a document attachment.
- **Cost:** each packet is one long Claude call (~tens of thousands of output
  tokens). With Opus 4.8 that's a few cents to a couple of dimes per packet
  depending on length. Use `claude-sonnet-4-6` to cut cost roughly in half.
- **Scaling / persistence:** the bot is stateful via `state.db`. Run it on a
  small always-on VM (or a process manager like `systemd`/`supervisor`/`pm2`)
  so the daily scheduler keeps firing.
- **First synthesis is slow** — long-form generation can take a couple of
  minutes; the bot shows a "typing/uploading" indicator while it works.

---

## Troubleshooting

| Symptom                                            | Fix                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `No source material found...`                      | Run `python indexer.py` first; make sure `books/` has files.          |
| `Missing required environment variable(s)`         | Set `TELEGRAM_BOT_TOKEN` and `ANTHROPIC_API_KEY` (in `.env`).          |
| PDF looks plain / Markdown sent instead            | `xhtml2pdf` failed on some content; the `.md` is sent as a fallback.  |
| Daily packet never arrives                         | Confirm you `/subscribe`d, the bot process stays running, and `TIMEZONE`/time are correct. |
| PDF text extraction is empty for a book            | Scanned/image-only PDFs have no text layer — OCR them first, or use a `.txt`/`.md` version. |
