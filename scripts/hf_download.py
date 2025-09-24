#!/usr/bin/env python3
"""
Download selected Hugging Face datasets listed in data/manifests/hf_datasets.yml
and save them under data/raw/ for model training. Requires `datasets` and `pyyaml`.

Usage:
  python scripts/hf_download.py [--dry-run]

Environment:
  HF_TOKEN (optional) for higher rate limits
"""

import argparse
import os
import sys
from pathlib import Path

try:
    import yaml
except Exception as e:
    print("Missing dependency: pyyaml (pip install pyyaml)")
    sys.exit(2)

try:
    from datasets import load_dataset
except Exception as e:
    print("Missing dependency: datasets (pip install datasets)")
    sys.exit(2)

MANIFEST_PATH = Path("data/manifests/hf_datasets.yml")


def load_manifest(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def save_split_to_disk(ds, dest_dir: Path):
    # Saves each split to arrow/parquet-like directory via .save_to_disk
    ds.save_to_disk(str(dest_dir))


def download_dataset(item, root_dir: Path, dry_run: bool = False):
    # Support either a plain repo_id string or an object with options
    if isinstance(item, str):
        opts = {"repo_id": item}
    elif isinstance(item, dict):
        opts = item
    else:
        print(f"[WARN] Unsupported include entry: {item}")
        return

    repo_id = opts.get("repo_id") or opts.get("name")
    if not repo_id:
        print(f"[WARN] Missing repo_id in entry: {item}")
        return

    dest = root_dir / repo_id.replace("/", "__")
    if dry_run:
        print(f"[DRY-RUN] Would download {repo_id} -> {dest}")
        return
    if dest.exists():
        print(f"[SKIP] {repo_id} already exists at {dest}")
        return
    print(f"[DOWNLOADING] {repo_id} -> {dest}")
    try:
        trust_remote = bool(opts.get("trust_remote_code", False))
        config_name = opts.get("config")
        revision = opts.get("revision")
        load_kwargs = {"trust_remote_code": trust_remote}
        if revision:
            load_kwargs["revision"] = revision
        if config_name:
            ds = load_dataset(repo_id, config_name, **load_kwargs)
        else:
            ds = load_dataset(repo_id, **load_kwargs)
        ensure_dir(dest)
        # If dataset_dict with splits
        try:
            allowed_splits = opts.get("splits")
            for split_name, split in ds.items():
                if isinstance(allowed_splits, list) and allowed_splits and split_name not in allowed_splits:
                    continue
                split_dir = dest / split_name
                print(f"  - saving split: {split_name}")
                save_split_to_disk(split, split_dir)
        except AttributeError:
            # Single dataset (no splits), save directly
            save_split_to_disk(ds, dest)
        print(f"[DONE] {repo_id}")
    except Exception as e:
        print(f"[ERROR] Failed to download {repo_id}: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="List actions without downloading")
    args = parser.parse_args()

    if not MANIFEST_PATH.exists():
        print(f"Manifest not found: {MANIFEST_PATH}")
        sys.exit(1)

    manifest = load_manifest(MANIFEST_PATH)
    root_dir = Path(manifest.get("download", {}).get("root_dir", "data/raw"))
    ensure_dir(root_dir)

    include = manifest.get("selection", {}).get("include", [])
    for entry in include:
        download_dataset(entry, root_dir, dry_run=args.dry_run)

    print("All done.")


if __name__ == "__main__":
    main()
