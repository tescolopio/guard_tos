# Data pipeline: Hugging Face collection

This folder documents how we collect and prepare datasets for the Terms Guardian ML experiments.

## What's here

- `docs/data/hf-datasets-catalog.md`: Survey of candidate datasets with licenses and relevance.
- `data/manifests/hf_datasets.yml`: Machine-readable selection manifest for automated downloads.
- `scripts/hf_download.py`: Downloader that reads the manifest and fetches datasets into `data/raw/`.
- `scripts/requirements.txt`: Python deps for the scripts.

## Manifest structure (`data/manifests/hf_datasets.yml`)

- `version`: Manifest version number.
- `categories`: Human-readable notes and candidates by our 8 categories.
- `selection`:
  - `include`: Repos we will download.
  - `eval_only`: Datasets used only for evaluation.
  - `consider`: Candidates to review next.
- `download`:
  - `root_dir`: Output directory (default `data/raw`).
  - `force`: Reserved for future use to re-download.
  - `timeout_sec`: Reserved, not yet used by the script.

## Usage

1. Create a Python environment and install requirements

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

1. Optional: authenticate to Hugging Face for higher limits

```bash
# Create a HF token at https://hf.co/settings/mcp/ or https://hf.co/settings/tokens
export HF_TOKEN=hf_xxx
```

1. Dry-run to see what will be downloaded

```bash
python scripts/hf_download.py --dry-run
```

1. Download datasets in `selection.include`

```bash
python scripts/hf_download.py
```

Outputs will be written to `data/raw/<repo_owner>__<repo_name>/<split>/` using the Hugging Face `Dataset.save_to_disk` format.

## Next steps

- Expand `selection.include` as we confirm licenses and mappings.
- Integrate `data/raw/` with `scripts/prepare_datasets.py` to build a unified `data/clauses.jsonl`.
- Add off-Hub datasets (e.g., OPP-115/Polisis, CLAUDETTE, ToS;DR) with acquisition notes.

### Augment sparse classes

If some classes (e.g., CLASS_ACTION_WAIVER, UNILATERAL_CHANGES) have too few positives:

1. Harvest candidates from curated ToS pages

```bash
python scripts/harvest_clause_candidates.py --input test-pages/curated-tos --output data/harvested_candidates.jsonl
```

1. Manually review and accept positives into a cleaned file (or use your own review flow), then run:

```bash
python scripts/clean_harvest_jsonl.py --input data/harvested_candidates.jsonl --output data/harvested_class_action.cleaned.jsonl
```

1. Re-run preparation with augmentation

```bash
python scripts/prepare_datasets.py --output data/clauses.jsonl --augment data/harvested_class_action.cleaned.jsonl
```

## Troubleshooting

- If you see `Missing dependency: ...`, ensure you installed from `scripts/requirements.txt` in an active virtualenv.
- Some datasets have restrictive licenses; keep them in `eval_only` until cleared.
- If a dataset already exists on disk, the script will skip it.
