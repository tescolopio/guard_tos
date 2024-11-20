# rightsAssessor.js

This script implements the rights assessment logic for the Terms Guardian extension. It currently uses pattern matching as a placeholder for future integration with a TensorFlow.js model.

## Purpose

This script aims to analyze legal texts (such as Terms of Service and Privacy Policies) to assess the potential impact on user rights. It identifies patterns and language that might indicate positive or negative implications for users.

## Structure

### Functions

#### `createRightsAssessor({ log, logLevels, commonWords = [], legalTermsDefinitions = {} })`

Creates and returns an object with functions for assessing rights implications in text.

* Takes `log` (a logging function), `logLevels` (log level definitions), `commonWords` (an array of common words), and `legalTermsDefinitions` (an object with legal term definitions) as arguments.
* Uses constants for rights assessment (`POSITIVE`, `NEGATIVE`, `OBLIGATIONS`) from `LEGAL_PATTERNS.RIGHTS`.
* Returns an object with the `analyzeContent` function.

#### `chunkText(text, chunkSize = 500)`

Chunks the given text into smaller segments for analysis.

* Takes `text` (the text content) and an optional `chunkSize` (defaulting to 500) as arguments.
* Splits the text into sentences and groups them into chunks of approximately the specified size.
* Returns an array of text chunks.

#### `analyzeRightsPatterns(text)`

Analyzes the text for patterns related to user rights.

* This function is a temporary placeholder until a TensorFlow.js model is integrated.
* It uses regular expressions to count occurrences of predefined patterns categorized as `POSITIVE`, `NEGATIVE`, and `OBLIGATIONS`.
* Calculates a normalized score (0-1) based on the pattern counts, where higher scores indicate more positive implications for user rights.

#### `identifyUncommonWords(text)`

Identifies uncommon words in the text.

* Takes `text` as an argument.
* Splits the text into words and checks if each word is in the `commonWords` list.
* If a word is not common, it attempts to fetch its definition using `fetchDefinition()`.
* Returns an array of uncommon words with their definitions.

#### `fetchDefinition(word)`

Fetches the definition of a word.

* Currently a placeholder function until API integration is implemented.
* Takes a `word` as an argument.
* Returns `null` for now. (Will eventually fetch definitions from an API.)

#### `analyzeContent(text)`

Performs the main analysis of the text to assess rights implications.

* Chunks the text using `chunkText()`.
* Analyzes each chunk using `analyzeRightsPatterns()` and calculates an average score.
* Identifies uncommon words using `identifyUncommonWords()`.
* Returns an object with the following information:
  * `rightsScore`: The average rights score (0-1).
  * `uncommonWords`: An array of uncommon words with definitions.
  * `details`: Additional details like chunk count, average score, and a placeholder confidence score.

## Usage

This script is used by the service worker (`service-worker.js`) to analyze the rights implications of legal documents.

## Additional Sections

### Dependencies

* `LEGAL_PATTERNS` and `RIGHTS_PATTERNS`:  Provides predefined patterns for legal text and rights analysis.
* `commonWords`:  A list of common words to exclude from uncommon word identification.
* `legalTermsDefinitions`: An object with definitions of legal terms.

### Future Enhancements

* TensorFlow.js Integration: The current pattern-based analysis will be replaced with a more sophisticated machine learning model implemented using TensorFlow.js. This will improve the accuracy and depth of the rights assessment.

### Error Handling

The `analyzeContent` function includes a `try...catch` block to handle errors during analysis and returns a default result with an error message.
