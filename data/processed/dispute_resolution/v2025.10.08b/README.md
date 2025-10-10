# Dispute Resolution Dataset (v2025.10.08b)

This build supersedes v2025.10.08a by adding 120 synthetic venue selection
clauses while retaining the previously generated waivers.

Highlights:

- Total records: 1,072 (↑360 synthetic clauses over baseline)
- Synthetic coverage:
  - 150 class action waivers
  - 90 jury trial waivers
  - 120 venue selection clauses
- Binding arbitration corpus examples retained without change

Synthetic records were generated with
`scripts/ml/generate_synthetic_clauses.py` (preface-enabled templates) and
merged via `scripts/ml/merge_synthetic_with_processed.py`.
