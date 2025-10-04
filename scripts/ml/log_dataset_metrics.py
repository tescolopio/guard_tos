#!/usr/bin/env python3
"""Compute descriptive metrics for a labeled dataset and persist them to disk.

This helper is intended to provide lightweight telemetry for processed or gold
corpora prior to full model evaluation. Metrics include record counts, label
balance, and clause length statistics. The output JSON is designed to live in
`reports/eval/history/<category>/` alongside model evaluation reports.

Example:
    python scripts/ml/log_dataset_metrics.py \
        --category dispute_resolution \
        --dataset data/processed/dispute_resolution/v2025.09.27/dataset.jsonl \
        --output reports/eval/history/dispute_resolution/v2025.09.27_dataset.json
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path
from typing import Dict, Iterable, List

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:  # pragma: no cover - ensure local imports resolve
    sys.path.insert(0, str(REPO_ROOT))

from scripts.ml.category_config import CATEGORY_REGISTRY, CategoryConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--dataset", required=True, help="Path to JSONL dataset with labels")
    parser.add_argument("--output", required=True, help="Path to metrics JSON to write")
    parser.add_argument(
        "--manifest",
        help="Optional manifest JSON to merge into metrics output",
    )
    return parser.parse_args()


def load_jsonl(path: Path) -> Iterable[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def build_length_stats(texts: List[str]) -> Dict[str, float]:
    if not texts:
        return {"avg_chars": 0.0, "median_chars": 0.0, "avg_tokens": 0.0}
    char_lengths = [len(text) for text in texts]
    token_lengths = [len(text.split()) for text in texts]
    return {
        "avg_chars": round(statistics.fmean(char_lengths), 2),
        "median_chars": statistics.median(char_lengths),
        "avg_tokens": round(statistics.fmean(token_lengths), 2),
    }


def accumulate_label_totals(
    records: List[Dict[str, object]],
    config: CategoryConfig,
) -> Dict[str, int]:
    totals: Dict[str, int] = {label: 0 for label in config.label_list}
    for record in records:
        labels = record.get("labels", {})
        for label in config.label_list:
            if float(labels.get(label, 0.0)) >= 0.5:
                totals[label] += 1
    return totals


def main() -> None:
    args = parse_args()
    config = CATEGORY_REGISTRY[args.category]
    dataset_path = Path(args.dataset)
    records = list(load_jsonl(dataset_path))
    if not records:
        raise SystemExit(f"Dataset {dataset_path} is empty")

    texts = [str(record.get("text", "")) for record in records]
    length_stats = build_length_stats(texts)
    label_totals = accumulate_label_totals(records, config)

    metrics = {
        "category": config.name,
        "dataset_path": str(dataset_path),
        "records": len(records),
        "label_totals": label_totals,
        "label_distribution": {
            label: round(count / len(records), 4)
            for label, count in label_totals.items()
        },
        "length_stats": length_stats,
    }

    if args.manifest:
        manifest_path = Path(args.manifest)
        with manifest_path.open("r", encoding="utf-8") as handle:
            metrics["manifest"] = json.load(handle)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)

    print(f"Wrote dataset metrics to {output_path}")


if __name__ == "__main__":  # pragma: no cover
    main()
