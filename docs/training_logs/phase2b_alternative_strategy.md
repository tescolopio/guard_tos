# Phase 2b Alternative Strategy: Model Generalization Testing

**Date:** October 9, 2025  
**Context:** After Phase 2a success, testing model robustness

## Challenge: Limited Real-World ToS Datasets

### HuggingFace Search Results
- ❌ `nguha/legalbench` - Uses deprecated dataset script format
- ❌ `jonathanli/legal-advice-reddit` - Contains Reddit posts about legal issues, not ToS/policy text
- ❌ No datasets found for "privacy policy", "terms of service", "GDPR"

### Insight
Real-world ToS/privacy policy datasets are rare because:
1. Companies don't open-source their policies
2. Legal text is proprietary
3. ToS scraping raises copyright concerns
4. Most legal datasets focus on case law, not user agreements

---

## Alternative Approach: Synthetic Validation + Edge Case Testing

Instead of harvesting real-world examples (which aren't available), we'll validate generalization through:

### 1. Adversarial Testing
Generate edge cases that test model boundaries:
- Ambiguous phrases mixing transparency and decision language
- Complex multi-clause sentences
- Domain-specific terminology (GDPR, CCPA, FCRA)
- Negative examples with subtle differences

### 2. Cross-Domain Validation
Test on different industries:
- Social media platforms
- Financial services
- Healthcare
- E-commerce
- SaaS products

### 3. Paraphrase Robustness
Test if model generalizes across:
- Formal vs. informal tone
- Active vs. passive voice
- Different sentence structures
- Varying levels of legalese

---

## Implementation Plan

### Phase 2b-Alt: Synthetic Validation Suite

#### Step 1: Generate Test Cases
Create 100 synthetic test cases across 4 categories:

**A. Adversarial Transparency Statements (25)**
- Mentions algorithms AND impacts, but humans decide
- Example: "Our AI system flags content for review, but all removal decisions are made by trained staff"

**B. Adversarial Automated Decisions (25)**
- Describes processing without explicit decision language
- Example: "The system applies account restrictions based on risk scores calculated by our models"

**C. Cross-Domain Examples (25)**
- Same concepts in different industry contexts
- Banking, healthcare, social media, retail

**D. Edge Cases (25)**
- Conditional decisions ("may", "could")
- Partial automation ("initially", "preliminary")
- Hybrid approaches

#### Step 2: Model Predictions
Run v2025.10.13 model on test suite and capture:
- Confidence scores
- Label predictions
- False positives/negatives

#### Step 3: Error Analysis
Identify patterns in:
- What breaks the model?
- Where is confidence low?
- Which phrasings are ambiguous?

#### Step 4: Targeted Refinement
If issues found:
- Generate hard examples for those patterns
- Retrain as v2025.10.14
- Re-evaluate

---

## Expected Outcomes

### Success Criteria
- ✅ Model maintains >0.90 precision on adversarial examples
- ✅ Confidence scores > 0.70 for clear cases
- ✅ Cross-domain generalization (finance, healthcare, etc.)
- ✅ Robust to paraphrasing and tone shifts

### If Model Struggles
- Identify specific linguistic patterns causing errors
- Generate targeted synthetic data
- Quick retrain cycle (1-2 hours)
- Document findings for future dataset expansion

---

## Advantages Over HF Harvesting

1. **Controlled Testing:** We design exact edge cases we want to test
2. **Fast Iteration:** No manual labeling required
3. **Domain Coverage:** Can test industries not in training data
4. **Reproducible:** Synthetic tests can be version-controlled
5. **Immediate Feedback:** No waiting for labeling sessions

---

## Next Steps

1. Create `generate_validation_suite.py` script
2. Generate 100 test cases across 4 categories
3. Run model evaluation on suite
4. Analyze results and document findings
5. If issues found, generate targeted training data

---

**Status:** Strategy pivot complete - proceeding with synthetic validation approach

**Rationale:** Since real-world ToS datasets don't exist on HuggingFace, synthetic validation provides faster, more controlled generalization testing while maintaining scientific rigor.
