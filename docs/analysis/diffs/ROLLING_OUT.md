# Multi-Document Diff Rollout Plan

## Objectives
Expand automated capture + diff monitoring beyond SAM.gov and Quora to a prioritized set of additional services whose Terms of Service or related policies materially affect user rights.

## Candidate Services (Initial Wave)
1. GitHub (Terms + Acceptable Use + Privacy) – high developer impact
2. Reddit (User Agreement + Moderator Guidelines excerpts) – frequent policy shifts
3. Pinterest (Terms + Acceptable Use) – prior arbitration/class action changes
4. X / Twitter (Terms + Rules) – rapid iteration; watch wording around APIs & rate limits
5. Meta (Facebook) Terms / Supplemental Data Policy – complex layered documents

## Prioritization Criteria
- Change Volatility (historical churn / news-tracked updates)
- Legal Risk Profile (heavy arbitration, unilateral changes, data usage breadth)
- Coverage Gap (diversity of clause patterns for ML training)
- Reuse of Existing Capture Pattern (static vs JS-heavy vs login-gated)
- Downstream Demand (internal stakeholders requesting monitoring)

## Phase Breakdown
| Phase | Scope | Deliverables | Dependencies |
|-------|-------|--------------|--------------|
| 1 | Baseline infra hardening | Generalized diff (DONE), ignore pattern modularity, shared service registry (DONE) | `diff_terms.js`, `config/services.json` |
| 2 | Add 2 high-priority docs | Capture scripts + baseline diffs (GitHub ✅, Reddit ⏳) | Puppeteer patterns from sam-gov/quora |
| 3 | Extend to 3 more | Capture + baseline (Pinterest, X, Meta partial) | Anti-bot handling if needed |
| 4 | Policy Family Linking | Map related policies (Privacy, Community) under unified service key | Exporter schema extension |
| 5 | ML Feedback Loop | Harvest new clause variants into training corpus automatically | Calibrated thresholds |

## Data Model Enhancements (Status)
- [ ] meta.json normalization: unify to array-of-pages structure `{ name, url, sha256_* }`
- [x] Service registry: `config/services.json` (capture + diff metadata per service)
- [ ] Policy typing: `terms | privacy | community | security`; feed into exporter

## Actionable Next Steps
1. Run first GitHub capture + diff baseline (requires network window)
2. Add Reddit service entry (capture script + ignore patterns) using registry scaffold
3. Normalize legacy SAM.gov meta to registry-friendly format (object + pages array)
4. Extend exporter to group documents by `service` and `policy_type`
5. Schedule recurring diff execution (Nightly GitHub + Quora sweep)

## Service Registry & CLI Quickstart
- `config/services.json` now drives both capture and diff metadata (`targets`, `policies`, ignore files).
- Capture commands:
	```bash
	npm run capture:samgov
	npm run capture:quora
	npm run capture:github
	```
- Diff commands:
	```bash
	npm run diff:samgov
	npm run diff:quora
	npm run diff:github
	npm run diff:terms   # runs sam-gov, quora, github sequentially
	```
- Ignore pattern files live under `docs/analysis/diffs/.<service>-ignore.json` (GitHub + Quora added).

## Ignore Pattern Strategy
Maintain one JSON per service; share a global `.common-ignore.json` for boilerplate (cookie notices, nav, footer) inherited at runtime.

## Risks & Mitigations
- Layout/selector drift: maintain fallback selector arrays; assert min byte length > threshold to catch truncated captures.
- Anti-bot blocks: randomized UA + backoff; cache last good batch if failure persists.
- Policy fragmentation: maintain alias list mapping synonyms ("User Agreement" -> terms).

## Success Metrics
- T+14 days: 5 services onboarded with automated diffs
- Mean capture success rate ≥ 95%
- False positive diff noise (pure formatting) < 10% of change events (tracked manually first)
- New clause pattern yield ≥ 5 novel variants per month into ML corpus

## Follow-Up Enhancements (Backlog)
- HTML DOM structural diff (beyond paragraph heuristic)
- Inline risk scoring delta in diff summary
- Slack/webhook alerts on effective date change or arbitration/liability modifications
- Periodic recrawl historical batches to generate retroactive version history

---
Generated as part of multi-document rollout planning.
