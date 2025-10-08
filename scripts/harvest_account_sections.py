#!/usr/bin/env python3
"""Harvest account/termination sections from consumer ToS websites.

This script scrapes termination, cancellation, and account sections from
popular consumer services to supplement the account_management training corpus.

Example:
    python scripts/harvest_account_sections.py \
        --output data/corpus/account_sections_chunks.jsonl
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup


# Consumer services with publicly accessible termination/account ToS sections
SOURCES = {
    "spotify_tos": {
        "url": "https://www.spotify.com/us/legal/end-user-agreement/",
        "sections": ["Termination", "Cancelling subscriptions"]
    },
    "dropbox_tos": {
        "url": "https://www.dropbox.com/terms",
        "sections": ["Termination"]
    },
    "github_tos": {
        "url": "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
        "sections": ["Cancellation", "Termination"]
    },
    "slack_tos": {
        "url": "https://slack.com/terms-of-service/user",
        "sections": ["Termination"]
    },
    "zoom_tos": {
        "url": "https://explore.zoom.us/en/terms/",
        "sections": ["Termination"]
    },
}


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output JSONL file"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.0,
        help="Delay between requests in seconds"
    )
    return parser.parse_args()


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if len(chunk.strip()) > 100:  # Skip very short chunks
            chunks.append(chunk)
    
    return chunks


def harvest_source(name: str, config: dict, delay: float) -> list[dict]:
    """Harvest text from a single source."""
    print(f"\nHarvesting {name}...")
    print(f"  URL: {config['url']}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(config['url'], headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "header", "footer"]):
            script.decompose()
        
        # Extract text
        text = soup.get_text(separator='\n', strip=True)
        
        # Clean up text
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        text = ' '.join(lines)
        
        # Chunk the text
        chunks = chunk_text(text)
        
        # Create corpus items
        corpus_items = []
        for i, chunk in enumerate(chunks):
            corpus_items.append({
                "text": chunk,
                "source": name,
                "chunk_id": i,
                "meta": {
                    "url": config['url'],
                    "harvest_date": "2025-10-07"
                }
            })
        
        print(f"  ✓ Harvested {len(corpus_items)} chunks")
        time.sleep(delay)
        return corpus_items
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return []


def main() -> None:
    """Main function to drive the harvest."""
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    all_items = []
    
    for name, config in SOURCES.items():
        items = harvest_source(name, config, args.delay)
        all_items.extend(items)
    
    # Write output
    print(f"\nWriting {len(all_items)} chunks to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for item in all_items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    print(f"\n✓ Successfully harvested {len(all_items)} chunks from {len(SOURCES)} sources")
    
    # Print summary
    source_counts = {}
    for item in all_items:
        source = item['source']
        source_counts[source] = source_counts.get(source, 0) + 1
    
    print("\nSource breakdown:")
    for source, count in sorted(source_counts.items()):
        print(f"  - {source}: {count} chunks")


if __name__ == "__main__":
    main()
