#!/usr/bin/env python3
"""Directly import synthetic examples that are already labeled.

Unlike build_category_dataset.py which uses weak supervision patterns,
this script directly imports pre-labeled synthetic data.
"""

import json
import argparse
from pathlib import Path
from collections import Counter
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Input JSONL file with labeled examples")
    parser.add_argument("--output-dir", required=True, help="Output directory")
    parser.add_argument("--category", required=True, help="Category name")
    parser.add_argument("--notes", default="", help="Build notes")
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read all examples and convert to expected format
    examples = []
    with input_path.open() as f:
        for line in f:
            ex = json.loads(line)
            # Convert labels list to dict with confidence scores
            if isinstance(ex.get('labels'), list):
                label_dict = {label: 1.0 for label in ex['labels']}
                ex['labels'] = label_dict
            examples.append(ex)
    
    # Count labels (handle both dict and list formats)
    label_counts = Counter()
    for ex in examples:
        labels = ex['labels']
        if isinstance(labels, dict):
            for label in labels.keys():
                label_counts[label] += 1
        else:  # list
            for label in labels:
                label_counts[label] += 1
    
    # Write dataset
    dataset_path = output_dir / "dataset.jsonl"
    with dataset_path.open("w") as f:
        for ex in examples:
            f.write(json.dumps(ex) + "\n")
    
    # Calculate label distribution
    total_records = len(examples)
    label_distribution = {
        label: count / total_records
        for label, count in label_counts.items()
    }
    
    # Write manifest
    manifest = {
        "category": args.category,
        "version": output_dir.name,
        "records": total_records,
        "label_distribution": label_distribution,
        "label_counts": dict(label_counts),
        "sources": ["synthetic"],
        "created": datetime.now().isoformat(),
        "notes": args.notes or "Direct import of pre-labeled synthetic data"
    }
    
    manifest_path = output_dir / "manifest.json"
    with manifest_path.open("w") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"✓ Wrote {total_records} records to {dataset_path}")
    print(f"✓ Label counts: {dict(label_counts)}")
    print(f"✓ Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
