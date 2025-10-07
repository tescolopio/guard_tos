# Mock Page Analysis Workflow

This guide shows how to localise the mock Terms of Service pages that live in the repository and run them through the Terms Guardian analysis pipeline. All commands expect Node.js v18 or newer (matching the `package.json` engine constraint).

## 1. Serve the mock pages (optional)

If you want to browse the captured pages in a browser, start a static web server from the repository root:

```bash
npx http-server test-pages/all-mocks/test-pages --port 8080 --cors
```

Visit `http://localhost:8080/` and navigate into the saved page you want to inspect. This step is not required for automated analysis; it is simply a convenient way to eyeball the fixtures.

## 2. Run the pipeline against a single page

Use the existing fixture runner to analyse any HTML or text asset:

```bash
npm run analyze:fixture -- test-pages/all-mocks/test-pages/sample-tos.html
```

The command prints a JSON report containing readability, rights, user-rights index, key findings, and uncommon terms for the page.

## 3. Batch-analyse all mock pages

To process every supported page under `test-pages/all-mocks/test-pages/` (or any folder you choose), run:

```bash
npm run analyze:mocks
```

Key flags:

- `npm run analyze:mocks -- test-pages/all-mocks/test-pages/curated-tos` – target a specific subdirectory.
- `npm run analyze:mocks -- --limit=5` – only analyse the first five pages (useful for quick spot checks).
- `npm run analyze:mocks -- --json` – emit structured JSON with per-file outputs and error metadata.

Behind the scenes the script reuses the same pipeline that powers the extension: text extraction, legal-content detection, readability grading, rights assessment, summarisation, and the user-rights index.

## 4. Next steps

- Feed the JSON output into bespoke tooling or dashboards for regression tracking.
- Combine with the optional static server to manually verify problem areas the automated run flags.
- Extend `scripts/analyze_mock_pages.js` if you want additional filters (e.g., skip PDFs, focus on specific risk categories).
