#!/usr/bin/env python3
"""
Normalize off-Hub datasets into JSONL with schema {text,label}.

Usage examples:
  python scripts/ingest_offhub.py --source opp115 --input data/offhub/raw/opp115/policies.jsonl --text-field policy_text --label-field category --out data/offhub/normalized/opp115.jsonl
  python scripts/ingest_offhub.py --source claudette --input data/offhub/raw/claudette/clauses.csv --csv --text-field clause --label-field label --map-file data/offhub/mapping.yml --out data/offhub/normalized/claudette.jsonl

Notes:
- Respects mapping file for label normalization into our taxonomy.
- Adds a `source` field for provenance.
"""
import argparse
import csv
import json
from pathlib import Path
from typing import Dict

try:
    import yaml
except Exception:
    yaml = None


def load_mapping(path: str) -> Dict[str, str]:
    if not path:
        return {}
    if yaml is None:
        raise RuntimeError("pyyaml not installed; cannot load mapping file")
    with open(path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}
    return data.get('labels', data) if isinstance(data, dict) else {}


def run(args):
    mapping = load_mapping(args.map_file) if args.map_file else {}
    inp = Path(args.input)
    outp = Path(args.out)
    outp.parent.mkdir(parents=True, exist_ok=True)

    count = 0
    with outp.open('w', encoding='utf-8') as fo:
        if args.csv:
            with inp.open('r', encoding='utf-8', newline='') as fi:
                reader = csv.DictReader(fi)
                for row in reader:
                    text = (row.get(args.text_field) or '').strip()
                    label = (row.get(args.label_field) or '').strip()
                    if not text or not label:
                        continue
                    label = mapping.get(label, label)
                    rec = {"text": text, "label": label, "source": args.source}
                    fo.write(json.dumps(rec, ensure_ascii=False) + '\n')
                    count += 1
        else:
            with inp.open('r', encoding='utf-8') as fi:
                for line in fi:
                    if not line.strip():
                        continue
                    try:
                        obj = json.loads(line)
                    except Exception:
                        continue
                    text = (obj.get(args.text_field) or '').strip()
                    label = (obj.get(args.label_field) or '').strip()
                    if not text or not label:
                        continue
                    label = mapping.get(label, label)
                    rec = {"text": text, "label": label, "source": args.source}
                    fo.write(json.dumps(rec, ensure_ascii=False) + '\n')
                    count += 1
    print(f"Wrote {count} rows to {outp}")


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', required=True, help='Source name for provenance (e.g., opp115, claudette, tosdr)')
    ap.add_argument('--input', required=True, help='Input file (JSONL by default, or CSV with --csv)')
    ap.add_argument('--csv', action='store_true', help='Treat input as CSV')
    ap.add_argument('--text-field', required=True)
    ap.add_argument('--label-field', required=True)
    ap.add_argument('--map-file', default='', help='Optional YAML mapping file for labels')
    ap.add_argument('--out', required=True, help='Output JSONL path')
    run(ap.parse_args())
