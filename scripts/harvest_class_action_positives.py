#!/usr/bin/env python3
"""
Harvest candidate CLASS_ACTION_WAIVER sentences from local text/HTML files.

Usage:
  python scripts/harvest_class_action_positives.py --input_dir ./samples --out data/harvested_class_action.jsonl

Notes:
  - This is a heuristic bootstrapper. Manually review the output before merging into training data.
  - You can append the reviewed rows to data/clauses.jsonl or extend prepare_datasets.py to include them.
"""
import argparse
import json
import re
from pathlib import Path

RE_CLASS_ACTION = re.compile(r"class\s+action\s+waiv|waiv\w*\s+.*class\s+action|class\s+proceeding\s+waiv", re.I)


def extract_sentences(text: str):
    # naive sentence split; good enough for harvesting
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def clean_html(text: str) -> str:
    # strip tags
    return re.sub(r"<[^>]+>", " ", text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input_dir', required=True)
    ap.add_argument('--out', default='data/harvested_class_action.jsonl')
    args = ap.parse_args()

    root = Path(args.input_dir)
    outp = Path(args.out)
    outp.parent.mkdir(parents=True, exist_ok=True)

    count = 0
    with open(outp, 'w', encoding='utf-8') as f:
        for p in root.rglob('*'):
            if not p.is_file():
                continue
            if p.suffix.lower() not in {'.txt', '.md', '.html', '.htm'}:
                continue
            txt = p.read_text(encoding='utf-8', errors='ignore')
            if p.suffix.lower() in {'.html', '.htm'}:
                txt = clean_html(txt)
            for s in extract_sentences(txt):
                if RE_CLASS_ACTION.search(s):
                    f.write(json.dumps({"text": s, "label": "CLASS_ACTION_WAIVER", "source": str(p)}) + "\n")
                    count += 1
    print(f"Wrote {count} candidate sentences to {outp}")


if __name__ == '__main__':
    main()
