#!/usr/bin/env python3
"""Compare evaluation metrics between two model reports.

Given two JSON files produced by `evaluate_category_model.py`, this tool
prints overall metric deltas along with label-level precision/recall/F1
changes. It helps quantify regressions or improvements after retraining.

Example:
    python scripts/ml/compare_model_metrics.py \
        --previous reports/eval/history/data_collection/v2025.10.08a_model_eval.json \
        --current reports/eval/history/data_collection/v2025.10.09a_model_eval.json \
        --labels data_collection_minimal purpose_specific consent_explicit
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, Iterable, List, Optional


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--previous", required=True, type=Path, help="Path to baseline metrics JSON")
    parser.add_argument("--current", required=True, type=Path, help="Path to new metrics JSON")
    parser.add_argument(
        "--labels",
        nargs="*",
        help="Optional list of label names to highlight; defaults to all labels present",
    )
    parser.add_argument(
        "--print-all",
        action="store_true",
        help="When set, print full metrics table for every label",
    )
    parser.add_argument(
        "--export-csv",
        type=Path,
        help="Append selected label metrics and deltas to this CSV file",
    )
    parser.add_argument(
        "--current-run-id",
        type=str,
        help="Identifier for the current evaluation report when exporting",
    )
    parser.add_argument(
        "--previous-run-id",
        type=str,
        help="Optional identifier for the baseline report when exporting",
    )
    parser.add_argument(
        "--category",
        type=str,
        help="Optional category name to include in CSV exports",
    )
    return parser.parse_args()


def load_metrics(path: Path) -> Dict[str, object]:
    if not path.exists():
        raise SystemExit(f"Metrics file {path} not found")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def format_delta(value: Optional[float]) -> str:
    if value is None:
        return "n/a"
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.3f}"


def float_or_none(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def collect_labels(previous: Dict[str, object], current: Dict[str, object], focus: Iterable[str] | None) -> List[str]:
    prev_labels = set(previous.get("full_report", {}).keys())
    curr_labels = set(current.get("full_report", {}).keys())
    common = sorted(prev_labels & curr_labels)
    if focus:
        requested = [label for label in focus if label in common]
        missing = [label for label in focus if label not in common]
        if missing:
            print(f"Warning: labels missing from reports: {', '.join(missing)}")
        return requested or common
    return common


def print_overall(previous: Dict[str, object], current: Dict[str, object]) -> None:
    prev_metrics = previous.get("metrics", {})
    curr_metrics = current.get("metrics", {})
    for key in sorted(prev_metrics.keys()):
        prev_val = float_or_none(prev_metrics.get(key))
        curr_val = float_or_none(curr_metrics.get(key))
        if prev_val is None or curr_val is None:
            continue
        delta = curr_val - prev_val
        print(f"{key}: {curr_val:.3f} (delta {format_delta(delta)})")


def print_label_table(previous: Dict[str, object], current: Dict[str, object], labels: Iterable[str], print_all: bool) -> None:
    print("\nLabel metrics:")
    for label in labels:
        prev_data = previous.get("full_report", {}).get(label, {})
        curr_data = current.get("full_report", {}).get(label, {})
        if not prev_data or not curr_data:
            continue
        prev_f1 = float_or_none(prev_data.get("f1-score"))
        curr_f1 = float_or_none(curr_data.get("f1-score"))
        delta_f1 = (curr_f1 - prev_f1) if prev_f1 is not None and curr_f1 is not None else None
        f1_display = f"{curr_f1:.3f}" if curr_f1 is not None else "n/a"
        print(f"- {label}: F1 {f1_display} (delta {format_delta(delta_f1)})")
        if print_all:
            for metric in ("precision", "recall"):
                prev_val = float_or_none(prev_data.get(metric))
                curr_val = float_or_none(curr_data.get(metric))
                if prev_val is None or curr_val is None:
                    continue
                delta = curr_val - prev_val
                print(f"    {metric}: {curr_val:.3f} (delta {format_delta(delta)})")


def export_metrics_csv(
    path: Path,
    run_id: str,
    previous_run_id: Optional[str],
    category: Optional[str],
    labels: Iterable[str],
    previous: Dict[str, object],
    current: Dict[str, object],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = path.exists()
    fieldnames = [
        "run_id",
        "previous_run_id",
        "category",
        "label",
        "precision",
        "recall",
        "f1",
        "previous_precision",
        "previous_recall",
        "previous_f1",
        "precision_delta",
        "recall_delta",
        "f1_delta",
    ]

    with path.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        for label in labels:
            prev_data = previous.get("full_report", {}).get(label, {})
            curr_data = current.get("full_report", {}).get(label, {})

            curr_precision = float_or_none(curr_data.get("precision"))
            curr_recall = float_or_none(curr_data.get("recall"))
            curr_f1 = float_or_none(curr_data.get("f1")) or float_or_none(curr_data.get("f1-score"))

            prev_precision = float_or_none(prev_data.get("precision"))
            prev_recall = float_or_none(prev_data.get("recall"))
            prev_f1 = float_or_none(prev_data.get("f1")) or float_or_none(prev_data.get("f1-score"))

            precision_delta = (curr_precision - prev_precision) if (curr_precision is not None and prev_precision is not None) else None
            recall_delta = (curr_recall - prev_recall) if (curr_recall is not None and prev_recall is not None) else None
            f1_delta = (curr_f1 - prev_f1) if (curr_f1 is not None and prev_f1 is not None) else None

            writer.writerow(
                {
                    "run_id": run_id,
                    "previous_run_id": previous_run_id or "",
                    "category": category or "",
                    "label": label,
                    "precision": f"{curr_precision:.6f}" if curr_precision is not None else "",
                    "recall": f"{curr_recall:.6f}" if curr_recall is not None else "",
                    "f1": f"{curr_f1:.6f}" if curr_f1 is not None else "",
                    "previous_precision": f"{prev_precision:.6f}" if prev_precision is not None else "",
                    "previous_recall": f"{prev_recall:.6f}" if prev_recall is not None else "",
                    "previous_f1": f"{prev_f1:.6f}" if prev_f1 is not None else "",
                    "precision_delta": f"{precision_delta:.6f}" if precision_delta is not None else "",
                    "recall_delta": f"{recall_delta:.6f}" if recall_delta is not None else "",
                    "f1_delta": f"{f1_delta:.6f}" if f1_delta is not None else "",
                }
            )


def main() -> None:
    args = parse_args()
    previous = load_metrics(args.previous)
    current = load_metrics(args.current)

    print("Overall metrics:")
    print_overall(previous, current)

    labels = collect_labels(previous, current, args.labels)
    print_label_table(previous, current, labels, args.print_all)

    if args.export_csv:
        if not args.current_run_id:
            raise SystemExit("--current-run-id is required when using --export-csv")
        export_metrics_csv(
            args.export_csv,
            args.current_run_id,
            args.previous_run_id,
            args.category,
            labels,
            previous,
            current,
        )
        print(f"\nExported label metrics to {args.export_csv}")


if __name__ == "__main__":
    main()
