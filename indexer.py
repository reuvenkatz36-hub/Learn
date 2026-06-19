"""
indexer.py
==========
One-time (re-runnable) pipeline that turns your local library of books into a
searchable vector store.

What it does
------------
1. Reads every supported file in ``BOOKS_DIR`` (.pdf, .txt, .md).
2. Extracts plain text (PDFs via ``pypdf``).
3. Splits each book into overlapping, paragraph-aware chunks.
4. Embeds the chunks locally (sentence-transformers, no API key needed) and
   stores them in a persistent ChromaDB collection, tagged with the source
   book so the bot can attribute and contrast perspectives later.

Usage
-----
    python indexer.py            # index everything (incremental: skips unchanged books)
    python indexer.py --rebuild  # wipe the collection and re-index from scratch

Run this once after dropping your 15 books into the ``books/`` folder, and any
time you add, remove, or change a book.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

import config

# File extensions we know how to read.
SUPPORTED_SUFFIXES = {".pdf", ".txt", ".md"}


# --------------------------------------------------------------------------- #
# Text extraction
# --------------------------------------------------------------------------- #
def extract_text(path: Path) -> str:
    """Return the plain-text content of a single book file."""
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md"}:
        # Read as UTF-8, tolerating the occasional bad byte.
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        # Imported lazily so a missing pypdf only matters if you actually have PDFs.
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        pages: list[str] = []
        for page in reader.pages:
            try:
                pages.append(page.extract_text() or "")
            except Exception as exc:  # noqa: BLE001 - keep going on a bad page
                print(f"  ! Could not read a page in {path.name}: {exc}")
        return "\n\n".join(pages)

    raise ValueError(f"Unsupported file type: {path}")


# --------------------------------------------------------------------------- #
# Chunking
# --------------------------------------------------------------------------- #
def chunk_text(
    text: str,
    chunk_size: int = config.CHUNK_SIZE,
    overlap: int = config.CHUNK_OVERLAP,
) -> list[str]:
    """
    Split ``text`` into overlapping chunks of roughly ``chunk_size`` characters.

    We greedily pack whole paragraphs into a chunk until adding the next one
    would exceed the target size. Overlap is achieved by carrying the tail of
    the previous chunk into the next, which preserves context across boundaries
    (important for retrieval quality).
    """
    # Normalize whitespace and split into paragraphs.
    paragraphs = [p.strip() for p in text.replace("\r\n", "\n").split("\n\n")]
    paragraphs = [p for p in paragraphs if p]

    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        # If a single paragraph is larger than the chunk size, hard-split it.
        if len(para) > chunk_size:
            if current:
                chunks.append(current)
                current = ""
            for i in range(0, len(para), chunk_size - overlap):
                chunks.append(para[i : i + chunk_size])
            continue

        if len(current) + len(para) + 2 <= chunk_size:
            current = f"{current}\n\n{para}".strip()
        else:
            chunks.append(current)
            # Start the next chunk with an overlap tail from the previous one.
            tail = current[-overlap:] if overlap else ""
            current = f"{tail}\n\n{para}".strip()

    if current:
        chunks.append(current)

    return chunks


# --------------------------------------------------------------------------- #
# Vector store
# --------------------------------------------------------------------------- #
def get_collection(rebuild: bool = False):
    """Open (or create) the persistent ChromaDB collection."""
    config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))

    # Local embedding function — downloads the model on first use, then caches.
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=config.EMBEDDING_MODEL
    )

    if rebuild:
        try:
            client.delete_collection(config.COLLECTION_NAME)
            print("Existing collection deleted (rebuild).")
        except Exception:  # noqa: BLE001 - collection may not exist yet
            pass

    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},
    )


def book_id(path: Path) -> str:
    """A stable, filesystem-independent identifier for a book."""
    return hashlib.sha1(path.name.encode("utf-8")).hexdigest()[:12]


def index_book(collection, path: Path) -> int:
    """Extract, chunk, and store one book. Returns the number of chunks added."""
    bid = book_id(path)

    # Incremental indexing: if this book already has chunks, skip it. Re-add a
    # changed book by running with --rebuild, or delete its chunks first.
    existing = collection.get(where={"book_id": bid}, limit=1)
    if existing and existing.get("ids"):
        print(f"  · {path.name}: already indexed, skipping.")
        return 0

    text = extract_text(path)
    if not text.strip():
        print(f"  ! {path.name}: no extractable text, skipping.")
        return 0

    chunks = chunk_text(text)
    ids = [f"{bid}-{i}" for i in range(len(chunks))]
    metadatas = [
        {"book_id": bid, "book": path.name, "chunk_index": i}
        for i in range(len(chunks))
    ]

    # Add in batches to keep memory and request sizes reasonable.
    BATCH = 256
    for start in range(0, len(chunks), BATCH):
        end = start + BATCH
        collection.add(
            ids=ids[start:end],
            documents=chunks[start:end],
            metadatas=metadatas[start:end],
        )

    print(f"  ✓ {path.name}: {len(chunks)} chunks indexed.")
    return len(chunks)


def discover_books() -> list[Path]:
    """Return all supported book files in BOOKS_DIR, sorted by name."""
    if not config.BOOKS_DIR.exists():
        raise SystemExit(
            f"Books directory not found: {config.BOOKS_DIR}\n"
            "Create it and add your books (see README.md)."
        )
    return sorted(
        p
        for p in config.BOOKS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Index the local book library.")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Delete the existing collection and re-index everything.",
    )
    args = parser.parse_args()

    books = discover_books()
    if not books:
        raise SystemExit(
            f"No supported books found in {config.BOOKS_DIR} "
            f"(looking for {', '.join(sorted(SUPPORTED_SUFFIXES))})."
        )

    print(f"Found {len(books)} book(s) in {config.BOOKS_DIR}\n")
    collection = get_collection(rebuild=args.rebuild)

    total = 0
    for path in books:
        try:
            total += index_book(collection, path)
        except Exception as exc:  # noqa: BLE001 - one bad book shouldn't abort all
            print(f"  ! Failed to index {path.name}: {exc}", file=sys.stderr)

    print(
        f"\nDone. Collection '{config.COLLECTION_NAME}' now holds "
        f"{collection.count()} chunks total ({total} added this run)."
    )


if __name__ == "__main__":
    main()
