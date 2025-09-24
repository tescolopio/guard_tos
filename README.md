# Terms Guardian

![Project Icon](./images/icon128.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Terms Guardian is a Chrome Extension (Manifest V3) that helps you understand Terms of Service (ToS) pages. It detects ToS content on a page, extracts the text, grades readability, summarizes sections, and flags key rights-impacting clauses.

Core modules live in `src/analysis` (readability, rights assessment, summarization) and results are shown in a side panel UI.

## Features

- ToS detection and robust text extraction (HTML-first; DOCX/PDF helpers included)
- Readability grading (Flesch, Flesch–Kincaid, Gunning Fog)
- Rights assessor with clause patterns (e.g., Arbitration, Class Action Waiver, Limitation of Liability, Unilateral Changes)
- Section-aware summarization and key excerpts
- Legal dictionary highlighting of uncommon terms
- Side panel UI for at-a-glance grades and details
- Optional local ML augmentation (TF‑IDF + Logistic Regression) with per-class thresholds

See docs for details on rubric, patterns, and modeling: `docs/analysis/`.

## Install (developer, Chrome)

1. Install dependencies

   npm install

2. Build the extension

   npm run build

3. Load it in Chrome

   - Open chrome://extensions
   - Enable Developer mode
   - Load unpacked → select the `dist/` folder

## Usage

- Navigate to a Terms of Service page.
- Click the extension icon or use the side panel entry; the panel shows:
  - Summary and section breakdown
  - Readability metrics
  - Rights assessor details (detected clauses, category impacts)
  - Highlighted legal terms

## Architecture (high level)

- `src/background/serviceWorker.js` – Service worker, events, messaging
- `src/content/content.js` – Detects ToS, extracts document text
- `src/panel/sidepanel.{html,js}` – Side panel UI
- `src/analysis/*` – Readability, rights assessor, summarizer, text extractor
- `src/utils/*` – Constants, DOM helpers, debugger utilities
- `src/data/*` – Patterns, dictionaries, cache

Build system: Webpack (see `config/webpack.*.js`), outputs to `dist/`.

More details: `docs/architecture.md` and `docs/setup/webpack-common.md`.

## Testing

- Run all tests: `npm test`
- Focused outcome test: `npm run test:outcome`

Tests use Jest + jsdom. Fixtures live under `__tests__/fixtures/` with a “target outcome” harness to validate end-to-end analysis against expectations. See `docs/analysis/target-outcome.md`.

## Development

Prerequisites:

- Node.js 18+
- Chrome for testing
- Optional (ML pipeline): Python 3.10+ and a venv at `/mnt/d/guard_tos/.venv`

Common scripts:

- Build (prod): `npm run build`
- Dev watch: `npm run dev`
- Tests: `npm test`

## Permissions

The extension requests a minimal set for content injection and side panel:

- `activeTab`, `scripting`, `contextMenus`, `sidePanel`, `storage`

Host matching is via `content_scripts.matches`. Review and scope responsibly for store submission.

## Launch readiness

- MVP scope and acceptance criteria: `docs/launch/mvp.md`
- Release checklist for Chrome Web Store: `docs/launch/release-checklist.md`

## Optional: ML pipeline quickstart

Ensure your Python venv exists at `/mnt/d/guard_tos/.venv` and install requirements:

```bash
pip install -r scripts/requirements.txt
```

Common flows:

- Download datasets from a Hugging Face manifest: `npm run ml:download`
- Prepare → train → calibrate: `npm run ml:prep:train:calibrate`
  See `docs/launch/mvp.md` for MVP scope and acceptance criteria.

- Release checklist: `docs/launch/release-checklist.md`
- E2E smoke guide: `docs/qa/e2e-smoke.md`
- Readability interpretation: `docs/analysis/readability-interpretation.md`
- Include normalized off‑Hub data: `npm run ml:full:offhub`
- Sync thresholds to the extension: `npm run ml:sync-thresholds`
- Smoke check the model: `npm run ml:smoke`

Details: `docs/data/README.md`, `docs/data/offhub-intake.md`.

## Contributing

- Write tests for new behavior
- Keep bundles lean and avoid adding large deps
- Follow existing patterns in `src/analysis` and `src/utils`

## License

MIT License

## Contact

[time@3dtechsolutions.us](mailto:time@3dtechsolutions.us)
