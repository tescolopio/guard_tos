#!/usr/bin/env python3
"""Merge synthetic problematic clauses into existing datasets.

This script:
1. Loads synthetic consent_implied and privacy_waiver examples
2. Merges them into data_collection and user_privacy corpora
3. Rebuilds datasets with improved label coverage

Example:
    python scripts/merge_synthetic_clauses.py
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path


def main() -> None:
    """Main function to merge synthetic data."""
    
    # Load synthetic examples
    synthetic_path = Path("data/aug/problematic_clauses.jsonl")
    print(f"Loading synthetic data from {synthetic_path}...")
    
    with synthetic_path.open() as f:
        synthetic = [json.loads(line) for line in f]
    
    consent_implied = [ex for ex in synthetic if ex["label"] == "consent_implied"]
    privacy_waiver = [ex for ex in synthetic if ex["label"] == "privacy_waiver"]
    
    print(f"  Loaded {len(consent_implied)} consent_implied examples")
    print(f"  Loaded {len(privacy_waiver)} privacy_waiver examples")
    
    # Merge into data_collection corpus (for consent_implied)
    data_collection_corpus = Path("data/corpus/data_collection_full.jsonl")
    print(f"\nMerging consent_implied into {data_collection_corpus}...")
    
    # Create backup
    backup_path = data_collection_corpus.parent / f"{data_collection_corpus.stem}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
    shutil.copy(data_collection_corpus, backup_path)
    print(f"  Created backup: {backup_path}")
    
    # Load existing corpus
    with data_collection_corpus.open() as f:
        existing_data_collection = [json.loads(line) for line in f]
    
    # Convert consent_implied examples to corpus format
    consent_corpus_items = []
    for i, ex in enumerate(consent_implied):
        corpus_item = {
            "text": ex["text"],
            "source": "synthetic_problematic_clauses",
            "chunk_id": i,
            "meta": ex.get("meta", {})
        }
        consent_corpus_items.append(corpus_item)
    
    # Merge
    updated_data_collection = existing_data_collection + consent_corpus_items
    
    with data_collection_corpus.open("w") as f:
        for item in updated_data_collection:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    print(f"  Merged {len(consent_corpus_items)} consent_implied examples")
    print(f"  New corpus size: {len(updated_data_collection)} (was {len(existing_data_collection)})")
    
    # Merge into user_privacy corpus (for privacy_waiver)
    # Note: user_privacy currently reuses data_collection corpus
    # We'll create a dedicated user_privacy corpus now
    user_privacy_corpus = Path("data/corpus/user_privacy_full.jsonl")
    print(f"\nCreating {user_privacy_corpus} with privacy_waiver examples...")
    
    # Convert privacy_waiver examples to corpus format
    privacy_corpus_items = []
    for i, ex in enumerate(privacy_waiver):
        corpus_item = {
            "text": ex["text"],
            "source": "synthetic_problematic_clauses",
            "chunk_id": i,
            "meta": ex.get("meta", {})
        }
        privacy_corpus_items.append(corpus_item)
    
    # User privacy should include the data_collection corpus + privacy_waiver
    all_user_privacy = existing_data_collection + consent_corpus_items + privacy_corpus_items
    
    user_privacy_corpus.parent.mkdir(parents=True, exist_ok=True)
    with user_privacy_corpus.open("w") as f:
        for item in all_user_privacy:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    print(f"  Created user_privacy corpus with {len(privacy_corpus_items)} privacy_waiver examples")
    print(f"  Total corpus size: {len(all_user_privacy)}")
    
    print("\n✓ Successfully merged synthetic data!")
    print("\nNext steps:")
    print("  1. Rebuild data_collection dataset: python scripts/build_category_dataset.py \\")
    print("       --category data_collection \\")
    print("       --corpus data/corpus/data_collection_full.jsonl \\")
    print("       --output data/processed/data_collection/v2025.10.07d")
    print("\n  2. Rebuild user_privacy dataset: python scripts/build_category_dataset.py \\")
    print("       --category user_privacy \\")
    print("       --corpus data/corpus/user_privacy_full.jsonl \\")
    print("       --output data/processed/user_privacy/v2025.10.07b")


if __name__ == "__main__":
    main()
