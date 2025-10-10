# Synthetic Clause Spot Check — 2025-10-08

We pulled five random clauses from each augmented dataset (content_rights and dispute_resolution) to sanity-check label alignment and language variety. No critical issues were observed.

## Sampling Method
- Random seed: 20251008
- Source files:
  - `data/aug/content_rights/v2025.10.08a/synthetic.jsonl`
  - `data/aug/dispute_resolution/v2025.10.08a/synthetic.jsonl`
- Sample size: 5 synthetic records per category

## Findings

### Content Rights
| Labels | Excerpt | Notes |
|--------|---------|-------|
| commercial_use_claim | The parties further agree that User grants Helios Media a perpetual license to monetize the submission across broadcast, streaming, and derivative merchandising channels… | Clear monetization language; clause ties directly to commercial exploitation. |
| ip_retained | For clarity, Notwithstanding the license granted herein, the creator retains all title, ownership, and intellectual property rights… | Explicit retention of IP; consistent with label. |
| moral_rights_waiver | Each contributor understands that You hereby irrevocably waive any claims based on moral rights… | Strong waiver text with jurisdiction qualifier. |
| ip_retained | In consideration for access to Acme Platform, Contributor represents that granting the non-exclusive license… | Reinforces retention + non-exclusive grant; aligns with label. |
| ip_retained | Each contributor understands that Except for the non-exclusive rights granted to Acme Platform… | Another retention clause referencing license limitations. |

### Dispute Resolution
| Labels | Excerpt | Notes |
|--------|---------|-------|
| class_action_waiver | By accepting service usage, You and Acme Platform agree that disputes will be adjudicated solely on an individual basis… | Clear ban on class actions. |
| jury_trial_waiver | As a condition precedent to using Helios Media, Both parties hereby waive trial by jury… | Classic jury waiver phrasing. |
| class_action_waiver | As a condition precedent to using Nimbus Services, Disputes between you and Northwind Networks must be brought individually… | Reinforces individual arbitration; good variety. |
| jury_trial_waiver | As a condition precedent to using Acme Platform, The parties agree that any litigation… will be heard by a judge sitting without a jury… | Meets waiver criteria; includes fallback bench trial language. |
| class_action_waiver | In entering these Terms, Disputes between you and Orbit Apps must be brought individually… | Mentions administrative fees; no class element. |

## Recommendations
- Content rights samples show redundant prefaces for some `ip_retained` examples. Consider expanding preface pool or adding bespoke `ip_retained` intros in a future iteration.
- Dispute resolution samples look balanced between class action and jury trial clauses; venue selection was not part of the sample (as expected since synthetic set targeted waivers).
- No blockers discovered; datasets ready for integration.
