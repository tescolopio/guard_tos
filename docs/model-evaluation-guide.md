# Model Evaluation Guide

**Date**: October 7, 2025  
**Purpose**: Comprehensive guide for evaluating trained Terms Guardian models

---

## Quick Start

After training a model, evaluate it with:

```bash
# Basic evaluation (print metrics to console)
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection

# Full evaluation with detailed reports
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --output-dir evaluation_reports/data_collection_v1

# Quick check (no detailed reports)
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --quick
```

---

## Alpha Testing Validation

Our alpha pipeline runs a consolidated validation pass across **all trained models** with:

```bash
python scripts/ml/run_model_validation.py \
  --config scripts/ml/model_validation_targets.yaml \
  --json-report artifacts/validation/model_validation_results.json
```

### What the Validation Runner Does

- Loads every model + dataset pair listed in `scripts/ml/model_validation_targets.yaml`
- Performs batched inference across the full dataset (no random splitting)
- Checks that:
  - Macro F1 stays above the configured minimum
  - Every label's F1 stays above the configured floor
  - Each label has sufficient positive support (helps reveal dataset imbalance)
- Emits a summary table and optional JSON report for CI dashboards
- Returns **non-zero** when any category marked `enforce: true` fails, allowing the
  pipeline to halt before promotion.

### Understanding the Output

| Column | Meaning |
|--------|---------|
| `Status` | `PASS`, `WARN` (non-blocking), or `FAIL` (blocking) |
| `Macro F1` | Full-dataset macro F1 at the configured threshold |
| `Notes` | Violated checks (failures) or advisories (warnings) |

Warnings appear for categories that are still under development (e.g., Content
Rights) so we never lose sight of outstanding work, while production-ready
categories are enforced strictly.

### Customising Thresholds

Edit `scripts/ml/model_validation_targets.yaml` to:

- Point to new model artifacts or datasets
- Adjust macro/per-label F1 requirements
- Tune minimum label support expectations
- Toggle `enforce` to control whether a category should block the pipeline
- Override `batch_size` if you need to reduce GPU/CPU memory pressure

💡 **Tip:** commit threshold changes alongside the corresponding training or
data updates so that regressions stay visible in code review.

---

## What Gets Evaluated

### 1. **Per-Label Metrics**
For each label (e.g., `data_collection_extensive`, `consent_explicit`):
- **Precision**: Of all predicted positives, how many were correct?
- **Recall**: Of all actual positives, how many did we find?
- **F1 Score**: Harmonic mean of precision and recall (balanced metric)
- **Support**: Number of examples with this label in eval set

### 2. **Macro Metrics**
Overall model performance:
- **Macro Precision**: Average precision across all labels (unweighted)
- **Macro Recall**: Average recall across all labels (unweighted)
- **Macro F1**: Average F1 across all labels (PRIMARY SUCCESS METRIC)

### 3. **Confusion Matrices**
For each label:
- **True Positives (TP)**: Correctly predicted positive
- **False Positives (FP)**: Incorrectly predicted positive (Type I error)
- **False Negatives (FN)**: Incorrectly predicted negative (Type II error)
- **True Negatives (TN)**: Correctly predicted negative

### 4. **Error Analysis**
- **False Positives**: Examples where model predicted a label but shouldn't have
  - Useful for: Identifying over-triggering patterns
  - Shows: Confidence scores, text snippets, label assignments
  
- **False Negatives**: Examples where model missed a label it should have found
  - Useful for: Identifying gaps in model understanding
  - Shows: Confidence scores, text snippets, missed labels

### 5. **Sample Predictions**
Representative examples with:
- Full text (first 300 chars)
- Per-label predictions with confidences
- Ground truth labels
- Correctness indicators

---

## Interpreting Results

### Success Criteria

| Metric | Minimum | Production | Excellent |
|--------|---------|------------|-----------|
| **Macro F1** | 0.65 | 0.75 | 0.80+ |
| **Per-label F1** | 0.60 | 0.70 | 0.80+ |

### Assessment Guidelines

✅ **EXCELLENT** (Macro F1 ≥ 0.80)
- Model is production-ready
- Proceed to next category
- Document successful hyperparameters

✅ **GOOD** (Macro F1 = 0.75-0.79)
- Acceptable performance
- If all per-label F1 ≥ 0.70, proceed
- If some labels <0.70, consider minor optimization

⚠️ **FAIR** (Macro F1 = 0.65-0.74)
- Consider optimization before proceeding
- Check which labels are underperforming
- May need more epochs, better LR, or threshold tuning

❌ **POOR** (Macro F1 < 0.65)
- Requires significant improvement
- Review data quality
- Try different hyperparameters or base model
- Consider adding more training data

---

## Output Files

When using `--output-dir`, the script generates:

### 1. `evaluation_report.json`
Complete metrics in JSON format:
```json
{
  "model_path": "...",
  "category": "data_collection",
  "threshold": 0.5,
  "macro_metrics": {
    "macro_precision": 0.82,
    "macro_recall": 0.79,
    "macro_f1": 0.80
  },
  "per_label_metrics": {
    "data_collection_extensive": {
      "precision": 0.85,
      "recall": 0.82,
      "f1": 0.83,
      "support": 50
    },
    ...
  },
  "confusion_matrices": {...},
  "summary": {
    "num_labels": 6,
    "labels_above_f1_0.70": 6,
    "weakest_label": "purpose_broad",
    "strongest_label": "consent_explicit"
  }
}
```

