# Algorithmic Decisions Dataset - v2025.10.13

## Overview
**Date:** October 9, 2025  
**Base Version:** v2025.10.08a  
**Total Examples:** 716 (+394 from baseline)

## Purpose
Phase 2a augmentation targeting **automated_decision** precision improvements. Addresses false positive pattern where model confuses transparency statements about algorithms with actual automated decision-making.

## Dataset Composition

| Source | Count | Description |
|--------|-------|-------------|
| Baseline (v2025.10.08a) | 322 | Original curated + harvested examples |
| Phase 2a Positives | 248 | Strong decisional language with user impact |
| Phase 2a Hard Negatives | 146 | Transparency statements mentioning algorithms |
| **Total** | **716** | |

## Labels
- `automated_decision`: Clauses describing automated decision-making with user impact
- `human_review`: Statements about right to human review/appeal
- `transparency_statement`: Disclosures about algorithmic factors/processing

## Augmentation Strategy

### Problem Identified
From evaluation run `v2025.10.12`:
- **Precision:** 0.375 (too low)
- **Recall:** 0.900 (good)
- **F1:** 0.529

**False Positive Pattern:**
Model incorrectly flags transparency statements as `automated_decision`:
- "We explain how our algorithms process information..."
- "We aim to be transparent about algorithmic systems..."
- "The automated system relies on criteria including..."

### Solution: Hard Negative Generation
Generated 146 transparency hard negatives that:
1. Mention algorithms, automated systems, AI
2. Use neutral verbs (analyze, process, organize, help, assist)
3. **Do NOT** describe decisions with user impact
4. Explicitly state "for informational purposes" or "recommendations only"

**Example Hard Negatives:**
```
✓ "Algorithms help us organize user engagement and content quality to improve user experience."
✓ "We use automated tools to track safety considerations for reporting."
✓ "While algorithms analyze temporal patterns and account age, all final decisions require human review."
```

### Additional Positives
Generated 100 `automated_decision` positives emphasizing:
- Strong decisional verbs: "determines", "decides", "automatically enforces"
- Clear user impact: "suspend your account", "remove content", "restrict access"
- Regulatory context: GDPR, FCRA, EEOC compliance scenarios

## Success Metrics
| Metric | Baseline (v2025.10.12) | Target | Stretch Goal |
|--------|------------------------|--------|--------------|
| Precision | 0.375 | 0.60 | 0.70 |
| Recall | 0.900 | 0.85+ | 0.90+ |
| F1 | 0.529 | 0.70+ | 0.78+ |

## Training Plan
1. Train model on v2025.10.13 dataset
2. Evaluate with `--fp-destination` to capture new false positives
3. Run validation with `--summary-csv` for delta tracking
4. Compare metrics with baseline using `compare_model_metrics.py`
5. Update dashboard and document results

## Files
- `dataset.jsonl` - Shuffled merged dataset (716 examples)
- `manifest.json` - Dataset metadata and provenance
- `README.md` - This file

## Next Steps
If precision target (0.60) is not met:
1. Review new false positives from evaluation
2. Generate additional hard negatives targeting remaining patterns
3. Consider harvesting real-world examples from Hugging Face datasets (Phase 2b)

---
**Generated:** October 9, 2025  
**Author:** GitHub Copilot  
**Phase:** 2a - Synthetic Hard Negative Generation
