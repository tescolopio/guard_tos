#!/usr/bin/env python3
"""Calibrate decision thresholds for a fine-tuned category model.

Example:

```bash
python scripts/ml/calibrate_category_model.py \
  --category data_collection \
  --dataset data/gold/data_collection/gold_eval.jsonl \
  --model artifacts/models/data_collection/v2025.09.30 \
  --out-json reports/calibration/data_collection_v2025.09.30.json
```
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

import numpy as np  # type: ignore

from transformers import AutoModelForSequenceClassification, AutoTokenizer  # type: ignore

from evaluate_category_model import (  # type: ignore
    CATEGORY_REGISTRY,
    build_dataset,
    compute_predictions,
)


def derive_thresholds(y_true: np.ndarray, y_proba: np.ndarray) -> Dict[str, float]:
    from sklearn.metrics import precision_recall_curve  # type: ignore

    precision, recall, thresholds = precision_recall_curve(y_true, y_proba)
    if len(thresholds) == 0:
        return {
            "t_f1": 0.5,
            "f1": 0.0,
            "t_p90": 0.5,
            "p_at_p90": 0.0,
            "r_at_p90": 0.0,
            "t_p80": 0.5,
            "p_at_p80": 0.0,
            "r_at_p80": 0.0,
            "suggested": 0.5,
        }

    with np.errstate(divide="ignore", invalid="ignore"):
        f1_scores = 2 * precision * recall / (precision + recall)
        f1_scores[np.isnan(f1_scores)] = 0
    best_idx = int(np.argmax(f1_scores[:-1])) if len(f1_scores) > 1 else 0

    def first_thr(target: float) -> tuple[float, float, float]:
        for idx, thr in enumerate(thresholds):
            if precision[idx] >= target:
                return float(thr), float(precision[idx]), float(recall[idx])
        top = int(np.argmax(precision[:-1])) if len(precision) > 1 else 0
        thr = float(thresholds[top]) if len(thresholds) > 0 else 0.5
        return thr, float(precision[top]), float(recall[top])

    t_f1 = float(thresholds[best_idx])
    best_f1 = float(f1_scores[best_idx])
    t_p90, p90, r90 = first_thr(0.90)
    t_p80, p80, r80 = first_thr(0.80)
    suggested = t_p90 if r90 >= 0.2 else t_f1

    return {
        "t_f1": t_f1,
        "f1": best_f1,
        "t_p90": t_p90,
        "p_at_p90": p90,
        "r_at_p90": r90,
        "t_p80": t_p80,
        "p_at_p80": p80,
        "r_at_p80": r80,
        "suggested": suggested,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--dataset", required=True, help="Gold evaluation dataset (JSONL)")
    parser.add_argument("--model", required=True, help="Directory with fine-tuned model weights")
    parser.add_argument("--out-json", required=True, help="Where to write calibration thresholds JSON")
    parser.add_argument("--threshold", type=float, default=0.5, help="Initial cutoff used for predictions (for reporting only)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = CATEGORY_REGISTRY[args.category]

    dataset = build_dataset(Path(args.dataset), config)
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(args.model)

    labels, _, probs = compute_predictions(model, tokenizer, dataset, config, args.threshold)

    thresholds = {}
    labels_arr = np.array(labels)
    probs_arr = np.array(probs)
    for idx, label_name in enumerate(config.label_list):
        y_true = labels_arr[:, idx]
        y_proba = probs_arr[:, idx]
        thresholds[label_name] = derive_thresholds(y_true, y_proba)

    out_path = Path(args.out_json)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        json.dump({"category": args.category, "thresholds": thresholds}, handle, indent=2)

    print(f"Wrote calibration thresholds for {args.category} to {out_path}")


if __name__ == "__main__":
    main()
