# Readability Interpretation

This guide explains how we derive readability grades and how to interpret them in the UI.

## Metric

- Primary metric: Flesch Reading Ease (FRE) on 0–100 scale
- Higher is easier to read; legal text typically scores lower due to long sentences and complex words

## Score to grade mapping

- 90–100: A (Very easy) — 5th grade level; plain everyday language
- 80–89: B (Easy) — 6th grade level; simple sentences
- 70–79: C (Fairly easy) — 7th grade level
- 60–69: D (Standard) — 8th–9th grade level
- 50–59: E (Fairly difficult) — 10th–12th grade level
- <50: F (Difficult) — College level or above; dense legalese likely

Note: Internally we keep the numeric FRE for calculations like the User Rights Index’s Clarity & Transparency component.

## UI behavior

- We display both the letter grade and numeric FRE score
- A short-text guard lowers confidence and avoids over‑penalizing brief content
- Tooltips include a one‑line explanation and improvement tips when applicable

## Improvement tips (heuristic)

- Shorten sentences; prefer one idea per sentence
- Use common words instead of jargon (where legally safe)
- Add headings and lists to improve scannability

## Edge cases

- Extremely short texts (<100 words): show low confidence and avoid definitive grading
- Non‑English content: FRE may be unreliable; we note this when language detection flags mismatch (future)
