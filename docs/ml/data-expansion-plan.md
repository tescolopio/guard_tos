# URI Data Expansion Program

Last updated: 2025-09-27

## 1. Objectives & Success Criteria

**Goal:** Deliver production-grade datasets for all eight URI categories so that model training, calibration, and evaluation can proceed with confidence.

| Dimension           | Target                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| Coverage            | ≥1 vetted processed corpus release + gold evaluation set per category             |
| Quality             | QA review sample ≥300 spans, error rate ≤10%, inter-annotator agreement κ ≥0.75   |
| Freshness           | Harvest cadence documented; delta harvest <45 days old for high-change sources    |
| Transparency        | Every release tracked via manifest, metrics snapshot, and changelog entry         |
| Reproducibility     | Scripts runnable via npm/python tasks; outputs reproducible from raw sources      |
| Compliance & Ethics | Licensing recorded, sensitive data scrubbing verified, reviewer sign-off archived |

## 2. Current Inventory Snapshot

| Category               | Processed Dataset | Gold Dataset                           | Last Action                      | Next Required Step                                    |
| ---------------------- | ----------------- | -------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| Dispute Resolution     | ✅ `v2025.09.27`  | ⚠️ Draft seed (`gold_eval.todo.jsonl`) | Automated build + metrics logged | SME review + finalize gold set + QA metrics           |
| Data Collection & Use  | ❌                | ❌                                     | None                             | Harvest sources (GDPR/CCPA/etc.), run pipeline        |
| User Privacy           | ❌                | ❌                                     | None                             | Define weak supervision patterns, harvest regulators  |
| Content Rights         | ❌                | ❌                                     | None                             | Pull CUAD/LEDGAR clauses, run preprocessing           |
| Account Management     | ❌                | ❌                                     | None                             | Harvest subscription agreements, annotate termination |
| Terms Changes          | ❌                | ❌                                     | None                             | Collect change-log clauses, build heuristics          |
| Algorithmic Decisions  | ❌                | ❌                                     | None                             | Source AI transparency statements, craft patterns     |
| Clarity & Transparency | ❌                | ❌                                     | None                             | Gather plain-language exemplars vs legalese corpora   |

Legend: ✅ shipped | ⚠️ in progress | ❌ not started.

> Source registry entries for Wave 1 categories have been bootstrapped in `data/raw/_sources.csv` (GDPR, CCPA, FTC privacy cases, EDPB guidelines, PolicyQA, SEC filings).

## 3. Phase Plan (Harvest → Review)

Each category follows the same five-phase pipeline. Phases can overlap across categories, but promotion requires completing all acceptance criteria.

### 3.1 Harvest

- **Inputs:** Source registry (`docs/ml/training-data-pipeline.md`), `data/raw/_sources.csv`.
- **Activities:** Crawl/download primary & supplemental sources, record licensing, snapshot raw artifacts under `data/raw/<source>/<yyyymmdd>/`.
- **Tooling:** `npm run ml:harvest`, bespoke scrapers, `scripts/offline` utilities.
- **Deliverables:** Raw text/PDFs with metadata, updated `_sources.csv`, harvest log in `dev_progress.md`.
- **Acceptance:** Sources tagged with URI category, license confirmed, sensitive data policies documented.

### 3.2 Preprocess

- **Inputs:** Raw artifacts from harvest phase.
- **Activities:** Normalize encoding, strip boilerplate, chunk spans (300–600 words), deduplicate, compute readability stats.
- **Tooling:** `npm run ml:normalize`, `npm run ml:chunk`, `scripts/corpus/lib/*` helpers.
- **Deliverables:** Normalized text under `data/normalized`, chunked JSONL under `data/chunks/<category>/`.
- **Acceptance:** QC report (length distribution, language detection) stored in `reports/qc/<category>/<date>.json` with PASS status.

### 3.3 Label (Weak Supervision + SME seeding)

- **Inputs:** Chunked spans.
- **Activities:** Apply category-specific heuristics (`scripts/corpus/patterns/<category>.yaml`), map historical labels via `SOURCE_LABEL_MAP`, stratify results.
- **Tooling:** `scripts/corpus/build_category_dataset.py`, `scripts/corpus/seed_gold_dataset.py`.
- **Deliverables:** Processed corpus (`data/processed/<category>/vYYYY.MM.DD/`), metrics snapshot (`reports/eval/history/<category>/<version>_dataset.json`), SME seed (`gold_eval.todo.jsonl`).
- **Acceptance:** Manifest generated, label distribution reviewed, seed size ≥150 spans with ≥30 positives per label where feasible.

### 3.4 Manifest & Documentation

- **Inputs:** Processed corpus outputs.
- **Activities:** Complete `manifest.json`, write dataset README, log changes in `docs/training_progress.md`, cross-link in `docs/ml/gold-datasets.md`.
- **Tooling:** `scripts/ml/log_dataset_metrics.py`, manual docs edits.
- **Deliverables:** Versioned directory with manifest + README, doc updates, Jira/issue tracker entry.
- **Acceptance:** Manifest fields populated (sources, QA stats, notes), README includes provenance + caveats, documentation PR approved.

### 3.5 Review & Promote Gold Set

