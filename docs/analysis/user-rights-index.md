# User Rights Index (URI) — Specification

This document defines the Terms Guardian User Rights Index (URI): how we compute per-category scores and an overall grade from analysis modules (rights assessor, readability, sections).

## Goals

- Provide an 8-category overview of how a document affects user rights
- Blend readability into clarity to reflect understandability
- Offer a stable contract for the sidepanel UI and tests

## Categories and Weights

Weights are defined in `src/utils/constants.js` under `ANALYSIS.USER_RIGHTS_INDEX.CATEGORIES` and currently set to:

- Clarity & Transparency — 0.20
- Data Collection & Use — 0.25
- User Privacy — 0.20
- Content Rights — 0.15
- Account Management — 0.10
- Dispute Resolution — 0.10
- Terms Changes — 0.05
- Algorithmic Decisions — 0.05

Overall grade thresholds: A≥85, B≥75, C≥65, D≥50, else F (see `ANALYSIS.USER_RIGHTS_INDEX.GRADING`).

## Inputs

- Rights Assessor outputs with per-area scores and details
- Readability normalized score (0–100)
- Optional section-level category hints

## Mapping from rights assessor to URI

The combiner in `src/analysis/userRightsIndex.js` maps internal scores to the URI categories:

- DISPUTE_RESOLUTION → Dispute Resolution
- CLASS_ACTIONS → Dispute Resolution
- UNILATERAL_CHANGES → Terms Changes
- DATA_PRACTICES → Data Collection & Use
- RETENTION_AND_DELETION → User Privacy
- CONSENT_AND_OPT_OUT → Clarity & Transparency
- CONTENT_AND_IP → Content Rights
- LIABILITY_AND_REMEDIES → Clarity & Transparency
- ACCOUNT_MANAGEMENT → Account Management
- ALGORITHMIC_DECISIONS → Algorithmic Decisions

## Readability blend

The `readability.normalizedScore` contributes to the URI’s Clarity & Transparency category via:

- New score = 0.7 × existing Clarity score + 0.3 × readability.normalizedScore

This maintains the rights signals but rewards documents that are easier to understand.

## Per-category outputs

Each category exposes:

- score: 0–100 (number)
- grade: A–F (derived from thresholds)
- sentiment: -1 | 0 | 1 (heuristic; low scores → -1, high → 1)
- signals: metadata; includes `source: "rightsAssessor"` when applicable and may include `readability` for clarity

## Overall

We compute a weighted average across the eight categories using the configured weights, then map to a letter grade using the same thresholds as categories.

## Output contract (example)

```json
{
  "categories": {
    "CLARITY_TRANSPARENCY": {
      "score": 78,
      "grade": "C",
      "sentiment": 0,
      "signals": { "readability": 81.2, "source": "rightsAssessor" }
    },
    "DATA_COLLECTION_USE": {
      "score": 72,
      "grade": "C",
      "sentiment": 0,
      "signals": { "source": "rightsAssessor" }
    },
    "USER_PRIVACY": {
      "score": 80,
      "grade": "B",
      "sentiment": 1,
      "signals": { "source": "rightsAssessor" }
    },
    "CONTENT_RIGHTS": {
      "score": 68,
      "grade": "D",
      "sentiment": -1,
      "signals": { "source": "rightsAssessor" }
    },
    "ACCOUNT_MANAGEMENT": {
      "score": 85,
      "grade": "A",
      "sentiment": 1,
      "signals": { "source": "rightsAssessor" }
    },
    "DISPUTE_RESOLUTION": {
      "score": 55,
      "grade": "D",
      "sentiment": -1,
      "signals": { "source": "rightsAssessor" }
    },
    "TERMS_CHANGES": {
      "score": 60,
      "grade": "D",
      "sentiment": 0,
      "signals": { "source": "rightsAssessor" }
    },
    "ALGORITHMIC_DECISIONS": {
      "score": 50,
      "grade": "D",
      "sentiment": 0,
      "signals": { "source": "rightsAssessor" }
    }
  },
  "weightedScore": 71.3,
  "grade": "C"
}
```

## Error handling

If inputs are missing or invalid, the combiner returns neutral defaults (score≈50, grade C) rather than throwing—ensuring UI stability.

## Notes

- This is a document-level index. Section-level signals are smoothed in.
- Sentiment is intentionally simple and can be replaced by a more nuanced model later.
- Keep constants as the source of truth for weights/thresholds; this spec mirrors that configuration.
