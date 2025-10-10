#!/usr/bin/env python3
"""Merge processed datasets with newly generated synthetic clauses.

This utility takes an existing processed JSONL dataset and one or more
synthetic JSONL files, merges them together, and optionally shuffles the
combined examples. Duplicate `text` entries are removed to avoid training on
identical clauses multiple times.

Example usage:

```
python scripts/ml/merge_synthetic_with_processed.py \
    --base data/processed/content_rights/v2025.10.07a/dataset.jsonl \
    --synthetic data/aug/content_rights/v2025.10.08a/synthetic.jsonl \
    --output data/processed/content_rights/v2025.10.08a/dataset.jsonl \
    --shuffle
```
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Dict, Iterable, List


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, type=Path, help="Path to the processed JSONL dataset")
    parser.add_argument(
        "--synthetic",
        action="append",
        type=Path,
        required=True,
        help="Path(s) to synthetic JSONL files to merge; repeat for multiple inputs",
    )
    parser.add_argument("--output", required=True, type=Path, help="Destination JSONL path for the merged dataset")
    parser.add_argument(
        "--shuffle",
        action="store_true",
        help="Shuffle merged examples before writing (uses --seed for reproducibility)",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed used when --shuffle is provided")
    return parser.parse_args()


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def validate_labels(records: Iterable[Dict[str, object]], expected_labels: List[str]) -> None:
    for entry in records:
        labels = entry.get("labels")
        if not isinstance(labels, dict):
            raise ValueError("All records must include a 'labels' dictionary")
        missing = [label for label in expected_labels if label not in labels]
        if missing:
            raise ValueError(f"Record missing labels: {missing}")


def main() -> None:
    args = parse_args()

    base_records = load_jsonl(args.base)
    if not base_records:
        raise SystemExit(f"Base dataset {args.base} is empty or missing")

    expected_labels = sorted(base_records[0]["labels"].keys())
    validate_labels(base_records, expected_labels)

    synthetic_records: List[Dict[str, object]] = []
    for synth_path in args.synthetic:
        synth_examples = load_jsonl(synth_path)
        if not synth_examples:
            raise SystemExit(f"Synthetic dataset {synth_path} is empty")
        validate_labels(synth_examples, expected_labels)
        synthetic_records.extend(synth_examples)

    combined = base_records + synthetic_records

    # Drop duplicate texts to avoid double counting identical clauses
    unique_examples = []
    seen_texts = set()
    for record in combined:
        text = record.get("text")
        if text is None:
            raise ValueError("Each record must contain a 'text' field")
        if text in seen_texts:
            continue
        seen_texts.add(text)
        unique_examples.append(record)

    if args.shuffle:
        random.seed(args.seed)
        random.shuffle(unique_examples)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        for record in unique_examples:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(
        "Merged dataset created with",
        len(unique_examples),
        "examples (",
        len(base_records),
        "base +",
        len(synthetic_records),
        "synthetic,",
        len(unique_examples) - len(base_records),
        "net new after dedupe)",
    )


if __name__ == "__main__":
    main()
