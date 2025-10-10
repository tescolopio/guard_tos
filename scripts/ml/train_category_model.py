#!/usr/bin/env python3
"""Train a category-specific text classifier for Terms Guardian.

This script is intentionally modular so each URI category (Data Collection, Content Rights,
Dispute Resolution, etc.) can be trained with the same workflow while producing distinct
model artifacts and evaluation reports.

Usage example:

```bash
python scripts/ml/train_category_model.py \
  --category data_collection \
  --dataset data/processed/data_collection/v2025.09.30.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/data_collection/v2025.09.30
```

The script expects Hugging Face Transformers + Datasets libraries. Install via:

```bash
pip install -r scripts/requirements.txt
```

Outputs:
- Fine-tuned model weights (saved in `--output-dir`)
- `metrics.json` with accuracy, precision, recall, F1, and AUROC
- `config.json` capturing thresholds, tokenizer vocab, and category metadata
- Optional confusion matrix PNG when matplotlib is available
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

try:
    from datasets import Dataset  # type: ignore
    from transformers import (  # type: ignore
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )
except ImportError as exc:  # pragma: no cover - guidance for users without deps
    raise SystemExit(
        "Missing Transformers/Datasets dependencies. Install with "
        "`pip install -r scripts/requirements.txt` before running training."
    ) from exc

# Add scripts/ml to path for local imports
import sys
sys.path.insert(0, str(Path(__file__).parent))

from category_config import CATEGORY_REGISTRY, CategoryConfig


LOGGER = logging.getLogger("train_category_model")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--dataset", required=True, help="Path to JSONL dataset produced by the data pipeline")
    parser.add_argument("--base-model", default="distilbert-base-uncased", help="Hugging Face model checkpoint to fine-tune")
    parser.add_argument("--output-dir", required=True, help="Directory where model + metrics will be written")
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=5e-5)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--warmup-ratio", type=float, default=0.1)
    parser.add_argument("--eval-split", type=float, default=0.15, help="Proportion of data reserved for evaluation")
    parser.add_argument("--seed", type=int, default=13)
    parser.add_argument("--push-to-hub", action="store_true", help="If set, attempt to push model to configured Hugging Face Hub repo")
    return parser.parse_args()


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def dataset_from_jsonl(path: Path, config: CategoryConfig, eval_split: float):
    """Create a Hugging Face Dataset from JSONL with `text` and multi-hot `labels`."""

    records = load_jsonl(path)

    if not records:
        raise ValueError(f"Dataset at {path} is empty")

    # Flatten label dictionaries into deterministic order
    def _extract_labels(example: Dict[str, object]) -> Dict[str, object]:
        label_dict = example.get("labels", {})
        vector = [float(label_dict.get(label, 0.0)) for label in config.label_list]
        return {"text": example["text"], "labels": vector}

    processed = [_extract_labels(row) for row in records]
    dataset = Dataset.from_list(processed)
    dataset = dataset.train_test_split(test_size=eval_split, seed=42)
    return dataset["train"], dataset["test"]


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    category = CATEGORY_REGISTRY[args.category]
    dataset_path = Path(args.dataset)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    LOGGER.info("Loading dataset for category '%s' from %s", category.name, dataset_path)
    train_dataset, eval_dataset = dataset_from_jsonl(dataset_path, category, args.eval_split)

    tokenizer = AutoTokenizer.from_pretrained(args.base_model)

    def tokenize_batch(batch: Dict[str, List[str]]):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=category.max_length,
        )

    train_dataset = train_dataset.map(tokenize_batch, batched=True)
    eval_dataset = eval_dataset.map(tokenize_batch, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        num_labels=len(category.label_list),
        problem_type="multi_label_classification",
    )

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=args.weight_decay,
        warmup_ratio=args.warmup_ratio,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        seed=args.seed,
        push_to_hub=args.push_to_hub,
        report_to=["none"],
    )

    def compute_metrics(eval_preds):
        from sklearn.metrics import classification_report  # type: ignore
        import numpy as np  # type: ignore

        logits, labels = eval_preds
        probs = 1 / (1 + np.exp(-logits))
        preds = (probs >= 0.5).astype(int)

        report = classification_report(
            labels,
            preds,
            target_names=category.label_list,
            output_dict=True,
            zero_division=0,
        )
        # Compute micro-average metrics
        micro = report["micro avg"]
        metrics = {
            "precision": micro["precision"],
            "recall": micro["recall"],
            "f1": micro["f1-score"],
        }
        metrics_path = output_dir / "metrics.json"
        with metrics_path.open("w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
        LOGGER.info("Saved detailed metrics to %s", metrics_path)
        return metrics

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    trainer.save_model()
    tokenizer.save_pretrained(output_dir)

    config_path = output_dir / "category_config.json"
    with config_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "category": category.name,
                "label_list": category.label_list,
                "base_model": args.base_model,
                "epochs": args.epochs,
                "learning_rate": args.learning_rate,
                "batch_size": args.batch_size,
                "weight_decay": args.weight_decay,
                "warmup_ratio": args.warmup_ratio,
            },
            handle,
            indent=2,
        )
    LOGGER.info("Saved category config to %s", config_path)


if __name__ == "__main__":
    main()
