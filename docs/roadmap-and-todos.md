# Terms Guardian — Comprehensive Roadmap and Exhaustive TODOs

Last updated: 2025-09-23

This document consolidates all planning, roadmap, and TODOs into a single source of truth. It supersedes scattered lists across the repo while cross‑linking canonical references for detail.

## Scope and Principles

- Privacy-first: all analysis runs locally by default
- Clear UX: report‑card style results (letter grades) and concise explanations
- Robust engineering: tests, performance ceilings, and graceful fallbacks
- Incremental ML: category‑specific models enhance, not replace, rule logic

## Phase Overview

1. Stabilize & harden MVP (bug fixes, tests, perf, bundle size)
2. Grade-based UX rollout (A–F), explanations, and UI polish
3. Browser ML: category‑specific models (progressively shipped)
4. Automation & QA (Playwright E2E + fixtures server)
5. Beta, feedback loop, and Chrome Web Store release
6. Post‑launch monitoring and growth features

---

## Phase 1 — MVP Hardening and Tech Debt

References: docs/mvp_todo.md, dev_progress.md, PRODUCTION_READINESS.md

- Build & Bundles
  - [ ] Resolve remaining Terser/minification edge cases for prod build (if any resurface)
  - [ ] Bundle size optimization for dictionaries (ensure code‑splitting remains effective)
  - [ ] Verify web accessible resources and dynamic import paths in MV3
- Tests & CI
  - [ ] Consolidate Jest configs; ensure stable Node/jsdom split per suite
  - [ ] Fix hanging tests root causes; audit timeouts (docs/testing-guidelines.md)
  - [ ] Achieve 85%+ unit coverage; add snapshot‑free assertions for flaky areas
  - [ ] Add smoke pipeline in CI: build + minimal E2E validation
- Analysis Pipeline
  - [ ] Ensure performFullAnalysis uses all core analyzers (readability, summary, rights, uncommon terms)
  - [ ] Verify rights score format mapping for sidepanel (0–1 → UI percent)
  - [ ] Guarantee hash‑based caching toggles and metrics in diagnostics
- Data & Dictionaries
  - [ ] Audit legal dictionaries for redundancy and size; split by locale/category
  - [ ] Document dictionary update workflow and tests

Acceptance criteria:

- Production build reproducible and verified
- All unit suites pass locally and in CI with timeouts
- Sidepanel shows consistent data across fixtures
- Bundle size within target budgets (core <150KB, lazy dictionaries OK)

---

## Phase 2 — Grade-Based UX (A–F)

References: docs/grade-based-implementation.md, docs/sentiment-analysis-implementation.md, docs/analysis/rights-scoring-spec.md

- Specification & Consistency
  - [ ] Finalize letter‑grade scales per category (privacy, liability, dispute, user control, content/IP, service terms, commercial terms)
  - [ ] Normalize grade→score (A=95,B=85,C=75,D=65,F=30) and score→grade thresholds
  - [ ] Ensure coherent explanations and pattern examples per grade
- UI/UX Implementation
  - [ ] Sidepanel components render letter grades with color coding and tooltips
  - [ ] Overall “report card” summary with category breakdown
  - [ ] Accessibility: color contrast, ARIA labels for grades
  - [ ] Empty/uncertain state UX (no clear grade → show C/neutral with hint)
- Backend/Logic Integration
  - [ ] Map rules/ML outputs to letter grades consistently
  - [ ] Aggregate chunk grades → category grade with confidence weighting
  - [ ] Aggregate category grades → overall grade
  - [ ] Persist last analysis + grade snapshots for comparison

Acceptance criteria:

- Users see A–F grades across categories with clear explanations
- Overall grade matches category aggregation logic
- Documented mapping in rights‑scoring‑spec with tests

---

## Phase 3 — Category‑Specific Browser ML

References: docs/ml-enhancement-plan.md, docs/legal-corpus-implementation.md, docs/training_progress.md

- Data Pipeline
  - [ ] Implement legal corpus collectors (GDPR, FTC, SEC, case law) with licenses
  - [ ] Preprocessing: segmentation, de‑citation, normalization
  - [ ] Weak supervision labelers per category; export grade labels
  - [ ] Gold set: small, hand‑labeled ToS corpus for evaluation
- Models & Training
  - [ ] PoC: Data Privacy classifier (DistilBERT → distilled/quantized TF.js or lightweight classic model)
  - [ ] Calibration: per‑category thresholds targeting precision≥0.8
  - [ ] Model cards and change logs per release
  - [ ] Size budget: <10MB per category (compressed); prefer <5MB
