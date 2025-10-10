#!/usr/bin/env python3
"""Download datasets from Hugging Face for harvesting."""

import argparse
from pathlib import Path
from datasets import load_dataset
import json


def download_dataset(dataset_id: str, output_dir: Path, subset: str = None, split: str = None):
    """Download a dataset from Hugging Face Hub.
    
    Args:
        dataset_id: HF dataset identifier (e.g., 'nguha/legalbench')
        output_dir: Local directory to save the dataset
        subset: Optional dataset subset/configuration
        split: Optional split to download (train, test, etc.)
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading dataset: {dataset_id}")
    if subset:
        print(f"  Subset: {subset}")
    if split:
        print(f"  Split: {split}")
    
    try:
        # Load dataset
        if subset:
            dataset = load_dataset(dataset_id, subset, split=split)
        else:
            dataset = load_dataset(dataset_id, split=split)
        
        # Save to JSONL format
        output_file = output_dir / "raw_data.jsonl"
        
        # Handle different dataset structures
        if split and hasattr(dataset, '__iter__'):
            # Single split
            records = list(dataset)
        elif hasattr(dataset, 'keys'):
            # Multiple splits - concatenate all
            records = []
            for split_name in dataset.keys():
                records.extend(list(dataset[split_name]))
        else:
            records = list(dataset)
        
        # Write to JSONL
        with output_file.open('w', encoding='utf-8') as f:
            for record in records:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
        
        print(f"✅ Downloaded {len(records)} records to {output_file}")
        
        # Save metadata
        metadata = {
            "dataset_id": dataset_id,
            "subset": subset,
            "split": split,
            "num_records": len(records),
            "output_file": str(output_file),
        }
        
        metadata_file = output_dir / "metadata.json"
        with metadata_file.open('w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Saved metadata to {metadata_file}")
        
        return len(records)
        
    except Exception as e:
        print(f"❌ Error downloading {dataset_id}: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        required=True,
        help="HuggingFace dataset ID (e.g., 'nguha/legalbench')"
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output directory for downloaded data"
    )
    parser.add_argument(
        "--subset",
        help="Optional dataset subset/configuration"
    )
    parser.add_argument(
        "--split",
        help="Optional split to download (e.g., 'train', 'test')"
    )
    
    args = parser.parse_args()
    
    download_dataset(
        dataset_id=args.dataset,
        output_dir=args.output,
        subset=args.subset,
        split=args.split,
    )


if __name__ == "__main__":
    main()
