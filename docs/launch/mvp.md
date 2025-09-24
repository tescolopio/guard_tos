# MVP scope and acceptance criteria

This document defines the minimal viable product scope for the Terms Guardian Chrome Web Store launch and the acceptance criteria to ship.

## Scope

User-visible:

- Detect ToS pages and extract main legal text
- Show side panel with:
  - Overall summary + section summaries
  - Readability metrics (Flesch, FKGL, Gunning Fog)
  - Rights assessor overview with detected clauses and brief impacts
  - Legal term highlights with definitions for uncommon terms
- No external services required; runs fully locally

Out of scope for MVP:

- Cloud database/API sync
- Accounts, preferences sync, telemetry
- Advanced settings UI beyond basic toggles

## Quality bars

- Performance: initial analysis in ≤ 2s on typical ToS pages; subsequent loads benefit from caching
- Bundle size: keep core under ~500KB (gzipped) and avoid large new deps
- Accessibility: keyboard navigable side panel; basic ARIA roles/labels
- Privacy: no network calls during analysis (except extension updates)

## Acceptance criteria

Functional

- [ ] Detects ToS text on at least 10 common sites (curated list) and opens side panel
- [ ] Produces readability metrics and overall grade
- [ ] Detects arbitration, class action waiver, limitation of liability, unilateral changes when present
- [ ] Generates summaries and key excerpts
- [ ] Highlights dictionary terms with definitions

Reliability

- [ ] Handles long pages without crashing; no unhandled promise rejections
- [ ] Hash-based cache prevents reprocessing unchanged content

Testing

- [ ] Unit/integration Jest suite passes (green)
- [ ] Target-outcome fixture test passes and covers key clauses
- [ ] Manual smoke runs on curated pages (checklist in QA doc)

Docs

- [ ] README updated for MV3, build, usage, permissions
- [ ] Store listing assets checklist prepared

## Demo script (internal)

1. Open a known ToS page from the curated list
2. Click the extension icon → panel opens
3. Point out readability grades and rights assessor detections
4. Show section summaries and a couple highlighted terms
5. Refresh page to demonstrate cached fast path
