// src/ml/clauseClassifier.js
// Minimal TF-IDF + One-vs-Rest Logistic Regression scorer for browser use

let cachedModel = null;

export async function loadModel(getUrl) {
  if (cachedModel) return cachedModel;
  // Try chrome.runtime path first, fallback to provided or relative path
  const defaultUrl =
    globalThis.chrome?.runtime?.getURL?.(
      globalThis.EXT_CONSTANTS?.ML?.ASSET_PATH ||
        "dictionaries/tfidf_logreg_v1.json",
    ) ||
    (typeof getUrl === "function"
      ? getUrl()
      : globalThis.EXT_CONSTANTS?.ML?.ASSET_PATH ||
        "/dictionaries/tfidf_logreg_v1.json");
  const res = await fetch(defaultUrl);
  if (!res.ok) throw new Error(`Model fetch failed: ${res.status}`);
  cachedModel = await res.json(); // { vocab: {token: idx}, idf: number[], classes: {NAME:{coef:number[], intercept:number}} }
  return cachedModel;
}

export function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function featurize(tokens, vocab, idf) {
  const counts = new Map();
  for (const t of tokens) {
    const idx = vocab[t];
    if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1);
  }
  const total = tokens.length || 1;
  const feats = [];
  for (const [idx, c] of counts) {
    const tfidf = (c / total) * (idf[idx] ?? 1);
    feats.push([idx, tfidf]);
  }
  return feats; // sparse pairs [index, value]
}

function sigmoid(x) {
  if (x > 20) return 1; // prevent overflow
  if (x < -20) return 0; // prevent underflow
  return 1 / (1 + Math.exp(-x));
}

export function predictProba(tokens, model) {
  const { vocab, idf, classes } = model || {};
  if (!vocab || !idf || !classes) return {};
  const x = featurize(tokens, vocab, idf);
  const out = {};
  for (const [name, cls] of Object.entries(classes)) {
    const coef = cls.coef || [];
    const b = cls.intercept || 0;
    let z = b;
    for (const [i, v] of x) z += (coef[i] || 0) * v;
    out[name] = sigmoid(z);
  }
  return out;
}

export async function classifySentences(sentences, getUrl) {
  const m = await loadModel(getUrl);
  return (sentences || []).map((s) => ({
    text: s,
    proba: predictProba(tokenize(s), m),
  }));
}

// CommonJS compatibility for Jest
if (typeof module !== "undefined" && module.exports) {
  module.exports = { loadModel, tokenize, predictProba, classifySentences };
}
