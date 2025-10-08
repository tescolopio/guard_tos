#!/usr/bin/env python3
"""Extracts and chunks text from harvested legal HTML documents.

This script processes raw HTML files (e.g., GDPR, CCPA) into chunked text
suitable for weak supervision labeling. Chunks are saved as JSONL records.

Example:
    python scripts/corpus/preprocess_legal_html.py \
        --input data/raw/gdpr_eur_2016_679/20251007/gdpr.html \
        --output data/corpus/gdpr_chunks.jsonl \
        --source gdpr
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from bs4 import BeautifulSoup
except ImportError:
    raise SystemExit("BeautifulSoup4 is required. Install it with: pip install beautifulsoup4")


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Path to input HTML file")
    parser.add_argument("--output", required=True, help="Path to output JSONL file")
    parser.add_argument("--source", required=True, help="Source identifier (e.g., gdpr, ccpa)")
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=400,
        help="Target number of words per chunk",
    )
    parser.add_argument(
        "--overlap",
        type=int,
        default=50,
        help="Number of words to overlap between chunks",
    )
    return parser.parse_args()


def extract_text_from_html(html_path: Path) -> str:
    """Extracts plain text from an HTML file."""
    with html_path.open("r", encoding="utf-8") as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Remove script and style elements
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()
    
    # Get text
    text = soup.get_text()
    
    # Normalize whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = " ".join(chunk for chunk in chunks if chunk)
    
    return text


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[Tuple[str, int, int]]:
    """
    Splits text into overlapping chunks.
    
    Returns a list of tuples: (chunk_text, start_word_index, end_word_index)
    """
    words = text.split()
    chunks = []
    
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_text = " ".join(chunk_words)
        chunks.append((chunk_text, start, end))
        
        if end >= len(words):
            break
        
        start = end - overlap
    
    return chunks


def main() -> None:
    """Main function to drive the preprocessing."""
    args = parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Extracting text from {input_path}...")
    text = extract_text_from_html(input_path)
    
    print(f"Chunking text (chunk_size={args.chunk_size}, overlap={args.overlap})...")
    chunks = chunk_text(text, args.chunk_size, args.overlap)
    
    print(f"Writing {len(chunks)} chunks to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for idx, (text_chunk, start, end) in enumerate(chunks):
            record = {
                "text": text_chunk,
                "source": args.source,
                "chunk_id": idx,
                "word_range": [start, end],
                "meta": {
                    "source_file": str(input_path),
                    "word_count": end - start,
                }
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    print(f"Successfully wrote {len(chunks)} chunks.")


if __name__ == "__main__":
    main()
