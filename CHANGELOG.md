# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `scripts/ml/merge_synthetic_with_processed.py` for deterministic merging of processed and synthetic datasets with dedupe and optional shuffling.
- Synthetic venue selection clauses (120) and refreshed waiver templates to rebalance dispute_resolution training data.
- Training artifacts for content_rights `v2025.10.08a-v1` and dispute_resolution `v2025.10.08b-v1`, including metrics reports.
- Spot-check log `docs/training_logs/2025-10-08-synthetic-spotcheck.md` documenting manual review of synthetic clauses.

### Changed
- Regenerated `data/processed/content_rights/v2025.10.08a/dataset.jsonl` (1,595 records) with balanced low-support labels.
- Regenerated `data/processed/dispute_resolution/v2025.10.08b/dataset.jsonl` (1,072 records) adding venue selection coverage.
- Updated `scripts/ml/generate_synthetic_clauses.py` with preface pools, expanded suffixes, and on-the-fly dedupe guarantees.
- Tightened validation config to enforce thresholds for augmented content_rights and dispute_resolution models.
- Refreshed `docs/dataset-status.md` with latest counts and phase summaries.

### Fixed
- Ensured dispute_resolution validation now passes with venue selection support ≥50 positives.

## [1.0.0] - 2025-09-17

### Added

- User Rights Index (URI) combiner with 8 categories and weighted overall grade
- Readability blend into Clarity & Transparency
- Side panel updates to display URI and detailed tooltips
- Enhanced summarization demo and wiring

### Changed

- Consolidated documentation; archived concept proposals and duplicates
- Stabilized webpack prod build and Jest config

### Fixed

- Terser minification errors by removing conflicting config
- Assorted test stability improvements

---

Keep this file updated with every release. Follow semantic versioning when possible.
