# Data Collection - Training Log

**Category**: Data Collection  
**Dataset**: data/processed/data_collection/v2025.10.07e/gold_seed.jsonl  
**Started**: 2025-10-07  
**Status**: 🔄 In Progress

---

## Dataset Overview

- **Records**: ___
- **Gold Seeds**: ___
- **Labels**: ___
- **Balance**: ___

---

## Training Iterations

### Baseline (v1) - 2025-10-07

**Hyperparameters**:
```
base_model: distilbert-base-uncased
epochs: 5
batch_size: 16
learning_rate: 5e-5
weight_decay: 0.01
eval_split: 0.15
```

**Results**:
- Macro F1: ___ (target: >0.75)
- Train F1: ___
- Eval F1: ___
- Training time: ___ minutes

**Per-Label Performance**:
| Label | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| ___ | ___ | ___ | ___ | ___ |

**Issues Identified**:
- [ ] Issue 1: ___
- [ ] Issue 2: ___

**Decision**: ___

---

### Iteration 2 (v2) - Date

**Changes from v1**:
- Change 1: ___
- Change 2: ___

**Results**:
- Macro F1: ___
- Train F1: ___
- Eval F1: ___

**Per-Label Performance**:
| Label | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| ___ | ___ | ___ | ___ | ___ |

**Issues Identified**:
- [ ] Issue 1: ___

**Decision**: ___

---

### Iteration 3 (v3) - Date

_(Add more iterations as needed)_

---

## Final Model

**Version**: v___  
**Status**: ✅ Production Ready / ⚠️ Needs Improvement / ❌ Failed

**Final Metrics**:
- Macro F1: ___
- All labels F1 >0.70: ☐ Yes ☐ No
- Passes manual validation: ☐ Yes ☐ No
- Model size: ___ MB

**Model Location**: `artifacts/models/data_collection/___/`

---

## Key Learnings

### What Worked:
1. ___
2. ___
3. ___

### What Didn't Work:
1. ___
2. ___

### Surprises:
1. ___
2. ___

---

## Recommendations for Next Category

**Hyperparameters to use**:
```
epochs: ___
learning_rate: ___
weight_decay: ___
batch_size: ___
```

**Things to watch for**:
1. ___
2. ___

**Changes to make**:
1. ___
2. ___

---

## Manual Test Results

### Test Sample 1
**Text**: ___  
**Expected**: ___  
**Predicted**: ___  
**Result**: ✅ / ❌

### Test Sample 2
**Text**: ___  
**Expected**: ___  
**Predicted**: ___  
**Result**: ✅ / ❌

_(Add more test samples as needed)_

---

## Next Steps

- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

---

**Last Updated**: 2025-10-07  
**Completed**: ☐ Yes ☐ No
