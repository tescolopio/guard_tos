# Model Training Guide

**Date**: October 7, 2025  
**Status**: Ready to train - All 7 substantive categories prepared

---

## Overview

This guide walks through training multilabel text classifiers for all 7 substantive URI categories using the expanded datasets from Phase 1 & 2 expansion.

**Total Training Data**: 3,293 labeled examples across 28 labels

---

## Prerequisites

### 1. Python Environment

```bash
# Create/activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r scripts/requirements.txt
```

### 2. Hardware Requirements

**Minimum (CPU)**:
- 8GB RAM
- Training time: ~30-60 minutes per category
- Total: ~4-6 hours for all 7 categories

**Recommended (GPU)**:
- 8GB+ VRAM (NVIDIA GPU)
- Training time: ~5-10 minutes per category
- Total: ~45-70 minutes for all 7 categories

### 3. Verify Datasets

```bash
python scripts/ml/check_training_readiness.py
```

Expected output: ✅ ALL DATASETS READY FOR TRAINING!

---

## Training Pipeline

### Option A: Train All Categories (Recommended)

```bash
# Train all 7 categories sequentially
bash scripts/ml/train_all_categories.sh
```

**What this does**:
1. Trains all 7 substantive categories in order (largest → smallest)
2. Saves models to `artifacts/models/{category}/{version}/`
3. Generates metrics.json with precision/recall/F1 scores
4. Creates category_config.json with training parameters

**Estimated time**: 
- CPU: 4-6 hours
- GPU: 45-70 minutes

---

### Option B: Train Individual Categories

For more control or to train specific categories:

```bash
# Example: Train Data Collection
python scripts/ml/train_category_model.py \
  --category data_collection \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/data_collection/v2025.10.07e \
  --epochs 5 \
  --batch-size 16
```

**Available categories**:
- `content_rights` (1,379 records, 4 labels)
- `dispute_resolution` (712 records, 4 labels)
- `data_collection` (291 gold seeds, 6 labels)
- `user_privacy` (190 gold seeds, 4 labels)
- `account_management` (200 gold seeds, 4 labels)
- `terms_changes` (150 gold seeds, 3 labels)
- `algorithmic_decisions` (150 gold seeds, 3 labels)

---

## Training Configuration

### Hyperparameters

**Base Model**: `distilbert-base-uncased`
- Lightweight BERT variant (66M parameters)
- Fast inference, good for browser deployment
- Alternatives: `bert-base-uncased`, `roberta-base`

**Training Settings**:
```python
epochs = 3-5  # 3 for large datasets (700+), 5 for smaller (200-300)
batch_size = 16  # Reduce to 8 if OOM on GPU
learning_rate = 5e-5  # Standard for BERT fine-tuning
weight_decay = 0.01  # L2 regularization
warmup_ratio = 0.1  # 10% warmup steps
eval_split = 0.15  # 15% held-out for validation
```

**Problem Type**: `multi_label_classification`
- Each example can have multiple labels
- Uses sigmoid activation (not softmax)
- Binary cross-entropy loss per label

---

## Model Outputs

For each trained category, the following artifacts are saved:

```
artifacts/models/{category}/{version}/
├── pytorch_model.bin          # Model weights
├── config.json                # Model architecture config
├── tokenizer_config.json      # Tokenizer settings
├── vocab.txt                  # Vocabulary
├── metrics.json               # Performance metrics
├── category_config.json       # Training parameters
└── checkpoint-{N}/            # Best checkpoint
```

### Metrics Explained

**metrics.json** contains:
```json
{
  "label_name": {
    "precision": 0.85,  // TP / (TP + FP)
    "recall": 0.82,     // TP / (TP + FN)
    "f1-score": 0.83,   // Harmonic mean of P & R
    "support": 45       // Number of examples with this label
  },
  "micro avg": { ... },  // Aggregate across all labels
  "macro avg": { ... },  // Average per-label metrics
  "weighted avg": { ... } // Weighted by support
}
```

**Target Performance**:
- F1 > 0.75: Good for production
- F1 > 0.85: Excellent
- F1 < 0.70: May need more data or tuning

---

## Dataset Summary

