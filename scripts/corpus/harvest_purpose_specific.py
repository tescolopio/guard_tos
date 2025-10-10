#!/usr/bin/env python3
"""Harvest long-form purpose_specific clauses from statutory corpora.

This utility scans HTML sources (currently GDPR and CCPA dumps) for
sentences/paragraphs that match common "limited purpose" phrasing and
emits JSONL records compatible with the data_collection label schema.

Example:
    python scripts/corpus/harvest_purpose_specific.py \
        --output data/gold/data_collection/purpose_specific_harvest.v2025.10.09.jsonl
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable, Iterator, List

LABELS = [
    "data_collection_extensive",
    "data_collection_minimal",
    "consent_explicit",
    "consent_implied",
    "purpose_specific",
    "purpose_broad",
]

KEY_PHRASES = [
    "solely for the purpose",
    "solely for purposes of",
    "solely for purposes",
    "specific purpose",
    "limited to",
    "only for the purpose",
    "restricted to",
    "express purpose",
    "shall not use",
    "may maintain",
    "shall use any personal information",
]

DEFAULT_SOURCES = [
    ("data/raw/ccpa_california/20251007/ccpa.html", "ccpa_20251007"),
    ("data/raw/gdpr_eur_2016_679/20251007/gdpr.html", "gdpr_2016_679"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Path to write harvested JSONL records",
    )
    parser.add_argument(
        "--min-chars",
        type=int,
        default=180,
        help="Minimum character length for harvested passages (default: 180)",
    )
    parser.add_argument(
        "--sources",
        nargs="*",
        metavar=("HTML_PATH", "SOURCE_ID"),
        help=(
            "Optional overrides for (path,source_id) pairs. Provide an even number "
            "of arguments: path1 source1 path2 source2 ..."
        ),
    )
    return parser.parse_args()


def iter_sources(args: argparse.Namespace) -> List[tuple[Path, str]]:
    if args.sources:
        if len(args.sources) % 2:
            raise SystemExit("--sources expects path/source_id pairs (even number of args)")
        pairs = []
        for i in range(0, len(args.sources), 2):
            pairs.append((Path(args.sources[i]), args.sources[i + 1]))
        return pairs
    return [(Path(path), source_id) for path, source_id in DEFAULT_SOURCES]


def strip_html(text: str) -> str:
    text = re.sub(r"<(script|style)[^>]*>.*?</\\1>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_passages(text: str) -> Iterable[str]:
    return re.split(r"(?<=[.;:])\s+", text)


def matches_key_phrase(text: str) -> bool:
    lower = text.lower()
    return any(phrase in lower for phrase in KEY_PHRASES)


def make_label_dict(target: str) -> dict[str, float]:
    return {label: 1.0 if label == target else 0.0 for label in LABELS}


def harvest_passages(path: Path, source_id: str, min_chars: int) -> Iterator[dict[str, object]]:
    raw = path.read_text(encoding="utf-8")
    cleaned = strip_html(raw)
    seen: set[str] = set()
    for passage in split_passages(cleaned):
        passage = passage.strip()
        if len(passage) < min_chars:
            continue
        if not matches_key_phrase(passage):
            continue
        if passage in seen:
            continue
        seen.add(passage)
        yield {
            "text": passage,
            "labels": make_label_dict("purpose_specific"),
            "category": "data_collection",
            "source": f"harvested_{source_id}",
        }


def write_jsonl(records: Iterable[dict[str, object]], output_path: Path) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for record in records:
            json.dump(record, handle, ensure_ascii=False)
            handle.write("\n")
            count += 1
    return count


def main() -> None:
    args = parse_args()
    sources = iter_sources(args)

    harvested: list[dict[str, object]] = []
    for html_path, source_id in sources:
        if not html_path.exists():
            print(f"Warning: {html_path} missing, skipping")
            continue
        harvested.extend(harvest_passages(html_path, source_id, args.min_chars))

    count = write_jsonl(harvested, args.output)
    print(f"Wrote {count} purpose_specific passages to {args.output}")


if __name__ == "__main__":
    main()
