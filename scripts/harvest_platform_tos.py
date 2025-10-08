#!/usr/bin/env python3
"""Harvest Terms of Service and Privacy Policy documents from major platforms.

This script uses web scraping to download ToS/Privacy Policy documents from
well-known platforms that are likely to contain implied consent clauses.

Example:
    python scripts/harvest_platform_tos.py \
        --output data/corpus/platform_tos_chunks.jsonl
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    raise SystemExit("Required libraries missing. Install with: pip install requests beautifulsoup4")


# List of ToS/Privacy Policy URLs from major platforms
PLATFORM_URLS = [
    ("reddit", "https://www.reddit.com/policies/privacy-policy", "Privacy Policy"),
    ("twitter", "https://twitter.com/en/privacy", "Privacy Policy"),
    ("discord", "https://discord.com/privacy", "Privacy Policy"),
    ("spotify", "https://www.spotify.com/us/legal/privacy-policy/", "Privacy Policy"),
    ("instagram", "https://help.instagram.com/519522125107875", "Privacy Policy"),
    ("tiktok", "https://www.tiktok.com/legal/page/us/privacy-policy/en", "Privacy Policy"),
    ("linkedin", "https://www.linkedin.com/legal/privacy-policy", "Privacy Policy"),
    ("netflix", "https://help.netflix.com/legal/privacy", "Privacy Policy"),
    ("amazon", "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ", "Privacy Notice"),
    ("google", "https://policies.google.com/privacy", "Privacy Policy"),
]


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output JSONL file"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=300,
        help="Target number of words per chunk"
    )
    parser.add_argument(
        "--overlap",
        type=int,
        default=50,
        help="Number of words to overlap between chunks"
    )
    return parser.parse_args()


def fetch_page(url: str) -> str:
    """Fetch a web page and return its HTML content."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"  Error fetching {url}: {e}")
        return ""


def extract_text(html: str) -> str:
    """Extract clean text from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script and style elements
    for script_or_style in soup(["script", "style", "nav", "header", "footer"]):
        script_or_style.decompose()
    
    # Get text
    text = soup.get_text()
    
    # Normalize whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = " ".join(chunk for chunk in chunks if chunk)
    
    return text


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[Tuple[str, int, int]]:
    """Split text into overlapping chunks."""
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
    """Main function to drive the harvesting."""
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    all_records = []
    
    for platform, url, doc_type in PLATFORM_URLS:
        print(f"Fetching {platform} {doc_type}...")
        html = fetch_page(url)
        
        if not html:
            print(f"  Skipped {platform} due to fetch error")
            continue
        
        text = extract_text(html)
        if len(text) < 1000:
            print(f"  Skipped {platform} - text too short ({len(text)} chars)")
            continue
        
        chunks = chunk_text(text, args.chunk_size, args.overlap)
        print(f"  Extracted {len(chunks)} chunks from {platform}")
        
        for idx, (text_chunk, start, end) in enumerate(chunks):
            record = {
                "text": text_chunk,
                "source": f"platform_tos_{platform}",
                "chunk_id": idx,
                "meta": {
                    "platform": platform,
                    "url": url,
                    "doc_type": doc_type,
                    "word_range": [start, end],
                    "word_count": end - start
                }
            }
            all_records.append(record)
        
        # Be respectful - add a small delay between requests
        time.sleep(2)
    
    print(f"\nWriting {len(all_records)} chunks to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for record in all_records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    print(f"Successfully harvested {len(all_records)} chunks from {len(PLATFORM_URLS)} platforms.")


if __name__ == "__main__":
    main()
