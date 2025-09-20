#!/usr/bin/env python3
"""
Calibrate per-class probability thresholds for the tiny TF‑IDF + LR model JSON.

Inputs:
- --data data/clauses.jsonl (fields: text, label)
- --model src/data/dictionaries/tfidf_logreg_v2.json

Outputs:
- Prints a summary table and writes JSON suggestions to stdout or file via --out-json
- Optionally writes a Markdown report via --out-md

Method:
- Recreates the JS scoring pipeline: tokenize -> tfidf (tf/len * idf[idx]) -> sigmoid(coef·x + b)
- Computes precision-recall curves per class and derives:
  * t_f1: threshold that maximizes F1
  * t_p90: smallest threshold achieving precision>=0.90 (if attainable)
  * t_p80: smallest threshold achieving precision>=0.80 (if attainable)

Requires: pandas, numpy, scikit-learn
"""
import argparse
import json
from collections import defaultdict
from dataclasses import asdict, dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_curve, average_precision_score


def tokenize_simple(text: str) -> List[str]:
    import re
    return [t for t in re.split(r"[^a-z0-9]+", str(text).lower()) if t]


def load_model(model_path: str) -> Dict:
    with open(model_path, "r", encoding="utf-8") as f:
        return json.load(f)


def score_proba(texts: List[str], model: Dict) -> Dict[str, np.ndarray]:
    vocab = model.get("vocab", {})
    idf = np.array(model.get("idf", []), dtype=float)
    classes = model.get("classes", {})

    # Pre-tokenize
    toks = [tokenize_simple(t) for t in texts]

    # Compute sparse tf-idf as dict idx->value per doc
    feats: List[Dict[int, float]] = []
    for ts in toks:
        counts: Dict[int, int] = defaultdict(int)
        for t in ts:
            idx = vocab.get(t)
            if idx is not None:
                counts[idx] += 1
        total = len(ts) or 1
        vec = {}
        for idx, c in counts.items():
            val = (c / total) * (idf[idx] if idx < len(idf) else 1.0)
            vec[idx] = val
        feats.append(vec)

    def sigmoid(x: np.ndarray) -> np.ndarray:
        x = np.clip(x, -20, 20)
        return 1.0 / (1.0 + np.exp(-x))

    # Score each class
    out: Dict[str, np.ndarray] = {}
    n = len(texts)
    for name, cls in classes.items():
        coef = np.array(cls.get("coef", []), dtype=float)
        b = float(cls.get("intercept", 0.0))
        z = np.full((n,), b, dtype=float)
        # accumulate dot-product from sparse features
        for i, vec in enumerate(feats):
            s = 0.0
            for idx, v in vec.items():
                if idx < len(coef):
                    s += coef[idx] * v
            z[i] += s
        out[name] = sigmoid(z)
    return out


@dataclass
class Thresholds:
    t_f1: float
    f1: float
    ap: float
    t_p90: float
    p_at_p90: float
    r_at_p90: float
    t_p80: float
    p_at_p80: float
    r_at_p80: float


def derive_thresholds(y_true: np.ndarray, y_proba: np.ndarray) -> Thresholds:
    precision, recall, th = precision_recall_curve(y_true, y_proba)
    # precision_recall_curve returns precision/recall for thresholds, of length len(th)+1
    # Compute F1 across points (skip zero division)
    with np.errstate(divide='ignore', invalid='ignore'):
        f1 = 2 * precision * recall / (precision + recall)
        f1[np.isnan(f1)] = 0
    # Map F1 indices back to threshold indices (last element has no threshold)
    best_idx = int(np.argmax(f1[:-1])) if len(th) > 0 else 0
    t_f1 = float(th[best_idx]) if len(th) > 0 else 0.5
    best_f1 = float(f1[best_idx]) if len(f1) > 0 else 0.0
    ap = float(average_precision_score(y_true, y_proba))

    def first_thr_for_precision(target: float) -> Tuple[float, float, float]:
        for i in range(len(th)):
            if precision[i] >= target:
                return float(th[i]), float(precision[i]), float(recall[i])
        # fallback: highest precision point
        max_i = int(np.argmax(precision[:-1])) if len(th) > 0 else 0
        return float(th[max_i] if len(th) > 0 else 0.5), float(precision[max_i]), float(recall[max_i])

    t_p90, p90, r90 = first_thr_for_precision(0.90)
    t_p80, p80, r80 = first_thr_for_precision(0.80)

    return Thresholds(
        t_f1=t_f1,
        f1=best_f1,
        ap=ap,
        t_p90=t_p90,
        p_at_p90=p90,
        r_at_p90=r90,
        t_p80=t_p80,
        p_at_p80=p80,
        r_at_p80=r80,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True)
    ap.add_argument('--model', required=True)
    ap.add_argument('--labels', nargs='+', required=True)
    ap.add_argument('--out-json', default='data/calibration_suggestions.json')
    ap.add_argument('--out-md', default='docs/analysis/model-calibration.md')
    args = ap.parse_args()

    df = pd.read_json(args.data, lines=True)
    # keep only rows with labels of interest
    df = df[df['label'].isin(args.labels)].copy()
    texts = df['text'].astype(str).tolist()
    y_true_all = {c: (df['label'] == c).astype(int).to_numpy() for c in args.labels}

    model = load_model(args.model)
    proba = score_proba(texts, model)

    suggestions = {}
    lines = ["# Model Calibration Report", "", f"Model: {args.model}", f"Data: {args.data}", ""]
    lines.append("| Class | AP | F1-max | t_F1 | t_P90 (P,R) | t_P80 (P,R) | Suggested |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|")
    for c in args.labels:
        if c not in proba:
            continue
        thr = derive_thresholds(y_true_all[c], proba[c])
        # Suggestion policy: prefer p90 if recall not catastrophic; else F1 threshold
        suggested = thr.t_p90 if thr.r_at_p90 >= 0.2 else thr.t_f1
        suggestions[c] = {
            "ap": thr.ap,
            "t_f1": thr.t_f1,
            "f1": thr.f1,
            "t_p90": thr.t_p90,
            "p_at_p90": thr.p_at_p90,
            "r_at_p90": thr.r_at_p90,
            "t_p80": thr.t_p80,
            "p_at_p80": thr.p_at_p80,
            "r_at_p80": thr.r_at_p80,
            "suggested": suggested,
        }
        lines.append(
            f"| {c} | {thr.ap:.3f} | {thr.f1:.3f} | {thr.t_f1:.2f} | {thr.t_p90:.2f} ({thr.p_at_p90:.2f},{thr.r_at_p90:.2f}) | "
            f"{thr.t_p80:.2f} ({thr.p_at_p80:.2f},{thr.r_at_p80:.2f}) | {suggested:.2f} |"
        )

    with open(args.out_json, 'w', encoding='utf-8') as f:
        json.dump(suggestions, f, indent=2)
    with open(args.out_md, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote calibration suggestions to {args.out_json} and report to {args.out_md}")


if __name__ == '__main__':
    main()
