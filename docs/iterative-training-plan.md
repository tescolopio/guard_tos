# Iterative Training Plan - One Category at a Time

**Date**: October 7, 2025  
**Strategy**: Train → Evaluate → Optimize → Repeat

---

## Philosophy

Instead of batch training all 7 categories, we'll train them **one at a time** to:
- Identify optimal hyperparameters early
- Catch data quality issues before scaling
- Establish baseline performance benchmarks
- Refine our evaluation methodology
- Build institutional knowledge about what works

---

## Training Order & Rationale

### Phase 1: Pilot (Learn & Optimize)

#### 1. **Data Collection** (First to train)
**Why start here?**
- Medium size (291 gold seeds, 6 labels)
- Balanced label distribution (50-56 per label)
- High-quality mix (corpus + synthetic)
- Most complex (6 labels vs. 3-4 in others)
- If we can train this well, others will be easier

**Expected challenges**:
- More labels = harder multilabel problem
- Need to tune threshold per label
- Will test our evaluation methodology

**What we'll learn**:
- Optimal epochs for synthetic data
- Best threshold settings (default 0.5 may not work)
- How to handle 6-way multilabel classification
- GPU memory requirements

---

### Phase 2: Refinement (Apply Learnings)

#### 2. **User Privacy** (Second to train)
**Why next?**
- Similar size (190 seeds, 4 labels)
- Also balanced (46-55 per label)
- Similar synthetic/corpus mix
- Fewer labels = test if simpler is better

**Apply learnings from Data Collection**:
- Use optimized hyperparameters
- Apply refined evaluation metrics
- Test if 4 labels trains better than 6

---

#### 3. **Account Management** (Third)
**Why here?**
- Perfect balance (50 per label, 4 labels)
- 100% synthetic data
- Test: Do pure-synthetic models work well?

**Key questions**:
- Do synthetic-only models generalize to real ToS?
- Is perfect balance actually better?
- Should we add corpus data?

---

#### 4. **Terms Changes** (Fourth)
**Why here?**
- Same size as Account Mgmt (150 seeds)
- Only 3 labels (simplest so far)
- Also 100% synthetic

**Key questions**:
- Does 3-label problem train faster/better?
- Can we reduce epochs for smaller problems?

---

#### 5. **Algorithmic Decisions** (Fifth)
**Why here?**
- Same profile as Terms Changes (150 seeds, 3 labels)
- Validate findings from Terms Changes
- Last of the small categories

---

### Phase 3: Scale (Big Datasets)

#### 6. **Dispute Resolution** (Second to last)
**Why here?**
- Large dataset (712 records, 4 labels)
- Real corpus data (not synthetic)
- Heavily imbalanced (binding_arbitration dominates)

**Apply all learnings**:
- Use optimized hyperparameters from small categories
- Test class weights for imbalance
- May need fewer epochs (more data = faster convergence)

---

#### 7. **Content Rights** (Last)
**Why save for last?**
- Largest dataset (1,379 records, 4 labels)
- Real corpus data
- Heavily imbalanced (license_assignment 94% of dataset)

**Final test**:
- Will extreme imbalance hurt performance?
- Do we need class weights?
- Can we reduce epochs due to large dataset?

---

## Training Workflow (Per Category)

### Step 1: Pre-Training (5-10 min)

```bash
# Review dataset
python scripts/ml/inspect_dataset.py --category data_collection

# Check for issues
python scripts/ml/check_training_readiness.py
```

**Look for**:
- Label distribution issues
- Text quality problems
- Outliers (very long/short examples)

---

### Step 2: Initial Training (30-60 min)

```bash
# Train with baseline hyperparameters
python scripts/ml/train_category_model.py \
  --category data_collection \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/data_collection/v2025.10.07e-baseline \
  --epochs 5 \
  --batch-size 16 \
  --learning-rate 5e-5
```

**Monitor during training**:
- Loss should decrease steadily
- Eval metrics should improve each epoch
- No huge jumps (indicates instability)

---

### Step 3: Evaluation (10-15 min)

```bash
# Review metrics
cat artifacts/models/data_collection/v2025.10.07e-baseline/metrics.json | jq

# Test on real-world samples
python scripts/ml/test_model_manual.py \
  --model artifacts/models/data_collection/v2025.10.07e-baseline \
  --test-file test-pages/sample_tos.md

# Generate confusion matrix
python scripts/ml/analyze_predictions.py \
  --model artifacts/models/data_collection/v2025.10.07e-baseline
```

**Key metrics to check**:
- **Per-label F1 scores**: Should be >0.70 for each label
- **Macro-average F1**: Should be >0.75
- **Confusion patterns**: Which labels get confused?
- **False positive rate**: Are we over-predicting?

---

### Step 4: Analysis & Optimization (15-30 min)

**Questions to answer**:

1. **Are F1 scores acceptable?**
   - ✅ All labels >0.70: Proceed to next category
   - ⚠️ Some <0.70: Investigate why
   - ❌ Most <0.60: Need major changes

2. **Is the model over/underfitting?**
   - Train F1 >> Eval F1: Overfitting (reduce epochs, add regularization)
   - Train F1 ≈ Eval F1: Good fit
   - Train F1 < 0.80: Underfitting (more epochs, different model)

