# Legal Corpus for Terms Guardian ML Training

This directory contains the processed legal corpus harvested from Hugging Face datasets. Documents are stored in JSONL format (one JSON document per line) for efficient streaming during training.

## Corpus Statistics

Last updated: 2025-10-02

| Dataset | Documents | Size | Source | Categories |
|---------|-----------|------|--------|------------|
| CUAD Contract Clauses | 8,373 | 5.2 MB | dvgodoy/CUAD_v1 | dispute_resolution, liability |
| Privacy Policy QA | 8,738 | 26 MB | amentaga-nttd/privacy-policy-qa | data_collection_use, user_privacy |
| LEDGAR Legal Clauses | 79,726 | 69 MB | MAdAiLab/lex_glue_ledgar | content_ip, dispute_resolution |
| **TOTAL** | **96,837** | **100 MB** | - | - |

## Document Format

Each line in a `.jsonl` file is a JSON object with this structure:

```json
{
  "doc_id": "unique_identifier",
  "text": "The actual legal text content...",
  "source": "dataset_name",
  "metadata": {
    "original_split": "train/test/validation",
    "length": 371,
    "index": 0,
    "original_label": "Category or label from source dataset"
  }
}
```

## Quality Filters Applied

During ingestion, documents are filtered based on:
- **Length**: Min 50 chars, Max 5000 chars
- **Deduplication**: Exact text duplicates removed
- **Language**: English (when langdetect available)

## Next Steps

1. **Quality Control**: Run QC report on corpus
   ```bash
   python scripts/corpus/qc_report.py --input data/corpus/*.jsonl
   ```

2. **Pattern-Based Labeling**: Apply weak supervision patterns
   ```bash
   python scripts/corpus/build_category_dataset.py \
     --category dispute_resolution \
     --input data/corpus/*.jsonl
   ```

3. **Training Data Generation**: Create labeled datasets for each category
   - `dispute_resolution`: CUAD + LEDGAR (arbitration, class action waivers)
   - `data_collection_use`: Privacy Policy QA (data collection practices)
   - `user_privacy`: Privacy Policy QA (privacy rights, retention, deletion)

## Source Dataset Details

### CUAD (Contract Understanding Atticus Dataset)
- **License**: CC-BY-4.0
- **Content**: Contract clauses from commercial agreements
- **Labels**: 41 clause types including dispute resolution, liability, IP rights
- **Use Cases**: Dispute resolution patterns, liability limitation clauses

### Privacy Policy QA Classification
- **Content**: Privacy policy clauses with relevance classifications
- **Use Cases**: Data collection practices, privacy rights disclosures
- **Format**: Text snippets with classification labels

### LEDGAR (Legal Clause Classification)
- **License**: Check MAdAiLab repo
- **Content**: Legal provisions from SEC EDGAR filings
- **Labels**: 100+ provision types
- **Use Cases**: General legal language patterns, contract terms

## Data Lineage

```
Hugging Face Hub
    ↓ [scripts/hf_download.py]
data/raw/<dataset>/
    ↓ [scripts/corpus/ingest_huggingface.py]
data/corpus/<dataset>.jsonl
    ↓ [scripts/corpus/build_category_dataset.py + patterns/*.yaml]
data/processed/<category>/labeled_dataset.jsonl
    ↓ [scripts/training/train_category_model.py]
models/<category>/distilbert_model/
```

## Notes

- Raw HF datasets preserved in `data/raw/` for re-processing if needed
- Ingestion script (`ingest_huggingface.py`) is idempotent - won't overwrite existing outputs
- Use `--dataset` flag to re-process specific datasets after schema changes
- For additional datasets, update `data/manifests/hf_datasets.yml` and re-run download/ingestion
