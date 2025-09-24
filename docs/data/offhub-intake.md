# Off-Hub dataset intake

This note tracks acquisition and ingestion of datasets not hosted on Hugging Face that are useful for ToS/legal clause modeling.

## Candidate sources

- OPP-115 / Polisis (privacy policies)
  - Link: [https://privacypolicies.cs.princeton.edu](https://privacypolicies.cs.princeton.edu)
  - Artifacts: policy texts, annotations (data practices), segment-level labels
  - License: academic/conditional — review before distribution
  - Fit: Data privacy, user control (access/delete/portability), data sharing
- CLAUDETTE (unfair terms in consumer contracts)
  - Link: [https://claus-project.eu/](https://claus-project.eu/) or related publications
  - License: check paper/artifacts; often research-only
  - Fit: unfair ToS clauses including unilateral changes, arbitration-like terms
- ToS;DR
  - Link: [https://tosdr.org](https://tosdr.org)
  - Artifacts: crowd-sourced points/ratings of services and annotated clauses
  - License: open data (varies by subset) — verify per dump
  - Fit: service terms, dispute resolution, commercial terms, user rights

## Intake policy

- Respect original licenses; store raw data outside the repo if redistribution is restricted (e.g., `data/offhub/raw/`).
- Normalize into a common JSONL schema used by our pipeline: `{ text: str, label: str }`.
- Keep a provenance field when available: `{ source: str }`.
- Maintain a mapping/taxonomy file if labels differ (e.g., `data/offhub/mapping.yml`).

## Workflow

1. Download raw data locally into `data/offhub/raw/<source>/` (do not commit if license restricts).
1. Map fields into `{text,label}` and write `data/offhub/normalized/<source>.jsonl`.
1. Append to training via `scripts/prepare_datasets.py --augment data/offhub/normalized/<source>.jsonl`.

## Label mapping guidance

- Arbitration → `ARBITRATION`
- Class action waiver → `CLASS_ACTION_WAIVER`
- Limitation of liability → `LIABILITY_LIMITATION`
- Unilateral change of terms → `UNILATERAL_CHANGES`

When only coarse category is available, use regex heuristics (see `scripts/prepare_datasets.py`) to derive a best-effort label, and keep a ‘weak_label’ field in intermediate files for auditability.

## Risks and mitigations

- Licensing: keep raw dumps out of VCS; document links and hashes.
- Class imbalance: prioritize augmentation for sparse labels.
- Domain drift: prefer ToS/consumer contracts over generic contracts where possible.
