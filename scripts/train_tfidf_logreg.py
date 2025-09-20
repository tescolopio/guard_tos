#!/usr/bin/env python3
"""
Minimal TF‑IDF + OvR Logistic Regression trainer
- Ingests curated CSV/JSONL with fields: text, label (single-label per row)
- Produces JSON model compatible with src/ml/clauseClassifier.js:
  {
    "vocab": { token: index },
    "idf": [ ... ],
    "classes": { NAME: { "coef": [ ... ], "intercept": float } }
  }

Usage:
  python scripts/train_tfidf_logreg.py --input data/clauses.jsonl --output src/data/dictionaries/tfidf_logreg_v2.json \
    --min_df 2 --max_features 20000 --labels ARBITRATION CLASS_ACTION_WAIVER LIABILITY_LIMITATION UNILATERAL_CHANGES

Requires: scikit-learn, pandas, numpy
"""
import argparse
import json
import os
from typing import List

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def load_data(path: str) -> pd.DataFrame:
    if path.endswith('.jsonl'):
        return pd.read_json(path, lines=True)
    if path.endswith('.json'):
        return pd.read_json(path)
    if path.endswith('.csv'):
        return pd.read_csv(path)
    raise ValueError(f"Unsupported input format: {path}")


def tokenize_simple(text: str) -> List[str]:
    # Match the JS tokenizer: lowercased, split on non-alphanum
    import re
    return [t for t in re.split(r"[^a-z0-9]+", str(text).lower()) if t]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--labels', nargs='+', required=True, help='Class labels to train (e.g., ARBITRATION ... )')
    ap.add_argument('--min_df', type=int, default=2)
    ap.add_argument('--max_features', type=int, default=20000)
    ap.add_argument('--test_size', type=float, default=0.15)
    ap.add_argument('--random_state', type=int, default=42)
    args = ap.parse_args()

    df = load_data(args.input)
    # Expect either 'label' str or 'labels' list
    if 'labels' in df.columns:
        # convert to single-label rows (duplicate rows per label)
        df = df.explode('labels').rename(columns={'labels': 'label'})
    if 'label' not in df.columns or 'text' not in df.columns:
        raise ValueError("Input must contain 'text' and 'label' or 'labels'.")

    df = df[df['label'].isin(args.labels)].copy()
    if df.empty:
        raise ValueError('No rows remain after filtering to target labels.')

    X_train, X_test, y_train, y_test = train_test_split(
        df['text'].astype(str), df['label'].astype(str),
        test_size=args.test_size, random_state=args.random_state, stratify=df['label']
    )

    # Vectorizer mirroring JS tokenize
    vec = TfidfVectorizer(tokenizer=tokenize_simple, lowercase=False,
                          min_df=args.min_df, max_features=args.max_features)
    Xtr = vec.fit_transform(X_train)
    Xte = vec.transform(X_test)

    # One-vs-rest LR
    lr = LogisticRegression(max_iter=200, solver='liblinear')
    clf = OneVsRestClassifier(lr)
    # Convert labels to multilabel (binary indicator per class)
    mlb = MultiLabelBinarizer(classes=args.labels)
    ytr = mlb.fit_transform([[y] for y in y_train])
    yte = mlb.transform([[y] for y in y_test])

    clf.fit(Xtr, ytr)

    # Eval
    ypred = clf.predict(Xte)
    print(classification_report(yte, ypred, target_names=args.labels, zero_division=0))

    # Export model JSON matching JS structure
    vocab = {t: int(i) for t, i in vec.vocabulary_.items()}
    # scikit stores idf_ aligned to feature indices [0..n-1]
    idf = vec.idf_.tolist()

    classes = {}
    for i, name in enumerate(args.labels):
        # Each estimator_ is a binary LR for class i
        est = clf.estimators_[i]
        coef = est.coef_.ravel().tolist()
        intercept = float(est.intercept_[0])
        classes[name] = {"coef": coef, "intercept": intercept}

    model = {"vocab": vocab, "idf": idf, "classes": classes}
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(model, f)
    print(f"Saved model to {args.output}")


if __name__ == '__main__':
    main()
