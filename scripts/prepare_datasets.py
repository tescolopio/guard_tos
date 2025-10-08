#!/usr/bin/env python3
"""
Prepare training data by pulling datasets from Hugging Face and mapping labels to Terms Guardian taxonomy.
Output: JSONL with fields {"text": str, "label": str}

Datasets:
- CUAD variants (preferred: dvgodoy/CUAD_v1_Contract_Understanding_clause_classification)
- LEDGAR (MAdAiLab/lex_glue_ledgar)

Label mapping is heuristic and may use regex filters for UNILATERAL_CHANGES and CLASS_ACTION_WAIVER.
"""
import argparse
import json
import re
from pathlib import Path
from typing import List, Optional, Tuple

import pandas as pd
from datasets import load_dataset
from tqdm import tqdm

# Target labels to extract
TARGETS = {
    'ARBITRATION',
    'CLASS_ACTION_WAIVER',
    'LIABILITY_LIMITATION',
    'UNILATERAL_CHANGES',
    'LICENSE_ASSIGNMENT',
    'IP_RETAINED',
    'MORAL_RIGHTS_WAIVER',
    'COMMERCIAL_USE_CLAIM',
    # Optional next: 'JURY_TRIAL_WAIVER',
}

RE_UNILATERAL = re.compile(
    r"((we|our|company|provider)\s+(may|can)\s+(amend|modify|change|update))|"
    r"(reserve\s+the\s+right\s+to\s+(amend|modify|change|update))",
    re.I,
)
RE_CLASS_ACTION = re.compile(r"class\s+action\s+waiver|waive\s+.*class\s+action", re.I)
RE_ARBITRATION = re.compile(r"arbitrat", re.I)
RE_LIABILITY_PHRASE = re.compile(r"limitation\s+of\s+liability", re.I)
RE_LICENSE_GRANT = re.compile(
    r"\bgrant(?:s|ed|ing)?\s+(?:to\s+)?(?:us|the\s+(?:company|service|platform|provider|licensor|licensee))\b.*\blicense",
    re.I,
)
RE_IP_RETENTION = re.compile(
    r"\byou\s+(?:retain|keep|maintain)\s+(?:all\s+)?(?:rights?|ownership|title)\s+(?:of|in)\s+(?:your\s+)?content",
    re.I,
)
RE_MORAL_RIGHTS = re.compile(
    r"\b(?:moral\s+rights?|rights?\s+of\s+(?:attribution|integrity))\b.*\b(waiv(?:e|er)|not\s+assert|irrevocably)",
    re.I,
)
RE_COMMERCIAL_USE = re.compile(
    r"\b(?:use|license)\s+(?:your\s+)?content\b.*\b(advertising|marketing|promotion|commercial|publicity|syndication|monetiz)",
    re.I,
)
RE_COMMERCIAL_USE_ALT = re.compile(
    r"\b(advertising|marketing|promotion|commercial|publicity|syndication|monetiz)\b.*\b(?:your\s+)?content",
    re.I,
)


def _pick_text_and_label_columns(df: pd.DataFrame, label_features=None) -> Tuple[Optional[str], Optional[str]]:
    """Pick likely text and label columns from a dataframe.
    Returns (text_col, label_col). Either may be None if not found.
    """
    text_candidates = [
        'text', 'clause_text', 'clause', 'sentence', 'context', 'content', 'raw_text', 'body'
    ]
    label_candidates = [
        # Prefer explicit string labels when available
        'label_text', 'category', 'heading', 'tag', 'type', 'class', 'label'
    ]
    tcol = next((c for c in text_candidates if c in df.columns), None)
    lcol = next((c for c in label_candidates if c in df.columns), None)
    # If only numeric label present but features indicate mapping, keep 'label'
    if not lcol and label_features and 'label' in df.columns:
        lcol = 'label'
    return tcol, lcol


def _ensure_string_labels(series: pd.Series, features) -> pd.Series:
    """Convert common integer ClassLabel columns to their string names if needed."""
    try:
        # Datasets ClassLabel mapping available via features
        if features and hasattr(features, 'feature'):
            # For Arrow Datasets, features is a Features object with dict-like access
            if 'label' in features and hasattr(features['label'], 'int2str'):
                return series.apply(lambda v: features['label'].int2str(int(v)) if pd.notna(v) else v)
        # If numeric ints but no features provided, just cast to str
        if pd.api.types.is_integer_dtype(series.dtype):
            return series.astype(str)
    except Exception:
        pass
    return series


