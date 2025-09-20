#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

UI_MARKERS = [
    "Rights Score:",
    "User Rights Protection:",
    "Detected Clauses:",
    "What this means:",
]

def is_ui_boilerplate(text: str, source: str) -> bool:
    # Filter known UI sources
    if source and source.lower().endswith("tooltip-test.html"):
        return True
    # Filter obvious UI markers
    if any(m in text for m in UI_MARKERS):
        return True
    # Filter heavily escaped blobs (likely scraped JSON fragments)
    if text.count("\\\\") >= 4:
        return True
    # Filter absurdly long lines that look like serialized blocks
    if len(text) > 1200:
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description="Clean harvested CLASS_ACTION_WAIVER JSONL by removing UI/boilerplate lines.")
    ap.add_argument("--input", required=True, help="Path to harvested JSONL")
    ap.add_argument("--output", required=True, help="Path to cleaned JSONL output")
    ap.add_argument("--label", default="CLASS_ACTION_WAIVER", help="Expected label to enforce (default: CLASS_ACTION_WAIVER)")
    args = ap.parse_args()

    inp = Path(args.input)
    outp = Path(args.output)

    kept, dropped = 0, 0
    with inp.open("r", encoding="utf-8") as fin, outp.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                dropped += 1
                continue
            text = obj.get("text", "") or ""
            source = obj.get("source", "") or ""
            label = obj.get("label", "") or ""

            # Enforce expected label
            if label != args.label:
                dropped += 1
                continue

            if is_ui_boilerplate(text, source):
                dropped += 1
                continue

            fout.write(json.dumps(obj, ensure_ascii=False) + "\n")
            kept += 1

    print(f"Kept {kept} lines, dropped {dropped} lines -> {outp}")

if __name__ == "__main__":
    main()
