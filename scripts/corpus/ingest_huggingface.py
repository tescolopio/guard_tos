#!/usr/bin/env python3
"""
Ingest Hugging Face datasets into Terms Guardian corpus format.

This script processes downloaded HF datasets from data/raw/ and converts them
into standardized JSONL format for weak-supervision labeling and training.

Usage:
    python scripts/corpus/ingest_huggingface.py [--dry-run] [--dataset DATASET_NAME]
    
Output:
    data/corpus/<dataset_name>.jsonl - Processed documents in standard format
    
Format:
    Each line is a JSON object with:
    {
        "doc_id": "unique_identifier",
        "text": "document text",
        "source": "dataset_name",
        "metadata": {
            "original_split": "train/test/val",
            "length": token_count,
            "language": "en",
            ...
        }
    }
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Iterator, Tuple
from collections import defaultdict

try:
    import yaml
except ImportError:
    print("ERROR: Missing pyyaml dependency. Install: pip install pyyaml")
    sys.exit(2)

try:
    from datasets import load_from_disk, Dataset
except ImportError:
    print("ERROR: Missing datasets dependency. Install: pip install datasets")
    sys.exit(2)

# Optional: language detection for filtering
try:
    from langdetect import detect, LangDetectException
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("WARNING: langdetect not available. Language filtering disabled.")


MANIFEST_PATH = Path("data/manifests/hf_datasets.yml")
DEFAULT_OUTPUT_DIR = Path("data/corpus")
DEFAULT_RAW_DIR = Path("data/raw")


class HuggingFaceIngester:
    """Process Hugging Face datasets into corpus format."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.output_dir = Path(config.get("output_dir", DEFAULT_OUTPUT_DIR))
        self.min_length = config.get("min_text_length", 50)
        self.max_length = config.get("max_text_length", 5000)
        self.target_language = config.get("language", "en")
        self.deduplicate = config.get("deduplicate", True)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.stats = defaultdict(int)
        self.seen_texts = set() if self.deduplicate else None
    
    def detect_language(self, text: str) -> Optional[str]:
        """Detect language of text. Returns None if detection unavailable."""
        if not LANGDETECT_AVAILABLE:
            return None
        try:
            return detect(text)
        except LangDetectException:
            return None
    
    def is_valid_text(self, text: str) -> bool:
        """Check if text meets quality criteria."""
        if not text or not text.strip():
            return False
        
        text_len = len(text)
        if text_len < self.min_length or text_len > self.max_length:
            self.stats["filtered_length"] += 1
            return False
        
        # Language check (if available)
        if LANGDETECT_AVAILABLE and self.target_language:
            lang = self.detect_language(text)
            if lang and lang != self.target_language:
                self.stats["filtered_language"] += 1
                return False
        
        # Deduplication
        if self.deduplicate:
            text_hash = hash(text.strip().lower())
            if text_hash in self.seen_texts:
                self.stats["filtered_duplicate"] += 1
                return False
            self.seen_texts.add(text_hash)
        
        return True
    
    @staticmethod
    def _normalise_whitespace(value: str) -> str:
        return re.sub(r"\s+", " ", value.strip())

    def _parse_privacy_policy_qa(self, example: Dict) -> List[Tuple[str, Dict[str, object]]]:
        """Break privacy-policy QA prompts into individual clause/question records."""
        text = example.get("text", "")
        if not text:
            return []

        start = text.find("Clause:")
        if start == -1:
            return []

        cursor = start
        segments: List[Tuple[str, Dict[str, object]]] = []
        top_level_label = example.get("label")

        while cursor != -1:
            clause_idx = text.find("Clause:", cursor)
            if clause_idx == -1:
                break
            question_idx = text.find("Question:", clause_idx)
            if question_idx == -1:
                break

            next_clause_idx = text.find("Clause:", question_idx + len("Question:"))
            label_idx = text.find("Label:", question_idx)
            use_label = -1
            if label_idx != -1 and (next_clause_idx == -1 or label_idx < next_clause_idx):
                use_label = label_idx

            clause_raw = text[clause_idx + len("Clause:") : question_idx]
            if use_label != -1:
                question_raw = text[question_idx + len("Question:") : use_label]
                label_raw = text[use_label + len("Label:") : next_clause_idx if next_clause_idx != -1 else len(text)]
            else:
                question_raw = text[question_idx + len("Question:") : next_clause_idx if next_clause_idx != -1 else len(text)]
                label_raw = ""

            clause = self._normalise_whitespace(clause_raw)
            question = self._normalise_whitespace(question_raw)
            inline_label = self._normalise_whitespace(label_raw) if label_raw else ""

            if clause:
                combined_text = clause
                if question:
                    combined_text = f"{clause}\n\nQuestion: {question}"

                metadata: Dict[str, object] = {
                    "question": question,
                    "example_role": "query" if next_clause_idx == -1 else "few_shot",
                }

                if inline_label:
                    metadata["provided_label"] = inline_label
                if next_clause_idx == -1 and top_level_label:
                    metadata["target_label"] = top_level_label

                segments.append((combined_text, metadata))

            cursor = next_clause_idx

        return segments

    def extract_text_from_example(
        self, example: Dict, dataset_name: str
    ) -> List[Tuple[str, Dict[str, object]]]:
        """Extract text + metadata tuples from a dataset example."""
        # Common text field names in legal datasets
        text_fields = [
            "text", "content", "clause", "document", "policy", 
            "provision", "paragraph", "sentence", "excerpt",
            "question", "context"  # For QA datasets
        ]
        
        # Dataset-specific mappings
        if "cuad" in dataset_name.lower():
            # CUAD has 'clause' field for contract clauses
            text = example.get("clause") or example.get("text") or example.get("context", "")
            if text:
                return [(text, {})]
        elif "privacy-policy-qa" in dataset_name.lower():
            return self._parse_privacy_policy_qa(example)
        elif "ledgar" in dataset_name.lower():
            # LEDGAR has 'text' field
            text = example.get("text", "")
            if text:
                return [(text, {})]
        else:
            # Generic extraction
            text = None
            for field in text_fields:
                if field in example:
                    text = example[field]
                    break
            
            if not text and isinstance(example, dict):
                # Try to find any string field with substantial content
                for key, value in example.items():
                    if isinstance(value, str) and len(value) > 30:
                        text = value
                        break
        
        if text:
            return [(text, {})]
        return []
    
    def process_dataset(
        self, 
        dataset_path: Path, 
        dataset_name: str,
        dry_run: bool = False
    ) -> int:
        """Process a single dataset directory."""
        print(f"\n[PROCESSING] {dataset_name}")
        print(f"  Source: {dataset_path}")
        
        if not dataset_path.exists():
            print(f"  [SKIP] Dataset path does not exist")
            return 0
        
        # Output file
        output_file = self.output_dir / f"{dataset_name}.jsonl"
        if output_file.exists() and not dry_run:
            print(f"  [SKIP] Output already exists: {output_file}")
            return 0
        
        # Load dataset splits
        splits = [d for d in dataset_path.iterdir() if d.is_dir()]
        if not splits:
            # Single dataset without splits
            splits = [dataset_path]
        
        doc_count = 0
        
        if dry_run:
            print(f"  [DRY-RUN] Would process {len(splits)} split(s)")
            return 0
        
        with open(output_file, "w", encoding="utf-8") as out_f:
            for split_path in splits:
                split_name = split_path.name if split_path != dataset_path else "default"
                print(f"  Processing split: {split_name}")
                
                try:
                    # Load the split
                    dataset = load_from_disk(str(split_path))
                    
                    for idx, example in enumerate(dataset):
                        records = self.extract_text_from_example(example, dataset_name)

                        if not records:
                            self.stats["no_text_field"] += 1
                            continue

                        for inner_idx, (text, extra_meta) in enumerate(records):
                            if not text:
                                continue

                            if not self.is_valid_text(text):
                                continue

                            metadata = {
                                "original_split": split_name,
                                "length": len(text),
                                "index": idx,
                            }
                            if extra_meta:
                                metadata.update(extra_meta)

                            doc = {
                                "doc_id": f"{dataset_name}_{split_name}_{idx}_{inner_idx}",
                                "text": text.strip(),
                                "source": dataset_name,
                                "metadata": metadata,
                            }

                            if "label" in example:
                                doc["metadata"].setdefault("original_label", example["label"])
                            if "labels" in example:
                                doc["metadata"].setdefault("original_labels", example["labels"])

                            out_f.write(json.dumps(doc, ensure_ascii=False) + "\n")
                            doc_count += 1

                            if doc_count % 1000 == 0:
                                print(f"    Processed {doc_count} documents...")
                
                except Exception as e:
                    print(f"  [ERROR] Failed to process split {split_name}: {e}")
                    continue
        
        print(f"  [DONE] Wrote {doc_count} documents to {output_file}")
        self.stats["total_documents"] += doc_count
        return doc_count
    
    def print_stats(self):
        """Print processing statistics."""
        print("\n" + "=" * 60)
        print("INGESTION STATISTICS")
        print("=" * 60)
        print(f"Total documents processed: {self.stats['total_documents']}")
        print(f"Filtered (length): {self.stats['filtered_length']}")
        print(f"Filtered (language): {self.stats['filtered_language']}")
        print(f"Filtered (duplicate): {self.stats['filtered_duplicate']}")
        print(f"No text field found: {self.stats['no_text_field']}")
        print("=" * 60)


