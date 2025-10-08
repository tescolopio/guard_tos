# Dataset Expansion Plan
## Recommendations for Production-Grade Training Data

**Date**: October 7, 2025  
**Status**: Analysis & Recommendations

---

## Executive Summary

**Current State**: 2,476 total records across 7 categories  
**Recommendation**: Expand to **~4,500-5,000 total records**  
**Priority**: Focus on the 3 newly created categories with only 36-38 examples each

---

## Target Metrics

### Industry Benchmarks for Multilabel Text Classification

| Quality Tier | Examples/Label | Use Case |
|--------------|----------------|----------|
| **Minimum Viable** | 50-100 | Proof of concept, early testing |
| **Production Ready** | 200-300 | Initial production deployment |
| **High Performance** | 500+ | Mature product, robust performance |

### Transfer Learning Context (BERT/DistilBERT)

With pre-trained language models, we can achieve good results with:
- **Minimum**: 100-200 examples per label
- **Recommended**: 200-300 examples per label
- **Optimal**: 300-500 examples per label

---

## Current Dataset Analysis

### ✅ STRONG Categories (No immediate expansion needed)

#### Content Rights
- **Current**: 1,379 records  
- **Per Label**: ~345 examples/label  
- **Status**: EXCELLENT - Far exceeds production targets
- **Action**: None required; can sample down for faster training

#### Dispute Resolution  
- **Current**: 712 records  
- **Per Label**: ~178 examples/label  
- **Status**: GOOD - Meets production minimum
- **Action**: Optional expansion to 300/label for robustness

---

### ⚠️ MEDIUM Categories (Moderate expansion recommended)

#### Data Collection
- **Current**: 192 records across 6 labels  
- **Per Label**: ~32 examples/label  
- **Status**: BELOW minimum for production
- **Target**: 300-400 total records (50-67/label)
- **Gap**: +108-208 records needed
- **Strategy**: Mine more real ToS + expand synthetic templates

#### User Privacy
- **Current**: 81 records across 4 labels  
- **Per Label**: ~20 examples/label  
- **Status**: BELOW minimum for production
- **Target**: 200-300 total records (50-75/label)
- **Gap**: +119-219 records needed
- **Strategy**: Mine privacy policies + synthetic examples

---

### ❌ CRITICAL Categories (Urgent expansion needed)

#### Account Management
- **Current**: 36 records across 4 labels  
- **Distribution**: 
  - auto_renewal_friction: 20 (55.6%)
  - grace_period: 8 (22.2%)
  - easy_termination: 5 (13.9%)
  - manual_cancellation: 3 (8.3%)
- **Status**: INSUFFICIENT for production
- **Target**: 200-300 total records (50-75/label)
- **Gap**: +164-264 records needed
- **Priority**: HIGH

#### Terms Changes  
- **Current**: 38 records across 3 labels  
- **Distribution**:
  - advance_notice: 25 (65.8%)
  - unilateral_change: 7 (18.4%)
  - opt_out_provided: 6 (15.8%)
- **Status**: INSUFFICIENT for production
- **Target**: 200-300 total records (67-100/label)
- **Gap**: +162-262 records needed
- **Priority**: HIGH

#### Algorithmic Decisions
- **Current**: 38 records across 3 labels  
- **Distribution**:
  - automated_decision: 32 (84.2%)
  - human_review: 9 (23.7%)
  - transparency_statement: 8 (21.1%)
- **Status**: INSUFFICIENT for production
- **Target**: 200-300 total records (67-100/label)
- **Gap**: +162-262 records needed  
- **Priority**: HIGH
- **Challenge**: Rare in consumer ToS; may need to mine EU GDPR compliance docs

---

## Recommended Expansion Strategy

### Phase 1: Critical Categories (Weeks 1-2)
**Goal**: Bring all categories to minimum viable production level (50+ examples/label)

1. **Account Management** → 200 records
   - Mine subscription service ToS (SaaS, streaming, e-commerce)
   - Target platforms: Netflix, Spotify, Adobe, AWS, Azure
   - Focus on: auto-renewal clauses, cancellation policies

2. **Terms Changes** → 200 records  
   - Mine platform ToS with version history
   - Look for "modifications" and "amendments" sections
   - Expand synthetic templates for unilateral_change and opt_out

3. **Algorithmic Decisions** → 200 records
   - Mine EU-based platforms (GDPR compliance)
   - Target: social media, content platforms with recommendation systems
   - Sources: Meta, TikTok, YouTube, Twitter/X, LinkedIn

### Phase 2: Medium Categories (Weeks 3-4)
**Goal**: Strengthen borderline categories to production standards

4. **Data Collection** → 350 records
   - Mine analytics and advertising platforms
   - Target: Google, Meta, ad networks, analytics services

5. **User Privacy** → 250 records
   - Mine privacy policies specifically (not ToS)
   - Focus on CCPA/GDPR compliant documents

