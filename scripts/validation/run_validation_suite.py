#!/usr/bin/env python3
"""Run v2025.10.13 model on validation suite and analyze results."""

import json
import os
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List

# Disable CUDA to avoid bitsandbytes issues
os.environ['CUDA_VISIBLE_DEVICES'] = ''

from setfit import SetFitModel


def load_validation_suite(path: Path) -> List[Dict]:
    """Load validation suite."""
    examples = []
    with path.open('r', encoding='utf-8') as f:
        for line in f:
            examples.append(json.loads(line))
    return examples


def predict_with_confidence(model, texts: List[str]) -> List[Dict]:
    """Run predictions with confidence scores."""
    # Get predictions
    predictions = model.predict(texts, as_numpy=True)
    
    # Get probabilities for confidence
    probs = model.predict_proba(texts, as_numpy=True)
    
    results = []
    for pred, prob_dist in zip(predictions, probs):
        # pred is the class index (0 or 1)
        # prob_dist is [prob_class_0, prob_class_1]
        confidence = float(prob_dist[pred])
        predicted_label = "automated_decision" if pred == 1 else "NEGATIVE"
        
        results.append({
            "predicted_label": predicted_label,
            "confidence": confidence,
            "prob_negative": float(prob_dist[0]),
            "prob_positive": float(prob_dist[1]),
        })
    
    return results


def analyze_results(examples: List[Dict], predictions: List[Dict]) -> Dict:
    """Analyze validation results by category."""
    
    by_category = defaultdict(list)
    
    for ex, pred in zip(examples, predictions):
        category = ex["test_category"]
        expected = ex["expected_label"]
        predicted = pred["predicted_label"]
        confidence = pred["confidence"]
        
        # Determine correctness
        if expected == "AMBIGUOUS":
            correct = None  # Can't judge
        elif expected == "NEGATIVE":
            correct = (predicted == "NEGATIVE")
        else:  # expected == "automated_decision"
            correct = (predicted == "automated_decision")
        
        by_category[category].append({
            "text": ex["text"],
            "expected": expected,
            "predicted": predicted,
            "confidence": confidence,
            "correct": correct,
            "prob_negative": pred["prob_negative"],
            "prob_positive": pred["prob_positive"],
        })
    
    # Compute stats by category
    stats = {}
    for category, results in by_category.items():
        # Filter out ambiguous for accuracy calculation
        judged_results = [r for r in results if r["correct"] is not None]
        
        if judged_results:
            accuracy = sum(r["correct"] for r in judged_results) / len(judged_results)
            errors = [r for r in judged_results if not r["correct"]]
            avg_confidence = sum(r["confidence"] for r in results) / len(results)
        else:
            accuracy = None
            errors = []
            avg_confidence = sum(r["confidence"] for r in results) / len(results)
        
        stats[category] = {
            "total": len(results),
            "accuracy": accuracy,
            "avg_confidence": avg_confidence,
            "errors": errors,
            "all_results": results,
        }
    
    return stats


def print_report(stats: Dict) -> None:
    """Print validation report."""
    print("\n" + "="*80)
    print("VALIDATION SUITE RESULTS - v2025.10.13 Model")
    print("="*80)
    
    categories_order = [
        "adversarial_transparency",
        "adversarial_automated_decision",
        "cross_domain",
        "edge_case",
    ]
    
    total_judged = 0
    total_correct = 0
    
    for category in categories_order:
        if category not in stats:
            continue
        
        cat_stats = stats[category]
        print(f"\n📊 {category.upper().replace('_', ' ')}")
        print(f"   Total examples: {cat_stats['total']}")
        
        if cat_stats["accuracy"] is not None:
            print(f"   Accuracy: {cat_stats['accuracy']:.1%}")
            print(f"   Avg confidence: {cat_stats['avg_confidence']:.3f}")
            print(f"   Errors: {len(cat_stats['errors'])}")
            
            # Track overall
            judged = [r for r in cat_stats["all_results"] if r["correct"] is not None]
            total_judged += len(judged)
            total_correct += sum(r["correct"] for r in judged)
            
            # Show error examples
            if cat_stats["errors"]:
                print(f"\n   ❌ ERROR EXAMPLES:")
                for i, err in enumerate(cat_stats["errors"][:3], 1):  # Show first 3
                    print(f"\n      [{i}] Expected: {err['expected']}")
                    print(f"          Predicted: {err['predicted']} (conf: {err['confidence']:.3f})")
                    print(f"          Text: {err['text'][:100]}...")
                
                if len(cat_stats["errors"]) > 3:
                    print(f"\n      ... and {len(cat_stats['errors']) - 3} more errors")
        else:
            # Ambiguous category
            print(f"   (Ambiguous - no accuracy computed)")
            print(f"   Avg confidence: {cat_stats['avg_confidence']:.3f}")
            
            # Show prediction distribution
            pred_dist = Counter(r["predicted"] for r in cat_stats["all_results"])
            print(f"   Predictions: {dict(pred_dist)}")
            
            # Show confidence ranges
            confidences = [r["confidence"] for r in cat_stats["all_results"]]
            print(f"   Confidence range: {min(confidences):.3f} - {max(confidences):.3f}")
    
    # Overall accuracy
    if total_judged > 0:
        overall_accuracy = total_correct / total_judged
        print(f"\n{'='*80}")
        print(f"OVERALL ACCURACY (excluding edge cases): {overall_accuracy:.1%} ({total_correct}/{total_judged})")
        print(f"{'='*80}\n")


def save_detailed_results(stats: Dict, output_path: Path) -> None:
    """Save detailed results to file."""
    output = {
        "model": "v2025.10.13",
        "validation_suite": "algorithmic_decisions_generalization_suite_v2025.10.13",
        "stats_by_category": {},
    }
    
    for category, cat_stats in stats.items():
        output["stats_by_category"][category] = {
            "total": cat_stats["total"],
            "accuracy": cat_stats["accuracy"],
            "avg_confidence": cat_stats["avg_confidence"],
            "num_errors": len(cat_stats["errors"]),
            "results": cat_stats["all_results"],
        }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Detailed results saved to: {output_path}")


def main():
    """Main validation pipeline."""
    # Paths
    validation_suite_path = Path("data/validation/algorithmic_decisions_generalization_suite_v2025.10.13.jsonl")
    model_path = Path("artifacts/models/algorithmic_decisions/v2025.10.13")
    output_path = Path("evaluation_reports/generalization_validation_v2025.10.13.json")
    
    # Load model
    print(f"📦 Loading model from {model_path}...")
    model = SetFitModel.from_pretrained(str(model_path))
    print("✅ Model loaded")
    
    # Load validation suite
    print(f"\n📄 Loading validation suite from {validation_suite_path}...")
    examples = load_validation_suite(validation_suite_path)
    print(f"✅ Loaded {len(examples)} validation examples")
    
    # Run predictions
    print(f"\n🔮 Running predictions...")
    texts = [ex["text"] for ex in examples]
    predictions = predict_with_confidence(model, texts)
    print("✅ Predictions complete")
    
    # Analyze results
    print(f"\n📊 Analyzing results...")
    stats = analyze_results(examples, predictions)
    
    # Print report
    print_report(stats)
    
    # Save detailed results
    save_detailed_results(stats, output_path)


if __name__ == "__main__":
    main()
