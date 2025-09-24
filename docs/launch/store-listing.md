# Chrome Web Store Listing — Terms Guardian

This document is a draft to help prepare your store listing. Adapt copy as needed before submission.

## Summary (short description)

Terms Guardian grades Terms of Service in your browser — readability, rights impact, and a clear 8-category User Rights Index. No data leaves your device in the MVP.

## Description (long)

Terms Guardian helps you quickly understand Terms of Service:

- Readability grade with Flesch/Kincaid/Fog details
- Rights analysis with clause signals (arbitration, class actions, unilateral changes, data sharing, etc.)
- User Rights Index (URI): 8 categories with weights and an overall A–F grade
- Section summaries and key excerpts
- Uncommon legal terms with plain-language definitions

Privacy-first: In the MVP, all analysis is performed locally. No network calls are made for analysis. You control cache and settings.

## Key features

- On-page detection of ToS and similar legal documents
- Side panel with grades, summaries, and definitions
- Lightweight footprint; production bundles ~89KB (excluding dictionaries)
- Optional diagnostics for power users

## Permissions rationale

- activeTab — needed to analyze and summarize the current tab on user action
- scripting — injects the content script on demand to parse page text
- contextMenus — optional quick actions from right‑click to open the side panel or run analysis
- sidePanel — opens the analysis UI in Chrome's side panel
- storage — saves settings and local cache (readability, rights, summaries)

We do not request network permissions for MVP analysis. If future features integrate cloud caching, they will be optional and clearly disclosed.

## Screenshots (guidance)

Include 3–5 screenshots:

1. Side panel showing Readability + Rights + URI overview
2. Rights details popup with clause indicators
3. Summaries and uncommon terms
4. Settings page (privacy controls and cache management)

## Links

- Privacy Policy: ../../PRIVACY.md
- Documentation: ../../README.md
- User Rights Index spec: ../analysis/user-rights-index.md

## Contact and support

- Bugs and feedback: open an issue at [the GitHub repository](https://github.com/your-org/terms-guardian) or email [support@example.com](mailto:support@example.com)

## Release notes (snippet)

- Initial MVP release with local-only analysis, URI, summaries, readability, and uncommon terms.
