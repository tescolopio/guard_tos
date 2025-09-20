# Datasets and Label Mapping (v1)

This document outlines the datasets we plan to use and how their labels map to the Terms Guardian clause taxonomy defined in `src/data/legalPatterns.js` and the rights scoring spec.

## Target Clause Taxonomy

- HIGH_RISK: ARBITRATION, CLASS_ACTION_WAIVER, UNILATERAL_CHANGES, DATA_SALE_OR_SHARING, AUTO_RENEWAL_FRICTION, NEGATIVE_OPTION_BILLING, DELEGATION_ARBITRABILITY
- MEDIUM_RISK: ARBITRATION_CARVEOUTS, VAGUE_CONSENT, LIMITED_RETENTION_DISCLOSURE, MORAL_RIGHTS_WAIVER, JURY_TRIAL_WAIVER
- POSITIVES: CLEAR_OPT_OUT, SELF_SERVICE_DELETION, NO_DATA_SALE, TRANSPARENT_RETENTION

## Primary HF Datasets

- CUAD (Contract Understanding Atticus Dataset)

  - HF links: theatticusproject/cuad, theatticusproject/cuad-qa, dvgodoy/CUAD_v1_Contract_Understanding_clause_classification
  - Licensing: CC-BY-4.0 (attribution required)
  - Relevant categories:
    - Arbitration → ARBITRATION
    - Limitation of Liability → LIABILITY_LIMITATION (maps into MEDIUM_RISK/HIGH_RISK weight as configured; currently used in MEDIUM_RISK weighting path)
    - Amendments/Modifications → UNILATERAL_CHANGES (filtered via regex: e.g., "we may modify", "we reserve the right to change")
    - Jury Trial Waiver → JURY_TRIAL_WAIVER
    - Moral Rights Waiver → MORAL_RIGHTS_WAIVER

- LEDGAR (LexGLUE task)
  - HF link: MAdAiLab/lex_glue_ledgar
  - Relevant headings:
    - Arbitration → ARBITRATION
    - Limitation of Liability → LIABILITY_LIMITATION
    - Amendments/Modifications → UNILATERAL_CHANGES (regex-filtered to ensure unilateral nature)

## Supplemental (off-HF or alternate)

- OPP-115 / Polisis Privacy Policies

  - Use to populate positives and privacy-related clauses:
    - NO_DATA_SALE (explicit statements not selling data)
    - TRANSPARENT_RETENTION (explicit retention periods)
    - CLEAR_OPT_OUT (explicit opt-out instructions)
    - SELF_SERVICE_DELETION (account/data deletion self-service)

- CLAUDETTE (Unfair Terms in Consumer Contracts / ToS)

  - Useful to find unfair terms including class action waivers and arbitration in ToS context; label mapping may require manual/regex assistance.

- ToS;DR
  - Points-of-interest (good/bad) for ToS; can be mined for sentences including CLASS_ACTION_WAIVER and ARBITRATION.

## Label Mapping Rules (v1)

- ARBITRATION

  - Match dataset labels containing "Arbitration". Include class action arbitration; exclude general "dispute resolution" unless the clause mandates arbitration.

- CLASS_ACTION_WAIVER

  - Rare in contracts datasets; detect via regex on sentences/clauses: /class\s+action\s+waiver|waive\s+.\*class\s+action/i across CUAD/LEDGAR texts and ToS corpora.

- LIABILITY_LIMITATION

  - Map "Limitation of Liability"; ensure the clause limits provider liability (exclude indemnification sections unless they include explicit limitation language).

- UNILATERAL_CHANGES

  - Map from headings like "Amendments"/"Modifications" but require regex confirmation of unilateral power by provider (e.g., /we\s+may\s+modify|we\s+reserve\s+the\s+right\s+to\s+change/i).

- POSITIVES (NO_DATA_SALE, TRANSPARENT_RETENTION, CLEAR_OPT_OUT, SELF_SERVICE_DELETION)

  - From OPP-115: Use policy segments with explicit statements matching the regexes in `legalPatterns.js`. For example:
    - NO_DATA_SALE: /we\s+do\s+not\s+sell\s+(your\s+)?(personal\s+)?data/i
    - TRANSPARENT_RETENTION: /(retain|store)\s+data\s+for\s+\d+\s+(days|months|years)/i
    - CLEAR_OPT_OUT: /opt-?out\s+(procedure|process)/i
    - SELF_SERVICE_DELETION: /(delete|erase)\s+your\s+account|remove\s+your\s+data/i

- MEDIUM_RISK (additional)
  - JURY_TRIAL_WAIVER, MORAL_RIGHTS_WAIVER: direct label mapping where present (CUAD), else regex.
  - VAGUE_CONSENT, LIMITED_RETENTION_DISCLOSURE: privacy datasets where consent/retention language lacks specificity; apply regex in `legalPatterns.js`.

## Data Preparation

- Unit of training: sentence-level or short-clause snippets (20–120 tokens) extracted from datasets; negatives sampled from neutral sentences.
- Balance: ensure per-class reasonable positives (dozens→hundreds) and include diverse negatives.
- Splits: stratified train/val; avoid leakage from same document across splits.

## Notes on Licensing

- CUAD and derivatives: CC-BY-4.0. Provide attribution in model card and repo docs.
- LEDGAR: follow LexGLUE licensing; verify usage terms.
- OPP-115/Polisis, CLAUDETTE, ToS;DR: follow their respective licenses/terms.

## Calibration and thresholds

- After preparing `data/clauses.jsonl` and training `src/data/dictionaries/tfidf_logreg_v2.json`, we calibrated per-class thresholds using `scripts/calibrate_thresholds.py`.
- See `docs/analysis/model-calibration.md` for precision–recall summaries and suggested thresholds.
- Current thresholds are set in `src/utils/constants.js > ML.THRESHOLDS` and were derived to target ~0.90 precision where feasible while maintaining adequate recall. Adjust as the dataset improves (especially for CLASS_ACTION_WAIVER coverage).

## Versioning

- Maintain a curation log (sources, filters, label mappings) and version it alongside model versions (e.g., `tfidf_logreg_v1`).

### Augmenting CLASS_ACTION_WAIVER

- Use `scripts/harvest_class_action_positives.py --input_dir <folder>` to bootstrap candidate sentences from local ToS/HTML/text.
- Manually review and append approved rows to `data/clauses.jsonl` (format: `{ text, label }`).
- Re-run `npm run ml:train` and `npm run ml:calibrate` to refresh model and thresholds.
