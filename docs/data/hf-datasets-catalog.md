# Hugging Face Datasets Catalog for Terms Guardian ML (as of 2025-09-23)

This catalog tracks candidate datasets from the Hugging Face Hub for training category-specific models and grade labelers. We prioritize permissive licenses and strong relevance to our categories.

Note: For higher rate limits, set HF_TOKEN. See [hf.co/settings/mcp](https://hf.co/settings/mcp/) or create an account at [hf.co/join](https://hf.co/join).

## Legend

- Relevance: High / Medium / Low relative to our categories
- License: Ensure compliance before use (CC-BY-4.0 preferred). Avoid NC/SA unless internal only.
- Categories: DPriv (Data Privacy), DShare (Data Sharing), URights (User Control), Service (Service Terms), Liability, Dispute, ContentIP, Commercial

---

## Contracts & Clauses (Liability, Dispute, Content/IP, Commercial)

### CUAD (Contract Understanding Atticus Dataset)

- Repo: <https://hf.co/datasets/theatticusproject/cuad>
- Variant (QA): <https://hf.co/datasets/theatticusproject/cuad-qa>
- Variants (Clause/Full Text by community):
  - <https://hf.co/datasets/dvgodoy/CUAD_v1_Contract_Understanding_clause_classification>
  - <https://hf.co/datasets/dvgodoy/CUAD_v1_Contract_Understanding_PDF>
  - <https://hf.co/datasets/zenml/cuad-deepseek>
- License: CC-BY-4.0 (favorable)
- Size: 10K–100K range depending on variant
- Relevance: High (clauses across many categories, good for weak supervision and fine-tuning)
- Categories: Liability, Dispute, ContentIP, Commercial

### ContractNLI

- Repo: <https://hf.co/datasets/kiddothe2b/contract-nli>
- Subtasks (LegalBench/MTEB subsets): multiple (confidentiality, sharing with third parties, etc.)
- License: CC-BY-NC-SA-4.0 (non-commercial restriction) — caution
- Relevance: Medium (NLI framing; clause reasoning)
- Categories: Liability, Dispute, ContentIP

### LEDGAR / LexGLUE LEDGAR

- Repo: <https://hf.co/datasets/MAdAiLab/lex_glue_ledgar> (and forks)
- License: check per repo (varies)
- Relevance: High (contract clause classification; category labels)
- Categories: Liability, Dispute, ContentIP, Commercial

### LegalBench (umbrella)

- Repo: <https://hf.co/datasets/nguha/legalbench>
- Subtasks: consumer contracts QA, etc.
- License: other (review needed per task)
- Relevance: Medium (benchmarks and tasks useful for evaluation)
- Categories: Mixed

---

## Privacy & Policies (Data Privacy, Data Sharing, User Control)

### Privacy Policy QA (community)

- Repo: <https://hf.co/datasets/amentaga-nttd/privacy-policy-qa-classification>
- License: check (likely custom)
- Relevance: Medium (QA classification on privacy policy content)
- Categories: DPriv, DShare, URights

### Other privacy policy datasets

- OPP-115, Polisis (not directly found on HF via anonymous search). Consider external sources or mirrored versions.
- Relevance: High if available; otherwise acquire off-Hub with license review.

---

## ToS / Unfair Terms (Dispute, Liability, User Control)

### CLAUDETTE (Unfair Terms)

- Not surfaced in quick HF search; exists in literature. Consider external acquisition with license review.
- Relevance: High (consumer contracts unfair terms; helpful for dispute/liability)

### ToS;DR

- Not surfaced in quick HF search. Consider API or exported data with terms review.
- Relevance: Medium/High for weak supervision and evaluation.

---

## Initial Recommendations

- Use CUAD (and clause classification variants) as primary contract corpus for Dispute/Liability/ContentIP/Commercial models.
- Use LegalBench subsets for evaluation baselines and select training where license permits.
- For Privacy categories, attempt to source OPP-115/Polisis style datasets off-Hub; augment with regulatory text (GDPR/CCPA) via weak supervision.

## Next Steps

1. Curate final selection with licenses and splits (see manifest).
2. Build downloader for CC-BY-4.0 datasets (CUAD, LEDGAR where available).
3. Start weak supervision labelers for grade mapping per category.
