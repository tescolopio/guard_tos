# QA Report: Synthetic IP_RETAINED Data Validation

**Category:** `content_rights`
**Dataset Version:** `v2025.10.08a`
**Date:** 2025-10-08

## 1. Summary

This report documents the quality assurance review for the synthetically generated `IP_RETAINED` clauses. The review concludes that the synthetic data is **high-quality, realistic, and suitable for use** in the `content_rights` dataset.

## 2. Background

The `content_rights` dataset initially suffered from a severe class imbalance, with only 5 examples for the `IP_RETAINED` label. Initial attempts to harvest more organic examples proved insufficient. To remedy this, a set of 53 synthetic clauses were generated to provide positive examples for this label.

## 3. Methodology

A qualitative review was conducted on a sample of the data.

1.  **Sampling:** A QA sample was created by combining the 5 original, manually-seeded `IP_RETAINED` examples with a random selection of 8 new synthetic examples.
2.  **Analysis:** The combined sample, located at `data/derived/qa_sample_ip_retained.jsonl`, was manually reviewed for:
    *   **Tone and Realism:** Does the synthetic text sound like a real terms of service clause?
    *   **Variety:** Do the clauses cover different scenarios and phrasing?
    *   **Accuracy:** Does the clause correctly assert that the user retains IP rights?
    *   **Duplication:** Is there a risk of overly repetitive or memorizable content?

## 4. Findings

The synthetic data met or exceeded quality expectations across all dimensions.

*   **Tone and Realism:** Excellent. The synthetic clauses successfully mimic the legalistic tone of the manual seeds.
*   **Variety:** Good. The generation script produced a range of scenarios covering different types of user content and service types.
*   **Accuracy:** High. All sampled synthetic clauses correctly and unambiguously state that the user retains ownership of their intellectual property.
*   **Duplication Risk:** Low. The combinatorial generation approach creates sufficient surface-level variation to avoid simple duplication.

## 5. Conclusion & Recommendation

**Approve.**

The synthetic `IP_RETAINED` data is approved for use in the `v2025.10.08a` dataset and future iterations. This hybrid strategy of combining organic data with targeted synthetic generation is a valid approach for bootstrapping low-resource labels.
