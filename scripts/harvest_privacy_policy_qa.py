#!/usr/bin/env python3
"""Extract privacy policy clauses from the Hugging Face privacy-policy-qa dataset.

This script downloads the privacy-policy-qa-classification dataset and extracts
the actual privacy policy clauses from the QA pairs, saving them in a JSONL format
suitable for weak supervision labeling.

Example:
    python scripts/harvest_privacy_policy_qa.py \
        --output data/corpus/privacy_policy_qa_chunks.jsonl \
        --max-records 500
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Set

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from datasets import load_dataset
except ImportError:
    raise SystemExit("datasets library is required. Install it with: pip install datasets")


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output JSONL file"
    )
    parser.add_argument(
        "--max-records",
        type=int,
        default=500,
        help="Maximum number of unique clauses to extract"
    )
    parser.add_argument(
        "--min-length",
        type=int,
        default=50,
        help="Minimum clause length in characters"
    )
    return parser.parse_args()


def extract_clauses(text: str) -> list[str]:
    """
    Extract privacy policy clauses from the QA classification format.
    
    The text contains multiple "Clause: ... Question: ... Label: ..." triplets.
    We want to extract just the clause text.
    """
    # Pattern to match "Clause: <text>" followed by "Question:"
    pattern = r"Clause:\s*([^\n]+?)\s*(?=Question:)"
    matches = re.findall(pattern, text, re.DOTALL)
    
    # Clean up and filter
    clauses = []
    for match in matches:
        clause = match.strip()
        # Remove any trailing incomplete text
        if clause and not clause.endswith(("...", "Label:")):
            clauses.append(clause)
    
    return clauses


def main() -> None:
    """Main function to drive the extraction."""
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print("Downloading privacy-policy-qa-classification dataset...")
    ds = load_dataset("amentaga-nttd/privacy-policy-qa-classification")
    
    # Combine train and validation splits
    all_examples = []
    for split_name in ["train", "validation"]:
        if split_name in ds:
            all_examples.extend(ds[split_name])
    
    print(f"Processing {len(all_examples)} examples...")
    
    # Extract unique clauses
    unique_clauses: Set[str] = set()
    for example in all_examples:
        text = example.get("text", "")
        clauses = extract_clauses(text)
        for clause in clauses:
            if len(clause) >= args.min_length:
                unique_clauses.add(clause)
    
    print(f"Found {len(unique_clauses)} unique clauses")
    
    # Limit to max_records and save
    clauses_to_save = list(unique_clauses)[:args.max_records]
    
    print(f"Writing {len(clauses_to_save)} clauses to {output_path}...")
    with output_path.open("w", encoding="utf-8") as f:
        for idx, clause in enumerate(clauses_to_save):
            record = {
                "text": clause,
                "source": "privacy_policy_qa",
                "chunk_id": idx,
                "meta": {
                    "dataset": "amentaga-nttd/privacy-policy-qa-classification",
                    "extraction_method": "qa_clause_extraction"
                }
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    print(f"Successfully wrote {len(clauses_to_save)} clauses.")
    print(f"\nSample clauses:")
    for i, clause in enumerate(clauses_to_save[:3]):
        print(f"\n{i+1}. {clause[:150]}...")


if __name__ == "__main__":
    main()
