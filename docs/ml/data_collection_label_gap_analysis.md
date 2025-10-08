# Data Collection Dataset - Label Gap Analysis

**Dataset Version:** v2025.10.07  
**Date:** 2025-10-07  
**Category:** data_collection

## Summary

The initial data_collection dataset was created from GDPR and CCPA regulatory texts. While most labels were successfully populated, the `consent_implied` label has **0 examples**.

## Findings

### consent_implied Label Gap

**Expected Pattern:** The `consent_implied` label is designed to identify Terms of Service language that assumes user consent through continued use, such as:
- "By using this service, you consent to..."
- "Continued use constitutes consent"
- "You are deemed to have consented..."

**Source Mismatch:** The GDPR and CCPA are **regulatory documents** that define data protection requirements and best practices. They:
1. Advocate for **explicit consent** mechanisms
2. Warn **against** implied consent practices
3. Do not contain the "by using you agree" language found in Terms of Service

**Conclusion:** The absence of `consent_implied` examples is **expected and correct** given the current source selection. This label requires harvesting actual Terms of Service documents, not regulatory texts.

## Label Distribution (v2025.10.07)

| Label                      | Count | Percentage |
|----------------------------|-------|------------|
| data_collection_extensive  | 19    | 35.2%      |
| purpose_broad              | 24    | 44.4%      |
| data_collection_minimal    | 15    | 27.8%      |
| consent_explicit           | 8     | 14.8%      |
| purpose_specific           | 5     | 9.3%       |
| **consent_implied**        | **0** | **0.0%**   |

## Recommendations

### Short-term (Current Dataset)
- **Accept the gap:** The v2025.10.07 dataset is fit for purpose for training classifiers on regulatory compliance language
- **Proceed with SME review:** The 5 populated labels provide sufficient signal for initial model training
- **Document limitation:** Note in the manifest that this version focuses on regulatory texts

### Medium-term (Next Iteration)
1. **Harvest Terms of Service documents:** Add sources like:
   - PolicyQA corpus (privacy policies with QA pairs)
   - ToS;DR (Terms of Service summaries)
   - Manual captures from major platforms (similar to content_rights methodology)

2. **Blend sources:** Create a v2025.10.XX dataset that combines:
   - Regulatory texts (GDPR, CCPA) → best practices, explicit consent
   - Terms of Service documents → implied consent, real-world practices

3. **Balance considerations:** Implied consent is a **negative practice** from a privacy perspective, so having fewer examples may actually be desirable for training a privacy-friendly classifier.

## Next Steps

1. Update the manifest to note the source limitation
2. Proceed with SME review for the current 5 labels
3. Plan a second harvest iteration to include Terms of Service documents
