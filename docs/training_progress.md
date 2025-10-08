# Training Progress — Browser ML Augmentation (as of 2025-10-08)

This document tracks the current state of the lightweight, on-device clause classifier used to augment rule-based rights analysis.

## Current Model

- Architecture: TF‑IDF + One-vs-Rest Logistic Regression (multilabel)
- Runtime: Pure JS, browser-first; lazy-loads JSON model
- Artifact: `src/data/dictionaries/tfidf_logreg_v2.json`
- Classes: `ARBITRATION`, `CLASS_ACTION_WAIVER`, `LIABILITY_LIMITATION`, `UNILATERAL_CHANGES`

## Dataset

- Source datasets: CUAD (clauses), LEDGAR (contracts), and targeted manual seeds for ownership retention
- Augmentation: Local harvested positives for `CLASS_ACTION_WAIVER` merged via `--augment`; manual IP retention snippets appended for content rights coverage
- Prep script: `scripts/prepare_datasets.py`
- Current rows: 3,973 (v2025-10-08a) → `data/clauses.jsonl`
- New processed dataset: `data/processed/content_rights/v2025.10.08a` (license assignment 1,295, IP retained 53, moral rights waiver 3, commercial use claim 28)
- Synthetic augmentation: 53 templated IP retention clauses (`data/aug/content_rights_ip_retained.jsonl`) injected via `--augment`

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
- ⚠️ Dataset freshness: Privacy/data-sharing augments still pending; monitor balance as new sources land.
- ⚠️ Content rights imbalance: `IP_RETAINED` now at 53 synthetic positives; schedule SME review and organic harvest to validate and diversify sources.
- 📌 Follow-up items tracked in `docs/ml-enhancement-plan.md` under “Production Readiness Workstreams.”

## Change Log

- 2025‑10‑07: **Dispute Resolution Complete**: Created `dispute_resolution` dataset (v2025.10.07) from CUAD corpus; 712 labeled records across 4 labels (binding_arbitration: 623, jury_trial_waiver: 74, venue_selection: 137, class_action_waiver: 12); created gold set seed (148 records). **All 4 URI categories now have production datasets**.
- 2025‑10‑07: **Label Gap Resolution**: Generated 30 synthetic examples each for `consent_implied` and `privacy_waiver` using template-based method; merged into corpora and rebuilt datasets → `data_collection` v2025.10.07d (192 records, consent_implied: 3→18) and `user_privacy` v2025.10.07b (81 records, privacy_waiver: 0→6); created updated gold sets (145 and 81 records respectively).
- 2025‑10‑07: Expanded `data_collection` dataset to v2025.10.07c with 177 records (3.3x increase); added 500 privacy policy clauses and 220 platform ToS chunks; created updated gold set seed (96 records).
- 2025‑10‑07: Created `user_privacy` dataset (v2025.10.07) by reusing data_collection corpus; 75 labeled records, 49 gold seed; privacy_waiver label has 0 examples (rare problematic practice).
- 2025‑10‑07: Created gold set seed for `data_collection` (46 records); investigated consent_implied label gap and documented findings - gap is expected as regulatory texts don't contain implied consent language.
- 2025‑10‑07: Created first `data_collection` dataset (v2025.10.07) from harvested GDPR and CCPA texts; 54 labeled records with weak supervision patterns; logged metrics snapshot.
- 2025‑10‑08: Validated synthetic `IP_RETAINED` data via qualitative review; created QA report and updated dataset manifest.
- 2025‑10‑08: Added synthetic IP retention augmentation (53 rows), refreshed `data/clauses.jsonl` (3,973 rows), and generated `data/processed/content_rights/v2025.10.08a` with updated manifest.
- 2025‑10‑07: Expanded `data/clauses.jsonl` to 3,920 rows with new content rights labels; generated `data/processed/content_rights/v2025.10.07a` and logged metrics snapshot.
- 2025‑09‑26: ML asset audit completed; documented shipped model scope, threshold sync, and outstanding category coverage gaps.
- 2025‑09‑17: Augmented dataset prepared; model retrained; thresholds recalibrated; constants updated; prod build verified.
- 2025‑09‑17: Quality pass on harvested data (removed UI/boilerplate; dropped 3 lines); dataset 2,605 rows; retrained and recalibrated; thresholds updated.
