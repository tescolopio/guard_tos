#!/usr/bin/env python3
"""Build a per-category training dataset for Terms Guardian models.

This utility converts clause-level harvests/heuristics into the multi-label JSONL
structure expected by `scripts/ml/train_category_model.py`.

Example:
    python scripts/corpus/build_category_dataset.py \
        --category dispute_resolution \
        --input data/clauses.jsonl \
        --output-dir data/processed/dispute_resolution/v2025.09.27 \
        --sources harvested_clauses,hf_cuad
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence

try:
    import yaml
    HAS_YAML = True
except ImportError:  # pragma: no cover
    HAS_YAML = False

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:  # pragma: no cover - runtime path fix for scripts
    sys.path.insert(0, str(REPO_ROOT))

from scripts.ml.category_config import CATEGORY_REGISTRY, CategoryConfig

PATTERNS_DIR = REPO_ROOT / "scripts" / "corpus" / "patterns"

# Fallback patterns if YAML loading fails
FALLBACK_LABEL_PATTERNS: Dict[str, Dict[str, Sequence[re.Pattern[str]]]] = {
    "dispute_resolution": {
        "binding_arbitration": (
            re.compile(r"\barbitrat", re.IGNORECASE),
            re.compile(r"\brules\s+of\s+(?:aaa|jams)", re.IGNORECASE),
        ),
        "class_action_waiver": (
            re.compile(r"class\s+action", re.IGNORECASE),
            re.compile(r"collective\s+action\s+waiver", re.IGNORECASE),
        ),
        "jury_trial_waiver": (
            re.compile(r"jury\s+trial", re.IGNORECASE),
            re.compile(r"waive\s+.*jury", re.IGNORECASE),
        ),
        "venue_selection": (
            re.compile(r"exclusive\s+venue", re.IGNORECASE),
            re.compile(r"venue\s+shall\s+be", re.IGNORECASE),
            re.compile(r"governing\s+law", re.IGNORECASE),
        ),
    },
    "content_rights": {
        "license_assignment": (
            re.compile(r"\bgrant(?:s|ed|ing)?\s+(?:us|the\s+(?:company|service|platform|provider))\b.*\blicense", re.IGNORECASE),
            re.compile(r"\bnon[- ]exclusive\s+royalty[- ]free\s+license", re.IGNORECASE),
        ),
        "ip_retained": (
            re.compile(r"\byou\s+retain\s+(?:all\s+)?ownership\s+(?:rights?|of)\s+(?:your\s+)?content", re.IGNORECASE),
        ),
        "moral_rights_waiver": (
            re.compile(r"\bwaiv(?:e|er).{0,40}moral\s+rights", re.IGNORECASE),
        ),
        "commercial_use_claim": (
            re.compile(r"\buse\s+(?:your\s+)?content\s+for\s+(?:advertising|marketing|promotion|commercial)", re.IGNORECASE),
        ),
    }
}

SOURCE_LABEL_MAP: Dict[str, Dict[str, Dict[str, float]]] = {
    "dispute_resolution": {
        "ARBITRATION": {"binding_arbitration": 1.0},
        "CLASS_ACTION_WAIVER": {"class_action_waiver": 1.0},
        "LIABILITY_LIMITATION": {},  # not part of DR label list
        "UNILATERAL_CHANGES": {},
    },
    "content_rights": {
        "LICENSE_ASSIGNMENT": {"license_assignment": 1.0},
        "IP_RETAINED": {"ip_retained": 1.0},
        "MORAL_RIGHTS_WAIVER": {"moral_rights_waiver": 1.0},
        "COMMERCIAL_USE_CLAIM": {"commercial_use_claim": 1.0},
    },
}


@dataclass
class DatasetStats:
    count: int
    label_totals: Dict[str, int]

    def distribution(self) -> Dict[str, float]:
        if self.count == 0:
            return {}
        return {
            label: round(total / self.count, 4)
            for label, total in sorted(self.label_totals.items())
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--input", required=True, help="Path to source JSONL with clause-level records")
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory where processed dataset + manifest will be written",
    )
    parser.add_argument(
        "--sources",
        default="",
        help="Comma-separated identifiers describing corpus sources (stored in manifest)",
    )
    parser.add_argument(
        "--min-labels",
        type=int,
        default=1,
        help="Minimum count of positive labels required to retain a record",
    )
    parser.add_argument(
        "--notes",
        default="Automated build via scripts/corpus/build_category_dataset.py",
        help="Notes string stored in manifest",
    )
    return parser.parse_args()


def load_jsonl(path: Path) -> Iterable[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def load_patterns_from_yaml(category: str) -> Dict[str, Sequence[re.Pattern[str]]]:
    """Load regex patterns from YAML file for the given category.
    
    Returns:
        Dictionary mapping label names to compiled regex patterns.
        Falls back to empty dict if YAML not available or file not found.
    """
    if not HAS_YAML:
        return {}
    
    pattern_file = PATTERNS_DIR / f"{category}.yaml"
    if not pattern_file.exists():
        return {}
    
    try:
        with pattern_file.open("r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        
        if not config or "labels" not in config:
            return {}
        
        result: Dict[str, List[re.Pattern[str]]] = {}
        
        for label_name, label_config in config["labels"].items():
            patterns: List[re.Pattern[str]] = []
            
            # Load positive patterns
            for pattern_def in label_config.get("positive_patterns", []):
                if isinstance(pattern_def, dict) and "pattern" in pattern_def:
                    try:
                        compiled = re.compile(pattern_def["pattern"], re.IGNORECASE)
                        patterns.append(compiled)
                    except re.error:
                        # Skip invalid regex
                        continue
            
            if patterns:
                result[label_name] = tuple(patterns)
        
        return result
        
    except (yaml.YAMLError, KeyError, TypeError):
        return {}


def get_patterns_for_category(category: str) -> Dict[str, Sequence[re.Pattern[str]]]:
    """Get patterns for a category, trying YAML first then fallback.
    
    Returns:
        Dictionary mapping label names to compiled regex patterns.
    """
    yaml_patterns = load_patterns_from_yaml(category)
    if yaml_patterns:
        return yaml_patterns
    
    # Fall back to hardcoded patterns
    return FALLBACK_LABEL_PATTERNS.get(category, {})


def map_source_labels(
    raw_labels: Sequence[str],
    category: str,
) -> Dict[str, float]:
    mappings = SOURCE_LABEL_MAP.get(category, {})
    label_scores: Dict[str, float] = defaultdict(float)
    for raw in raw_labels:
        for label, value in mappings.get(raw.upper(), {}).items():
            label_scores[label] = max(label_scores[label], value)
    return label_scores


def apply_pattern_heuristics(text: str, category: str) -> Dict[str, float]:
    results: Dict[str, float] = {}
    patterns = get_patterns_for_category(category)
    for label, pattern_list in patterns.items():
        for pattern in pattern_list:
            if pattern.search(text):
                results[label] = max(results.get(label, 0.0), 1.0)
                break
    return results


def build_record(
    text: str,
    rules: Dict[str, float],
    patterns: Dict[str, float],
    category_config: CategoryConfig,
) -> Dict[str, object]:
    labels = {label: 0.0 for label in category_config.label_list}
    for label, score in {**patterns, **rules}.items():
        if label in labels:
            labels[label] = max(labels[label], float(score))
    positives = sum(1 for value in labels.values() if value >= 0.5)
    return {
        "text": text,
        "labels": labels,
        "positive_label_count": positives,
    }


def summarise(records: List[Dict[str, object]], category_config: CategoryConfig) -> DatasetStats:
    totals = Counter({label: 0 for label in category_config.label_list})
    for record in records:
        labels = record["labels"]
        for label, value in labels.items():
            if value >= 0.5:
                totals[label] += 1
    return DatasetStats(len(records), dict(totals))


def main() -> None:
    args = parse_args()
    config = CATEGORY_REGISTRY[args.category]
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    sources = [s for s in (item.strip() for item in args.sources.split(",")) if s]

    processed: List[Dict[str, object]] = []
    for row in load_jsonl(input_path):
        text = str(row.get("text", "")).strip()
        if not text:
            continue
        raw_label = row.get("label")
        if isinstance(raw_label, str):
            raw_labels = [raw_label]
        elif isinstance(raw_label, list):
            raw_labels = [str(v) for v in raw_label]
        else:
            raw_labels = []

        rule_scores = map_source_labels(raw_labels, args.category)
        pattern_scores = apply_pattern_heuristics(text, args.category)
        record = build_record(text, rule_scores, pattern_scores, config)
        if record["positive_label_count"] < args.min_labels:
            continue
        processed.append(record)

    stats = summarise(processed, config)

    output_path = output_dir / "dataset.jsonl"
    with output_path.open("w", encoding="utf-8") as handle:
        for record in processed:
            record = {k: v for k, v in record.items() if k != "positive_label_count"}
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    manifest_path = output_dir / "manifest.json"
    manifest = {
        "category": config.name,
        "version": output_dir.name,
        "records": stats.count,
        "label_distribution": stats.distribution(),
        "sources": sources,
        "qa_sample_size": 0,
        "qa_accuracy": 0.0,
        "annotators": [],
        "license": "pending",
        "notes": args.notes,
    }
    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)

    readme_path = output_dir / "README.md"
    if not readme_path.exists():
        readme_path.write_text(
            "# "
            + config.name.replace("_", " ").title()
            + " Dataset\n\n"
            + "Automatically generated via corpus build CLI. Replace this file with "
            + "annotation notes once SMEs review the dataset.\n",
            encoding="utf-8",
        )

    summary_path = output_dir / "summary.json"
    with summary_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "records": stats.count,
                "label_totals": stats.label_totals,
            },
            handle,
            indent=2,
        )

    print(f"Wrote {stats.count} records to {output_path}")
    print(f"Label totals: {stats.label_totals}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":  # pragma: no cover
    main()