def from_cuad() -> pd.DataFrame:
    # Use the clause classification variant if available
    try:
        ds = load_dataset('dvgodoy/CUAD_v1_Contract_Understanding_clause_classification')
        train = ds['train']
        df = pd.DataFrame(train)
        tcol, lcol = _pick_text_and_label_columns(df, label_features=train.features)
        if not tcol or not lcol:
            raise ValueError(f"Could not locate text/label columns in dvgodoy/CUAD_v1 dataset. Found columns: {list(df.columns)}")
        df = df[[tcol, lcol]].rename(columns={tcol: 'text', lcol: 'raw_label'})
        # Map integer labels (ClassLabel) to strings if needed
        df['raw_label'] = _ensure_string_labels(df['raw_label'], train.features)
    except Exception as e:
        # Fallback to theatticusproject/cuad and derive weak labels from question text
        try:
            ds = load_dataset('theatticusproject/cuad')
            train = ds['train']
            df = pd.DataFrame(train)
            # Use "context" as text and "question" as a proxy label
            tcol = 'context' if 'context' in df.columns else 'text' if 'text' in df.columns else None
            qcol = 'question' if 'question' in df.columns else None
            if not tcol or not qcol:
                raise ValueError('Could not find context/question in CUAD QA dataset')
            df = df[[tcol, qcol]].rename(columns={tcol: 'text', qcol: 'raw_label'})
        except Exception as e2:
            # Re-raise a combined error to be handled by caller
            raise RuntimeError(f"CUAD load failed: primary error: {e}; fallback error: {e2}")

    def map_label(lbl: str, txt: str) -> str:
        l = str(lbl or '').lower()
        if 'arbitration' in l:
            return 'ARBITRATION'
        if 'limitation of liability' in l or 'liability' in l or 'limited liability' in l:
            return 'LIABILITY_LIMITATION'
        if 'amend' in l or 'modif' in l or 'change' in l or 'update' in l:
            # require unilateral phrasing
            return 'UNILATERAL_CHANGES' if RE_UNILATERAL.search(txt or '') else ''
        if 'moral right' in l:
            return 'MORAL_RIGHTS_WAIVER'
        if 'license' in l:
            if RE_IP_RETENTION.search(txt or ''):
                return 'IP_RETAINED'
            return 'LICENSE_ASSIGNMENT'
        if 'ip ownership' in l or 'joint ip ownership' in l:
            return 'LICENSE_ASSIGNMENT'
        if RE_CLASS_ACTION.search(txt or ''):
            return 'CLASS_ACTION_WAIVER'
        # Text fallbacks
        if RE_ARBITRATION.search(txt or ''):
            return 'ARBITRATION'
        if RE_LIABILITY_PHRASE.search(txt or ''):
            return 'LIABILITY_LIMITATION'
        if RE_UNILATERAL.search(txt or ''):
            return 'UNILATERAL_CHANGES'
        if RE_MORAL_RIGHTS.search(txt or ''):
            return 'MORAL_RIGHTS_WAIVER'
        if RE_LICENSE_GRANT.search(txt or ''):
            return 'LICENSE_ASSIGNMENT'
        if RE_IP_RETENTION.search(txt or ''):
            return 'IP_RETAINED'
        if RE_COMMERCIAL_USE.search(txt or '') or RE_COMMERCIAL_USE_ALT.search(txt or ''):
            return 'COMMERCIAL_USE_CLAIM'
        return ''

    df['label'] = [map_label(lbl, txt) for lbl, txt in zip(df['raw_label'], df['text'])]
    df = df[df['label'] != '']
    return df[['text', 'label']]


