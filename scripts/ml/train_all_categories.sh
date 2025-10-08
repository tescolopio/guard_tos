#!/bin/bash
# Train all 7 substantive URI category models
# Run from project root: bash scripts/ml/train_all_categories.sh

set -e  # Exit on error

echo "=========================================="
echo "Training All URI Category Models"
echo "=========================================="
echo ""

# Configuration
BASE_MODEL="distilbert-base-uncased"
BATCH_SIZE=16
SEED=42

# Create artifacts directory
mkdir -p artifacts/models

# Function to train a single category
train_category() {
    local category=$1
    local dataset=$2
    local output=$3
    local epochs=$4
    
    echo "=========================================="
    echo "Training: $category"
    echo "Dataset: $dataset"
    echo "Output: $output"
    echo "Epochs: $epochs"
    echo "=========================================="
    
    python scripts/ml/train_category_model.py \
        --category "$category" \
        --dataset "$dataset" \
        --base-model "$BASE_MODEL" \
        --output-dir "$output" \
        --epochs "$epochs" \
        --batch-size "$BATCH_SIZE" \
        --seed "$SEED"
    
    echo "✓ Completed: $category"
    echo ""
}

# 1. Content Rights (1,379 records - Largest, train first)
train_category \
    "content_rights" \
    "data/processed/content_rights/v2025.10.08a/dataset.jsonl" \
    "artifacts/models/content_rights/v2025.10.08a" \
    3

# 2. Dispute Resolution (712 records - Second largest)
train_category \
    "dispute_resolution" \
    "data/processed/dispute_resolution/v2025.10.07/dataset.jsonl" \
    "artifacts/models/dispute_resolution/v2025.10.07" \
    3

# 3. Data Collection (364 records, 6 labels)
train_category \
    "data_collection" \
    "data/processed/data_collection/v2025.10.07e/gold_seed.jsonl" \
    "artifacts/models/data_collection/v2025.10.07e" \
    5

# 4. User Privacy (238 records, 4 labels)
train_category \
    "user_privacy" \
    "data/processed/user_privacy/v2025.10.07c/gold_seed.jsonl" \
    "artifacts/models/user_privacy/v2025.10.07c" \
    5

# 5. Account Management (200 records, 4 labels)
train_category \
    "account_management" \
    "data/processed/account_management/v2025.10.07h/gold_seed.jsonl" \
    "artifacts/models/account_management/v2025.10.07h" \
    5

# 6. Terms Changes (200 records, 3 labels)
train_category \
    "terms_changes" \
    "data/processed/terms_changes/v2025.10.07e/gold_seed.jsonl" \
    "artifacts/models/terms_changes/v2025.10.07e" \
    5

# 7. Algorithmic Decisions (200 records, 3 labels)
train_category \
    "algorithmic_decisions" \
    "data/processed/algorithmic_decisions/v2025.10.07b/gold_seed.jsonl" \
    "artifacts/models/algorithmic_decisions/v2025.10.07b" \
    5

echo "=========================================="
echo "✅ All Models Trained Successfully!"
echo "=========================================="
echo ""
echo "Model locations:"
echo "  - artifacts/models/content_rights/v2025.10.08a/"
echo "  - artifacts/models/dispute_resolution/v2025.10.07/"
echo "  - artifacts/models/data_collection/v2025.10.07e/"
echo "  - artifacts/models/user_privacy/v2025.10.07c/"
echo "  - artifacts/models/account_management/v2025.10.07h/"
echo "  - artifacts/models/terms_changes/v2025.10.07e/"
echo "  - artifacts/models/algorithmic_decisions/v2025.10.07b/"
echo ""
echo "Next steps:"
echo "  1. Review metrics in each model's metrics.json"
echo "  2. Validate models on held-out test data"
echo "  3. Implement Clarity & Transparency composite metric"
echo "  4. Deploy models to extension"
