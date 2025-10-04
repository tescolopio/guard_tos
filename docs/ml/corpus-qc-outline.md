# Corpus QC Automation Outline

_Last updated: 2025-10-01_

## 1. Purpose

Provide a reproducible quality-control report for every processed dataset release. The QC script (`scripts/corpus/qc_report.py`) now generates JSON and optional Markdown reports that surface structural issues (missing fields, encoding errors), distribution shifts (length, language, duplicates), and labeling anomalies before a corpus advances to SME review or model training. Effective thresholds are centrally managed in `scripts/corpus/config/qc_thresholds.yaml`, with CLI flags available for overrides.

## 2. Scope & Inputs

- **Primary input:** `data/processed/<category>/<version>/dataset.jsonl`
- **Optional inputs:**
  - `data/raw/_sources.csv` for licensing/context metadata
  - `data/processed/<category>/<version>/manifest.json` for expected counts
  - Stopword lists or language detection resources (e.g., `langdetect`, `fasttext`)
- **Invocation:** `python scripts/corpus/qc_report.py --category <cat> --dataset ... [--manifest ...] [--sources ...] [--write-markdown]`
- **Configuration:** default and per-category thresholds live in `scripts/corpus/config/qc_thresholds.yaml`; CLI flags (e.g., `--max-duplicate-ratio`) override config at runtime.
- **Sample run (used for smoke test):** `python scripts/corpus/qc_report.py --category dispute_resolution --dataset data/processed/dispute_resolution/v2025.09.30-qc-sample/dataset.jsonl --manifest data/processed/dispute_resolution/v2025.09.30-qc-sample/manifest.json --sources demo_fixture --write-markdown`

## 3. Required Checks

| Check                          | Description                                                                 | Output Field                  |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| File integrity                 | Confirm dataset readable, UTF-8 encoded, JSON schema matches expectations  | `integrity.status`, `errors`  |
| Structural validation          | Ensure `text` non-empty, labels cover category label list, numeric ranges  | `structure.status`, `issues`  |
| Length statistics              | Compute min/median/mean/max tokens & characters, flag outliers             | `length.stats`, `length.flags`|
| Language mix                   | Detect dominant language per record; report percentage non-English         | `language.primary`, `language.flags` |
| Duplicate analysis             | Compute near-duplicate rate using MinHash/SimHash; identify top collisions | `dedupe.duplicate_ratio`, `dedupe.samples` |
| Label distribution             | Count positives per label, compare with manifest expectations              | `labels.totals`, `labels.warnings`    |
| Source coverage (optional)     | Cross-check records contain `source` metadata when expected                | `source.coverage`, `source.flags`     |
| QA readiness gates             | Summarize pass/fail against thresholds (e.g., duplicate ratio <5%)         | `gates.summary`                        |

## 4. Report Format

- Emit JSON report at `reports/qc/<category>/<version>.json` with nested sections above.
- Optionally render Markdown summary for humans at `reports/qc/<category>/<version>.md`.
- Include CLI exit code 0 (pass) / 1 (fail) to integrate with CI.

### Sample JSON Skeleton

```json
{
  "metadata": {
    "category": "data_collection_use",
    "version": "v2025.10.01",
    "generated_at": "2025-10-01T12:34:56Z"
  },
  "integrity": {"status": "pass", "errors": []},
  "structure": {"status": "pass", "issues": []},
  "length": {"stats": {"tokens": {"mean": 187.2}}, "flags": []},
  "language": {"primary": "en", "breakdown": {"en": 0.96, "es": 0.04}, "flags": []},
  "dedupe": {"duplicate_ratio": 0.018, "samples": []},
  "labels": {"totals": {"binding_arbitration": 1866}, "warnings": []},
  "gates": {"summary": "pass", "failed_checks": []}
}
```

## 5. Implementation Notes

- Reuse tokenization utilities (e.g., spaCy, nltk) or fallback to simple whitespace counts for token length.
- Language detection now uses `langdetect` with deterministic seeding plus heuristic fallback for low-confidence results.
- Duplicate analysis combines exact-match hashing with optional MinHash+LSH (`datasketch`) to surface near duplicates; the threshold is tunable via config/CLI.
- Thresholds (token bounds, duplicate ratio, language mix) are sourced from `qc_thresholds.yaml`; CLI flags (e.g., `--max-duplicate-ratio`, `--max-non-primary-language`, `--minhash-similarity-threshold`) remain available.
- Add quiet (`--quiet`) and verbose modes in a future revision if CLI output becomes noisy.
- `scripts/requirements.txt` now declares `langdetect` and `datasketch`; ensure environments install the updated dependency set.

## 6. Integration Points

1. **Corpus build pipeline:** Add optional `--qc-report` flag to `scripts/corpus/build_category_dataset.py` to auto-invoke after dataset generation.
2. **CI / GitHub Actions:** Run QC script on pull requests touching `data/processed/**` or pattern configurations.
3. **Documentation hooks:** Append QC summary link to `docs/training_progress.md` and category README.

## 7. Acceptance Criteria

- Script exits non-zero when any gate fails (structural issues, duplicate ratio above threshold, etc.).
- Report files generated in both JSON and human-readable format.
- Unit tests cover major checks with synthetic datasets (clean + failure cases).
- Runtime <2 minutes for 10k-record corpus on developer laptops.

## 8. Follow-Up Tasks

- Expand threshold coverage for remaining categories in `qc_thresholds.yaml` as corpora mature.
- Wire QC invocation into `scripts/corpus/build_category_dataset.py` (e.g., `--qc-report` flag) and corresponding npm scripts (`npm run ml:qc`).
- Add documentation snippet to `docs/ml/data-expansion-plan.md` referencing QC automation progress and dependency requirements.
