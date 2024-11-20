# isLegalText.js

This script provides advanced legal text analysis using pattern matching and term density to determine if a given text is likely a legal document.

## Purpose

This script aims to accurately identify legal texts (such as Terms of Service, Privacy Policies, and other legal agreements) by analyzing various features of the text, including:

* Presence and density of legal terms.
* Patterns commonly found in legal documents (e.g., section numbering, definitions, citations).
* Structural characteristics (e.g., headings, lists).

## Structure

### Functions

#### `createLegalTextAnalyzer({ log, logLevels, legalTerms = [] })`

Creates and returns an object with functions for analyzing legal text.

* Takes `log` (a logging function), `logLevels` (log level definitions), and `legalTerms` (an array of legal terms) as arguments.
* Uses `EXT_CONSTANTS` to access configuration values.
* Creates a `textExtractor` instance using `createTextExtractor`.
* Defines `LEGAL_PATTERNS` for pattern matching.
* Returns an object with the following functions:
  * `analyzeText`: Analyzes the text and returns detailed results.
  * `isLegalText`: (Backwards compatibility) Determines if the text is legal.
  * `getLegalTermDensity`: (Backwards compatibility) Calculates the density of legal terms.
  * `_test`: (For testing) Exposes internal functions for testing.

#### `analyzeText(text)`

Analyzes the given text to determine if it's legal content.

* Extracts and preprocesses the text using `textExtractor.extract()`.
* Performs basic checks for sufficient text length.
* Splits the text into sentences and words.
* Calculates basic text metrics using `calculateTextMetrics()`.
* Analyzes patterns in the text using `analyzePatterns()`.
* Determines the legal status of the text using `determineTextStatus()`.
* Returns an object with analysis results, including:
  * `isLegal`: A boolean indicating whether the text is likely legal.
  * `confidence`: The confidence level of the analysis ('low', 'medium', or 'high').
  * `score`: The calculated score based on various metrics.
  * `metrics`: Detailed metrics including term count, density, pattern analysis, etc.

#### `calculateTextMetrics(words, sentences)`

Calculates basic text metrics, such as term count, density, proximity score, and average sentence length.

* Takes an array of `words` and an array of `sentences` as arguments.
* Calculates the frequency and distribution of legal terms.
* Calculates a proximity bonus based on the distance between legal terms.
* Returns an object with the calculated metrics.

#### `analyzePatterns(text)`

Analyzes the text for patterns commonly found in legal documents.

* Checks for patterns like section numbering, definitions, legal headers, citations, and lists.
* Calculates a pattern score based on the presence of these patterns.
* Returns an object with pattern analysis results.

#### `determineTextStatus(metrics, patternMetrics)`

Determines the legal status of the text based on the calculated metrics and pattern analysis.

* Calculates a weighted score combining density, proximity score, and pattern score.
* Determines if the text is legal based on the score and term count thresholds.
* Assigns a confidence level ('low', 'medium', or 'high') based on the term count.
* Returns an object indicating whether the text is legal, the confidence level, and the calculated score.

## Usage

This script is used by the `domManager.js` script to analyze the text content extracted from web pages.

## Additional Sections

### Dependencies

* `textExtractor.js`: Used for extracting and preprocessing text.
* `EXT_CONSTANTS`: Provides access to configuration values and thresholds.
* `legalTerms.js`: Provides a list of legal terms.

### Error Handling

The `analyzeText` function includes a `try...catch` block to handle errors during analysis and returns an object with an error message.

### Testing

The `_test` property exposes internal functions (`calculateTextMetrics`, `analyzePatterns`, `determineTextStatus`) for testing purposes.
