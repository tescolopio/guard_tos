#!/usr/bin/env python3
"""Run automated validation checks against trained Terms Guardian models.

This script is designed for the alpha testing pipeline. It loads a validation
configuration (see `model_validation_targets.yaml`) and verifies that each
model artifact:

1. Exists and can be loaded for inference.
2. Produces predictions on the reference evaluation dataset.
3. Meets minimum macro F1 and per-label F1 thresholds.
4. Has sufficient positive support per label to avoid severe imbalance.

Any category marked with `enforce: true` will cause the process to exit with a
non-zero status when the requirements are not satisfied. Categories with
`enforce: false` will emit warnings but will not fail the pipeline, which is
useful for models that are still under active development.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import csv
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import yaml

# Ensure we can import evaluation helpers that live alongside this script
SCRIPT_DIR = Path(__file__).parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from evaluate_model import (  # type: ignore  # pylint: disable=import-error
    CATEGORY_REGISTRY,
    compute_macro_metrics,
    compute_per_label_metrics,
    predict_batch,
)

from transformers import AutoModelForSequenceClassification, AutoTokenizer  # type: ignore

try:
    import torch  # type: ignore
except ImportError as exc:  # pragma: no cover - handled at runtime
    raise SystemExit(
        "Missing PyTorch dependency. Install with `pip install -r scripts/requirements.txt`."
    ) from exc

LOGGER = logging.getLogger("model_validation")


@dataclass
class ValidationResult:
    """Container for the outcome of validating a single category."""

    name: str
    status: str
    macro_f1: float
    per_label_metrics: Dict[str, Dict[str, float]]
    label_support: Dict[str, int]
    failures: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "macro_f1": self.macro_f1,
            "per_label_metrics": self.per_label_metrics,
            "label_support": self.label_support,
            "failures": self.failures,
            "warnings": self.warnings,
        }


def determine_run_id(args: argparse.Namespace) -> str:
    if args.run_id:
        return args.run_id
    if args.json_report:
        return args.json_report.stem
    return datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--config",
        default=SCRIPT_DIR / "model_validation_targets.yaml",
        type=Path,
        help="Path to validation thresholds configuration",
    )
    parser.add_argument(
        "--json-report",
        type=Path,
        help="Write structured validation results to the given JSON file",
    )
    parser.add_argument(
        "--summary-csv",
        type=Path,
        help="Append per-label precision/recall/F1 metrics to this CSV file",
    )
    parser.add_argument(
        "--run-id",
        type=str,
        help="Optional identifier for this validation run (defaults to report stem or timestamp)",
    )
    parser.add_argument(
        "--categories",
        nargs="+",
        help="Optional subset of categories to validate",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Reduce console output (still prints summary table)",
    )
    return parser.parse_args()


def load_examples(dataset_path: Path) -> List[Dict[str, Any]]:
    """Load all examples from a JSONL dataset."""
    with dataset_path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def build_label_matrix(examples: List[Dict[str, Any]], label_list: List[str]) -> np.ndarray:
    """Convert dataset label field into a binary matrix."""
    label_index = {label: idx for idx, label in enumerate(label_list)}
    matrix = np.zeros((len(examples), len(label_list)), dtype=int)

    for row_idx, example in enumerate(examples):
        labels_data = example.get("labels", [])
        if isinstance(labels_data, dict):
            for label_name, value in labels_data.items():
                if value and label_name in label_index:
                    matrix[row_idx, label_index[label_name]] = 1
        else:
            for label_name in labels_data:
                if label_name in label_index:
                    matrix[row_idx, label_index[label_name]] = 1

    return matrix


def predict_in_batches(
    model,
    tokenizer,
    texts: List[str],
    label_list: List[str],
    threshold: float,
    device: int,
    batch_size: int,
) -> np.ndarray:
    """Run inference in smaller batches to control memory usage."""

    batched_predictions: List[np.ndarray] = []
    for start in range(0, len(texts), batch_size):
        batch_texts = texts[start : start + batch_size]
        batch_predictions, _ = predict_batch(
            model=model,
            tokenizer=tokenizer,
            texts=batch_texts,
            label_list=label_list,
            threshold=threshold,
            device=device,
        )
        batched_predictions.append(batch_predictions)

    return np.vstack(batched_predictions)


def evaluate_category(entry: Dict[str, Any]) -> ValidationResult:
    name = entry["name"]
    config = CATEGORY_REGISTRY.get(name)
    if not config:
        raise SystemExit(f"Unknown category '{name}'. Check category_config.py for valid keys.")

    model_path = Path(entry["model_path"]).expanduser()
    dataset_path = Path(entry["dataset_path"]).expanduser()
    threshold = float(entry.get("threshold", 0.3))
    min_macro_f1 = float(entry.get("min_macro_f1", 0.75))
    min_label_f1 = float(entry.get("min_label_f1", 0.65))
    min_label_support = entry.get("min_label_support")
    batch_size = int(entry.get("batch_size", 64))
    enforce = bool(entry.get("enforce", True))

    failures: List[str] = []
    warnings: List[str] = []

    if not model_path.exists():
        failures.append(f"Model directory missing: {model_path}")
        return ValidationResult(
            name=name,
            status="failed" if enforce else "warning",
            macro_f1=0.0,
            per_label_metrics={},
            label_support={},
            failures=failures,
        )

    if not dataset_path.exists():
        failures.append(f"Dataset missing: {dataset_path}")
        return ValidationResult(
            name=name,
            status="failed" if enforce else "warning",
            macro_f1=0.0,
            per_label_metrics={},
            label_support={},
            failures=failures,
        )

    LOGGER.info("Evaluating %s", name)
    LOGGER.debug("  Model:   %s", model_path)
    LOGGER.debug("  Dataset: %s", dataset_path)

    # Load resources
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    device = 0 if torch.cuda.is_available() else -1
    if device >= 0:
        model = model.to(f"cuda:{device}")
        LOGGER.debug("Using GPU for inference")
    else:
        LOGGER.debug("Using CPU for inference")

    examples = load_examples(dataset_path)
    texts = [example["text"] for example in examples]
    label_matrix = build_label_matrix(examples, config.label_list)
    label_support = {
        label: int(label_matrix[:, idx].sum()) for idx, label in enumerate(config.label_list)
    }

    predictions = predict_in_batches(
        model=model,
        tokenizer=tokenizer,
        texts=texts,
        label_list=config.label_list,
        threshold=threshold,
        device=device,
        batch_size=batch_size,
    )

    per_label_metrics = compute_per_label_metrics(label_matrix, predictions, config.label_list)
    macro_metrics = compute_macro_metrics(label_matrix, predictions)
    macro_f1 = macro_metrics["macro_f1"]

    # Threshold checks
    if macro_f1 < min_macro_f1:
        failures.append(
            f"Macro F1 {macro_f1:.3f} is below required {min_macro_f1:.3f}"
        )

    for label_name, metrics in per_label_metrics.items():
        if metrics["f1"] < min_label_f1:
            failures.append(
                f"Label '{label_name}' F1 {metrics['f1']:.3f} below minimum {min_label_f1:.3f}"
            )

    if min_label_support is not None:
        for label_name, support in label_support.items():
            if support < min_label_support:
                message = (
                    f"Label '{label_name}' support {support} < minimum {min_label_support}"
                )
                if enforce:
                    failures.append(message)
                else:
                    warnings.append(message)

    status = "passed"
    if failures:
        status = "failed" if enforce else "warning"
    elif warnings:
        status = "warning"

    return ValidationResult(
        name=name,
        status=status,
        macro_f1=macro_f1,
        per_label_metrics=per_label_metrics,
        label_support=label_support,
        failures=failures,
        warnings=warnings,
    )


def format_row(columns: List[str], widths: List[int]) -> str:
    return " | ".join(col.ljust(width) for col, width in zip(columns, widths))


def print_summary(results: List[ValidationResult]) -> None:
    widths = [18, 8, 10, 50]
    header = format_row(["Category", "Status", "Macro F1", "Notes"], widths)
    separator = "-" * len(header)
    print("\n" + header)
    print(separator)

    for result in results:
        if result.status == "passed":
            status = "PASS"
        elif result.status == "warning":
            status = "WARN"
        else:
            status = "FAIL"

        notes: List[str] = []
        if result.failures:
            notes.extend(result.failures)
        if result.warnings:
            notes.extend(result.warnings)
        if not notes:
            notes.append("All checks satisfied")

        note_text = "; ".join(notes)[:widths[3]]
        row = format_row(
            [result.name, status, f"{result.macro_f1:.3f}", note_text],
            widths,
        )
        print(row)

    print(separator + "\n")


def append_summary_csv(summary_path: Path, run_id: str, results: List[ValidationResult]) -> None:
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    existing: Dict[tuple[str, str], Dict[str, str]] = {}
    if summary_path.exists():
        with summary_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                key = (row["category"], row["label"])
                existing[key] = row

    fieldnames = [
        "run_id",
        "category",
        "label",
        "precision",
        "recall",
        "f1",
        "precision_delta",
        "recall_delta",
        "f1_delta",
        "status",
    ]

    file_exists = summary_path.exists()
    with summary_path.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        for result in results:
            for label, metrics in sorted(result.per_label_metrics.items()):
                precision = float(metrics.get("precision", 0.0))
                recall = float(metrics.get("recall", 0.0))
                f1 = float(metrics.get("f1", 0.0))

                prev_row = existing.get((result.name, label))
                if prev_row:
                    prev_precision = float(prev_row.get("precision", 0.0))
                    prev_recall = float(prev_row.get("recall", 0.0))
                    prev_f1 = float(prev_row.get("f1", 0.0))
                    precision_delta = precision - prev_precision
                    recall_delta = recall - prev_recall
                    f1_delta = f1 - prev_f1
                else:
                    precision_delta = ""
                    recall_delta = ""
                    f1_delta = ""

                writer.writerow(
                    {
                        "run_id": run_id,
                        "category": result.name,
                        "label": label,
                        "precision": f"{precision:.6f}",
                        "recall": f"{recall:.6f}",
                        "f1": f"{f1:.6f}",
                        "precision_delta": f"{precision_delta:.6f}" if precision_delta != "" else "",
                        "recall_delta": f"{recall_delta:.6f}" if recall_delta != "" else "",
                        "f1_delta": f"{f1_delta:.6f}" if f1_delta != "" else "",
                        "status": result.status,
                    }
                )


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(levelname)s %(message)s",
    )

    if not args.config.exists():
        raise SystemExit(f"Validation config not found: {args.config}")

    with args.config.open("r", encoding="utf-8") as handle:
        config_data = yaml.safe_load(handle)

    categories: List[Dict[str, Any]] = config_data.get("categories", [])
    if args.categories:
        selected = set(args.categories)
        categories = [entry for entry in categories if entry["name"] in selected]
        missing = selected.difference(entry["name"] for entry in categories)
        if missing:
            raise SystemExit(f"Requested unknown categories: {', '.join(sorted(missing))}")

    if not categories:
        raise SystemExit("No validation categories defined in configuration")

    results: List[ValidationResult] = []
    for entry in categories:
        try:
            result = evaluate_category(entry)
        except Exception as exc:  # pragma: no cover - diagnostic aid
            LOGGER.exception("Validation crashed for category %s", entry.get("name", "<unknown>"))
            enforce = bool(entry.get("enforce", True))
            status = "failed" if enforce else "warning"
            results.append(
                ValidationResult(
                    name=entry.get("name", "<unknown>"),
                    status=status,
                    macro_f1=0.0,
                    per_label_metrics={},
                    label_support={},
                    failures=[f"Unexpected error: {exc}"],
                )
            )
            continue
        results.append(result)

    print_summary(results)

    run_id = determine_run_id(args)
    if args.summary_csv:
        append_summary_csv(args.summary_csv, run_id, results)
        LOGGER.info("Appended per-label metrics to %s", args.summary_csv)

    if args.json_report:
        report_payload = {
            "results": [result.to_dict() for result in results],
            "failed_categories": [r.name for r in results if r.status == "failed"],
            "warning_categories": [r.name for r in results if r.status == "warning"],
        }
        args.json_report.parent.mkdir(parents=True, exist_ok=True)
        with args.json_report.open("w", encoding="utf-8") as handle:
            json.dump(report_payload, handle, indent=2)
        LOGGER.info("Wrote JSON report to %s", args.json_report)

    if any(result.status == "failed" for result in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
