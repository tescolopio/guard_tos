# Training Progress — Browser ML Augmentation (as of 2025-09-17)

This document tracks the current state of the lightweight, on-device clause classifier used to augment rule-based rights analysis.

## Current Model

- Architecture: TF‑IDF + One-vs-Rest Logistic Regression (multilabel)
- Runtime: Pure JS, browser-first; lazy-loads JSON model
- Artifact: `src/data/dictionaries/tfidf_logreg_v2.json`
- Classes: `ARBITRATION`, `CLASS_ACTION_WAIVER`, `LIABILITY_LIMITATION`, `UNILATERAL_CHANGES`

## Dataset

- Source datasets: CUAD (clauses) and LEDGAR (contracts) subset, mapped to internal taxonomy
- Augmentation: Local harvested positives for `CLASS_ACTION_WAIVER` merged via `--augment`
- Prep script: `scripts/prepare_datasets.py`
- Current rows: 2,605 (post-augmentation, cleaned) → `data/clauses.jsonl`

## Latest Training/Calibration (2025‑09‑17)

- Retrained on augmented dataset → saved model to `src/data/dictionaries/tfidf_logreg_v2.json`
- Calibrated per-class thresholds (precision–recall based):
  - ARBITRATION: 0.22218167154095733
  - CLASS_ACTION_WAIVER: 0.024667284473643268
  - LIABILITY_LIMITATION: 0.4689842162814725
  - UNILATERAL_CHANGES: 0.05755998593920249
- Suggestions file: `data/threshold_suggestions.json`
- Report: `docs/analysis/model-calibration.md`

## Integration

- Feature flag: `EXT_CONSTANTS.ML.ENABLED` (defaults to true)
- Thresholds source: `src/utils/constants.js` (updated to the values above)
- Fusion: Rule-based score blended with ML probability (alpha=0.65)
- Asset path: `dictionaries/tfidf_logreg_v2.json` (served from dist)

## Quick Commands

```bash
# Prepare datasets (with cleaned augmentation)
npm run ml:prep:aug

# Train the browser model
npm run ml:train

# Calibrate thresholds and refresh report
npm run ml:calibrate

# One-shot full pipeline with augmentation
npm run ml:full:aug
```

## Known Gaps / Next Steps

- Data quality pass on harvested positives (prune UI/boilerplate lines) and retrain
- Consider class balance tweaks or additional weak supervision for `CLASS_ACTION_WAIVER`
- Optional: publish curated dataset and training scripts for reproducibility
- Bundle-size follow-up: dictionary chunk splitting already in place; keep model JSON small

## 2025-09-26 Audit Summary

- ✅ Verified TF-IDF/LogReg artifact (`src/data/dictionaries/tfidf_logreg_v2.json`) matches `EXT_CONSTANTS.ML.MODEL_VERSION` and is distributed via the `dictionaries/` bundle.
- ✅ Confirmed runtime thresholds in `src/utils/constants.js` mirror the latest calibration report (`docs/analysis/model-calibration.md`).
- ⚠️ Coverage gap: shipped model only predicts `ARBITRATION`, `CLASS_ACTION_WAIVER`, `LIABILITY_LIMITATION`, and `UNILATERAL_CHANGES`; all other URI categories rely solely on rules.
- ⚠️ Confidence telemetry limited to rule/ML fusion (`FUSE_ALPHA = 0.65`); no per-category confidence exposed yet.
- ⚠️ Dataset freshness: `data/clauses.jsonl` still at 2,605 rows (2025-09-17); no privacy/data-sharing augments incorporated.
- 📌 Follow-up items tracked in `docs/ml-enhancement-plan.md` under “Production Readiness Workstreams.”

## Change Log

- 2025‑09‑26: ML asset audit completed; documented shipped model scope, threshold sync, and outstanding category coverage gaps.
- 2025‑09‑17: Augmented dataset prepared; model retrained; thresholds recalibrated; constants updated; prod build verified.
- 2025‑09‑17: Quality pass on harvested data (removed UI/boilerplate; dropped 3 lines); dataset 2,605 rows; retrained and recalibrated; thresholds updated.
