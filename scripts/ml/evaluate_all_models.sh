#!/bin/bash
# Batch evaluation script for all trained models
# Run after all training completes

echo "========================================="
echo "Evaluating All Trained Models"
echo "========================================="
echo ""

# Category 1: Data Collection (already evaluated)
echo "✅ Data Collection - Already evaluated"
echo "   Report: evaluation_reports/data_collection_v2025.10.10a_threshold_0.26/"
echo ""

# Category 2: User Privacy (already evaluated)
echo "✅ User Privacy - Already evaluated"
echo "   Report: evaluation_reports/user_privacy_v1/"
echo ""

# Category 3: Account Management
echo "📊 Evaluating Account Management..."
python scripts/ml/evaluate_model.py \
  --model artifacts/models/account_management/v2025.10.07h-v1 \
  --dataset data/processed/account_management/v2025.10.07h/gold_seed.jsonl \
  --category account_management \
  --threshold 0.3 \
  --output-dir evaluation_reports/account_management_v1

echo ""
echo "=== Account Management Complete ===" echo ""

# Category 4: Terms Changes
echo "📊 Evaluating Terms Changes..."
python scripts/ml/evaluate_model.py \
  --model artifacts/models/terms_changes/v2025.10.07e-v1 \
  --dataset data/processed/terms_changes/v2025.10.07e/gold_seed.jsonl \
  --category terms_changes \
  --threshold 0.3 \
  --output-dir evaluation_reports/terms_changes_v1

echo ""
echo "=== Terms Changes Complete ==="
echo ""

# Category 5: Algorithmic Decisions
echo "📊 Evaluating Algorithmic Decisions..."
python scripts/ml/evaluate_model.py \
  --model artifacts/models/algorithmic_decisions/v2025.10.07b-v1 \
  --dataset data/processed/algorithmic_decisions/v2025.10.07b/gold_seed.jsonl \
  --category algorithmic_decisions \
  --threshold 0.3 \
  --output-dir evaluation_reports/algorithmic_decisions_v1

echo ""
echo "=== Algorithmic Decisions Complete ==="
echo ""

echo "========================================="
echo "✅ All Evaluations Complete!"
echo "========================================="
echo ""
echo "Summary of reports:"
echo "  - evaluation_reports/data_collection_v2025.10.10a_threshold_0.26/"
echo "  - evaluation_reports/user_privacy_v1/"
echo "  - evaluation_reports/account_management_v1/"
echo "  - evaluation_reports/terms_changes_v1/"
echo "  - evaluation_reports/algorithmic_decisions_v1/"
echo ""
