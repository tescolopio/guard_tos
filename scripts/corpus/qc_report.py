#!/usr/bin/env python3
"""Generate automated QC reports for processed category datasets."""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, DefaultDict, Dict, Iterable, List, Optional, Sequence, Tuple

import yaml

try:  # pragma: no cover - optional dependency guard
    from langdetect import DetectorFactory, LangDetectException, detect_langs

    DetectorFactory.seed = 0
    LANGDETECT_AVAILABLE = True
except ImportError:  # pragma: no cover - fallback when langdetect missing
    LangDetectException = Exception  # type: ignore[assignment]
    detect_langs = None  # type: ignore[assignment]
    LANGDETECT_AVAILABLE = False

try:  # pragma: no cover - optional dependency guard
    from datasketch import MinHash, MinHashLSH

    DATASKETCH_AVAILABLE = True
except ImportError:  # pragma: no cover - fallback when datasketch missing
    MinHash = None  # type: ignore[assignment]
    MinHashLSH = None  # type: ignore[assignment]
    DATASKETCH_AVAILABLE = False

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:  # pragma: no cover - runtime path fix for scripts
    sys.path.insert(0, str(REPO_ROOT))

from scripts.ml.category_config import CATEGORY_REGISTRY, CategoryConfig

DEFAULT_STOPWORDS = {
    "the",
    "and",
    "that",
    "shall",
    "will",
    "you",
    "your",
    "our",
    "may",
    "not",
    "for",
    "with",
    "have",
    "hereby",
    "such",
    "this",
}

MINHASH_PERMUTATIONS = 128
MINHASH_SHINGLE_SIZE = 3

DEFAULT_THRESHOLD_VALUES = {
    "max_duplicate_ratio": 0.05,
    "max_non_primary_language": 0.10,
    "min_tokens": 5,
    "max_tokens": 3000,
    "minhash_similarity_threshold": 0.85,
}

QC_THRESHOLD_CONFIG_PATH = REPO_ROOT / "scripts" / "corpus" / "config" / "qc_thresholds.yaml"


@dataclass
class DatasetRecord:
    text: str
    labels: Dict[str, float]


@dataclass
class IntegrityResult:
    status: str
    errors: List[str]


@dataclass
class StructureResult:
    status: str
    issues: List[str]


@dataclass
class LengthStats:
    char_stats: Dict[str, float]
    token_stats: Dict[str, float]
    flags: List[str]


@dataclass
class LanguageStats:
    primary: str
    breakdown: Dict[str, float]
    flags: List[str]
    classification: Dict[str, float]
    confidence_summary: Dict[str, float]


@dataclass
class DedupeStats:
    duplicate_ratio: float
    sample_duplicates: List[Tuple[int, int]]
    flags: List[str]
    similarity_threshold: float


@dataclass
class LabelStats:
    totals: Dict[str, int]
    warnings: List[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True, choices=sorted(CATEGORY_REGISTRY.keys()))
    parser.add_argument("--dataset", required=True, help="Path to processed dataset JSONL file")
    parser.add_argument("--manifest", help="Optional manifest JSON with expected counts")
    parser.add_argument("--sources", default="", help="Comma-separated source identifiers to include in metadata")
    parser.add_argument("--version", help="Override dataset version used in metadata and output paths")
    parser.add_argument(
        "--output-dir",
        help="Directory to write QC reports; defaults to reports/qc/<category>/<version>",
    )
    parser.add_argument("--write-markdown", action="store_true", help="Emit a human-readable Markdown summary")
    parser.add_argument(
        "--max-duplicate-ratio",
        type=float,
        default=None,
        help="Maximum acceptable duplicate ratio before failing gates",
    )
    parser.add_argument(
        "--max-non-primary-language",
        type=float,
        default=None,
        help="Maximum fraction of records in non-primary languages",
    )
    parser.add_argument(
        "--min-tokens",
        type=int,
        default=None,
        help="Minimum allowed token count before flagging a record",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=None,
        help="Maximum allowed token count before flagging a record",
    )
    parser.add_argument(
        "--minhash-similarity-threshold",
        type=float,
        default=None,
        help="Similarity threshold for MinHash near-duplicate detection (0-1).",
    )
    parser.add_argument("--fail-on-warning", action="store_true", help="Exit non-zero if any warnings were raised")
    parser.add_argument("--sample-limit", type=int, default=20, help="Limit count for sample issue listings")
    return parser.parse_args()


