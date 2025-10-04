#!/usr/bin/env python3
"""Seed a gold evaluation dataset from a processed category corpus.

This utility selects a stratified sample from an auto-labeled corpus produced by
`scripts/corpus/build_category_dataset.py` so that subject-matter experts can
perform manual review and adjudication. The output JSONL adheres to the schema
expected by `docs/ml/gold-datasets.md`, but marks each record with
`review_status="pending"` to indicate that human validation is required.

Example:
    python scripts/corpus/seed_gold_dataset.py \
        --category dispute_resolution \
        --input data/processed/dispute_resolution/v2025.09.27/dataset.jsonl \
        --output data/gold/dispute_resolution/gold_eval.todo.jsonl \
        --per-label 50 --negatives 50
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Sequence

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:  # pragma: no cover - scripts need repo root
    sys.path.insert(0, str(REPO_ROOT))

from scripts.ml.category_config import CATEGORY_REGISTRY, CategoryConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--input", required=True, help="Path to processed dataset JSONL")
    parser.add_argument("--output", required=True, help="Destination path for seed JSONL")
    parser.add_argument(
        "--per-label",
        type=int,
        default=50,
        help="Target number of positive examples per label to include",
    )
    parser.add_argument(
        "--negatives",
        type=int,
        default=50,
        help="Number of low-confidence/negative examples to include for calibration",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=17,
        help="Random seed to ensure reproducible sampling",
    )
    return parser.parse_args()


def load_jsonl(path: Path) -> Iterable[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def bucket_records(records: Sequence[Dict[str, object]], config: CategoryConfig) -> Dict[str, List[int]]:
    buckets: Dict[str, List[int]] = {label: [] for label in config.label_list}
    negatives: List[int] = []
    for idx, record in enumerate(records):
        labels = record.get("labels", {})
        positives = 0
        for label in config.label_list:
            if float(labels.get(label, 0.0)) >= 0.5:
                buckets[label].append(idx)
                positives += 1
        if positives == 0:
            negatives.append(idx)
    buckets["__negatives__"] = negatives
    return buckets


def sample_indices(
    buckets: Dict[str, List[int]],
    per_label: int,
    negatives: int,
    rng: random.Random,
) -> List[int]:
    picked: List[int] = []

    for label, indices in buckets.items():
        if label == "__negatives__":
            continue
        if not indices:
            continue
        sample_count = min(per_label, len(indices))
        picked.extend(rng.sample(indices, sample_count))

    negative_indices = buckets.get("__negatives__", [])
    if negative_indices and negatives > 0:
        sample_count = min(negatives, len(negative_indices))
        picked.extend(rng.sample(negative_indices, sample_count))

    # Deduplicate while preserving order of selection
    seen = set()
    unique_picked = []
    for idx in picked:
        if idx not in seen:
            seen.add(idx)
            unique_picked.append(idx)
    return unique_picked


def build_seed_records(
    records: Sequence[Dict[str, object]],
    indices: Sequence[int],
    category: str,
    seed_version: str,
) -> List[Dict[str, object]]:
    output: List[Dict[str, object]] = []
    for idx in indices:
        record = dict(records[idx])
        record.setdefault("source", f"processed_{category}")
        record.setdefault("annotator", "")
        record.setdefault("confidence", 0.0)
        record.setdefault("notes", "")
        record["review_status"] = "pending"
        record["seed_version"] = record.get("seed_version") or seed_version
        output.append(record)
    return output


def summarize(records: Sequence[Dict[str, object]], config: CategoryConfig) -> Dict[str, object]:
    totals = defaultdict(int)
    for record in records:
        labels = record.get("labels", {})
        for label in config.label_list:
            if float(labels.get(label, 0.0)) >= 0.5:
                totals[label] += 1
    distribution = {}
    if records:
        distribution = {
            label: round(totals[label] / len(records), 4) for label in config.label_list
        }
    return {
        "count": len(records),
        "label_totals": dict(totals),
        "label_distribution": distribution,
    }


def main() -> None:
    args = parse_args()
    config = CATEGORY_REGISTRY[args.category]
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    records = list(load_jsonl(input_path))
    if not records:
        raise SystemExit(f"Input dataset {input_path} is empty")

    buckets = bucket_records(records, config)
    rng = random.Random(args.seed)
    indices = sample_indices(buckets, args.per_label, args.negatives, rng)

    if not indices:
        raise SystemExit("Sampling yielded no records. Check label coverage.")

    dataset_version = input_path.parent.name
    seed_records = build_seed_records(records, indices, args.category, dataset_version)

    with output_path.open("w", encoding="utf-8") as handle:
        for record in seed_records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    summary = summarize(seed_records, config)
    summary_path = output_path.with_suffix(".summary.json")
    with summary_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)

    print(
        f"Wrote {summary['count']} seed records to {output_path} "
        f"(summary: {summary_path})"
    )


if __name__ == "__main__":  # pragma: no cover
    main()
