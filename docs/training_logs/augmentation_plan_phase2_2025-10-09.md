# Data Augmentation Plan - Phase 2
**Date:** October 9, 2025  
**Focus:** Addressing `automated_decision` precision issues & expanding dataset diversity

## Executive Summary

Based on false positive analysis from run `v2025.10.12`, the `automated_decision` classifier is confusing **transparency statements about algorithms** with **actual automated decision-making clauses**. This phase combines:

1. **Targeted negative generation** to improve precision
2. **Harvesting from Hugging Face datasets** to increase diversity
3. **Focused manual review** of high-confidence false positives

---

## 1. False Positive Analysis (v2025.10.12)

### Key Patterns Identified

The model incorrectly flags the following as `automated_decision`:

| False Positive Text | Confidence | Issue |
|---------------------|------------|-------|
| "We explain how our algorithms process information: they analyze authenticity signals..." | 0.389 | Transparency statement, not a decision |
| "Our algorithmic models consider inputs like temporal patterns..." | 0.365 | Description of inputs, no user impact |
| "We aim to be transparent about how our algorithmic systems work" | 0.330 | Meta-statement about policy |
| "The automated system relies on criteria including account age..." | 0.347 | Mentions criteria but no decision outcome |

### Root Cause

The model over-weights keywords like:
- "algorithm", "automated", "system"
- "analyze", "process", "consider"

...without requiring evidence of:
- **User impact** (e.g., content removal, pricing changes, account suspension)
- **Decisional nature** (e.g., "determines", "decides", "results in")

### Success Criteria for Phase 2

- **Precision for `automated_decision`**: Increase from 0.375 → 0.60+
- **Recall for `automated_decision`**: Maintain ≥ 0.85
- **Reduction in false positives**: < 5 transparency statements misclassified per 100 examples

---

## 2. Data Augmentation Strategy

### 2.1 Hard Negative Generation (Synthetic)

Generate 150+ examples of **transparency statements** that mention algorithms but do NOT constitute automated decisions.

**Templates:**
```
- "We use [algorithm_type] to [analysis_action] but all final decisions require human review."
- "Our systems analyze [data_type] to provide recommendations, which you can ignore."
- "We are transparent about how [system] works: [description]."
- "Algorithms help us [neutral_action] (e.g., sort, categorize, suggest)."
```

**Negative Labels:**
- `automated_decision: 0`
- `transparency_statement: 1` (where appropriate)

**Script:** Enhance `scripts/generate_algorithmic_decisions_expanded.py` with new `generate_transparency_negatives()` function.

---

### 2.2 Positive Reinforcement (Synthetic)

Generate 100+ examples emphasizing **user impact** and **decisional language**.

**Templates:**
```
- "Our automated system [decisional_verb] whether to [user_impact_action]."
- "Algorithms determine [outcome] based on [criteria]. This decision is final unless appealed."
- "If our system detects [trigger], your [account/content/access] will be automatically [action]."
```

**Decisional Verbs:** determines, decides, evaluates and acts on, automatically enforces  
**User Impact Actions:** suspend your account, remove content, adjust pricing, restrict access

**Positive Labels:**
- `automated_decision: 1`

---

### 2.3 Harvest from Hugging Face Datasets

Based on the search, the following datasets are promising:

#### Primary Targets

1. **`nguha/legalbench`** (57.1K downloads)
   - **Why:** Large, English-language legal reasoning benchmark
   - **Subset:** Look for contract/policy classification tasks
   - **Action:** Download, filter for relevant text snippets, manually label 200-300 examples

2. **`jonathanli/legal-advice-reddit`** (447 downloads)
   - **Why:** Real-world discussions about legal policies, may contain references to ToS/Privacy policies
   - **Subset:** Filter for posts mentioning "automated decision", "algorithm", "privacy policy"
   - **Action:** Extract 100-150 relevant snippets, label them

3. **`huggingface-legal/takedown-notices`** (976 downloads)
   - **Why:** Legal documents with transparency statements and decision-making language
   - **Action:** Sample 50 relevant clauses

#### Harvesting Workflow

```bash
# 1. Download datasets
python scripts/data_sourcing/download_hf_dataset.py --dataset nguha/legalbench --output data/raw/hf_legalbench
python scripts/data_sourcing/download_hf_dataset.py --dataset jonathanli/legal-advice-reddit --output data/raw/hf_legal_reddit

# 2. Filter and extract relevant snippets
python scripts/data_sourcing/extract_algorithmic_snippets.py \
  --input data/raw/hf_legalbench \
  --output data/raw/hf_legalbench_filtered.jsonl \
  --keywords "automated,algorithm,decision,AI,machine learning,data collection"

# 3. Manual labeling session (Labelbox or internal tool)
# - Review 300 snippets
# - Label for: automated_decision, transparency_statement, human_review

# 4. Merge into training set
python scripts/augmentation/merge_harvested_data.py \
  --labeled data/raw/hf_legalbench_labeled.jsonl \
  --target data/processed/algorithmic_decisions/v2025.10.10/dataset.jsonl \
  --output data/processed/algorithmic_decisions/v2025.10.13/dataset.jsonl
```

---

### 2.4 Focused Manual Review

Sample 50 **high-confidence false positives** from existing evaluation runs and manually correct them.