- In‑Browser Integration
  - [ ] Lazy load per category; background warmup
  - [ ] Web Worker inference; chunk batching
  - [ ] Fusion with rules via alpha weighting; graceful fallback
  - [ ] Telemetry‑free counters for user feedback (local only)

Acceptance criteria:

- Data Privacy ML improves detection vs rule‑only on fixtures
- Latency overhead <300ms on common pages
- Feature flag to disable ML; full fallback path validated

---

## Phase 4 — Automation & QA

References: docs/testing-guidelines.md, docs/playwright_todo.md, docs/manual-testing-plan.md, docs/test-session-log.md

- Fixture Infrastructure
  - [ ] Lightweight HTTP server to serve test fixtures (avoid file:// limitations)
  - [ ] Curate golden ToS pages under test‑pages/ with metadata
  - [ ] Add fixture loader utils and mocks
- Playwright E2E
  - [ ] Boot Chrome with extension; verify badge, panel, analysis
  - [ ] Test grade rendering and accessibility
  - [ ] Regression pack: 10 representative ToS pages
  - [ ] Robust timeouts and retries; CI integration
- Manual QA
  - [ ] Update manual QA checklist for grade UX and ML toggles
  - [ ] Record runs in docs/test-session-log.md with screenshots

Acceptance criteria:

- Deterministic E2E suite runs under 5 minutes with timeouts
- Flake rate <3% across 10 runs
- Manual QA script covers edge cases and accessibility

---

## Phase 5 — Beta & Store Submission

References: PRODUCTION_READINESS.md, chrome-store-compliance.md, store-submission-guide.md, store-description.md, store-assets-guide.md, PRIVACY_POLICY.md

- Assets & Listing
  - [ ] Generate screenshots from fixtures (1280×800)
  - [ ] Finalize store description and privacy policy
  - [ ] Verify manifest permissions justifications
- Packaging
  - [ ] Validate prod build and ZIP packaging
  - [ ] Dry‑run upload in unlisted mode
- Beta Program
  - [ ] Invite testers, collect structured feedback
  - [ ] Prioritize fixes; publish release notes

Acceptance criteria:

- Store listing approved in unlisted mode
- Beta feedback triaged with tracked follow‑ups

---

## Phase 6 — Post‑Launch Monitoring & Growth

- Monitoring (local only; no tracking)
  - [ ] Error counters and self‑diagnostics in sidepanel
  - [ ] User‑visible health indicators; “copy diagnostics” button
- Updates & Maintenance
  - [ ] Quarterly dictionary refresh cadence
  - [ ] Model recalibration process documented
  - [ ] Backward‑compatible data schema guarantees
- Growth Features
  - [ ] Comparative grading vs industry averages
  - [ ] Change tracking across ToS revisions
  - [ ] Personalization: user‑weighted categories

Acceptance criteria:

- Clear maintenance playbook and cadence
- Low support burden via in‑app diagnostics

---

## Cross‑Cutting TODO Backlog (Exhaustive)

- Engineering
  - [ ] Eliminate duplicate methods (e.g., performFullAnalysis) and dead code
  - [ ] Strengthen error handling across async paths
  - [ ] Circular dependency audit
  - [ ] Memory ceilings for service worker lifecycle
  - [ ] Regex performance tests for large docs
- Testing
  - [ ] Service worker: define global.self; stabilize env
  - [ ] Content tests: jsdom env; DOM mocking utilities
  - [ ] Debugger: mock performance.now; align expectations
  - [ ] Webpack prod: plugin order/type test fixes
- Docs
  - [ ] API docs (JSDoc) for public methods
  - [ ] End‑user guide and onboarding flow
  - [ ] Architecture deep‑dive updates (caching, ML fusion)
  - [ ] Keep training_progress.md updated per model release
- Performance
  - [ ] Web worker offload for heavy analysis
  - [ ] Cache invalidation heuristics tuning
  - [ ] Bundle budget guardrails in CI

---

## Acceptance Criteria Templates

- Feature is accessible: keyboard navigation, color contrast ≥ 4.5:1
- Tests: unit + integration; E2E if user‑visible
- Performance: measured and documented; within budgets
- Documentation: updated references and quickstart snippets

---

## References

- MVP status: docs/mvp_todo.md
- Ongoing progress: dev_progress.md
- Grade system: docs/grade-based-implementation.md, docs/sentiment-analysis-implementation.md
- ML plan: docs/ml-enhancement-plan.md, docs/legal-corpus-implementation.md, docs/training_progress.md
- QA: docs/testing-guidelines.md, docs/manual-testing-plan.md, docs/qa_checklist.md
- Store: PRODUCTION_READINESS.md, chrome-store-compliance.md, store-\*.md
