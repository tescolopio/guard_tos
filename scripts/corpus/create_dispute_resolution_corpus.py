#!/usr/bin/env python3
"""Convert CUAD dispute resolution clauses to corpus format.

This script extracts ARBITRATION, CLASS_ACTION_WAIVER, and LIABILITY_LIMITATION
clauses from data/clauses.jsonl and converts them to the corpus format expected
by build_category_dataset.py.

Since CUAD labels don't map 1:1 to our taxonomy (we have jury_trial_waiver and
venue_selection that CUAD doesn't label), we'll rely on weak supervision patterns
to find those additional labels.

Example:
    python scripts/corpus/create_dispute_resolution_corpus.py \
        --output data/corpus/dispute_resolution_full.jsonl
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        default="data/clauses.jsonl",
        help="Path to clauses.jsonl file (CUAD data)"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output corpus JSONL file"
    )
    parser.add_argument(
        "--include-liability",
        action="store_true",
        help="Include LIABILITY_LIMITATION clauses (often contains venue/jury language)"
    )
    return parser.parse_args()


def main() -> None:
    """Main function to convert CUAD to corpus format."""
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Loading clauses from {input_path}...")
    
    with input_path.open() as f:
        clauses = [json.loads(line) for line in f]
    
    # Filter for dispute resolution related labels
    target_labels = {"ARBITRATION", "CLASS_ACTION_WAIVER"}
    if args.include_liability:
        target_labels.add("LIABILITY_LIMITATION")
    
    print(f"Filtering for labels: {', '.join(sorted(target_labels))}")
    
    dispute_clauses = [
        clause for clause in clauses
        if clause.get("label") in target_labels
    ]
    
    print(f"Found {len(dispute_clauses)} relevant clauses")
    
    # Convert to corpus format
    corpus_items = []
    for i, clause in enumerate(dispute_clauses):
        corpus_item = {
            "text": clause["text"],
            "source": "cuad_dispute_resolution",
            "chunk_id": i,
            "meta": {
                "original_label": clause.get("label"),
                "original_source": clause.get("source", "unknown")
            }
        }
        corpus_items.append(corpus_item)
    
    # Write corpus file
    print(f"Writing {len(corpus_items)} items to {output_path}...")
    with output_path.open("w") as f:
        for item in corpus_items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    # Print summary
    print(f"\n✓ Successfully created corpus!")
    print(f"\nLabel breakdown:")
    label_counts = {}
    for clause in dispute_clauses:
        label = clause.get("label", "unknown")
        label_counts[label] = label_counts.get(label, 0) + 1
    
    for label, count in sorted(label_counts.items()):
        print(f"  - {label}: {count}")
    
    print(f"\nNext step:")
    print(f"  python scripts/corpus/build_category_dataset.py \\")
    print(f"    --category dispute_resolution \\")
    print(f"    --input {output_path} \\")
    print(f"    --output-dir data/processed/dispute_resolution/v2025.10.07")


if __name__ == "__main__":
    main()
