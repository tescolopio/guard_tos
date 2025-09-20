# Terms Guardian — User Rights Scoring Specification (v1)

This document defines the formal scoring specification used by `rightsAssessor` to analyze legal text (Terms of Service, Privacy Policies, EULAs, contracts) and estimate user rights impact. It is implementation-agnostic and applies to both the rule-based engine and any ML-augmented/future models, ensuring a stable output contract and transparent methodology.

## 1. Scope and Inputs

- Input text: Arbitrary legal text (plain string). The analyzer may chunk text into ~500-character segments for efficiency; all scores aggregate across chunks.
- Optionals: Common words list and dictionary service for uncommon-term detection.
- Environment: Browser or Node (tests). ML augmentation is optional and feature-gated.

## 2. Clause Taxonomy (v1)

Categories and clause keys are defined in `src/data/legalPatterns.js`.

- HIGH_RISK
  - ARBITRATION
  - CLASS_ACTION_WAIVER
  - UNILATERAL_CHANGES
  - DATA_SALE_OR_SHARING
  - AUTO_RENEWAL_FRICTION
  - NEGATIVE_OPTION_BILLING
  - DELEGATION_ARBITRABILITY
- MEDIUM_RISK
  - ARBITRATION_CARVEOUTS
  - VAGUE_CONSENT
  - LIMITED_RETENTION_DISCLOSURE
  - MORAL_RIGHTS_WAIVER
  - JURY_TRIAL_WAIVER
- POSITIVES
  - CLEAR_OPT_OUT
  - SELF_SERVICE_DELETION
  - NO_DATA_SALE
  - TRANSPARENT_RETENTION

Each clause key is associated with a regex pattern for detection (rule-based path) and may have an ML label of the same name (ML path). The taxonomy is versioned alongside this spec.

## 3. Detection Signals

- Rule-based: Named-capture mega-regex over the text per chunk; increments `clauseCounts[category][key]` on matches.
- ML (optional): Sentence-level probabilities `P(key|sentence)` fused with rule signals. Thresholding converts probabilities into additional clause counts per chunk.
- Normalization context: Word count per document is recorded and used in scoring.

## 4. Scoring Model

### 4.1 Weights and Normalization

- Let counts per clause key be aggregated over all chunks into `C[key]` within category.
- Weights are defined in `EXT_CONSTANTS.ANALYSIS.RIGHTS.WEIGHTS`:
  - HIGH_RISK[key] ≤ 0 (negative penalties)
  - MEDIUM_RISK[key] ≤ 0 (negative penalties)
  - POSITIVES[key] ≥ 0 (positive bonuses)
  - CAPS: { MAX_NEGATIVE, MAX_POSITIVE }
- Normalization per `N = EXT_CONSTANTS.ANALYSIS.RIGHTS.NORMALIZATION_PER_WORDS` words (default 1000):
  - wordCount = total tokens (whitespace split); normFactor = max(1, wordCount / N)
  - neg = Σ C[key]·W[key] over HIGH_RISK and MEDIUM_RISK
  - pos = Σ C[key]·W[key] over POSITIVES
  - adjNeg = neg / normFactor
  - adjPos = pos / normFactor
  - cappedNeg = max(MAX_NEGATIVE, adjNeg)
  - cappedPos = min(MAX_POSITIVE, adjPos)

### 4.2 Score and Grade

- If no signals (neg == 0 and pos == 0): return neutral baseline score = 80 (heuristic), no caps applied.
- Otherwise base score = 100 + cappedNeg + cappedPos
- Clamp to [0, 100].
- Grade thresholds (configurable; defaults in constants):
  - A ≥ 85, B ≥ 75, C ≥ 65, D ≥ 50, else F.

## 5. Confidence Estimation

Confidence ∈ [0,1] combines coverage, signal strength, and type cues.

- Coverage (cov): min(1, chunkCount / ceil(wordCount / N))
- Signal strength (sig): min(1, totalSignals / 10) where totalSignals is sum of all clause counts.
- Type cue (type): 1 if legal header pattern detected, else 0.
- Weights `CONFIDENCE = { COVERAGE_WEIGHT, SIGNAL_WEIGHT, TYPE_WEIGHT }` in constants.
- conf = 0.4·cov + 0.4·sig + 0.2·type (defaults; configurable)

## 6. ML Fusion (Optional)

- For each chunk, sentences are classified with a lightweight TF‑IDF + OvR Logistic Regression model.
- For supported classes (e.g., ARBITRATION, CLASS_ACTION_WAIVER, LIABILITY_LIMITATION, UNILATERAL_CHANGES), compute fused probability per class:
  - ruleP ∈ {0,1} derived from presence of rule-based count in the chunk.
  - fused = α·ruleP + (1−α)·P_ml, where α = `EXT_CONSTANTS.ML.FUSE_ALPHA`.
  - If fused ≥ THRESHOLDS[class], increment the corresponding `clauseCounts` for that chunk.
- This preserves backward compatibility: ML can only add evidence, never remove rule matches.

## 7. Output Contract

See `docs/analysis/rights-output.schema.json` for the JSON Schema. High-level fields:

- rightsScore: number in [0,100]
- grade: "A"|"B"|"C"|"D"|"F"
- confidence: number in [0,1]
- uncommonWords: Array<{ word, definition }>
- details:
  - chunkCount: integer
  - averageScore: number (== rightsScore)
  - clauseSignals: integer (sum of counts)
  - wordCount: integer
  - clauseCounts: object keyed by category and clause key with integer counts
  - categoryScores: object keyed by top-level user rights category with:
    - raw: number (sum of weighted contributions before normalization)
    - adjusted: number (raw normalized per N words)
    - score: number in [0,100] (100 + clamped adjusted contribution)
  - dictionaryTerms: Array<{ term, count, examples? }>

## 8. Edge Cases and Safeguards

- Empty/short text: returns neutral defaults, low confidence.
- Extremely long documents: normalization avoids penalizing length; coverage controls confidence.
- Repetitive patterns: caps limit positive/negative extremes.
- Non-legal text: header/type cue lowers confidence; rubric may produce near‑neutral scores.
- ML failures/unavailable: proceed with rule-based only; errors are swallowed and logged at DEBUG.

## 9. Versioning and Reproducibility

- Spec version: v1 (this file). Any breaking changes increment spec version.
- Constants include rubric weights, grade thresholds, caps, confidence weights, ML fusion parameters.
- ML model versions are tracked via `EXT_CONSTANTS.ML.MODEL_VERSION` and asset path.
- For datasets, maintain a curation log (source, license, mapping). Optionally publish on HF.

## 10. Example Calculation (Illustrative)

- wordCount = 2,400; N=1000 → normFactor = 2.4
- Counts: ARBITRATION=2, CLASS_ACTION_WAIVER=1, LIABILITY_LIMITATION=3, CLEAR_OPT_OUT=1
- Weights: −15, −15, −8, +5
- neg = 2·(−15) + 1·(−15) + 3·(−8) = −69
- pos = 1·(+5) = +5
- adjNeg = −69 / 2.4 ≈ −28.75; adjPos = 5 / 2.4 ≈ 2.08
- cappedNeg = max(−60, −28.75) = −28.75; cappedPos = min(20, 2.08) = 2.08
- score = 100 − 28.75 + 2.08 ≈ 73.33 → Grade C (with default thresholds)

---

Maintainers: update this spec when taxonomy, weights, or fusion logic changes. Keep the docs synchronized with `src/analysis/rightsAssessor.js` and constants.
