"""
config.py
=========
Central configuration shared by ``indexer.py`` and ``bot.py``.

Everything that you might reasonably want to tweak (paths, model names,
retrieval depth, the daily schedule, the progressive curriculum) lives here so
the other modules stay focused on logic.

Secrets are read from environment variables (optionally via a local ``.env``
file loaded by ``python-dotenv``). Never hard-code API keys.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load variables from a local .env file if present (no-op if it doesn't exist).
load_dotenv()

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
# Absolute path to this project's root directory.
BASE_DIR = Path(__file__).resolve().parent

# Where your 15 source books live (PDFs and/or .txt/.md files).
BOOKS_DIR = Path(os.getenv("BOOKS_DIR", BASE_DIR / "books"))

# Where the persistent ChromaDB vector store is written by the indexer and
# read by the bot.
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", BASE_DIR / "vector_store"))

# Where generated reading packets (Markdown + PDF) are written before being
# sent to Telegram.
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", BASE_DIR / "packets"))

# SQLite database tracking covered topics, subscribers, and preferences.
STATE_DB = Path(os.getenv("STATE_DB", BASE_DIR / "state.db"))

# Name of the ChromaDB collection that holds the embedded book chunks.
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "library")

# --------------------------------------------------------------------------- #
# Secrets / API keys
# --------------------------------------------------------------------------- #
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
# The Anthropic SDK reads ANTHROPIC_API_KEY from the environment automatically;
# we surface it here only so we can fail fast with a clear error message.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# --------------------------------------------------------------------------- #
# LLM / synthesis settings
# --------------------------------------------------------------------------- #
# Claude Opus 4.8 is Anthropic's most capable model and is well-suited to
# high-quality, long-form synthesis. See https://docs.claude.com for details.
SYNTHESIS_MODEL = os.getenv("SYNTHESIS_MODEL", "claude-opus-4-8")

# A small, fast model used for cheap auxiliary calls (e.g. proposing the next
# curriculum topic when the static curriculum is exhausted).
PLANNER_MODEL = os.getenv("PLANNER_MODEL", "claude-haiku-4-5")

# Upper bound on output tokens for the synthesis call. ~5,000 words is roughly
# 7,000 tokens; we leave generous headroom. Large max_tokens REQUIRES streaming
# (the SDK enforces this to avoid HTTP timeouts), which bot.py uses.
SYNTHESIS_MAX_TOKENS = int(os.getenv("SYNTHESIS_MAX_TOKENS", "32000"))

# Effort controls how deeply the model thinks/works. "high" is the sweet spot
# for quality-sensitive long-form generation.
SYNTHESIS_EFFORT = os.getenv("SYNTHESIS_EFFORT", "high")

# --------------------------------------------------------------------------- #
# Retrieval settings
# --------------------------------------------------------------------------- #
# Target size (in characters) for each text chunk, with overlap to preserve
# context across chunk boundaries.
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "250"))

# How many passages to pull from the vector store per topic. We pull a broad
# set so the synthesis has material from many books to compare and contrast.
RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "28"))

# Embedding model used by ChromaDB (runs locally via sentence-transformers, so
# no embedding API key is required).
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# --------------------------------------------------------------------------- #
# Scheduling
# --------------------------------------------------------------------------- #
# Daily auto-send time (24h local time of the machine running the bot).
DAILY_HOUR = int(os.getenv("DAILY_HOUR", "7"))
DAILY_MINUTE = int(os.getenv("DAILY_MINUTE", "0"))
# IANA timezone for the scheduler (e.g. "America/New_York", "Europe/London").
TIMEZONE = os.getenv("TIMEZONE", "UTC")

# --------------------------------------------------------------------------- #
# Progressive curriculum
# --------------------------------------------------------------------------- #
# In Auto-Mode the bot walks through this list in order, picking the first
# topic it hasn't covered yet. When the list is exhausted it asks the planner
# model to propose a fresh, non-repeating topic. Edit this freely to match the
# subject matter of YOUR 15 books.
CURRICULUM: list[str] = [
    "Foundational mental models for decision-making under uncertainty",
    "How experts build and refine intuition",
    "Systems thinking: feedback loops, stocks, and flows",
    "The psychology of habit formation and behavior change",
    "First-principles reasoning versus reasoning by analogy",
    "Incentives and their second-order effects",
    "Deliberate practice and the structure of skill acquisition",
    "Cognitive biases and practical debiasing techniques",
    "The economics of attention and focus",
    "Negotiation, persuasion, and the dynamics of influence",
    "Risk, ruin, and asymmetric payoffs",
    "Leadership, trust, and high-performing teams",
    "Creativity, combinatorial thinking, and idea generation",
    "Long-term thinking and compounding across domains",
    "Resilience, antifragility, and learning from failure",
]


def assert_configured() -> None:
    """Fail fast with a helpful message if required secrets are missing."""
    missing = []
    if not TELEGRAM_BOT_TOKEN:
        missing.append("TELEGRAM_BOT_TOKEN")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if missing:
        raise SystemExit(
            "Missing required environment variable(s): "
            + ", ".join(missing)
            + "\nSet them in your shell or in a .env file (see README.md)."
        )
