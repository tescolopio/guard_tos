# Content Rights Dataset (v2025.10.08a)

This release combines the v2025.10.07a corpus build with 264 synthetic clauses
targeting low-support labels (commercial_use_claim, moral_rights_waiver,
ip_retained). Synthetic examples were generated with `scripts/ml/generate_synthetic_clauses.py`
using template variation for platforms, jurisdictions, and notice periods.

Key deltas:

- Total records: 1,595 (↑264)
- Each targeted label now has 100 positive examples
- Licensing `license_assignment` distribution unchanged (1,295 positives)

Use `scripts/ml/merge_synthetic_with_processed.py` to reproduce the merge.