### Phase 3: High Categories (Week 5+)
**Goal**: Optional strengthening for robustness

6. **Dispute Resolution** → 1,000 records (optional)
   - Already strong; can downsample or leave as-is
   
7. **Content Rights** → 1,500 records (optional)
   - Already excellent; consider strategic sampling

---

## Data Collection Methods

### 1. Corpus Mining (Primary)
- **Target Sources**:
  - Hugging Face datasets: `terms-of-service`, `privacy-policies`
  - Common Crawl filtered for "Terms of Service" pages
  - ToS;DR database (https://tosdr.org)
  - Archive.org historical ToS snapshots

- **Platforms to Prioritize**:
  - **Account Management**: Subscription services (Netflix, Spotify, Adobe Creative Cloud, Microsoft 365)
  - **Terms Changes**: Platforms with frequent updates (Facebook, Twitter, Instagram)
  - **Algorithmic Decisions**: AI-powered platforms (TikTok, YouTube, LinkedIn, ChatGPT)

### 2. Synthetic Expansion (Secondary)
- **Current Templates**: 10-15 per label
- **Expansion Goal**: 30-50 templates per label
- **Techniques**:
  - Paraphrasing with LLMs (GPT-4, Claude)
  - Template variation (active/passive voice, formal/informal tone)
  - Cross-pollination from real examples

### 3. Active Learning (Advanced)
- Train initial models on current data
- Use models to score unlabeled corpus
- Manually annotate high-uncertainty examples
- Iteratively retrain

---

## Resource Estimates

### Time Investment

| Task | Records | Hours | Method |
|------|---------|-------|---------|
| Mine & label Account Management | 164 | 8-12 | Corpus + synthetic |
| Mine & label Terms Changes | 162 | 8-12 | Corpus + synthetic |
| Mine & label Algorithmic Decisions | 162 | 10-15 | Corpus mining (harder) |
| Expand Data Collection | 108 | 5-8 | Synthetic + corpus |
| Expand User Privacy | 119 | 6-10 | Privacy policy mining |
| **TOTAL** | **715** | **37-57** | ~1.5 weeks full-time |

### Automation Opportunities

1. **LLM-Assisted Annotation**: Use GPT-4/Claude to pre-label, human verify
2. **Weak Supervision**: Expand YAML patterns to auto-label more corpus
3. **Data Augmentation**: Paraphrase existing examples with LLMs
4. **Semi-Supervised**: Train initial models, use for pseudo-labeling

---

## Recommended Targets (By Category)

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Content Rights | 1,379 | 1,500 | Low (already strong) |
| Dispute Resolution | 712 | 800 | Low (already good) |
| Data Collection | 192 | 350 | Medium |
| User Privacy | 81 | 250 | Medium |
| **Account Management** | **36** | **200** | **HIGH** |
| **Terms Changes** | **38** | **200** | **HIGH** |
| **Algorithmic Decisions** | **38** | **200** | **HIGH** |
| **TOTAL** | **2,476** | **~3,500** | Mixed |

---

## Decision Framework

### Option A: Minimum Viable (Conservative)
- **Target**: 50 examples/label for all categories
- **Total Expansion**: +500 records
- **Time**: 1 week
- **Risk**: May underperform on rare classes
- **Use Case**: Rapid MVP, proof of concept

### Option B: Production Ready (Recommended) ⭐
- **Target**: 200-300 total records per category
- **Total Expansion**: +700-900 records  
- **Time**: 1.5-2 weeks
- **Risk**: Low; industry standard
- **Use Case**: Production deployment with confidence

### Option C: High Performance (Ambitious)
- **Target**: 500+ records per category
- **Total Expansion**: +2,000 records
- **Time**: 4-6 weeks
- **Risk**: Diminishing returns; may overfit
- **Use Case**: Mature product, competitive differentiation

---

## Next Steps

### Immediate Actions
1. ✅ **Approved**: Proceed with Phase 1 expansion (critical categories)
2. Mine Account Management examples from subscription platforms
3. Expand synthetic templates for Terms Changes
4. Source EU platform ToS for Algorithmic Decisions

### Long-term
1. Implement active learning pipeline
2. Set up annotation interface (Label Studio or Prodigy)
3. Recruit domain expert for quality validation
4. Establish inter-annotator agreement benchmarks

---

## Recommendation

**I recommend Option B: Production Ready**

Focus on bringing the 3 critical categories (Account Management, Terms Changes, Algorithmic Decisions) to **200 records each** through a combination of:

1. **Corpus mining** (60-70% of new data)
2. **Synthetic expansion** (20-30% of new data)  
3. **LLM-assisted generation + human verification** (10-20%)

This will give you **~3,500 total records** - a solid foundation for production deployment with:
- Minimum 50-75 examples per label
- Good generalization across diverse ToS styles
- Robustness to rare but important clauses

**Estimated effort**: 1.5-2 weeks of focused data collection and annotation.

