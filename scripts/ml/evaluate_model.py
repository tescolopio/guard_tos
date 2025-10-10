#!/usr/bin/env python3
"""Comprehensive evaluation script for trained Terms Guardian models.

This script loads a trained model and runs detailed evaluation including:
- Per-label metrics (precision, recall, F1, support)
- Macro and micro averages
- Confusion matrices
- Error analysis (false positives, false negatives)
- Threshold analysis
- Sample predictions with confidence scores

Usage:

```bash
# Evaluate a trained model
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --output-dir evaluation_reports/data_collection_v1

# Quick evaluation (just print metrics, no report files)
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --quick

# Evaluate with custom threshold
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --threshold 0.4
```

Output files (when --output-dir is specified):
- evaluation_report.json - Complete metrics and analysis
- confusion_matrices.png - Visual confusion matrices per label
- error_analysis.json - Detailed false positive/negative examples
- false_positives_by_label.json - Top false positives grouped per label
- predictions_sample.json - Sample predictions with confidences
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from datasets import Dataset
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    hamming_loss,
    precision_recall_fscore_support,
)
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    pipeline,
)

# Add scripts/ml to path for local imports
sys.path.insert(0, str(Path(__file__).parent))
from category_config import CATEGORY_REGISTRY, CategoryConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(message)s",
)
LOGGER = logging.getLogger("evaluate_model")


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--model",
        required=True,
        help="Path to trained model directory (contains config.json, model weights, etc.)",
    )
    parser.add_argument(
        "--dataset",
        required=True,
        help="Path to JSONL dataset for evaluation (gold_seed.jsonl or test set)",
    )
    parser.add_argument(
        "--category",
        required=True,
        choices=sorted(CATEGORY_REGISTRY.keys()),
        help="Category name (must match training configuration)",
    )
    parser.add_argument(
        "--output-dir",
        help="Directory to save evaluation reports (if omitted, only prints to console)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Classification threshold for converting probabilities to labels (default: 0.5)",
    )
    parser.add_argument(
        "--eval-split",
        type=float,
        default=0.15,
        help="If dataset wasn't pre-split, use this proportion for evaluation (default: 0.15)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for dataset splitting (default: 42)",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick evaluation mode: print metrics only, skip detailed reports",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=20,
        help="Number of sample predictions to include in report (default: 20)",
    )
    parser.add_argument(
        "--run-id",
        help="Optional identifier for this evaluation run (defaults to output directory name)",
    )
    parser.add_argument(
        "--fp-destination",
        type=Path,
        help="If provided, publish grouped false positives under this directory",
    )
    parser.add_argument(
        "--fp-top-k",
        type=int,
        default=5,
        help="Maximum number of false positives to retain per label (default: 5)",
    )
    return parser.parse_args()


def load_dataset(dataset_path: str, eval_split: float, seed: int) -> Dataset:
    """Load and prepare evaluation dataset."""
    LOGGER.info(f"Loading dataset from {dataset_path}")
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    
    data = [json.loads(line) for line in lines]
    dataset = Dataset.from_list(data)
    
    # If dataset has 'split' column, filter to eval/test; otherwise create split
    if "split" in dataset.column_names:
        eval_data = dataset.filter(lambda x: x["split"] in ["eval", "test", "validation"])
        LOGGER.info(f"Using existing eval/test split: {len(eval_data)} examples")
    else:
        LOGGER.info(f"No split column found, creating {eval_split:.0%} eval split")
        split_dataset = dataset.train_test_split(test_size=eval_split, seed=seed)
        eval_data = split_dataset["test"]
        LOGGER.info(f"Created eval split: {len(eval_data)} examples")
    
    return eval_data


def predict_batch(
    model: Any,
    tokenizer: Any,
    texts: List[str],
    label_list: List[str],
    threshold: float,
    device: int = -1,
) -> Tuple[np.ndarray, np.ndarray]:
    """Run batch prediction and return predictions + probabilities.
    
    Returns:
        predictions: Binary matrix (n_samples, n_labels) with 1 where prob >= threshold
        probabilities: Float matrix (n_samples, n_labels) with raw sigmoid probabilities
    """
    LOGGER.info(f"Running inference on {len(texts)} examples...")
    
    # Tokenize
    encodings = tokenizer(
        texts,
        truncation=True,
        padding=True,
        max_length=512,
        return_tensors="pt",
    )
    
    # Move to device if GPU available
    if device >= 0:
        encodings = {k: v.to(f"cuda:{device}") for k, v in encodings.items()}
    
    # Get predictions
    import torch
    with torch.no_grad():
        outputs = model(**encodings)
        logits = outputs.logits
        probabilities = torch.sigmoid(logits).cpu().numpy()
    
    # Apply threshold
    predictions = (probabilities >= threshold).astype(int)
    
    return predictions, probabilities


def compute_per_label_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    label_list: List[str],
) -> Dict[str, Dict[str, float]]:
    """Compute precision, recall, F1 for each label."""
    metrics = {}
    
    for idx, label_name in enumerate(label_list):
        precision, recall, f1, support = precision_recall_fscore_support(
            y_true[:, idx],
            y_pred[:, idx],
            average="binary",
            zero_division=0,
        )
        
        # support is returned as array, extract the positive class count
        true_support = int(y_true[:, idx].sum())
        
        metrics[label_name] = {
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "support": true_support,
        }
    
    return metrics


def compute_macro_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """Compute macro-averaged metrics across all labels."""
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true,
        y_pred,
        average="macro",
        zero_division=0,
    )
    
    return {
        "macro_precision": float(precision),
        "macro_recall": float(recall),
        "macro_f1": float(f1),
    }


def compute_confusion_matrices(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    label_list: List[str],
) -> Dict[str, Dict[str, int]]:
    """Compute confusion matrix for each label."""
    matrices = {}
    
    for idx, label_name in enumerate(label_list):
        cm = confusion_matrix(y_true[:, idx], y_pred[:, idx])
        
        # Handle different confusion matrix shapes
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        elif cm.shape == (1, 1):
            # Only one class present
            if y_true[:, idx].sum() == 0:
                tn, fp, fn, tp = cm[0, 0], 0, 0, 0
            else:
                tn, fp, fn, tp = 0, 0, 0, cm[0, 0]
        else:
            tn, fp, fn, tp = 0, 0, 0, 0
        
        matrices[label_name] = {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        }
    
    return matrices


def analyze_errors(
    texts: List[str],
    y_true: np.ndarray,
    y_pred: np.ndarray,
    probabilities: np.ndarray,
    label_list: List[str],
    max_examples: int = 10,
) -> Dict[str, List[Dict[str, Any]]]:
    """Identify and analyze false positives and false negatives."""
    errors = {
        "false_positives": [],
        "false_negatives": [],
    }
    
    for idx, label_name in enumerate(label_list):
        # False positives: predicted=1, actual=0
        fp_indices = np.where((y_pred[:, idx] == 1) & (y_true[:, idx] == 0))[0]
        for i in fp_indices[:max_examples]:
            errors["false_positives"].append({
                "label": label_name,
                "text": texts[i][:200] + "..." if len(texts[i]) > 200 else texts[i],
                "confidence": float(probabilities[i, idx]),
                "text_length": len(texts[i]),
            })
        
        # False negatives: predicted=0, actual=1
        fn_indices = np.where((y_pred[:, idx] == 0) & (y_true[:, idx] == 1))[0]
        for i in fn_indices[:max_examples]:
            errors["false_negatives"].append({
                "label": label_name,
                "text": texts[i][:200] + "..." if len(texts[i]) > 200 else texts[i],
                "confidence": float(probabilities[i, idx]),
                "text_length": len(texts[i]),
            })
    
    return errors


def group_false_positives_by_label(
    errors: Dict[str, List[Dict[str, Any]]],
    top_k: int,
) -> Dict[str, List[Dict[str, Any]]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for entry in errors.get("false_positives", []):
        grouped.setdefault(entry["label"], []).append(entry)

    for label, items in grouped.items():
        items.sort(key=lambda x: x.get("confidence", 0.0), reverse=True)
        grouped[label] = items[:top_k]

    return grouped


def generate_sample_predictions(
    texts: List[str],
    y_true: np.ndarray,
    y_pred: np.ndarray,
    probabilities: np.ndarray,
    label_list: List[str],
    sample_size: int = 20,
) -> List[Dict[str, Any]]:
    """Generate sample predictions for manual inspection."""
    samples = []
    
    # Sample diverse examples (correct predictions, errors, edge cases)
    indices = np.random.choice(len(texts), min(sample_size, len(texts)), replace=False)
    
    for i in indices:
        # Build label predictions with confidences
        label_predictions = []
        for idx, label_name in enumerate(label_list):
            label_predictions.append({
                "label": label_name,
                "predicted": bool(y_pred[i, idx]),
                "actual": bool(y_true[i, idx]),
                "confidence": float(probabilities[i, idx]),
                "correct": bool(y_pred[i, idx] == y_true[i, idx]),
            })
        
        samples.append({
            "text": texts[i][:300] + "..." if len(texts[i]) > 300 else texts[i],
            "text_length": len(texts[i]),
            "predictions": label_predictions,
            "num_correct": sum(1 for lp in label_predictions if lp["correct"]),
            "num_labels": len(label_list),
        })
    
    # Sort by number correct (show hardest examples first)
    samples.sort(key=lambda x: x["num_correct"])
    
    return samples


def print_evaluation_summary(
    per_label_metrics: Dict[str, Dict[str, float]],
    macro_metrics: Dict[str, float],
    confusion_matrices: Dict[str, Dict[str, int]],
    threshold: float,
):
    """Print formatted evaluation summary to console."""
    print("\n" + "=" * 80)
    print("MODEL EVALUATION SUMMARY")
    print("=" * 80)
    
    print(f"\nThreshold: {threshold:.2f}")
    print(f"\nMacro Metrics:")
    print(f"  Precision: {macro_metrics['macro_precision']:.4f}")
    print(f"  Recall:    {macro_metrics['macro_recall']:.4f}")
    print(f"  F1 Score:  {macro_metrics['macro_f1']:.4f}")
    
    print(f"\n{'Label':<30} {'Precision':<12} {'Recall':<12} {'F1':<12} {'Support':<10}")
    print("-" * 80)
    
    for label_name, metrics in per_label_metrics.items():
        print(
            f"{label_name:<30} "
            f"{metrics['precision']:<12.4f} "
            f"{metrics['recall']:<12.4f} "
            f"{metrics['f1']:<12.4f} "
            f"{metrics['support']:<10}"
        )
    
    print("\n" + "=" * 80)
    print("CONFUSION MATRICES")
    print("=" * 80)
    
    for label_name, cm in confusion_matrices.items():
        print(f"\n{label_name}:")
        print(f"  True Positives:  {cm['true_positive']:4d}  |  False Positives: {cm['false_positive']:4d}")
        print(f"  False Negatives: {cm['false_negative']:4d}  |  True Negatives:  {cm['true_negative']:4d}")
    
    print("\n" + "=" * 80)


def save_evaluation_report(
    output_dir: Path,
    per_label_metrics: Dict[str, Dict[str, float]],
    macro_metrics: Dict[str, float],
    confusion_matrices: Dict[str, Dict[str, int]],
    errors: Dict[str, List[Dict[str, Any]]],
    samples: List[Dict[str, Any]],
    threshold: float,
    model_path: str,
    dataset_path: str,
    category: str,
    grouped_false_positives: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    run_id: Optional[str] = None,
    fp_destination: Optional[Path] = None,
):
    """Save comprehensive evaluation report to files."""
    output_dir.mkdir(parents=True, exist_ok=True)
    run_identifier = run_id or output_dir.name
    
    # Main evaluation report
    report = {
        "model_path": model_path,
        "dataset_path": dataset_path,
        "category": category,
        "threshold": threshold,
        "macro_metrics": macro_metrics,
        "per_label_metrics": per_label_metrics,
        "confusion_matrices": confusion_matrices,
        "summary": {
            "num_labels": len(per_label_metrics),
            "labels_above_f1_0.70": sum(1 for m in per_label_metrics.values() if m["f1"] >= 0.70),
            "labels_above_f1_0.75": sum(1 for m in per_label_metrics.values() if m["f1"] >= 0.75),
            "labels_above_f1_0.80": sum(1 for m in per_label_metrics.values() if m["f1"] >= 0.80),
            "weakest_label": min(per_label_metrics.items(), key=lambda x: x[1]["f1"])[0],
            "strongest_label": max(per_label_metrics.items(), key=lambda x: x[1]["f1"])[0],
        },
    }
    
    report_path = output_dir / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    LOGGER.info(f"✅ Saved evaluation report to {report_path}")
    
    # Error analysis
    error_path = output_dir / "error_analysis.json"
    with open(error_path, "w", encoding="utf-8") as f:
        json.dump(errors, f, indent=2)
    LOGGER.info(f"✅ Saved error analysis to {error_path}")

    if grouped_false_positives is not None:
        fp_path = output_dir / "false_positives_by_label.json"
        with open(fp_path, "w", encoding="utf-8") as f:
            json.dump(grouped_false_positives, f, indent=2)
        LOGGER.info(f"✅ Saved grouped false positives to {fp_path}")

        if fp_destination is not None:
            dest_dir = fp_destination / category
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_path = dest_dir / f"{run_identifier}.json"
            with dest_path.open("w", encoding="utf-8") as f:
                json.dump(grouped_false_positives, f, indent=2)
            LOGGER.info(f"✅ Published grouped false positives to {dest_path}")
    
    # Sample predictions
    samples_path = output_dir / "predictions_sample.json"
    with open(samples_path, "w", encoding="utf-8") as f:
        json.dump(samples, f, indent=2)
    LOGGER.info(f"✅ Saved sample predictions to {samples_path}")


def main():
    args = parse_args()
    
    # Load category config
    category_config = CATEGORY_REGISTRY[args.category]
    LOGGER.info(f"Evaluating category: {args.category}")
    LOGGER.info(f"Labels: {', '.join(category_config.label_list)}")
    
    # Load model and tokenizer
    LOGGER.info(f"Loading model from {args.model}")
    model = AutoModelForSequenceClassification.from_pretrained(args.model)
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    
    # Check for GPU
    import torch
    device = 0 if torch.cuda.is_available() else -1
    if device >= 0:
        model = model.to(f"cuda:{device}")
        LOGGER.info("✅ Using GPU for inference")
    else:
        LOGGER.info("⚠️  Using CPU for inference (will be slower)")
    
    # Load evaluation dataset
    eval_dataset = load_dataset(args.dataset, args.eval_split, args.seed)
    
    # Extract texts and labels
    texts = list(eval_dataset["text"])
    
    # Build label matrix
    y_true = np.zeros((len(eval_dataset), len(category_config.label_list)), dtype=int)
    for i, example in enumerate(eval_dataset):
        # Handle both dict and list label formats
        labels_data = example.get("labels", [])
        if isinstance(labels_data, dict):
            # Dict format: {label_name: 1.0 or 0.0}
            for label_name, value in labels_data.items():
                if label_name in category_config.label_list and value is not None and value > 0:
                    label_idx = category_config.label_list.index(label_name)
                    y_true[i, label_idx] = 1
        elif isinstance(labels_data, list):
            # List format: [label_name1, label_name2, ...]
            for label in labels_data:
                if label in category_config.label_list:
                    label_idx = category_config.label_list.index(label)
                    y_true[i, label_idx] = 1
    
    LOGGER.info(f"Evaluation dataset: {len(texts)} examples")
    LOGGER.info(f"Label distribution: {y_true.sum(axis=0).tolist()}")
    
    # Run predictions
    y_pred, probabilities = predict_batch(
        model=model,
        tokenizer=tokenizer,
        texts=texts,
        label_list=category_config.label_list,
        threshold=args.threshold,
        device=device,
    )
    
    # Compute metrics
    LOGGER.info("Computing metrics...")
    per_label_metrics = compute_per_label_metrics(y_true, y_pred, category_config.label_list)
    macro_metrics = compute_macro_metrics(y_true, y_pred)
    confusion_matrices = compute_confusion_matrices(y_true, y_pred, category_config.label_list)
    
    # Print summary
    print_evaluation_summary(per_label_metrics, macro_metrics, confusion_matrices, args.threshold)
    
    # Generate detailed analysis (unless quick mode)
    if not args.quick:
        LOGGER.info("Generating error analysis...")
        errors = analyze_errors(texts, y_true, y_pred, probabilities, category_config.label_list)
        grouped_false_positives = group_false_positives_by_label(errors, args.fp_top_k)
        
        LOGGER.info("Generating sample predictions...")
        samples = generate_sample_predictions(
            texts, y_true, y_pred, probabilities, category_config.label_list, args.sample_size
        )
        
        # Save reports if output directory specified
        if args.output_dir:
            output_dir = Path(args.output_dir)
            save_evaluation_report(
                output_dir=output_dir,
                per_label_metrics=per_label_metrics,
                macro_metrics=macro_metrics,
                confusion_matrices=confusion_matrices,
                errors=errors,
                samples=samples,
                threshold=args.threshold,
                model_path=args.model,
                dataset_path=args.dataset,
                category=args.category,
                grouped_false_positives=grouped_false_positives,
                run_id=args.run_id,
                fp_destination=args.fp_destination,
            )
            print(f"\n✅ Full evaluation report saved to {output_dir}")
        else:
            print(f"\n💡 Tip: Use --output-dir to save detailed reports")
    
    # Success/failure assessment
    print("\n" + "=" * 80)
    print("ASSESSMENT")
    print("=" * 80)
    
    macro_f1 = macro_metrics["macro_f1"]
    labels_below_threshold = [
        label for label, metrics in per_label_metrics.items() if metrics["f1"] < 0.70
    ]
    
    if macro_f1 >= 0.80:
        print(f"✅ EXCELLENT: Macro F1 = {macro_f1:.4f} (≥0.80) - Production ready!")
    elif macro_f1 >= 0.75:
        print(f"✅ GOOD: Macro F1 = {macro_f1:.4f} (≥0.75) - Acceptable performance")
    elif macro_f1 >= 0.65:
        print(f"⚠️  FAIR: Macro F1 = {macro_f1:.4f} (0.65-0.75) - Consider optimization")
    else:
        print(f"❌ POOR: Macro F1 = {macro_f1:.4f} (<0.65) - Needs significant improvement")
    
    if labels_below_threshold:
        print(f"\n⚠️  Labels below F1 0.70: {', '.join(labels_below_threshold)}")
        print("   Consider: more training data, hyperparameter tuning, or threshold adjustment")
    else:
        print("\n✅ All labels meet F1 ≥ 0.70 threshold")
    
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