3. **Are thresholds optimal?**
   - Default 0.5 may not be best
   - Try threshold sweep (0.3, 0.4, 0.5, 0.6, 0.7)
   - Pick threshold that maximizes F1

4. **Which labels are problematic?**
   - Look at per-label precision/recall
   - Low precision: Model over-predicting (raise threshold)
   - Low recall: Model under-predicting (lower threshold, more training)

---

### Step 5: Refinement (30-60 min per iteration)

Based on analysis, try one experiment at a time:

**Experiment A: Adjust Epochs**
```bash
# If overfitting: reduce epochs
--epochs 3

# If underfitting: increase epochs
--epochs 8
```

**Experiment B: Adjust Learning Rate**
```bash
# If training unstable: lower LR
--learning-rate 2e-5

# If converging too slowly: raise LR
--learning-rate 1e-4
```

**Experiment C: Different Base Model**
```bash
# Try RoBERTa (often better for small datasets)
--base-model roberta-base

# Or full BERT
--base-model bert-base-uncased
```

**Experiment D: Adjust Thresholds**
```bash
# After training, find optimal thresholds
python scripts/ml/optimize_thresholds.py \
  --model artifacts/models/data_collection/v2025.10.07e-baseline \
  --metric f1
```

---

### Step 6: Document Findings (5-10 min)

Create a training log for this category:

```markdown
## Data Collection Training Log

### Baseline (v1)
- Hyperparameters: epochs=5, lr=5e-5, batch=16
- Results: macro F1 = 0.78
- Issues: purpose_specific (F1=0.65) underperforming
- Decision: Try 8 epochs

### Iteration 2 (v2)
- Changes: epochs=8
- Results: macro F1 = 0.82
- Issues: Overfitting (train=0.95, eval=0.82)
- Decision: Try 6 epochs with higher weight_decay

### Final (v3)
- Changes: epochs=6, weight_decay=0.03
- Results: macro F1 = 0.84 ✅
- All labels >0.75
- Ready for production

### Learnings for Next Category:
- Synthetic data needs 6 epochs (not 5)
- weight_decay=0.03 prevents overfitting
- Default threshold 0.5 works well
```

---

### Step 7: Decision Point (5 min)

**Before moving to next category**:

✅ **Proceed if**:
- Macro F1 >0.75
- All labels F1 >0.70
- Model generalizes to real ToS samples
- No critical issues

⚠️ **Investigate if**:
- Some labels F1 <0.70
- High train/eval gap (>0.10)
- Poor performance on real samples

❌ **Stop and fix if**:
- Macro F1 <0.65
- Multiple labels F1 <0.60
- Model completely fails on real samples

---

## Recommended Starting Point

### **Category 1: Data Collection**

**Baseline Configuration**:
```bash
python scripts/ml/train_category_model.py \
  --category data_collection \
  --dataset data/processed/data_collection/v2025.10.07e/gold_seed.jsonl \
  --base-model distilbert-base-uncased \
  --output-dir artifacts/models/data_collection/v2025.10.07e-v1 \
  --epochs 5 \
  --batch-size 16 \
  --learning-rate 5e-5 \
  --weight-decay 0.01 \
  --eval-split 0.15 \
  --seed 42
```

**Why these settings?**
- `epochs=5`: Standard for fine-tuning (will adjust based on results)
- `batch-size=16`: Good balance speed/memory
- `learning-rate=5e-5`: BERT/DistilBERT standard
- `weight-decay=0.01`: Mild regularization
- `eval-split=0.15`: 85/15 train/val split
- `seed=42`: Reproducibility

**Expected Training Time**:
- CPU: ~30 minutes
- GPU (T4/V100): ~8 minutes

**Expected Performance**:
- Target: Macro F1 >0.75
- Stretch: Macro F1 >0.80
- All labels: F1 >0.70

---

## Success Criteria (Per Category)

### Minimum Acceptable:
- ✅ Macro-average F1 >0.75
- ✅ All labels F1 >0.70
- ✅ Passes manual validation on 10 real ToS samples

### Production Ready:
- ✅ Macro-average F1 >0.80
- ✅ All labels F1 >0.75
- ✅ <5% false positive rate on negative samples
- ✅ Model size <250MB for deployment

### Excellent:
- ✅ Macro-average F1 >0.85
- ✅ All labels F1 >0.80
- ✅ Generalizes to ToS from different industries

---

## Tools We'll Create (As Needed)

During iterative training, we'll build:

1. **Dataset Inspector**: Analyze label distributions, text lengths
2. **Manual Test Harness**: Quick testing on real ToS samples
3. **Threshold Optimizer**: Find best decision thresholds per label
4. **Prediction Analyzer**: Visualize confusion patterns
5. **Training Monitor**: Live training progress dashboard

---

## Timeline Estimate

**Per Category** (1-3 iterations):
- Baseline training: 30-60 min
- Evaluation: 15 min
- Analysis: 15 min
- Refinement: 30-60 min (per iteration)
- Documentation: 10 min

**Total per category**: 2-4 hours with 1-3 iterations

**All 7 categories**: 14-28 hours over 2-3 days

---

## What's Next?

Ready to start with **Data Collection**? I can:

1. **Start training now** (if environment ready)
2. **Create evaluation scripts first** (manual test harness, threshold optimizer)
3. **Create dataset inspector** (analyze before training)
4. **Something else?**

Let me know how you'd like to proceed! 🎯
