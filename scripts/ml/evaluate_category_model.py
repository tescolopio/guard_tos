#!/usr/bin/env python3
"""Evaluate a trained category model against a labeled dataset.

Example:

```bash
python scripts/ml/evaluate_category_model.py \
  --category data_collection \
  --dataset data/gold/data_collection/gold_eval.jsonl \
  --model artifacts/models/data_collection/v2025.09.30 \
  --report reports/eval/data_collection_v2025.09.30.json
```
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, Iterable, List

try:
    from datasets import Dataset  # type: ignore
    from transformers import AutoModelForSequenceClassification, AutoTokenizer  # type: ignore
    import torch  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing Transformers/Datasets dependencies. Install with "
        "`pip install -r scripts/requirements.txt`."
    ) from exc

from scripts.ml.category_config import CATEGORY_REGISTRY, CategoryConfig

LOGGER = logging.getLogger("evaluate_category_model")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--dataset", required=True, help="Path to JSONL evaluation dataset")
    parser.add_argument("--model", required=True, help="Directory containing fine-tuned model")
    parser.add_argument("--threshold", type=float, default=0.5, help="Prediction threshold for metrics")
    parser.add_argument("--report", required=True, help="Path to write metrics JSON report")
    parser.add_argument("--confusion-matrix", help="Optional path for confusion matrix CSV")
    return parser.parse_args()


def load_jsonl(path: Path) -> Iterable[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                yield json.loads(line)


def build_dataset(path: Path, config: CategoryConfig) -> Dataset:
    records = list(load_jsonl(path))
    if not records:
        raise ValueError(f"Dataset {path} is empty")

    def _extract(example: Dict[str, object]):
        labels = example.get("labels", {})
        vector = [float(labels.get(label, 0.0)) for label in config.label_list]
        return {"text": example["text"], "labels": vector}

    data = [_extract(row) for row in records]
    return Dataset.from_list(data)


def compute_predictions(model, tokenizer, dataset: Dataset, config: CategoryConfig, threshold: float):
    inputs = dataset["text"]
    encodings = tokenizer(
        inputs,
        truncation=True,
        padding="max_length",
        max_length=config.max_length,
        return_tensors="pt",
    )
    labels = dataset["labels"]

    with torch.no_grad():  # type: ignore
        logits = model(**encodings).logits.cpu().numpy()

    import numpy as np  # type: ignore

    probs = 1 / (1 + np.exp(-logits))
    preds = (probs >= threshold).astype(int)
    return labels, preds, probs


def compute_metrics(labels, preds, probs, config: CategoryConfig, report_path: Path, confusion_path: Path | None):
    import numpy as np  # type: ignore
    from sklearn.metrics import (  # type: ignore
        accuracy_score,
        classification_report,
        roc_auc_score,
    )

    labels_arr = np.array(labels)
    preds_arr = np.array(preds)

    report = classification_report(
        labels_arr,
        preds_arr,
        target_names=config.label_list,
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "accuracy": accuracy_score(labels_arr, preds_arr),
        "precision_micro": report["micro avg"]["precision"],
        "recall_micro": report["micro avg"]["recall"],
        "f1_micro": report["micro avg"]["f1-score"],
    }

    try:
        metrics["roc_auc_micro"] = roc_auc_score(labels_arr, probs, average="micro")
    except ValueError:
        metrics["roc_auc_micro"] = None

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump({"metrics": metrics, "full_report": report}, handle, indent=2)

    if confusion_path:
        confusion_path = Path(confusion_path)
        confusion_path.parent.mkdir(parents=True, exist_ok=True)
        with confusion_path.open("w", encoding="utf-8") as handle:
            header = ",".join(["label"] + config.label_list)
            handle.write(header + "\n")
            for idx, label in enumerate(config.label_list):
                row = ",".join([label] + [str(report[label]["support"]) if i == idx else "-" for i in range(len(config.label_list))])
                handle.write(row + "\n")

    LOGGER.info("Wrote evaluation report to %s", report_path)
    return metrics


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    config = CATEGORY_REGISTRY[args.category]
    dataset = build_dataset(Path(args.dataset), config)

    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(args.model)

    metrics = compute_predictions_and_metrics(
        tokenizer,
        model,
        dataset,
        config,
        args.threshold,
        Path(args.report),
        args.confusion_matrix,
    )
    LOGGER.info("Metrics: %s", metrics)


def compute_predictions_and_metrics(tokenizer, model, dataset, config, threshold, report_path, confusion_path):
    labels, preds, probs = compute_predictions(model, tokenizer, dataset, config, threshold)
    return compute_metrics(labels, preds, probs, config, report_path, confusion_path)


if __name__ == "__main__":
    main()
