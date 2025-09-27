# Evaluation & Benchmarking Plan

Last updated: 2025-09-26

This document specifies how we validate the category models and ensure regressions are caught before release.

## 🎯 Objectives

- Measure the uplift of ML-augmented scoring versus rule-only baselines.
- Track long-term quality using reproducible gold datasets and CI automation.
- Provide stakeholders with clear metrics (precision, recall, latency, calibration).

## 📦 Datasets

| Dataset             | Purpose                                                    | Location                               |
| ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Gold Evaluation Set | Hand-labeled spans per category (≥300 per label)           | `data/gold/<category>/gold_eval.jsonl` |
| Regression Fixtures | Snapshot of production ToS analyses for regression diffing | `__tests__/fixtures/`                  |
| Adversarial Set     | Edge-case clauses crafted by legal SMEs                    | `data/adversarial/<category>.jsonl`    |

Each dataset must ship with a manifest (records, label distribution, QA accuracy) consistent with `docs/ml/training-data-pipeline.md` and the schema described in `docs/ml/gold-datasets.md`.

## 🧪 Metrics

- **Precision / Recall / F1 (micro + per label)**
- **Accuracy** and **ROC-AUC (micro)** for calibration awareness
- **Latency** per 500-word chunk (Chrome stable, M2 Mac + Windows laptop baselines)
- **Memory footprint** during inference (heap snapshots)
- **Rule vs ML delta**: count of newly detected clauses & false positives removed

## ⚙️ Tooling

- `scripts/ml/evaluate_category_model.py` for offline evaluation metrics
- `scripts/ml/calibrate_category_model.py` for per-label threshold tuning
- `scripts/ml/export_category_model.py` to generate ONNX/TF.js bundles used in browser smoke tests
- `npm run ml:full:aug` for integrated pipeline smoke tests
- `npm run test:analysis` (to be updated) for regression diffs between rule-only and ML-assisted runs

## 🔁 Workflow

1. Export fresh gold dataset and update manifest.
2. Run evaluation script:

   ```bash
   python scripts/ml/evaluate_category_model.py \
     --category data_collection \
     --dataset data/gold/data_collection/gold_eval.jsonl \
     --model artifacts/models/data_collection/v2025.09.30 \
     --report reports/eval/data_collection_v2025.09.30.json
   ```

3. Generate latency report using browser profiler helper (TBD).
4. Compare results with previous release (stored under `reports/eval/history/`).
5. File a promotion checklist item if metrics fall below targets.

## 🚦 CI Integration

- Add GitHub Actions job that pulls the latest gold dataset, runs evaluation script, and uploads metrics artifact.
- Fail build if precision or recall drops >5% from baseline or if latency budgets are exceeded.
- Surface diff summary in PR comments (planned using `npm run ml:report`).

## 📊 Reporting

- Aggregate metrics into `docs/ml/performance-dashboard.md` (future) with sparklines per release.
- Share highlights with product/legal stakeholders before enabling models in production.

## ✅ Acceptance Criteria

- Baseline evaluation reports exist for the first shipped category model.
- Automation alerts the team when quality or latency regress.
- Documentation linked from `docs/ml-enhancement-plan.md` and `docs/roadmap-and-todos.md`.
