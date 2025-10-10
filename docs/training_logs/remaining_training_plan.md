# Remaining Training Plan - Categories 2-7

**Date**: October 7, 2025  
**Status**: Category 2 (User Privacy) in progress

---

## Training Queue

### ✅ Phase 1: Complete
1. **Data Collection** - ✅ DONE (Macro F1 = 0.729 @ threshold 0.3)

### 🔄 Phase 2: In Progress  
2. **User Privacy** - 🔄 TRAINING (190 records, 4 labels)

### ⏳ Phase 3-7: Pending
3. **Account Management** (200 records, 4 labels) - v2025.10.07h
4. **Terms Changes** (150 records, 3 labels) - v2025.10.07e
5. **Algorithmic Decisions** (150 records, 3 labels) - v2025.10.07b
6. **Dispute Resolution** - ❌ NO DATASET YET
7. **Content Rights** - ❌ NO DATASET YET

---

## Dataset Status

| Category | Version | Records | Labels | Status |
|----------|---------|---------|--------|--------|
| data_collection | v2025.10.07e | 291 | 6 | ✅ Trained |
| user_privacy | v2025.10.07c | 190 | 4 | 🔄 Training |
| account_management | v2025.10.07h | 200 | 4 | ⏳ Ready |
| terms_changes | v2025.10.07e | 150 | 3 | ⏳ Ready |
| algorithmic_decisions | v2025.10.07b | 150 | 3 | ⏳ Ready |
| dispute_resolution | N/A | ? | 4 | ❌ Missing |
| content_rights | N/A | ? | 4 | ❌ Missing |

---

## Missing Datasets Alert ⚠️

**Issue**: Dispute Resolution and Content Rights datasets not found in `data/processed/`

**Options**:
1. Check if they exist under different version names
2. Check if they're in raw/gold directories
3. May need to run dataset expansion for these categories
4. Could be named differently (check category_config.py)

**Next Step**: After User Privacy training, investigate missing datasets before proceeding.

---

## Training Commands (Ready to Use)

### Account Management
```bash
python scripts/ml/train_category_model.py \
  --category account_management \
  --dataset data/processed/account_management/v2025.10.07h/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/account_management/v2025.10.07h-v1 \
  --epochs 5 --batch-size 16 --learning-rate 5e-5 \
  --weight-decay 0.01 --eval-split 0.15 --seed 42
```

### Terms Changes
```bash
python scripts/ml/train_category_model.py \
  --category terms_changes \
  --dataset data/processed/terms_changes/v2025.10.07e/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/terms_changes/v2025.10.07e-v1 \
  --epochs 5 --batch-size 16 --learning-rate 5e-5 \
  --weight-decay 0.01 --eval-split 0.15 --seed 42
```

### Algorithmic Decisions
```bash
python scripts/ml/train_category_model.py \
  --category algorithmic_decisions \
  --dataset data/processed/algorithmic_decisions/v2025.10.07b/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/algorithmic_decisions/v2025.10.07b-v1 \
  --epochs 5 --batch-size 16 --learning-rate 5e-5 \
  --weight-decay 0.01 --eval-split 0.15 --seed 42
```

---

## Evaluation Commands (Threshold 0.3)

### User Privacy
```bash
python scripts/ml/evaluate_model.py \
  --model artifacts/models/user_privacy/v2025.10.07c-v1 \
  --dataset data/processed/user_privacy/v2025.10.07c/gold_seed.jsonl \
  --category user_privacy \
  --threshold 0.3 \
  --output-dir evaluation_reports/user_privacy_v1
```

### Account Management
```bash
python scripts/ml/evaluate_model.py \
  --model artifacts/models/account_management/v2025.10.07h-v1 \
  --dataset data/processed/account_management/v2025.10.07h/gold_seed.jsonl \
  --category account_management \
  --threshold 0.3 \
  --output-dir evaluation_reports/account_management_v1
```

### Terms Changes
```bash
python scripts/ml/evaluate_model.py \
  --model artifacts/models/terms_changes/v2025.10.07e-v1 \
  --dataset data/processed/terms_changes/v2025.10.07e/gold_seed.jsonl \
  --category terms_changes \
  --threshold 0.3 \
  --output-dir evaluation_reports/terms_changes_v1
```

### Algorithmic Decisions
```bash
python scripts/ml/evaluate_model.py \
  --model artifacts/models/algorithmic_decisions/v2025.10.07b-v1 \
  --dataset data/processed/algorithmic_decisions/v2025.10.07b/gold_seed.jsonl \
  --category algorithmic_decisions \
  --threshold 0.3 \
  --output-dir evaluation_reports/algorithmic_decisions_v1
```

---

## Time Estimates

Based on Data Collection experience:

| Category | Train Time | Eval Time | Total |
|----------|------------|-----------|-------|
| User Privacy (190 records) | ~3 min | ~30 sec | ~3.5 min |
| Account Management (200) | ~3 min | ~30 sec | ~3.5 min |
| Terms Changes (150) | ~2.5 min | ~30 sec | ~3 min |
| Algorithmic Decisions (150) | ~2.5 min | ~30 sec | ~3 min |
| **Subtotal (3 remaining)** | | | **~10 min** |

**Note**: Dispute Resolution and Content Rights times unknown (datasets missing)

---

## Success Criteria (Reminder)

For each model:
- ✅ **Minimum Acceptable**: Macro F1 ≥ 0.65 @ threshold 0.3
- ✅ **Production Ready**: Macro F1 ≥ 0.75 @ threshold 0.3
- ✅ **Per-Label**: At least 50% of labels with F1 ≥ 0.70

If not met:
1. Try threshold tuning (0.25, 0.35, 0.4)
2. If still poor, retrain with more epochs (8-10)
3. Document findings and move on (can optimize later)

---

## Next Steps

1. ⏳ Wait for User Privacy training to complete (~3 min)
2. ✅ Evaluate User Privacy with threshold 0.3
3. 📊 Document results
4. 🔍 **Investigate missing datasets** (Dispute Resolution, Content Rights)
5. 🚀 Train remaining ready categories (Account Management, Terms Changes, Algorithmic Decisions)