**Source:** `reports/eval/fp_samples/algorithmic_decisions/v2025.10.12.json`

**Process:**
1. Review each FP
2. Determine correct label(s)
3. Add to training set with corrected labels
4. Document error patterns for future generation scripts

---

## 3. Implementation Plan

### Phase 2a: Synthetic Generation (Week 1)

- [ ] **Day 1**: Enhance `generate_algorithmic_decisions_expanded.py` with hard negatives
- [ ] **Day 2**: Generate 150 transparency negatives + 100 decision positives
- [ ] **Day 3**: Review samples, merge into `v2025.10.13` dataset
- [ ] **Day 4**: Quick model retrain and validation

**Deliverables:**
- `data/processed/algorithmic_decisions/v2025.10.13/dataset.jsonl` (augmented)
- `scripts/generate_algorithmic_decisions_phase2.py` (updated)

### Phase 2b: Hugging Face Harvest (Week 2)

- [ ] **Day 1**: Download `nguha/legalbench` and `jonathanli/legal-advice-reddit`
- [ ] **Day 2**: Build extraction script for relevant snippets
- [ ] **Day 3-4**: Manual labeling session (300 snippets)
- [ ] **Day 5**: Merge labeled data, retrain model

**Deliverables:**
- `data/raw/hf_legalbench_labeled.jsonl`
- `data/raw/hf_legal_reddit_labeled.jsonl`
- `data/processed/algorithmic_decisions/v2025.10.14/dataset.jsonl` (merged)
- `scripts/data_sourcing/download_hf_dataset.py` (new)
- `scripts/data_sourcing/extract_algorithmic_snippets.py` (new)

### Phase 2c: Validation & Iteration (Week 3)

- [ ] **Day 1**: Run full evaluation with `--fp-destination` for new model
- [ ] **Day 2**: Compare metrics with baseline (v2025.10.12)
- [ ] **Day 3**: If precision < 0.60, repeat with adjusted templates
- [ ] **Day 4**: Update dashboard, document results

**Deliverables:**
- `evaluation_reports/algorithmic_decisions_v2025.10.14/`
- `reports/eval/algorithmic_decisions_metrics.csv` (updated)
- `docs/training_logs/augmentation_results_phase2.md`

---

## 4. Dataset Expansion (Other Labels)

While focusing on `automated_decision`, we should also consider:

### 4.1 `data_collection_extensive`

**Issue:** Low precision (0.88) due to confusion with `data_collection_basic`

**Solution:**
- Harvest privacy policy snippets from `nguha/legalbench` mentioning "biometric", "location tracking", "behavioral analysis"
- Generate 100 negatives: "We collect your email and name" (basic, not extensive)

### 4.2 `purpose_broad`

**Issue:** Moderate precision (0.87)

**Solution:**
- Generate 50 positives with vague language: "for business purposes", "as we see fit", "to improve our services"
- Generate 50 negatives with specific purposes: "solely for account authentication", "exclusively for fraud prevention"

---

## 5. Resource Requirements

### Compute
- **Synthetic generation**: ~2 hours on local machine
- **HF dataset download**: ~1 hour (depends on dataset size)
- **Model retraining**: ~8 hours on GPU (unchanged)

### Human Effort
- **Manual labeling**: ~6 hours (300 snippets @ 1 min/snippet)
- **FP review**: ~1 hour (50 examples)
- **Script development**: ~4 hours

### Storage
- **New datasets**: ~500 MB (HF downloads)
- **Processed data**: ~50 MB additional per version

---

## 6. Success Metrics

| Metric | Baseline (v2025.10.12) | Target (v2025.10.14) | Stretch Goal |
|--------|------------------------|----------------------|--------------|
| `automated_decision` Precision | 0.375 | 0.60 | 0.70 |
| `automated_decision` Recall | 0.900 | 0.85+ | 0.90+ |
| `automated_decision` F1 | 0.529 | 0.70+ | 0.78+ |
| FP Rate (transparency statements) | ~33% | <15% | <10% |

---

## 7. Next Steps

1. **Immediate**: Update `generate_algorithmic_decisions_expanded.py` with hard negative templates
2. **Week 1**: Generate synthetic data and validate quick wins
3. **Week 2**: Harvest and label HF data
4. **Week 3**: Evaluate, iterate, and publish results to dashboard

---

## Appendix: Relevant Hugging Face Datasets

### Prioritized List

1. **`nguha/legalbench`** - 57.1K downloads, English legal reasoning tasks
2. **`jonathanli/legal-advice-reddit`** - 447 downloads, real-world legal discussions
3. **`huggingface-legal/takedown-notices`** - 976 downloads, legal transparency statements
4. **`isaacus/open-australian-legal-corpus`** - 605 downloads, legislative/judicial documents (English)

### Download Commands

```bash
# Using Hugging Face CLI
huggingface-cli download nguha/legalbench --repo-type dataset --local-dir data/raw/hf_legalbench
huggingface-cli download jonathanli/legal-advice-reddit --repo-type dataset --local-dir data/raw/hf_legal_reddit
huggingface-cli download huggingface-legal/takedown-notices --repo-type dataset --local-dir data/raw/hf_takedown
```

---

**Plan Author:** GitHub Copilot  
**Reviewed By:** [Pending]  
**Status:** Draft - Awaiting approval for Phase 2a kickoff
