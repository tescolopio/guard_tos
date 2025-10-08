#!/usr/bin/env python3
"""Create account_management corpus from platform ToS and CUAD clauses.

This script combines:
1. Platform ToS chunks (termination/cancellation sections)
2. CUAD clauses containing account management keywords

Example:
    python scripts/corpus/create_account_management_corpus.py \
        --output data/corpus/account_management_full.jsonl
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output corpus JSONL file"
    )
    return parser.parse_args()


def main() -> None:
    """Main function to create account management corpus."""
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    corpus_items = []
    chunk_id = 0
    
    # Load platform ToS chunks
    print("Loading platform ToS chunks...")
    platform_tos_path = Path("data/corpus/platform_tos_chunks.jsonl")
    
    with platform_tos_path.open() as f:
        platform_chunks = [json.loads(line) for line in f]
    
    # Filter for account management related chunks
    account_keywords = ['terminat', 'suspend', 'cancel', 'renew', 'grace', 'subscription', 'delete', 'close']
    
    for chunk in platform_chunks:
        text = chunk['text'].lower()
        if any(kw in text for kw in account_keywords):
            corpus_items.append({
                "text": chunk['text'],
                "source": chunk['source'],
                "chunk_id": chunk_id,
                "meta": chunk.get('meta', {})
            })
            chunk_id += 1
    
    print(f"  Found {len(corpus_items)} relevant platform ToS chunks")
    
    # Load CUAD clauses
    print("Loading CUAD clauses...")
    clauses_path = Path("data/clauses.jsonl")
    
    with clauses_path.open() as f:
        clauses = [json.loads(line) for line in f]
    
    # Filter for account management related clauses
    cuad_count = 0
    for clause in clauses:
        text = clause['text'].lower()
        if any(kw in text for kw in account_keywords):
            corpus_items.append({
                "text": clause['text'],
                "source": "cuad_account_management",
                "chunk_id": chunk_id,
                "meta": {
                    "original_label": clause.get("label", "unknown"),
                    "original_source": clause.get("source", "unknown")
                }
            })
            chunk_id += 1
            cuad_count += 1
    
    print(f"  Found {cuad_count} relevant CUAD clauses")
    
    # Write corpus file
    print(f"\nWriting {len(corpus_items)} items to {output_path}...")
    with output_path.open("w") as f:
        for item in corpus_items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    print(f"\n✓ Successfully created corpus!")
    print(f"\nSource breakdown:")
    source_counts = {}
    for item in corpus_items:
        source = item['source']
        source_counts[source] = source_counts.get(source, 0) + 1
    
    for source, count in sorted(source_counts.items()):
        print(f"  - {source}: {count}")
    
    print(f"\nNext step:")
    print(f"  python scripts/corpus/build_category_dataset.py \\")
    print(f"    --category account_management \\")
    print(f"    --input {output_path} \\")
    print(f"    --output-dir data/processed/account_management/v2025.10.07")


if __name__ == "__main__":
    main()
