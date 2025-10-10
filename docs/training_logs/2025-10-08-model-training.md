# Model Training Summary — 2025-10-08

| Category | Dataset | Model Artifact | Macro F1 | Micro F1 | Label Highlights |
|----------|---------|----------------|----------|----------|------------------|
| content_rights | `data/processed/content_rights/v2025.10.08a/dataset.jsonl` | `artifacts/models/content_rights/v2025.10.08a-v1` | 0.987 | 0.987 | All low-support labels ≥0.93 F1 (ip_retained = 1.00). |
| dispute_resolution | `data/processed/dispute_resolution/v2025.10.08b/dataset.jsonl` | `artifacts/models/dispute_resolution/v2025.10.08b-v1` | 0.945 | 0.957 | Venue_selection F1 = 0.86, waivers ≥0.94 F1. |

## Notes
- Both trainings used `distilbert-base-uncased`, batch size 16, learning rate 5e-5.
- Dispute resolution training ran 5 epochs (seed 2025100914) to balance new venue coverage.
- Validation via `scripts/ml/run_model_validation.py --categories content_rights dispute_resolution` passed with macro F1 0.995 (content_rights) and 0.973 (dispute_resolution).

## Robustness Evaluation (2025-10-08)
- **Primary evaluation (threshold 0.5)**
	- Content Rights macro F1 0.974 (weakest label `commercial_use_claim` F1 0.929).
	- Dispute Resolution macro F1 0.942 (weakest label `venue_selection` F1 0.875).
- **Threshold sweeps (0.3 / 0.7)**
	- Content Rights: macro F1 range 0.974–0.979 with minimal precision/recall trade-off; moral rights waiver remains ≥0.95 F1.
	- Dispute Resolution: macro F1 range 0.929–0.939; higher threshold (0.7) improves precision but lowers jury_trial recall to 0.76.
- **Backtesting on legacy datasets**
	- Content Rights v2025.10.07a macro F1 0.916 (limited by low support in legacy set; moral_rights_waiver support=1).
	- Dispute Resolution v2025.10.07 macro F1 0.933; all labels ≥0.86 F1, showing compatibility with earlier corpora.
- Detailed reports stored under `evaluation_reports/` for each run (default, threshold sweep, and backtests).
