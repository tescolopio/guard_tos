#!/usr/bin/env python3
"""Inspect a dataset before training.

Analyzes:
- Record count and label distribution
- Text length statistics
- Label co-occurrence patterns
- Potential data quality issues
"""

import argparse
import json
from pathlib import Path
from collections import Counter, defaultdict
import statistics

def analyze_dataset(dataset_path: Path):
    """Comprehensive dataset analysis."""
    
    print("=" * 70)
    print(f"DATASET INSPECTION: {dataset_path.name}")
    print("=" * 70)
    print()
    
    # Load data
    with dataset_path.open() as f:
        records = [json.loads(line) for line in f if line.strip()]
    
    print(f"📊 Total Records: {len(records)}")
    print()
    
    # Text length analysis
    text_lengths = [len(record["text"]) for record in records]
    print("📏 Text Length Statistics:")
    print(f"  Min: {min(text_lengths)} chars")
    print(f"  Max: {max(text_lengths)} chars")
    print(f"  Mean: {statistics.mean(text_lengths):.1f} chars")
    print(f"  Median: {statistics.median(text_lengths):.1f} chars")
    print(f"  StdDev: {statistics.stdev(text_lengths):.1f} chars")
    print()
    
    # Find outliers
    mean = statistics.mean(text_lengths)
    stdev = statistics.stdev(text_lengths)
    outliers = [i for i, length in enumerate(text_lengths) 
                if abs(length - mean) > 3 * stdev]
    if outliers:
        print(f"  ⚠️  {len(outliers)} outliers (>3σ from mean):")
        for i in outliers[:5]:  # Show first 5
            print(f"      Record {i}: {text_lengths[i]} chars")
        print()
    
    # Label analysis
    label_counts = Counter()
    label_examples = defaultdict(list)
    
    for i, record in enumerate(records):
        labels = record.get("labels", {})
        if isinstance(labels, dict):
            for label, value in labels.items():
                if value > 0:
                    label_counts[label] += 1
                    if len(label_examples[label]) < 3:
                        label_examples[label].append(i)
        elif isinstance(labels, list):
            for label in labels:
                label_counts[label] += 1
                if len(label_examples[label]) < 3:
                    label_examples[label].append(i)
    
    print("🏷️  Label Distribution:")
    total_labels = sum(label_counts.values())
    for label, count in sorted(label_counts.items(), key=lambda x: -x[1]):
        pct = (count / len(records)) * 100
        bar = "█" * int(pct / 2)
        print(f"  {label:30} {count:4} ({pct:5.1f}%) {bar}")
    print()
    
    # Label balance check
    if label_counts:
        max_count = max(label_counts.values())
        min_count = min(label_counts.values())
        imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
        
        print("⚖️  Label Balance:")
        print(f"  Max: {max_count} | Min: {min_count} | Ratio: {imbalance_ratio:.2f}x")
        if imbalance_ratio > 5:
            print("  ⚠️  HIGH IMBALANCE: Consider class weights or resampling")
        elif imbalance_ratio > 2:
            print("  ⚠️  Moderate imbalance: Monitor per-label metrics")
        else:
            print("  ✅ Well balanced")
        print()
    
    # Co-occurrence patterns
    print("🔗 Label Co-occurrence (top 10):")
    cooccurrence = Counter()
    for record in records:
        labels = record.get("labels", {})
        if isinstance(labels, dict):
            active = [l for l, v in labels.items() if v > 0]
        else:
            active = labels
        
        if len(active) > 1:
            for i, l1 in enumerate(active):
                for l2 in active[i+1:]:
                    pair = tuple(sorted([l1, l2]))
                    cooccurrence[pair] += 1
    
    for pair, count in cooccurrence.most_common(10):
        print(f"  {pair[0]:25} + {pair[1]:25} → {count} times")
    print()
    
    # Multilabel statistics
    labels_per_record = []
    for record in records:
        labels = record.get("labels", {})
        if isinstance(labels, dict):
            count = sum(1 for v in labels.values() if v > 0)
        else:
            count = len(labels)
        labels_per_record.append(count)
    
    print("📑 Multilabel Statistics:")
    print(f"  Avg labels per record: {statistics.mean(labels_per_record):.2f}")
    print(f"  Single-label records: {labels_per_record.count(1)}")
    print(f"  Multi-label records: {sum(1 for x in labels_per_record if x > 1)}")
    print(f"  No labels: {labels_per_record.count(0)}")
    print()
    
    # Sample texts
    print("📝 Sample Records (first 3):")
    for i in range(min(3, len(records))):
        record = records[i]
        labels = record.get("labels", {})
        if isinstance(labels, dict):
            active = [l for l, v in labels.items() if v > 0]
        else:
            active = labels
        
        text_preview = record["text"][:100] + "..." if len(record["text"]) > 100 else record["text"]
        print(f"\n  Record {i}:")
        print(f"    Labels: {', '.join(active)}")
        print(f"    Text: {text_preview}")
    print()
    
    # Quality checks
    print("✅ Quality Checks:")
    
    # Check for empty texts
    empty_texts = sum(1 for r in records if not r.get("text", "").strip())
    if empty_texts:
        print(f"  ❌ {empty_texts} records with empty text")
    else:
        print(f"  ✅ No empty texts")
    
    # Check for missing labels
    no_labels = sum(1 for r in records if not r.get("labels"))
    if no_labels:
        print(f"  ❌ {no_labels} records with no labels")
    else:
        print(f"  ✅ All records have labels")
    
    # Check for very short texts
    very_short = sum(1 for length in text_lengths if length < 20)
    if very_short:
        print(f"  ⚠️  {very_short} records with <20 chars")
    else:
        print(f"  ✅ No very short texts")
    
    # Check for very long texts
    very_long = sum(1 for length in text_lengths if length > 1000)
    if very_long:
        print(f"  ⚠️  {very_long} records with >1000 chars (may be truncated)")
    
    print()
    print("=" * 70)
    print("INSPECTION COMPLETE")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", required=True, help="Path to dataset JSONL file")
    args = parser.parse_args()
    
    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"❌ Dataset not found: {dataset_path}")
        return 1
    
    analyze_dataset(dataset_path)
    return 0


if __name__ == "__main__":
    exit(main())
