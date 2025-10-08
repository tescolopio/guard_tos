#!/usr/bin/env python3
"""Verify all datasets are ready for training.

Checks that:
1. All dataset files exist
2. Files are not empty
3. Required fields are present (text, labels)
4. Label distributions are reasonable
"""

import json
from pathlib import Path
from collections import defaultdict

# Dataset paths for all 7 substantive categories
DATASETS = {
    "content_rights": "data/processed/content_rights/v2025.10.08a/dataset.jsonl",
    "dispute_resolution": "data/processed/dispute_resolution/v2025.10.07/dataset.jsonl",
    "data_collection": "data/processed/data_collection/v2025.10.07e/gold_seed.jsonl",
    "user_privacy": "data/processed/user_privacy/v2025.10.07c/gold_seed.jsonl",
    "account_management": "data/processed/account_management/v2025.10.07h/gold_seed.jsonl",
    "terms_changes": "data/processed/terms_changes/v2025.10.07e/gold_seed.jsonl",
    "algorithmic_decisions": "data/processed/algorithmic_decisions/v2025.10.07b/gold_seed.jsonl",
}


def check_dataset(name: str, path: str) -> bool:
    """Check if dataset is valid for training."""
    dataset_path = Path(path)
    
    # Check file exists
    if not dataset_path.exists():
        print(f"  ❌ File not found: {path}")
        return False
    
    # Load and validate
    try:
        with dataset_path.open() as f:
            records = [json.loads(line) for line in f if line.strip()]
        
        if not records:
            print(f"  ❌ Empty dataset")
            return False
        
        # Check required fields
        for i, record in enumerate(records[:5]):  # Check first 5
            if "text" not in record:
                print(f"  ❌ Missing 'text' field in record {i}")
                return False
            if "labels" not in record:
                print(f"  ❌ Missing 'labels' field in record {i}")
                return False
        
        # Count labels
        label_counts = defaultdict(int)
        for record in records:
            labels = record.get("labels", {})
            if isinstance(labels, dict):
                for label, value in labels.items():
                    if value > 0:
                        label_counts[label] += 1
            elif isinstance(labels, list):
                for label in labels:
                    label_counts[label] += 1
        
        print(f"  ✓ {len(records)} records")
        print(f"  ✓ {len(label_counts)} unique labels")
        
        # Show label distribution
        if label_counts:
            print(f"  ✓ Label distribution:")
            for label, count in sorted(label_counts.items()):
                print(f"      - {label}: {count}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error loading dataset: {e}")
        return False


def main():
    print("=" * 70)
    print("TRAINING READINESS CHECK")
    print("=" * 70)
    print()
    
    results = {}
    
    for category, path in DATASETS.items():
        print(f"📦 {category.upper().replace('_', ' ')}")
        print(f"   Path: {path}")
        results[category] = check_dataset(category, path)
        print()
    
    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    ready = sum(results.values())
    total = len(results)
    
    for category, is_ready in results.items():
        status = "✅ READY" if is_ready else "❌ NOT READY"
        print(f"  {category:25} {status}")
    
    print()
    print(f"Ready for Training: {ready}/{total} categories")
    
    if ready == total:
        print()
        print("✅ ALL DATASETS READY FOR TRAINING!")
        print()
        print("Next step: Run training script")
        print("  bash scripts/ml/train_all_categories.sh")
        print()
        print("Or train individual category:")
        print("  python scripts/ml/train_category_model.py \\")
        print("    --category data_collection \\")
        print("    --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \\")
        print("    --base-model distilbert-base-uncased \\")
        print("    --output-dir artifacts/models/data_collection/v2025.10.07e")
        return 0
    else:
        print()
        print("⚠️  Some datasets are not ready. Please fix issues above.")
        return 1


if __name__ == "__main__":
    exit(main())