def load_dataset(path: Path, config: CategoryConfig) -> Tuple[List[DatasetRecord], IntegrityResult, StructureResult]:
    records: List[DatasetRecord] = []
    integrity_errors: List[str] = []
    structure_issues: List[str] = []

    if not path.exists():
        return ([], IntegrityResult("fail", [f"Dataset file not found: {path}"]), StructureResult("fail", []))

    try:
        with path.open("r", encoding="utf-8") as handle:
            for idx, raw_line in enumerate(handle, start=1):
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError as exc:  # pragma: no cover - depends on malformed data
                    integrity_errors.append(f"Line {idx}: JSON decode error: {exc}")
                    continue

                text = str(payload.get("text", "")).strip()
                labels = payload.get("labels")

                if not text:
                    structure_issues.append(f"Line {idx}: Missing or empty text field")
                if not isinstance(labels, dict):
                    structure_issues.append(f"Line {idx}: Labels must be an object, got {type(labels).__name__}")
                    labels = {}

                validated_labels: Dict[str, float] = {}
                for label in config.label_list:
                    value = labels.get(label, 0.0)
                    try:
                        validated_labels[label] = float(value)
                    except (TypeError, ValueError):
                        structure_issues.append(
                            f"Line {idx}: Label '{label}' should be numeric, got {value!r}"
                        )
                        validated_labels[label] = 0.0

                for unknown_label in set(labels or {}).difference(config.label_list):
                    structure_issues.append(
                        f"Line {idx}: Unknown label '{unknown_label}' not defined for category {config.name}"
                    )

                records.append(DatasetRecord(text=text, labels=validated_labels))
    except UnicodeDecodeError as exc:  # pragma: no cover - depends on malformed file
        integrity_errors.append(f"Unicode decode error: {exc}")
    except OSError as exc:  # pragma: no cover - filesystem issues
        integrity_errors.append(f"File read error: {exc}")

    integrity_status = "pass" if not integrity_errors else "fail"
    structure_status = "pass" if not structure_issues else "fail"

    return records, IntegrityResult(integrity_status, integrity_errors), StructureResult(structure_status, structure_issues)


def tokenize(text: str) -> List[str]:
    return [token for token in text.split() if token]


def compute_length_stats(records: Sequence[DatasetRecord], min_tokens: int, max_tokens: int, sample_limit: int) -> LengthStats:
    char_lengths = [len(record.text) for record in records]
    token_lengths = [len(tokenize(record.text)) for record in records]

    def summarise(values: Sequence[int]) -> Dict[str, float]:
        if not values:
            return {"count": 0, "min": 0, "max": 0, "mean": 0.0, "median": 0.0}
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "mean": round(statistics.mean(values), 2),
            "median": round(statistics.median(values), 2),
        }

    flags: List[str] = []
    # Flag short records
    short_indexes = [idx for idx, length in enumerate(token_lengths) if length < min_tokens]
    long_indexes = [idx for idx, length in enumerate(token_lengths) if length > max_tokens]
    if short_indexes:
        sample = ", ".join(str(i) for i in short_indexes[:sample_limit])
        flags.append(f"{len(short_indexes)} records below min token threshold (examples: {sample})")
    if long_indexes:
        sample = ", ".join(str(i) for i in long_indexes[:sample_limit])
        flags.append(f"{len(long_indexes)} records above max token threshold (examples: {sample})")

    return LengthStats(
        char_stats=summarise(char_lengths),
        token_stats=summarise(token_lengths),
        flags=flags,
    )


def _coerce_threshold_value(key: str, value: Any) -> float | int:
    if value is None:
        raise ValueError("Threshold value cannot be None")
    if key in {"min_tokens", "max_tokens"}:
        return int(value)
    return float(value)