- **Inputs:** `gold_eval.todo.jsonl`, annotation guidelines.
- **Activities:** SME annotation, secondary adjudication, QA sampling, compute agreement metrics.
- **Tooling:** Annotation platform (Label Studio or internal tool), `scripts/analysis/agreement.py` (to be authored), `scripts/ml/evaluate_category_model.py` for spot checks.
- **Deliverables:** Final `gold_eval.jsonl`, updated `manifest.json` with QA numbers, QA summary appended to `reports/eval/history/...`.
- **Acceptance:** QA sample ≥300, κ ≥0.75 (per label), error rate ≤10%, reviewers sign-off recorded, dataset tagged "production" in changelog.

## 4. Category Rollout Waves

| Wave | Categories                                                        | Target Window | Rationale / Dependencies                                      |
| ---- | ----------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| 0    | Dispute Resolution                                                | Oct 2025      | Corpus already generated; finish SME review + QA              |
| 1    | Data Collection & Use, User Privacy                               | Nov 2025      | High-impact for privacy scoring; leverage overlapping sources |
| 2    | Content Rights, Terms Changes                                     | Dec 2025      | Shared contract corpora & change-log heuristics               |
| 3    | Account Management, Algorithmic Decisions, Clarity & Transparency | Jan 2026      | Lower availability corpora; requires bespoke pattern work     |

**Milestones per wave:** (a) processed corpus `vYYYY.MM.DD` released, (b) gold set signed off, (c) evaluation metrics logged.

## 5. Workstreams & Ownership

| Workstream                     | Lead Role             | Key Outputs                             | Supporting Scripts/Docs                                            |
| ------------------------------ | --------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Source Harvesting              | Data Engineer         | Harvest scripts, `_sources.csv` updates | `docs/ml/training-data-pipeline.md`, `scripts/harvest_*`           |
| Preprocessing & Normalization  | Data Engineer         | Normalized text, QC reports             | `scripts/corpus/lib/normalizer.py` (planned)                       |
| Weak Supervision Automation    | ML Engineer           | Pattern YAMLs, corpus builders          | `scripts/corpus/build_category_dataset.py`, `scripts/corpus/lib`   |
| SME Coordination & Annotation  | Legal Program Manager | Annotated gold sets, adjudication logs  | `docs/ml/annotation-guidelines.md`, annotation platform configs    |
| QA & Metrics                   | ML QA Analyst         | Metrics snapshots, QA dashboards        | `scripts/ml/log_dataset_metrics.py`, `reports/eval/README.md`      |
| Documentation & Change Control | Tech Writer / PM      | Updated docs, changelog entries         | This plan, `docs/training_progress.md`, `docs/ml/gold-datasets.md` |

## 6. Automation Backlog (Cross-Cutting)

1. **Pattern Libraries:** Formalize regex + keyword rules per category; store in versioned YAML with docs.
2. **QC Suite:** Create `scripts/corpus/qc_report.py` to auto-compute duplicate rate, language mix, label coverage.
3. **Agreement Calculator:** Implement script to compute κ and error rates from annotated CSV/JSON.
4. **Dataset Promotion CLI:** Add `scripts/corpus/promote_dataset.py` to bump manifest status (draft → prod) and update docs automatically.
5. **CI Checks:** Extend pipeline to fail if manifests missing required fields or metrics snapshots outdated (>30 days).
6. **Telemetry Hooks:** (Optional) Add command to copy manifests to analytics warehouse for long-term tracking.

## 7. Risk Mitigation

| Risk                            | Impact               | Mitigation                                                                                             |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Scarce labeled positives        | Low recall           | Expand seed with regulatory cases, apply active learning, request SME focus on underrepresented labels |
| Licensing restrictions          | Release delays       | Keep license metadata in `_sources.csv`, prefer public-domain/government sources first                 |
| SME bandwidth limitations       | Timeline slip        | Schedule rolling annotation sprints, pre-stratify batches, provide detailed guidelines                 |
| Pattern drift / false positives | Model noise          | Schedule quarterly pattern audits, cross-validate with gold sets                                       |
| QA metrics below threshold      | Block model training | Iterate on heuristics, refine annotation guidelines, run remediation before promotion                  |

## 8. Communication & Reporting

- **Weekly Sync:** Review harvest progress, QC blockers, annotation throughput.
- **Progress Log:** Update `dev_progress.md` with harvest dates, dataset releases, QA outcomes.
- **Dashboard:** Publish metrics summary to `reports/eval/README.md` once per wave.
- **Stakeholder Updates:** Share milestone briefings with product/legal when gold sets are approved.

## 9. Next Immediate Actions

1. Finish dispute resolution gold set review; capture QA metrics and promote to production.
2. Finalize source list + access credentials for privacy-related categories (Wave 1) and open ingestion tickets.
3. Draft pattern YAML scaffolding for data collection & user privacy to accelerate weak supervision.
4. Scope QC automation scripts (#6.2) and assign engineer for sprint planning.

---

_This plan complements `docs/ml/training-data-pipeline.md`, `docs/ml/gold-datasets.md`, and `docs/ml/enhancement-plan.md`. Update this document whenever timelines shift or new automation lands._