### 2. `error_analysis.json`
Detailed false positive and false negative examples:
```json
{
  "false_positives": [
    {
      "label": "data_collection_extensive",
      "text": "We collect basic information...",
      "confidence": 0.62,
      "text_length": 450
    },
    ...
  ],
  "false_negatives": [...]
}
```

### 3. `predictions_sample.json`
Sample predictions for manual review:
```json
[
  {
    "text": "Company may collect user data...",
    "text_length": 280,
    "predictions": [
      {
        "label": "data_collection_extensive",
        "predicted": true,
        "actual": true,
        "confidence": 0.89,
        "correct": true
      },
      ...
    ],
    "num_correct": 5,
    "num_labels": 6
  },
  ...
]
```

---

## Common Issues & Solutions

### Issue: Low Precision, High Recall
**Symptom**: Model predicts labels too liberally (many false positives)

**Solutions**:
1. Increase threshold: `--threshold 0.6` (default is 0.5)
2. More training epochs to learn boundaries better
3. Add more negative examples to training data
4. Consider higher weight_decay to reduce overfitting

### Issue: High Precision, Low Recall
**Symptom**: Model is too conservative (many false negatives)

**Solutions**:
1. Decrease threshold: `--threshold 0.4`
2. More training data with positive examples
3. Lower weight_decay to let model fit data better
4. More training epochs

### Issue: Specific Labels Underperform
**Symptom**: Most labels F1 > 0.75, but 1-2 labels < 0.65

**Solutions**:
1. Check label distribution in training data (imbalanced?)
2. Review error_analysis.json for that label
3. Add more training examples for weak labels
4. Consider label-specific thresholds
5. May need data quality review for that label

### Issue: All Labels Perform Poorly
**Symptom**: Macro F1 < 0.60, all labels struggling

**Solutions**:
1. Check data quality (mislabeled examples?)
2. Try different base model (roberta-base instead of distilbert)
3. Increase training epochs significantly (try 8-10)
4. Lower learning rate (try 2e-5)
5. Review if task is too ambiguous (may need clearer labeling guidelines)

### Issue: Overfitting (Train >> Eval)
**Symptom**: Training metrics high, evaluation metrics low

**Solutions**:
1. Increase weight_decay (try 0.05)
2. Decrease epochs (try 3)
3. Add dropout (modify model config)
4. More training data (especially diverse examples)

---

## Threshold Tuning

The default threshold (0.5) may not be optimal for all labels. Consider:

1. **Per-Label Analysis**: Check confusion matrices to see if threshold adjustment would help
   - High FP, low FN → increase threshold (be more conservative)
   - Low FP, high FN → decrease threshold (be more aggressive)

2. **Grid Search**: Try multiple thresholds:
   ```bash
   for threshold in 0.3 0.4 0.5 0.6 0.7; do
     python scripts/ml/evaluate_model.py \
       --model artifacts/models/data_collection/v2025.10.07e-v1 \
       --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
       --category data_collection \
       --threshold $threshold \
       --quick
   done
   ```

3. **Label-Specific Thresholds**: For production, you may want different thresholds per label
   - Implement in `src/ml/classifier.js` based on evaluation results

---

## Integration with Training Logs

After evaluation, update your training log:

```bash
# Example for Data Collection v1
vim docs/training_logs/data_collection_training_log.md
```

Document:
- Macro F1 score
- Per-label F1 scores (especially weak/strong labels)
- Key findings from error analysis
- Whether optimization is needed
- Recommendations for next iteration or next category

---

## Example Workflow

```bash
# 1. Train model
python scripts/ml/train_category_model.py \
  --category data_collection \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/data_collection/v2025.10.07e-v1 \
  --epochs 5

# 2. Quick evaluation check
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --quick

# 3. If looks good, generate full report
python scripts/ml/evaluate_model.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --category data_collection \
  --output-dir evaluation_reports/data_collection_v1

# 4. Review detailed reports
cat evaluation_reports/data_collection_v1/evaluation_report.json
cat evaluation_reports/data_collection_v1/error_analysis.json | jq '.false_positives[:5]'

# 5. Manual testing
python scripts/ml/test_model_manual.py \
  --model artifacts/models/data_collection/v2025.10.07e-v1 \
  --category data_collection

# 6. Document findings
vim docs/training_logs/data_collection_training_log.md

# 7. Decide: optimize or proceed to next category
```

---

## Tips for Success

1. **Always run evaluation before considering training complete**
2. **Review error_analysis.json to understand failure patterns**
3. **Check sample predictions manually - metrics don't tell the whole story**
4. **Document findings immediately while fresh in mind**
5. **Compare thresholds (try 0.4, 0.5, 0.6) before optimizing**
6. **If macro F1 < 0.70, don't proceed - optimize first**
7. **Save evaluation reports with version numbers for comparison**

---

## Next Steps

After evaluation:

- ✅ **If successful (Macro F1 ≥ 0.75)**: Document learnings, proceed to next category
- ⚠️ **If needs work (Macro F1 < 0.75)**: Review error analysis, optimize hyperparameters, retrain
- 📊 **Always**: Update training log with results and decisions

