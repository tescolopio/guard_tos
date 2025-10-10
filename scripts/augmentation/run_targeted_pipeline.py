#!/usr/bin/env python3
"""Run the targeted augmentation pipeline across priority labels.

This orchestrates synthetic generation (data collection + algorithmic decisions),
optional hard-negative creation, and merges the results into new processed
datasets. It reuses the generation utilities while keeping a single
configuration surface for reproducible runs.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import random
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

Record = Dict[str, object]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Failed to load module at {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[arg-type]
    return module


def load_jsonl(path: Path) -> List[Record]:
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def write_jsonl(path: Path, records: Iterable[Record]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def dedupe_by_text(records: List[Record]) -> List[Record]:
    seen: set[str] = set()
    deduped: List[Record] = []
    for record in records:
        text = record.get("text")
        if not isinstance(text, str):
            raise ValueError("Each record must include a text field")
        normalized = text.strip()
        if normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(record)
    return deduped


def validate_labels(records: List[Record], expected: List[str]) -> None:
    for entry in records:
        labels = entry.get("labels")
        if not isinstance(labels, dict):
            raise ValueError("Record missing labels dictionary")
        keys = sorted(labels.keys())
        if keys != expected:
            raise ValueError(
                "Label mismatch. Expected keys "
                f"{expected} but encountered {keys} in record {entry}"
            )


def merge_with_base(
    *,
    base_path: Path,
    additions: List[Record],
    output_path: Path,
    shuffle: bool,
    seed: int,
) -> Tuple[int, int]:
    base_records = load_jsonl(base_path)
    if not base_records:
        raise SystemExit(f"Base dataset {base_path} is empty or missing")

    expected_labels = sorted(base_records[0]["labels"].keys())
    validate_labels(base_records, expected_labels)
    if additions:
        validate_labels(additions, expected_labels)

    combined = base_records + additions
    combined = dedupe_by_text(combined)

    if shuffle:
        rng = random.Random(seed)
        rng.shuffle(combined)

    write_jsonl(output_path, combined)
    net_new = len(combined) - len(base_records)
    return len(combined), net_new


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42, help="Random seed for generation and shuffling")
    parser.add_argument(
        "--no-shuffle",
        action="store_true",
        help="Skip shuffling merged datasets before writing",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without writing files")

    # Data collection options
    parser.add_argument("--data-collection-base", type=Path, help="Existing processed dataset to augment")
    parser.add_argument("--data-collection-output", type=Path, help="Destination path for merged dataset")
    parser.add_argument(
        "--data-collection-version",
        type=str,
        default="v2025.10.12",
        help="Version tag used for synthetic artifact paths",
    )
    parser.add_argument(
        "--data-collection-synthetic-output",
        type=Path,
        help="Override path for synthetic data_collection positives",
    )
    parser.add_argument(
        "--data-collection-negatives-output",
        type=Path,
        help="Override path for data_collection negatives",
    )
    parser.add_argument(
        "--data-collection-label",
        action="append",
        dest="data_collection_labels",
        metavar="LABEL=COUNT",
        help="Override default counts for data_collection generation",
    )
    parser.add_argument(
        "--data-collection-curated",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files appended to data_collection positives",
    )
    parser.add_argument(
        "--data-collection-curated-negative",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files appended to data_collection negatives",
    )
    parser.add_argument(
        "--data-collection-source",
        type=str,
        help="Source string for data_collection generation (defaults to module constant)",
    )
    parser.add_argument(
        "--data-collection-notes",
        type=str,
        default="targeted_augmentation_v2025.10.12",
        help="Notes stored with generated data_collection records",
    )
    parser.add_argument(
        "--emit-data-collection-negatives",
        action="store_true",
        help="Generate data_collection hard negatives",
    )
    parser.add_argument(
        "--data-collection-negative-ratio",
        type=float,
        default=0.35,
        help="Ratio of negatives relative to positives for data_collection",
    )

    # Algorithmic decisions options
    parser.add_argument("--algorithmic-base", type=Path, help="Existing algorithmic_decisions dataset to augment")
    parser.add_argument("--algorithmic-output", type=Path, help="Destination path for merged algorithmic dataset")
    parser.add_argument(
        "--algorithmic-version",
        type=str,
        default="v2025.10.12",
        help="Version tag used for algorithmic synthetic artifacts",
    )
    parser.add_argument(
        "--algorithmic-synthetic-output",
        type=Path,
        help="Override path for algorithmic positives",
    )
    parser.add_argument(
        "--algorithmic-negatives-output",
        type=Path,
        help="Override path for algorithmic negatives",
    )
    parser.add_argument(
        "--algorithmic-label",
        action="append",
        dest="algorithmic_labels",
        metavar="LABEL=COUNT",
        help="Override counts for algorithmic generation",
    )
    parser.add_argument(
        "--algorithmic-curated",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files appended to algorithmic positives",
    )
    parser.add_argument(
        "--algorithmic-curated-negative",
        action="append",
        type=Path,
        default=[],
        help="Additional JSONL files appended to algorithmic negatives",
    )
    parser.add_argument(
        "--algorithmic-source",
        type=str,
        help="Source string for algorithmic generation (defaults to module constant)",
    )
    parser.add_argument(
        "--algorithmic-notes",
        type=str,
        default="targeted_augmentation_v2025.10.12",
        help="Notes stored with generated algorithmic records",
    )
    parser.add_argument(
        "--emit-algorithmic-negatives",
        action="store_true",
        help="Generate automated_decision hard negatives",
    )
    parser.add_argument(
        "--algorithmic-negative-ratio",
        type=float,
        default=0.3,
        help="Ratio of negatives relative to positives for automated_decision",
    )

    return parser


def run_data_collection_stage(args, data_module, seed: int, shuffle: bool, dry_run: bool) -> None:
    if not args.data_collection_base or not args.data_collection_output:
        return

    label_counts = data_module.parse_label_counts(args.data_collection_labels)
    notes = args.data_collection_notes or None
    source = args.data_collection_source or data_module.SYNTHETIC_SOURCE
    rng = random.Random(seed)

    positives, negatives, summary = data_module.build_examples(
        label_counts,
        rng=rng,
        source=source,
        notes=notes,
        include_negatives=args.emit_data_collection_negatives,
        negative_ratio=args.data_collection_negative_ratio,
    )

    for extra in args.data_collection_curated:
        if not extra.exists():
            print(f"[data_collection] Warning: curated file {extra} not found, skipping")
            continue
        positives.extend(data_module.load_jsonl(extra))

    for extra in args.data_collection_curated_negative:
        if not extra.exists():
            print(f"[data_collection] Warning: curated negative {extra} not found, skipping")
            continue
        negatives.extend(data_module.load_jsonl(extra))

    positives = data_module.dedupe_records(positives)
    negatives = data_module.dedupe_records(negatives) if negatives else []

    version = args.data_collection_version
    synthetic_output = (
        args.data_collection_synthetic_output
        or Path(f"data/aug/data_collection/{version}/synthetic_targeted.jsonl")
    )
    negatives_output = (
        args.data_collection_negatives_output
        or Path(f"data/aug/data_collection/{version}/hard_negatives/synthetic_targeted_negatives.jsonl")
    )

    print("[data_collection] Summary:")
    for label, count in summary.items():
        print(f"  • {label}: {count}")
    print(f"  • total positives: {len(positives)}")
    if args.emit_data_collection_negatives:
        print(f"  • total negatives: {len(negatives)}")

    if dry_run:
        print("[data_collection] Dry run enabled; skipping writes and merge")
        return

    data_module.write_jsonl(synthetic_output, positives)
    print(f"[data_collection] Wrote positives to {synthetic_output}")

    if args.emit_data_collection_negatives and negatives:
        data_module.write_jsonl(negatives_output, negatives)
        print(f"[data_collection] Wrote negatives to {negatives_output}")

    merged_total, net_new = merge_with_base(
        base_path=args.data_collection_base,
        additions=positives + negatives,
        output_path=args.data_collection_output,
        shuffle=shuffle,
        seed=seed,
    )
    print(
        f"[data_collection] Merged dataset: {merged_total} examples (net +{net_new} after dedupe) -> {args.data_collection_output}"
    )


def run_algorithmic_stage(args, algo_module, seed: int, shuffle: bool, dry_run: bool) -> None:
    if not args.algorithmic_base or not args.algorithmic_output:
        return

    label_counts = algo_module.parse_label_counts(args.algorithmic_labels)
    notes = args.algorithmic_notes or None
    source = args.algorithmic_source or algo_module.SYNTHETIC_SOURCE
    rng = random.Random(seed + 101)

    positives, negatives, summary = algo_module.build_examples(
        label_counts,
        rng=rng,
        source=source,
        notes=notes,
        include_negatives=args.emit_algorithmic_negatives,
        negative_ratio=args.algorithmic_negative_ratio,
    )

    for extra in args.algorithmic_curated:
        if not extra.exists():
            print(f"[algorithmic] Warning: curated file {extra} not found, skipping")
            continue
        positives.extend(algo_module.load_jsonl(extra))

    for extra in args.algorithmic_curated_negative:
        if not extra.exists():
            print(f"[algorithmic] Warning: curated negative {extra} not found, skipping")
            continue
        negatives.extend(algo_module.load_jsonl(extra))

    positives = algo_module.dedupe_records(positives)
    negatives = algo_module.dedupe_records(negatives) if negatives else []

    version = args.algorithmic_version
    synthetic_output = (
        args.algorithmic_synthetic_output
        or Path(f"data/aug/algorithmic_decisions/{version}/synthetic_targeted.jsonl")
    )
    negatives_output = (
        args.algorithmic_negatives_output
        or Path(f"data/aug/algorithmic_decisions/{version}/hard_negatives/synthetic_targeted_negatives.jsonl")
    )

    print("[algorithmic] Summary:")
    for label, count in summary.items():
        print(f"  • {label}: {count}")
    print(f"  • total positives: {len(positives)}")
    if args.emit_algorithmic_negatives:
        print(f"  • total negatives: {len(negatives)}")

    if dry_run:
        print("[algorithmic] Dry run enabled; skipping writes and merge")
        return

    algo_module.write_jsonl(synthetic_output, positives)
    print(f"[algorithmic] Wrote positives to {synthetic_output}")

    if args.emit_algorithmic_negatives and negatives:
        algo_module.write_jsonl(negatives_output, negatives)
        print(f"[algorithmic] Wrote negatives to {negatives_output}")

    merged_total, net_new = merge_with_base(
        base_path=args.algorithmic_base,
        additions=positives + negatives,
        output_path=args.algorithmic_output,
        shuffle=shuffle,
        seed=seed + 777,
    )
    print(
        f"[algorithmic] Merged dataset: {merged_total} examples (net +{net_new} after dedupe) -> {args.algorithmic_output}"
    )


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    data_module = load_module(
        "generate_data_collection_phase2",
        repo_root / "scripts" / "generate_data_collection_phase2.py",
    )
    algo_module = load_module(
        "generate_algorithmic_decisions_expanded",
        repo_root / "scripts" / "generate_algorithmic_decisions_expanded.py",
    )

    shuffle = not args.no_shuffle

    run_data_collection_stage(args, data_module, args.seed, shuffle, args.dry_run)
    run_algorithmic_stage(args, algo_module, args.seed, shuffle, args.dry_run)


if __name__ == "__main__":
    main()
