# rightsAssessor.js

This script implements the rights assessment logic for the Terms Guardian extension. It uses a rule-based rubric with tunable weights and normalization, and is designed to be augmented or swapped with a learned model later. For the formal methodology and output contract, see `docs/analysis/rights-scoring-spec.md`.

## Purpose

This script aims to analyze legal texts (such as Terms of Service and Privacy Policies) to assess the potential impact on user rights. It identifies patterns and language that might indicate positive or negative implications for users.

## Structure

### Functions

#### `createRightsAssessor({ log, logLevels, commonWords = [], legalTermsDefinitions = {} })`

Creates and returns an object with functions for assessing rights implications in text.

- Takes `log` (a logging function), `logLevels` (log level definitions), `commonWords` (an array of common words), and `legalTermsDefinitions` (an object with legal term definitions) as arguments.
- Uses constants for rights assessment (`POSITIVE`, `NEGATIVE`, `OBLIGATIONS`) from `LEGAL_PATTERNS.RIGHTS`.
- Returns an object with the `analyzeContent` function.

#### `chunkText(text, chunkSize = 500)`

Chunks the given text into smaller segments for analysis.

- Takes `text` (the text content) and an optional `chunkSize` (defaulting to 500) as arguments.
- Splits the text into sentences and groups them into chunks of approximately the specified size.
- Returns an array of text chunks.

#### `analyzeRightsPatterns(text)`

Analyzes the text for patterns related to user rights.

- Uses compiled clause-level patterns (via a mega-regex with named groups) to count clause signals per chunk.
- Produces a normalized, capped score on a 0–100 scale (higher is better). See `docs/analysis/rights-scoring-spec.md` for equations, caps, and grading.

#### `identifyUncommonWords(text)`

Identifies uncommon words in the text.

- Takes `text` as an argument.
- Splits the text into words and checks if each word is in the `commonWords` list.
- If a word is not common, it attempts to fetch its definition using `fetchDefinition()`.
- Returns an array of uncommon words with their definitions.

#### `fetchDefinition(word)`

Fetches the definition of a word.

- Currently a placeholder function until API integration is implemented.
- Takes a `word` as an argument.
- Returns `null` for now. (Will eventually fetch definitions from an API.)

#### `analyzeContent(text)`

Performs the main analysis of the text to assess rights implications.

- Chunks the text using `chunkText()`.
- Analyzes each chunk using `analyzeRightsPatterns()` and calculates an average score.
- Identifies uncommon words using `identifyUncommonWords()`.
- Returns an object with the following information:
  - `rightsScore`: The average rights score (0–100).
  - `uncommonWords`: An array of uncommon words with definitions.
  - `details`: Additional details like chunk count, average score, and a placeholder confidence score.

## Usage

This script is used by the service worker (`service-worker.js`) to analyze the rights implications of legal documents.

## Additional Sections

### Dependencies

- `LEGAL_PATTERNS` and `RIGHTS_PATTERNS`: Provides predefined patterns for legal text and rights analysis.
- `commonWords`: A list of common words to exclude from uncommon word identification.
- `legalTermsDefinitions`: An object with definitions of legal terms.

### Scoring Rubric (Current)

Inputs

- Text (chunked) and clause-level patterns from `LEGAL_PATTERNS.CLAUSES`.
- Tunable weights and grading thresholds from `EXT_CONSTANTS.ANALYSIS.RIGHTS`.

Normalization

- Counts are normalized per N words (default 1000) to avoid length bias.

Weights (defaults; see constants for values)

- High risk penalties: arbitration, class-action waiver, unilateral changes, data sale/sharing, auto-renewal friction.
- Medium risk penalties: arbitration carveouts, vague consent, limited retention disclosure.
- Newly added high-risk clauses: negative option billing (automatic continuation unless cancelled), delegation of arbitrability (arbitrator decides scope of arbitration).
- Newly added medium-risk clauses: moral rights waiver, jury trial waiver.

Current Clause Pattern Keys

High Risk

- ARBITRATION
- CLASS_ACTION_WAIVER
- UNILATERAL_CHANGES
- DATA_SALE_OR_SHARING
- AUTO_RENEWAL_FRICTION
- NEGATIVE_OPTION_BILLING
- DELEGATION_ARBITRABILITY

Medium Risk

- ARBITRATION_CARVEOUTS
- VAGUE_CONSENT
- LIMITED_RETENTION_DISCLOSURE
- MORAL_RIGHTS_WAIVER
- JURY_TRIAL_WAIVER

Positives

- CLEAR_OPT_OUT
- SELF_SERVICE_DELETION
- NO_DATA_SALE
- TRANSPARENT_RETENTION

Diagnostics & Transparency

The sidepanel exposes dictionary cache metrics today. To aid transparency of the rubric, `rightsAssessor` now returns aggregated `details.clauseCounts` which can be surfaced in future UI updates. A future enhancement (optional) is to display a table mapping pattern keys to weights so users can understand how the score was derived.

- Positive protections: clear opt-out, self-service deletion, no data sale, transparent retention.
- Caps prevent extreme sums from dominating (max negative and positive).

Score and Grade

- Base score 100, add capped positives and negatives (negatives are negative numbers), clamp to [0,100].
- Grade mapping: A≥85, B≥75, C≥65, D≥50, else F (configurable in constants).

Confidence

- Weighted combination of coverage (chunks vs. length), signal strength (clause counts), and type detection (legal headers).
- Weights are configurable under `ANALYSIS.RIGHTS.CONFIDENCE`.

Output

- rightsScore (0–100), grade (A–F), confidence (0–1), uncommonWords, and details (signals, counts).

### Future Enhancements

- TensorFlow.js Integration: Replace the rule-based step with a learned model while keeping the same output contract.

### Error Handling

The `analyzeContent` function includes a `try...catch` block to handle errors during analysis and returns a default result with an error message.