def load_manifest(path: Path) -> Dict:
    """Load the HF datasets manifest."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_datasets_to_process(
    manifest: Dict,
    raw_dir: Path,
    specific_dataset: Optional[str] = None
) -> List[tuple]:
    """Get list of (dataset_path, dataset_name) tuples to process."""
    datasets = []
    
    # Get included datasets from manifest
    included = manifest.get("selection", {}).get("include", [])
    
    for entry in included:
        if isinstance(entry, dict):
            repo_id = entry.get("repo_id")
        else:
            repo_id = entry
        
        if not repo_id:
            continue
        
        # Convert repo_id to directory name
        dataset_dir_name = repo_id.replace("/", "__")
        dataset_path = raw_dir / dataset_dir_name
        
        # If specific dataset requested, filter
        if specific_dataset and specific_dataset not in dataset_dir_name:
            continue
        
        datasets.append((dataset_path, dataset_dir_name))
    
    return datasets


def main():
    parser = argparse.ArgumentParser(
        description="Ingest Hugging Face datasets into corpus format"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without actually processing"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        help="Process only this specific dataset (partial name match)"
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=MANIFEST_PATH,
        help="Path to HF datasets manifest YAML"
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=DEFAULT_RAW_DIR,
        help="Directory containing raw HF datasets"
    )
    
    args = parser.parse_args()
    
    # Load manifest
    if not args.manifest.exists():
        print(f"ERROR: Manifest not found: {args.manifest}")
        sys.exit(1)
    
    manifest = load_manifest(args.manifest)
    
    # Get ingestion config
    ingest_config = manifest.get("ingestion", {})
    
    # Create ingester
    ingester = HuggingFaceIngester(ingest_config)
    
    # Get datasets to process
    datasets = get_datasets_to_process(manifest, args.raw_dir, args.dataset)
    
    if not datasets:
        print("No datasets to process. Have you run scripts/hf_download.py?")
        sys.exit(1)
    
    print(f"Found {len(datasets)} dataset(s) to process")
    
    # Process each dataset
    total_docs = 0
    for dataset_path, dataset_name in datasets:
        doc_count = ingester.process_dataset(dataset_path, dataset_name, args.dry_run)
        total_docs += doc_count
    
    # Print summary
    if not args.dry_run:
        ingester.print_stats()
        print(f"\nCorpus files written to: {ingester.output_dir}")
        print("\nNext steps:")
        print("  1. Run QC on corpus: python scripts/corpus/qc_report.py")
        print("  2. Generate labeled datasets: python scripts/corpus/build_category_dataset.py")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