def load_thresholds(category: str, args: argparse.Namespace) -> Dict[str, float]:
    config: Dict[str, Any] = {}
    if QC_THRESHOLD_CONFIG_PATH.exists():
        try:
            loaded = yaml.safe_load(QC_THRESHOLD_CONFIG_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                config = loaded
        except yaml.YAMLError:  # pragma: no cover - malformed config should not crash QC
            config = {}

    thresholds: Dict[str, float] = {}
    for key, default_value in DEFAULT_THRESHOLD_VALUES.items():
        thresholds[key] = default_value

    for key, value in (config.get("defaults") or {}).items():
        if key in thresholds and value is not None:
            thresholds[key] = _coerce_threshold_value(key, value)

    category_overrides = (config.get("categories") or {}).get(category, {})
    if isinstance(category_overrides, dict):
        for key, value in category_overrides.items():
            if key in thresholds and value is not None:
                thresholds[key] = _coerce_threshold_value(key, value)

    cli_overrides = {
        "max_duplicate_ratio": args.max_duplicate_ratio,
        "max_non_primary_language": args.max_non_primary_language,
        "min_tokens": args.min_tokens,
        "max_tokens": args.max_tokens,
        "minhash_similarity_threshold": getattr(args, "minhash_similarity_threshold", None),
    }
    for key, override in cli_overrides.items():
        if override is not None:
            thresholds[key] = _coerce_threshold_value(key, override)

    return thresholds


LANGDETECT_CONFIDENCE_THRESHOLD = 0.7


def heuristic_language_label(text: str) -> str:
    ascii_chars = sum(1 for ch in text if ch.isascii())
    total_chars = len(text)
    if total_chars == 0:
        return "unknown"
    non_ascii_ratio = 1 - (ascii_chars / total_chars)

    tokens = [token.strip(".,;:!?()[]\"'").lower() for token in text.split() if token]
    english_hits = sum(1 for token in tokens if token in DEFAULT_STOPWORDS)
    token_count = len(tokens) or 1
    english_ratio = english_hits / token_count

    if english_ratio >= 0.2 and non_ascii_ratio < 0.3:
        return "en"
    if english_ratio >= 0.1:
        return "mixed"
    return "unknown"


def detect_language(text: str) -> Tuple[str, float, Dict[str, float]]:
    stripped = text.strip()
    if not stripped:
        return "unknown", 0.0, {"unknown": 1.0}

    if LANGDETECT_AVAILABLE and detect_langs is not None:
        try:
            candidates = detect_langs(stripped)
            if candidates:
                top = max(candidates, key=lambda item: item.prob)
                distribution = {item.lang.lower(): float(item.prob) for item in candidates}
                label = top.lang.lower()
                confidence = float(top.prob)
                if confidence < LANGDETECT_CONFIDENCE_THRESHOLD:
                    heuristic = heuristic_language_label(stripped)
                    label = heuristic if heuristic != "unknown" else "mixed"
                return label, confidence, distribution
        except LangDetectException:  # pragma: no cover - relies on langdetect internals
            pass

    heuristic_label = heuristic_language_label(stripped)
    return heuristic_label, 0.0, {heuristic_label: 1.0}


def analyse_languages(records: Sequence[DatasetRecord], sample_limit: int) -> LanguageStats:
    language_counts: Counter[str] = Counter()
    probability_totals: DefaultDict[str, float] = defaultdict(float)
    non_primary_samples: List[int] = []
    low_confidence_samples: List[int] = []
    confidence_values: List[float] = []

    for idx, record in enumerate(records):
        label, confidence, distribution = detect_language(record.text)
        language_counts[label] += 1
        confidence_values.append(confidence)
        if label != "en" and len(non_primary_samples) < sample_limit:
            non_primary_samples.append(idx)
        if label == "en" and confidence < LANGDETECT_CONFIDENCE_THRESHOLD and len(low_confidence_samples) < sample_limit:
            low_confidence_samples.append(idx)
        for iso_code, probability in distribution.items():
            probability_totals[iso_code] += probability

    total_records = len(records)
    breakdown = {}
    if total_records:
        breakdown = {
            iso_code: round(total / total_records, 4)
            for iso_code, total in sorted(probability_totals.items())
        }

    classification = {}
    if total_records:
        classification = {
            language: round(count / total_records, 4)
            for language, count in sorted(language_counts.items())
        }

    primary = max(breakdown, key=breakdown.get) if breakdown else "unknown"
    flags: List[str] = []
    non_primary_fraction = 1.0 - breakdown.get("en", 0.0)
    if non_primary_fraction > 0 and non_primary_samples:
        flags.append(
            f"{non_primary_fraction:.2%} of tokens attributed to non-English languages (examples: {', '.join(map(str, non_primary_samples))})"
        )
    if low_confidence_samples:
        flags.append(
            f"Detected low-confidence English classifications (examples: {', '.join(map(str, low_confidence_samples))})"
        )

    confidence_summary: Dict[str, float] = {}
    if confidence_values:
        filtered = [value for value in confidence_values if value > 0]
        if filtered:
            confidence_summary = {
                "mean": round(statistics.mean(filtered), 3),
                "median": round(statistics.median(filtered), 3),
                "min": round(min(filtered), 3),
            }

    return LanguageStats(
        primary=primary,
        breakdown=breakdown,
        flags=flags,
        classification=classification,
        confidence_summary=confidence_summary,
    )


def normalise_text(text: str) -> str:
    return " ".join(text.lower().split())


def generate_shingles(text: str, shingle_size: int) -> List[str]:
    tokens = normalise_text(text).split()
    if not tokens:
        return []
    if len(tokens) <= shingle_size:
        return [" ".join(tokens)]
    return [
        " ".join(tokens[idx : idx + shingle_size])
        for idx in range(len(tokens) - shingle_size + 1)
    ]


def compute_minhash(text: str) -> Optional[MinHash]:
    if not DATASKETCH_AVAILABLE or MinHash is None:
        return None
    shingles = generate_shingles(text, MINHASH_SHINGLE_SIZE)
    if not shingles:
        return None
    signature = MinHash(num_perm=MINHASH_PERMUTATIONS)
    for shingle in shingles:
        signature.update(shingle.encode("utf-8"))
    return signature


def analyse_duplicates(
    records: Sequence[DatasetRecord],
    sample_limit: int,
    similarity_threshold: float,
) -> DedupeStats:
    canonical_map: Dict[str, List[int]] = defaultdict(list)
    for idx, record in enumerate(records):
        canonical = normalise_text(record.text)
        if canonical:
            canonical_map[canonical].append(idx)

    duplicate_pairs_exact: List[Tuple[int, int]] = []
    duplicate_indexes: set[int] = set()
    for indexes in canonical_map.values():
        if len(indexes) > 1:
            duplicate_indexes.update(indexes)
            for i in range(len(indexes)):
                for j in range(i + 1, len(indexes)):
                    duplicate_pairs_exact.append((indexes[i], indexes[j]))

    near_duplicate_pairs: set[Tuple[int, int]] = set()
    near_duplicate_error = ""
    if DATASKETCH_AVAILABLE and MinHash is not None and MinHashLSH is not None and len(records) > 1:
        try:
            lsh = MinHashLSH(threshold=similarity_threshold, num_perm=MINHASH_PERMUTATIONS)
            signatures: List[Optional[MinHash]] = []
            for idx, record in enumerate(records):
                signature = compute_minhash(record.text)
                signatures.append(signature)
                if signature is not None:
                    lsh.insert(str(idx), signature)

            for idx, signature in enumerate(signatures):
                if signature is None:
                    continue
                for candidate_key in lsh.query(signature):
                    candidate_idx = int(candidate_key)
                    if candidate_idx <= idx:
                        continue
                    candidate_signature = signatures[candidate_idx]
                    if candidate_signature is None:
                        continue
                    similarity = signature.jaccard(candidate_signature)
                    if similarity >= similarity_threshold:
                        pair = (idx, candidate_idx)
                        near_duplicate_pairs.add(pair)
                        duplicate_indexes.update(pair)
        except Exception as exc:  # pragma: no cover - defensive guard against datasketch runtime errors
            near_duplicate_pairs.clear()
            # Provide context without failing the overall QC run.
            near_duplicate_pairs.add((-1, -1))  # sentinel to signal failure in flags
            near_duplicate_error = str(exc)

    total_records = len(records) or 1
    duplicate_ratio = len(duplicate_indexes) / total_records if duplicate_indexes else 0.0

    combined_pairs: List[Tuple[int, int]] = []
    combined_pairs.extend(duplicate_pairs_exact)
    if near_duplicate_pairs:
        combined_pairs.extend(pair for pair in near_duplicate_pairs if pair != (-1, -1))

    flags: List[str] = []
    if duplicate_pairs_exact:
        sample = ", ".join(f"({a},{b})" for a, b in duplicate_pairs_exact[:sample_limit])
        flags.append(
            f"Exact duplicates detected across {len(duplicate_pairs_exact)} pair(s) (examples: {sample})"
        )
    if near_duplicate_pairs:
        if (-1, -1) in near_duplicate_pairs:
            flags.append(
                f"MinHash duplicate detection failed: {near_duplicate_error}. Falling back to exact matching results only."
            )
        else:
            sample = ", ".join(
                f"({a},{b})" for a, b in list(sorted(near_duplicate_pairs))[:sample_limit]
            )
            flags.append(f"Near-duplicate pairs above {similarity_threshold:.2f} similarity: {sample}")
    if not DATASKETCH_AVAILABLE:
        flags.append("datasketch not installed; near-duplicate detection limited to exact matches.")

    sample_duplicates = combined_pairs[:sample_limit]

    return DedupeStats(
        duplicate_ratio=duplicate_ratio,
        sample_duplicates=sample_duplicates,
        flags=flags,
        similarity_threshold=similarity_threshold,
    )


def analyse_labels(records: Sequence[DatasetRecord], config: CategoryConfig, sample_limit: int) -> LabelStats:
    totals: Dict[str, int] = {label: 0 for label in config.label_list}
    missing_label_samples: List[int] = []

    for idx, record in enumerate(records):
        positives = [label for label, score in record.labels.items() if score >= 0.5]
        for label in positives:
            totals[label] += 1
        if not positives and len(missing_label_samples) < sample_limit:
            missing_label_samples.append(idx)

    warnings: List[str] = []
    if missing_label_samples:
        warnings.append(
            f"{len(missing_label_samples)} records contain no positive labels (examples: {', '.join(map(str, missing_label_samples))})"
        )

    return LabelStats(totals=totals, warnings=warnings)


def load_manifest(manifest_path: Optional[Path]) -> Dict[str, Any]:
    if not manifest_path:
        return {}
    if not manifest_path.exists():
        return {"errors": [f"Manifest file not found: {manifest_path}"]}
    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - depends on malformed file
        return {"errors": [f"Manifest JSON decode error: {exc}"]}


def infer_version(dataset_path: Path, explicit_version: Optional[str]) -> str:
    if explicit_version:
        return explicit_version
    for part in reversed(dataset_path.parts):
        if part.startswith("v") and any(char.isdigit() for char in part):
            return part
    parent = dataset_path.parent.name
    return parent or datetime.utcnow().strftime("v%Y.%m.%d")


def determine_output_dir(category: str, version: str, output_dir: Optional[str]) -> Path:
    if output_dir:
        return Path(output_dir)
    return REPO_ROOT / "reports" / "qc" / category / version


def build_report(
    category: str,
    version: str,
    records: Sequence[DatasetRecord],
    integrity: IntegrityResult,
    structure: StructureResult,
    length_stats: LengthStats,
    language_stats: LanguageStats,
    dedupe_stats: DedupeStats,
    label_stats: LabelStats,
    manifest: Dict[str, Any],
    sources: Sequence[str],
    thresholds: Dict[str, float],
) -> Dict[str, Any]:
    failed_checks: List[str] = []
    warnings: List[str] = []

    if integrity.status != "pass":
        failed_checks.append("integrity")
    if structure.status != "pass":
        failed_checks.append("structure")
    if dedupe_stats.duplicate_ratio > thresholds["max_duplicate_ratio"]:
        failed_checks.append("duplicate_ratio")
        warnings.extend(dedupe_stats.flags)
    elif dedupe_stats.flags:
        warnings.extend(dedupe_stats.flags)
    non_primary = 1.0 - language_stats.breakdown.get("en", 0.0)
    if non_primary > thresholds["max_non_primary_language"]:
        failed_checks.append("language_mix")
        warnings.extend(language_stats.flags)
    elif language_stats.flags:
        warnings.extend(language_stats.flags)
    if length_stats.flags:
        warnings.extend(length_stats.flags)
    if label_stats.warnings:
        warnings.extend(label_stats.warnings)

    summary_status = "pass" if not failed_checks else "fail"

    return {
        "metadata": {
            "category": category,
            "version": version,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "sources": list(sources),
            "thresholds": thresholds,
        },
        "integrity": {
            "status": integrity.status,
            "errors": integrity.errors,
        },
        "structure": {
            "status": structure.status,
            "issues": structure.issues,
        },
        "length": {
            "char_stats": length_stats.char_stats,
            "token_stats": length_stats.token_stats,
            "flags": length_stats.flags,
        },
        "language": {
            "primary": language_stats.primary,
            "breakdown": language_stats.breakdown,
            "flags": language_stats.flags,
            "classification": language_stats.classification,
            "confidence_summary": language_stats.confidence_summary,
        },
        "dedupe": {
            "duplicate_ratio": round(dedupe_stats.duplicate_ratio, 4),
            "sample_pairs": dedupe_stats.sample_duplicates,
            "flags": dedupe_stats.flags,
            "similarity_threshold": round(dedupe_stats.similarity_threshold, 4),
        },
        "labels": {
            "totals": label_stats.totals,
            "warnings": label_stats.warnings,
        },
        "manifest": manifest,
        "gates": {
            "summary": summary_status,
            "failed_checks": failed_checks,
            "warnings": warnings,
        },
    }


def render_markdown(report: Dict[str, Any]) -> str:
    metadata = report["metadata"]
    length_stats = report["length"]
    language_stats = report["language"]
    dedupe = report["dedupe"]
    labels = report["labels"]

    lines = [
        f"# QC Report — {metadata['category']} ({metadata['version']})",
        "",
        f"Generated at: {metadata['generated_at']}",
        "",
        "## Summary",
        f"- Integrity: **{report['integrity']['status']}**",
        f"- Structure: **{report['structure']['status']}**",
        f"- Duplicate ratio: **{dedupe['duplicate_ratio']:.2%}**",
        f"- Primary language: **{language_stats['primary']}**",
        f"- Token median: **{length_stats['token_stats']['median']}**",
        "",
        "## Flags & Warnings",
    ]
    warnings = report["gates"].get("warnings", [])
    if warnings:
        lines.extend(f"- {warning}" for warning in warnings)
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Label Distribution",
        ]
    )
    for label, total in labels["totals"].items():
        lines.append(f"- **{label}**: {total}")

    return "\n".join(lines) + "\n"