| Category | Records | Gold Seeds | Labels | Balance | Status |
|----------|---------|------------|--------|---------|--------|
| Content Rights | 1,379 | 91 | 4 | Skewed (license_assignment dominant) | ✅ Ready |
| Dispute Resolution | 712 | 148 | 4 | Skewed (binding_arbitration dominant) | ✅ Ready |
| Data Collection | 364 | 291 | 6 | Balanced (192-245 per label) | ✅ Ready |
| User Privacy | 238 | 190 | 4 | Balanced (92-137 per label) | ✅ Ready |
| Account Management | 200 | 200 | 4 | Perfect balance (50 per label) | ✅ Ready |
| Terms Changes | 200 | 150 | 3 | Perfect balance (50 per label) | ✅ Ready |
| Algorithmic Decisions | 200 | 150 | 3 | Perfect balance (50 per label) | ✅ Ready |

**Notes**:
- **Content Rights & Dispute Resolution**: Naturally skewed (reflects real-world ToS)
- **Other 5 categories**: Synthetically balanced for better training
- **Gold Seeds**: Used for training (80% sample from full datasets)

---

## Validation & Testing

### 1. Automatic Validation

The training script automatically evaluates on 15% held-out data:

```bash
# Metrics saved to: artifacts/models/{category}/{version}/metrics.json
cat artifacts/models/data_collection/v2025.10.07e/metrics.json | jq .
```

### 2. Manual Testing

Test on real ToS documents not in training data:

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

# Load trained model
model_path = "artifacts/models/data_collection/v2025.10.07e"
model = AutoModelForSequenceClassification.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)

# Test clause
test_text = "We collect your email address and browsing history for marketing purposes."

# Predict
inputs = tokenizer(test_text, return_tensors="pt", truncation=True, max_length=512)
with torch.no_grad():
    outputs = model(**inputs)
    probs = torch.sigmoid(outputs.logits)[0]

# Get predictions (threshold = 0.5)
labels = ["data_collection_extensive", "consent_implied", "purpose_broad", ...]
predictions = {label: prob.item() for label, prob in zip(labels, probs) if prob > 0.5}
print(predictions)
```

### 3. Cross-Category Testing

Test that models don't confuse categories:

```bash
# Create test script: scripts/ml/test_cross_category.py
python scripts/ml/test_cross_category.py --sample-size 50
```

---

## Troubleshooting

### CUDA Out of Memory

```bash
# Reduce batch size
--batch-size 8  # or even 4

# Or train on CPU (slower)
export CUDA_VISIBLE_DEVICES=""
```

### Poor Performance (F1 < 0.70)

**Possible causes**:
1. **Insufficient data**: Categories with <200 examples may struggle
2. **Label imbalance**: Some labels have very few examples
3. **Noisy labels**: Synthetic data may have quality issues
4. **Wrong hyperparameters**: Try more epochs or different learning rate

**Solutions**:
- Increase epochs (5 → 8)
- Add more training data (corpus mining)
- Use class weights for imbalanced labels
- Try different base model (roberta-base)

### Model Overfitting

**Symptoms**: High train F1, low eval F1

**Solutions**:
- Increase weight_decay (0.01 → 0.05)
- Add dropout (modify model config)
- Reduce epochs
- Get more diverse training data

---

## Next Steps After Training

### 1. Model Evaluation
- Review metrics.json for all categories
- Identify low-performing labels
- Test on real-world ToS samples

### 2. Clarity & Transparency Implementation
- Use trained models to detect transparency_statement
- Combine with readability scores
- Implement composite metric

### 3. Model Deployment
Choose deployment strategy:
- **WebAssembly**: Convert to ONNX, use onnxruntime-web
- **Cloud API**: Deploy to HuggingFace Inference or custom server
- **Hybrid**: TF-IDF for browser, BERT for API

### 4. Extension Integration
- Load models in extension background service
- Implement inference pipeline
- Add UI for model predictions

---

## Estimated Training Timeline

**Sequential Training (CPU)**:
1. Content Rights: ~60 min (1,379 records)
2. Dispute Resolution: ~45 min (712 records)
3. Data Collection: ~30 min (291 seeds)
4. User Privacy: ~25 min (190 seeds)
5. Account Management: ~25 min (200 seeds)
6. Terms Changes: ~20 min (150 seeds)
7. Algorithmic Decisions: ~20 min (150 seeds)

**Total**: ~4-5 hours (CPU) or ~45-70 minutes (GPU)

---

## Resources

- **Training Script**: `scripts/ml/train_category_model.py`
- **Batch Training**: `scripts/ml/train_all_categories.sh`
- **Readiness Check**: `scripts/ml/check_training_readiness.py`
- **Category Config**: `scripts/ml/category_config.py`
- **Requirements**: `scripts/requirements.txt`

---

**Last Updated**: October 7, 2025  
**Status**: ✅ Ready to Train - All Datasets Validated
