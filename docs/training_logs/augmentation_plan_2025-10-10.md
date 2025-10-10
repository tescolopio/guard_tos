# Targeted Augmentation Plan — October 10, 2025

## Snapshot

| Label | Current Positives | Validation F1 | Precision | Recall |
|-------|-------------------|---------------|-----------|--------|
| `data_collection_extensive` | 141 | 0.686 | 0.546 | 0.922 |
| `purpose_broad` | 91 | 0.718 | 0.571 | 0.967 |
| `automated_decision` | 127 | 0.696 | 0.547 | 0.955 |

> Metrics sourced from `evaluation_reports/data_collection_v2025.10.10a_threshold_0.26/evaluation_report.json` and `evaluation_reports/validation_runs/v2025.10.10_all_categories.json`.

## Observed Gaps

### data_collection_extensive
- **Precision drag** stems from conflating general data-use disclosures with truly invasive surveillance. False positives frequently mention enumerated lawful bases without depicting expansive monitoring.
- Positive corpus dominated by synthetic narratives (`synthetic_expanded_phase2`). There is limited coverage of enterprise/IoT telemetry, partner ingestion pipelines, or temporal qualifiers ("continuous", "across affiliates").
- Negative coverage is light on near-miss language (e.g., detailed purpose lists with explicit limits) to teach the classifier what *not* to flag.

### purpose_broad
- Almost all positives are unlabeled `unknown` sources—a mixture of scraped regulatory text. Template variety is low; few samples explicitly enumerate multiple heterogeneous purposes in one clause.
- High recall with low precision indicates the model treats any list of purposes as broad, even when each remains narrowly scoped or bounded by user choice.

### automated_decision
- Training positives are 100% synthetic; no real-world language referencing specific regulators (GDPR Art. 22), credit reporting, or safety automation.
- False positives show transparency statements that describe factors but stop short of admitting an automated outcome. The model lacks contrastive negatives featuring algorithm descriptions without definitive automated action.

## Augmentation Strategy

### 1. Expand Positive Coverage
- **Extensive Collection**
  - Extend `scripts/generate_data_collection_phase2.py` with new segments covering: cross-device graphing, offline data enrichment, long-term retention, and risk-scoring exchanges.
  - Harvest 50–75 passages from privacy policies referencing full-stack telemetry (focus sectors: ad-tech, connected vehicles, smart home). Store under `data/aug/data_collection/v2025.10.10b/extensive_realworld.jsonl`.
- **Purpose Broad**
  - Author dedicated templates that combine 3+ disparate purposes (analytics, marketing, legal compliance, R&D) in a single paragraph, emphasizing phrases like "including but not limited to".
  - Capture clauses where businesses reserve rights to change purposes or reuse data for "other business interests". Target 80 synthetic sentences plus 30 curated legal excerpts.
- **Automated Decision**
  - Generate new positives referencing regulated scenarios (credit scoring, employment screening, content moderation). Incorporate verbs like "automatically denies", "auto-suspends", "risk score triggers".
  - Add 40 human-sourced snippets from regulator guidance (ICO, FTC) and product policies referencing automated enforcement.

### 2. Inject Hard Negatives
- Craft contrastive negatives where language *resembles* positives but stays limited:
  - For `data_collection_extensive`: statements about limited analytics, short retention, or anonymized reporting.
  - For `purpose_broad`: detailed single-purpose disclosures plus opt-out options.
  - For `automated_decision`: transparency statements describing algorithms without automated outcomes; highlight "human-in-the-loop" exceptions.
- Store negatives under `data/aug/<category>/hard_negatives/*.jsonl` and label appropriately (all zeros) to maintain schema.

### 3. Update Generation Scripts
- Parameterize new template banks and sampling controls so we can request targeted volume per label (e.g., `--label data_collection_extensive --count 150`).
- Add CLI flag to `scripts/generate_data_collection_phase2.py` and `scripts/generate_algorithmic_decisions_expanded.py` for emitting hard negatives alongside positives (using `--emit-negatives`).
- Ensure metadata fields `source` (e.g., `synthetic_expanded_v2025.10.12`) and `notes` capture provenance for audit.

### 4. Integration Workflow
1. Generate synthetic batches → write to `data/aug/...`.
2. Deduplicate against existing processed datasets using `scripts/ml/merge_synthetic_with_processed.py` (extend to support new hard-negative files).
3. Rebuild processed datasets (`data/processed/.../v2025.10.12/`) and manifests.
4. Retrain affected models with updated data; capture metrics in `reports/eval/history/...`.

## Tracking & Reporting
- Add per-label precision/recall columns to `evaluation_reports/validation_runs/*.json` ingestion summary to quickly monitor improvements.
- Automate extraction of top false positives per label after each run and persist to `reports/eval/fp_samples/<category>/<version>.json` for review.
- Create Grafana-friendly CSV (via `scripts/ml/compare_model_metrics.py`) logging automated_decision metrics over time to ensure improvements are visible.

## Next Steps
1. Implement generator enhancements and curate real-world passages (owners: ML content team).
2. Produce `v2025.10.12` datasets and rerun training/evaluation.
3. Update validation suite snapshot and documentation with new metrics.
