# Gold Evaluation Datasets

Last updated: 2025-09-26

## Purpose

Gold datasets provide the hand-reviewed ground truth required to benchmark machine learning models and regression-test the blended rights scoring. Each URI category maintains its own curated set of labeled spans so we can measure precision, recall, and calibration with confidence.

## Directory Layout

```text
data/gold/
  manifest-template.json          # canonical schema for dataset manifests
  clarity_transparency/           # per-category gold annotations
  data_collection_use/
  user_privacy/
  content_rights/
  account_management/
  dispute_resolution/
  terms_changes/
  algorithmic_decisions/
```

Each category directory should contain:

- `gold_eval.jsonl` — finalized evaluation spans.
- `manifest.json` — metadata derived from `manifest-template.json`.
- `README.md` — optional notes for annotators, edge cases, or sampling strategy.
- Supporting files (e.g., reviewer exports, adjudication notes) as needed.

## JSONL Record Format

```json
{
  "text": "Clause or paragraph under review",
  "labels": {
    "binding_arbitration": 1,
    "class_action_waiver": 0,
    "jury_trial_waiver": 0,
    "venue_selection": 1
  },
  "source": "ftc_case",
  "document_id": "case-2024-123",
  "annotator": "jdoe",
  "confidence": 0.9,
  "notes": "Venue selection clause is mandatory"
}
```

- Labels should align with the category label list defined in `scripts/ml/train_category_model.py`.
- `confidence` captures reviewer certainty (0–1). Default to `1.0` when fully confirmed.

## Curation Workflow

1. **Seed Selection** — Pull candidate spans from `data/processed/<category>/...` or external corpora.
2. **Primary Annotation** — Legal reviewer assigns labels and notes.
3. **Secondary Review** — A second reviewer verifies a stratified sample; disagreements adjudicated.
4. **Quality Metrics** — Record inter-annotator agreement (κ) and error rates in the manifest.
5. **Versioning** — Save datasets using semantic timestamps (`vYYYY.MM.DD`) and update manifests accordingly.

## Manifest Fields

- `category` — URI category (snake_case).
- `version` — release tag (e.g., `v2025.09.30`).
- `records` — total labeled spans.
- `label_distribution` — fraction of records per label.
- `sources` — list of corpus identifiers (GDPR, FTC, etc.).
- `qa_sample_size` & `qa_accuracy` — manual review coverage and pass rate.
- `annotators` — list of reviewer roles/IDs.
- `license` — licensing for the underlying texts.
- `notes` — freeform highlights (edge cases, TODOs).

## Getting Started Checklist

- [ ] Copy `manifest-template.json` into each category directory and fill in metadata.
- [ ] Add `.jsonl` dataset with labeled spans using the schema above.
- [ ] Update `docs/ml/evaluation-plan.md` with dataset availability dates.
- [ ] Reference datasets from `scripts/ml/evaluate_category_model.py` invocations in CI.

For annotation guidance, see `docs/ml/annotation-guidelines.md` (to be authored). When new datasets ship, remember to update `docs/training_progress.md` and the change log.