def main() -> None:  # pragma: no cover - CLI entry point
    args = parse_args()

    category_config = CATEGORY_REGISTRY[args.category]
    dataset_path = Path(args.dataset)
    manifest = load_manifest(Path(args.manifest)) if args.manifest else {}
    version = infer_version(dataset_path, args.version)
    output_dir = determine_output_dir(args.category, version, args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    sources = [item.strip() for item in args.sources.split(",") if item.strip()]

    thresholds = load_thresholds(args.category, args)

    records, integrity, structure = load_dataset(dataset_path, category_config)
    length_stats = compute_length_stats(
        records,
        int(thresholds["min_tokens"]),
        int(thresholds["max_tokens"]),
        args.sample_limit,
    )
    language_stats = analyse_languages(records, args.sample_limit)
    dedupe_stats = analyse_duplicates(
        records,
        args.sample_limit,
        float(thresholds["minhash_similarity_threshold"]),
    )
    label_stats = analyse_labels(records, category_config, args.sample_limit)
    report = build_report(
        category=args.category,
        version=version,
        records=records,
        integrity=integrity,
        structure=structure,
        length_stats=length_stats,
        language_stats=language_stats,
        dedupe_stats=dedupe_stats,
        label_stats=label_stats,
        manifest=manifest,
        sources=sources,
        thresholds=thresholds,
    )

    json_path = output_dir / "qc_report.json"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.write_markdown:
        markdown_path = output_dir / "qc_report.md"
        markdown_path.write_text(render_markdown(report), encoding="utf-8")

    print(f"QC report written to {json_path}")
    if args.write_markdown:
        print(f"Markdown summary written to {markdown_path}")

    exit_code = 0
    if report["gates"]["failed_checks"]:
        exit_code = 1
    elif args.fail_on_warning and report["gates"].get("warnings"):
        exit_code = 1

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
