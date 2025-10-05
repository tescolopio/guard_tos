#!/usr/bin/env python3
"""Aggregate mock Terms/Policy HTML pages into a single directory."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from typing import Iterable, List


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCES: List[Path] = [
    PROJECT_ROOT / "__tests__/fixtures",
    PROJECT_ROOT / "docs/fixtures",
    PROJECT_ROOT / "test-pages",
]
DEFAULT_TARGET = PROJECT_ROOT / "test-pages/all-mocks"


def iter_html_files(source: Path, target: Path) -> Iterable[tuple[Path, Path]]:
    """Yield (src_file, dest_file) pairs for HTML assets under *source*."""
    source = source.resolve()
    target = target.resolve()

    if not source.exists():
        return []

    for path in source.rglob("*.html"):
        if target in path.parents:
            # Skip artefacts from previous aggregation runs under the target tree.
            continue
        rel = path.relative_to(PROJECT_ROOT)
        yield path, target / rel


def aggregate(sources: Iterable[Path], target: Path, dry_run: bool = False) -> None:
    target = target.resolve()

    if dry_run:
        total = 0
        per_root: dict[str, int] = {}
        for source in sources:
            for _, dest in iter_html_files(source, target):
                total += 1
                root = dest.relative_to(target).parts[0]
                per_root[root] = per_root.get(root, 0) + 1
        print(f"Would aggregate {total} HTML files into {target}")
        for root, count in sorted(per_root.items()):
            print(f"  - {root}: {count}")
        return

    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)

    copy_count = 0
    for source in sources:
        for src_file, dest_file in iter_html_files(source, target):
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_file, dest_file)
            copy_count += 1

    print(f"Aggregated {copy_count} HTML files into {target}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files that would be copied without modifying the target directory.",
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help="Destination directory for the aggregated HTML files (default: %(default)s)",
    )
    parser.add_argument(
        "sources",
        metavar="SOURCE",
        nargs="*",
        type=Path,
        default=DEFAULT_SOURCES,
        help="Optional override for source directories; defaults to project fixtures and test pages.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sources = [
        src if isinstance(src, Path) and src.is_absolute() else PROJECT_ROOT / Path(src)
        for src in (args.sources or DEFAULT_SOURCES)
    ]
    target = args.target if args.target.is_absolute() else PROJECT_ROOT / args.target
    aggregate(sources, target, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
