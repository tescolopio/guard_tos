# Evaluation Reports

This directory stores offline evaluation metrics for category-specific models. Each
report is JSON emitted by `scripts/ml/evaluate_category_model.py` and includes both
aggregated metrics and the underlying classification report.

## Directory Structure

```text
reports/eval/
  README.md                     # this file
  history/                      # chronological evaluation runs per category
    dispute_resolution/
      v2025.09.27_dataset.json  # corpus-level stats logged before model eval
```

## Logging Baselines

1. Generate or refresh the gold dataset (see `docs/ml/gold-datasets.md`).
2. Snapshot dataset metrics for traceability:

   ```bash
   python scripts/ml/log_dataset_metrics.py \
     --category dispute_resolution \
     --dataset data/processed/dispute_resolution/v2025.09.27/dataset.jsonl \
     --manifest data/processed/dispute_resolution/v2025.09.27/manifest.json \
     --output reports/eval/history/dispute_resolution/v2025.09.27_dataset.json
   ```

3. Train the category model for the matching release tag.
4. Run the evaluation helper:

   ```bash
   python scripts/ml/evaluate_category_model.py \
     --category dispute_resolution \
     --dataset data/gold/dispute_resolution/gold_eval.jsonl \
     --model artifacts/models/dispute_resolution/v2025.09.27 \
     --report reports/eval/history/dispute_resolution/v2025.09.27_baseline.json
   ```

5. Record the highlight metrics in `docs/training_progress.md` and update the
   change log for traceability.

## Automation

The CI story will wire these scripts into a GitHub Actions workflow that fails builds
when quality drops by more than 5% or latency budgets are exceeded. See
`docs/ml/evaluation-plan.md` for the roadmap.