def from_ledgar() -> pd.DataFrame:
    ds = load_dataset('MAdAiLab/lex_glue_ledgar')
    # Dataset structures vary; try common fields
    parts = []
    for split in ('train', 'validation', 'test'):
        if split in ds:
            split_ds = ds[split]
            d = pd.DataFrame(split_ds)
            text_col, label_col = _pick_text_and_label_columns(d, label_features=split_ds.features)
            if not text_col or not label_col:
                continue
            d = d[[text_col, label_col]].rename(columns={text_col: 'text', label_col: 'raw_label'})
            # Map integer labels to strings if needed using features mapping
            d['raw_label'] = _ensure_string_labels(d['raw_label'], split_ds.features)
            parts.append(d)
    if not parts:
        return pd.DataFrame(columns=['text', 'label'])
    df = pd.concat(parts, ignore_index=True)

    def map_label(lbl: str, txt: str) -> str:
        l = str(lbl or '').lower()
        if 'arbitration' in l:
            return 'ARBITRATION'
        if 'limitation of liability' in l or 'liability' in l or 'limited liability' in l:
            return 'LIABILITY_LIMITATION'
        if 'amend' in l or 'modif' in l or 'change' in l or 'update' in l:
            return 'UNILATERAL_CHANGES' if RE_UNILATERAL.search(txt or '') else ''
        if 'moral right' in l:
            return 'MORAL_RIGHTS_WAIVER'
        if 'license' in l or 'intellectual property' in l:
            if RE_IP_RETENTION.search(txt or ''):
                return 'IP_RETAINED'
            return 'LICENSE_ASSIGNMENT'
        if RE_CLASS_ACTION.search(txt or ''):
            return 'CLASS_ACTION_WAIVER'
        # Text fallbacks
        if RE_ARBITRATION.search(txt or ''):
            return 'ARBITRATION'
        if RE_LIABILITY_PHRASE.search(txt or ''):
            return 'LIABILITY_LIMITATION'
        if RE_UNILATERAL.search(txt or ''):
            return 'UNILATERAL_CHANGES'
        if RE_MORAL_RIGHTS.search(txt or ''):
            return 'MORAL_RIGHTS_WAIVER'
        if RE_LICENSE_GRANT.search(txt or ''):
            return 'LICENSE_ASSIGNMENT'
        if RE_IP_RETENTION.search(txt or ''):
            return 'IP_RETAINED'
        if RE_COMMERCIAL_USE.search(txt or '') or RE_COMMERCIAL_USE_ALT.search(txt or ''):
            return 'COMMERCIAL_USE_CLAIM'
        return ''

    df['label'] = [map_label(lbl, txt) for lbl, txt in zip(df['raw_label'], df['text'])]
    df = df[df['label'] != '']
    return df[['text', 'label']]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', default='data/clauses.jsonl')
    ap.add_argument('--augment', nargs='*', default=[], help='Optional JSONL files with additional rows {text,label}')
    args = ap.parse_args()

    out = []
    for loader in (from_cuad, from_ledgar):
        try:
            df = loader()
            out.append(df)
        except Exception as e:
            print(f"WARN: dataset load failed: {e}")
    if not out:
        print('No data collected. Exiting with empty output.')
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text('')
        return

    df = pd.concat(out, ignore_index=True)

    # Optional augmentation
    aug_parts = []
    for path in args.augment or []:
        p = Path(path)
        if not p.exists():
            print(f"WARN: augment file not found, skipping: {p}")
            continue
        try:
            aug = pd.read_json(p, lines=True)
            if 'text' in aug.columns and 'label' in aug.columns:
                aug_parts.append(aug[['text', 'label']])
            else:
                print(f"WARN: augment file missing required columns: {p}")
        except Exception as e:
            print(f"WARN: failed reading augment file {p}: {e}")
    if aug_parts:
        df = pd.concat([df] + aug_parts, ignore_index=True)
    # Drop duplicates and sanitize text
    df['text'] = df['text'].astype(str).str.strip()
    df = df.dropna(subset=['text', 'label'])
    df = df[df['text'] != '']
    df = df.drop_duplicates(subset=['text', 'label'])

    # Save JSONL
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        for _, row in df.iterrows():
            f.write(json.dumps({'text': row['text'], 'label': row['label']}, ensure_ascii=False) + '\n')
    print(f"Wrote {len(df)} rows to {args.output}")


if __name__ == '__main__':
    main()
