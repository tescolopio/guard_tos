# Dispute Resolution Gold Dataset (Draft)

- **Last updated:** 2025-09-27
- **Seed source:** `data/processed/dispute_resolution/v2025.09.27/dataset.jsonl`
- **Seed generator:** `scripts/corpus/seed_gold_dataset.py`
- **Status:** Pending SME review

## Review Checklist

1. Import `gold_eval.todo.jsonl` into the annotation tool.
2. Validate labels per `docs/ml/annotation-guidelines.md#dispute-resolution`.
3. Update each record with `annotator`, `confidence`, and `notes`.
4. Change `review_status` to `approved` or `rejected` once adjudicated.
5. Export the finalized set as `gold_eval.jsonl` and update `manifest.json` with QA metrics.

See `docs/ml/gold-datasets.md` for detailed workflow guidance.
