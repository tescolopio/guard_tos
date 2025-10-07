#!/usr/bin/env python3
import argparse
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Clause patterns (broad, sentence-level)
PATTERNS: Dict[str, List[re.Pattern]] = {
    "ARBITRATION": [
        re.compile(r"\barbitrat(?:e|ion|or|ors|ed|ing)\b", re.I),
        re.compile(r"\bbinding\s+arbitration\b", re.I),
        re.compile(r"\bAAA\b|\bJAMS\b", re.I),
    ],
    "CLASS_ACTION_WAIVER": [
        re.compile(r"\bclass[- ]action\b", re.I),
        re.compile(r"\bclass[- ]wide\b", re.I),
        re.compile(r"\bcollective\s+action\b", re.I),
        re.compile(r"\bwaiv(?:e|er|es|ed|ing)\b.*\bclass\b", re.I),
        re.compile(r"\bclass\b.*\bwaiv(?:e|er|es|ed|ing)\b", re.I),
    ],
    "LIABILITY_LIMITATION": [
        re.compile(r"\blimit(?:ation)?\s+of\s+liability\b", re.I),
        re.compile(r"\bmaximum\s+extent\s+permitted\s+by\s+law\b", re.I),
        re.compile(r"\b(?:no|not)\s+liable?\b", re.I),
        re.compile(r"\bdisclaim(?:er|s|ed|ing)?\s+of\s+warrant(?:y|ies)\b", re.I),
    ],
    "UNILATERAL_CHANGES": [
        re.compile(r"\bwe\s+(?:may|reserve\s+the\s+right\s+to)\s+(?:change|modify|update|amend)\s+(?:these|the)\s+(?:terms|agreement|policy|policies)\b", re.I),
        re.compile(r"\bsubject\s+to\s+change\s+without\s+notice\b", re.I),
    ],
}

TAG_RE = re.compile(r"<[^>]+>")
SCRIPT_STYLE_RE = re.compile(r"<\s*(script|style)[^>]*>.*?<\s*/\s*\1\s*>", re.I | re.S)
WS_RE = re.compile(r"\s+")


def text_from_file(p: Path) -> str:
    """Read text from HTML/TXT/PDF files. PDFs best-effort; skip on failure."""
    lower = p.name.lower()
    try:
        if lower.endswith(('.html', '.htm')):
            raw = p.read_text(encoding='utf-8', errors='ignore')
            raw = SCRIPT_STYLE_RE.sub(' ', raw)
            raw = TAG_RE.sub(' ', raw)
            return WS_RE.sub(' ', raw)
        elif lower.endswith('.txt'):
            return WS_RE.sub(' ', p.read_text(encoding='utf-8', errors='ignore'))
        elif lower.endswith('.pdf'):
            try:
                from pdfminer.high_level import extract_text  # type: ignore
                txt = extract_text(str(p)) or ''
                return WS_RE.sub(' ', txt)
            except Exception:
                return ''
        else:
            return ''
    except Exception:
        return ''


def to_sentences(text: str) -> List[str]:
    text = text.strip()
    if not text:
        return []
    # Normalize whitespace and split naively; keep reasonable lengths
    parts = re.split(r"(?<=[.!?])\s+", text)
    out: List[str] = []
    for s in parts:
        s = s.strip()
        if 10 <= len(s) <= 500:
            out.append(s)
    return out


def harvest(input_dir: Path) -> List[Tuple[str, str, str]]:
    rows: List[Tuple[str, str, str]] = []  # (label, sentence, source)
    seen = set()
    for root, _, files in os.walk(input_dir):
        for name in files:
            p = Path(root) / name
            text = text_from_file(p)
            if not text:
                continue
            for sent in to_sentences(text):
                for label, regs in PATTERNS.items():
                    if any(r.search(sent) for r in regs):
                        key = (label, sent)
                        if key in seen:
                            continue
                        seen.add(key)
                        rows.append((label, sent, str(p)))
    return rows


def main():
    ap = argparse.ArgumentParser(description='Harvest clause candidate sentences from curated ToS files.')
    ap.add_argument('--input', default='test-pages/all-mocks/test-pages/curated-tos', help='Input folder of curated ToS files')
    ap.add_argument('--output', default='data/harvested_candidates.jsonl', help='Output JSONL path')
    args = ap.parse_args()

    inp = Path(args.input)
    outp = Path(args.output)
    outp.parent.mkdir(parents=True, exist_ok=True)

    rows = harvest(inp)
    counts: Dict[str, int] = {}
    with outp.open('w', encoding='utf-8') as f:
        for label, sent, src in rows:
            counts[label] = counts.get(label, 0) + 1
            rec = {"text": sent, "label": label, "source": src}
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')

    total = sum(counts.values())
    print(f'Wrote {total} candidates to {outp}')
    for k in sorted(counts.keys()):
        print(f'  {k}: {counts[k]}')


if __name__ == '__main__':
    main()
