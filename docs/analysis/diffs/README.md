# SAM.gov Diff Watcher

This directory contains automated diff reports and configuration for monitoring changes to the SAM.gov Terms of Use.

## Components

| File | Purpose |
|------|---------|
| `scripts/diff_samgov.js` | Compares the latest two capture batches and emits a markdown diff report. |
| `.samgov-ignore.json` | Regex patterns (case-insensitive) for paragraphs to ignore (navigation, layout chrome, generic banners). |
| `sam-gov-<batch>.md` | Generated diff report for the `<batch>` capture (only if change detected). |

## Capture Workflow

1. Run dynamic capture (creates timestamped batch under `data/captures/sam-gov/`):
   - `npm run capture:samgov`
2. Run diff watcher:
   - `npm run diff:samgov`
3. If a change is detected:
   - Exit code = 1
   - A new report is written to `docs/analysis/diffs/sam-gov-<currentBatch>.md`
4. Review the report for substantive legal changes, then:
   - Re-run readability metric if large content shift
   - Update `manual-reviews.yaml` scores / evidence if user rights posture changes

## Ignore Patterns

`./.samgov-ignore.json` is an array of regex strings (without surrounding slashes). Each is compiled with the `i` flag. If a paragraph matches *any* pattern it is excluded from diff comparison.

Example entry:
```json
"^\\[Skip to main content\\]$"
```

To extend ignore list:
1. Add new pattern to `.samgov-ignore.json`
2. Re-run `npm run diff:samgov`

## Diff Logic Overview

1. Identify the latest two timestamped batch directories (lexicographical sort of ISO-like names).
2. Load `meta.json` from each; compare sanitized hashes.
3. Load `terms.md` from each batch, split into paragraphs on blank-line boundaries.
4. Filter paragraphs against ignore regexes.
5. Compute added vs. removed sets using membership comparison.
6. Emit markdown report with:
   - Hash comparison table
   - Added paragraphs (truncated to 400 chars)
   - Removed paragraphs
   - Summary guidance
7. Exit codes: `0` (no change), `1` (change), `2` (not enough batches / error).

## CI Integration (Example)

In a GitHub Actions workflow (pseudo):
```yaml
steps:
  - run: npm run capture:samgov
  - run: npm run diff:samgov
  - name: Commit diff if changed
    if: failure() # diff exits 1 on change
    run: |
      git add docs/analysis/diffs/sam-gov-*.md data/captures/sam-gov/*/meta.json
      git commit -m "chore(samgov): detected terms change (auto-diff)"
      git push
```

## When to Re-Score

Trigger manual review if any of the following change paragraphs:
- Enumerated section list or heading text
- NDA clauses (# and obligations)
- D&B licensing definitions or permissible use terms
- Monitoring / CUI / PII paragraphs
- Privacy Policy analytics scope or retention language
- API usage / credential rotation requirements

## Potential Future Enhancements
- Inline intra-paragraph diff (LCS) for added/removed sentences.
- Date / effective version detector feeding a version history JSON ledger.
- Notification hook (email / webhook) when exit code = 1.

---
Maintained automatically; edit patterns cautiously to avoid masking real legal changes.
