# Dispute Resolution Dataset (v2025.10.08a)

This release layers 240 synthetic dispute resolution clauses onto the
v2025.10.07 corpus to improve support for `class_action_waiver` and
`jury_trial_waiver` labels.

Highlights:

- Total records: 952 (↑240)
- Added 150 synthetic class action waivers and 90 jury trial waivers
- Existing binding arbitration and venue selection clauses retained

Synthetic examples were produced with
`scripts/ml/generate_synthetic_clauses.py` using randomized prefaces,
forums, and jurisdictions for language diversity. Merge performed with
`scripts/ml/merge_synthetic_with_processed.py`.
