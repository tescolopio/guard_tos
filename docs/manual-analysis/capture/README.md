# Dynamic Capture Workflow (SAM.gov & Similar SPA Terms)

This document outlines a future-proof process to replace inferred legal analyses with verbatim clause extraction for dynamically rendered Terms of Use pages (e.g., SAM.gov) where static HTML snapshots contain only framework shell & analytics scripts.

## Goals
- Render SPA content post-JavaScript execution.
- Extract only substantive legal sections.
- Maintain audit trail (hashes, timestamps, selectors, version history).
- Enable automatic change detection → trigger re-scoring pipeline.

## Directory Structure
```
/scripts/capture-sam-gov.js        # Headless capture skeleton (needs puppeteer)
/data/captures/sam-gov/<timestamp>/
  raw.html                         # Full body.outerHTML (initial fallback)
  extracted.html                   # Narrowed legal content container (after selector tuning)
  extracted.md                     # Markdown-normalized version
  meta.json                        # Metadata: URL, selector, hashes, status
```

## Hash Strategy
- Compute SHA256 of `raw.html` and `extracted.html`.
- Store in `meta.json` along with `selector_used`.
- On subsequent runs, compare hashes:
  - If unchanged: skip re-summarization.
  - If changed: flag for manual review & YAML update.

## Normalization Guidelines
1. Strip `<script>`, `<style>`, inline event handlers.
2. Preserve heading tags (h1-h4) → Markdown equivalents.
3. Collapse sequential blank lines.
4. Remove dynamic timestamps or build IDs to reduce noise hash churn.

## Implementation Steps
1. Install dependency:
   - `npm install --save-dev puppeteer` (or `yarn add -D puppeteer`).
2. Uncomment the browser launch + extraction logic in `capture-sam-gov.js`.
3. Add selector refinement once real container identified (e.g., `[data-testid='terms-content']`).
4. Implement fallback logic:
   - Try each selector candidate.
   - On failure, log and store full body.
5. Add HTML → Markdown transform (e.g., `turndown`):
   - `npm install --save-dev turndown`
6. Store artifacts + meta ledger.
7. Add a simple diff script (optional future file): `/scripts/diff-latest-sam-gov.js` to compare previous capture.

## Sample Pseudocode (Final Form)
```js
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForTimeout(1500); // settle dynamic modules
let content = null;
for (const sel of target.selectorCandidates) {
  if (await page.$(sel)) { content = await page.$eval(sel, el => el.innerHTML); record.selector_used = sel; break; }
}
if (!content) { content = await page.evaluate(() => document.body.outerHTML); record.selector_used = 'body'; record.notes = 'Fallback full body'; }
```

## Change Detection Hook (Future)
Integrate into CI workflow:
- Run capture nightly.
- If `sha256_extracted` differs, open automated pull request tagging legal review team.

## Scoring Revision Process
1. Replace `[INFERRED]` annotations in `sam-gov-terms.md` with clause-backed summaries.
2. Remove `inferred_analysis: true` flag in YAML entry.
3. Adjust scores where new explicit language alters risk (e.g., if appeals described → raise Account Management, if data minimization noted → raise Data Collection & Use).

## Potential Enhancements
- Headless browser pool (parallelizing multiple government properties).
- Semantic diff (JS token-level) to highlight changed sentences.
- Structured clause tagging (JSON) for downstream machine learning experiments.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| DOM race conditions | Use `networkidle2` + small post-wait delay |
| Selector drift after redesign | Maintain fallback full body capture |
| Legal content embedded in iframes | Detect iframe nodes and recursively fetch src documents |
| High churn from non-legal banners | Strip known ephemeral nodes (cookie banner, ephemeral alerts) before hashing |

## Next Steps
- Identify real container selector after first dynamic run.
- Add turndown normalization.
- Wire a `scripts/capture-all.sh` orchestrator if expanding beyond SAM.gov.

---
*This capture framework converts provisional legal inferences into evidence-backed analyses, improving scoring precision and longitudinal change tracking.*
