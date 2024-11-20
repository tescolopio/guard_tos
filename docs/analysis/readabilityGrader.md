# readabilityGrader.js

This script provides functions to calculate the readability grade of a text based on various algorithms.

## Purpose

This script helps assess the readability of text content by implementing and applying different readability formulas. It provides scores and grades that indicate how easy or difficult the text is to read. This information can be useful for:

* Content creators: To assess the readability of their writing and make it more accessible to their target audience.
* educators: To determine the reading level of educational materials.
* Researchers: To analyze the readability of different types of texts.

## Structure

### Functions

#### `createReadabilityGrader({ log, logLevels })`

Creates and returns an object with functions for calculating readability grades.

* Takes `log` (a logging function) and `logLevels` (log level definitions) as arguments.
* Uses `global.Constants` to access configuration values.
* Defines `SYLLABLE_PATTERNS` for syllable counting.
* Returns an object with the following functions:
  * `calculateReadabilityGrade`: Calculates the readability grade of a text.
  * `_test`: (For testing) Exposes internal functions for testing.

#### `splitIntoSentences(text)`

Splits the given text into sentences based on punctuation (`.`, `!`, `?`).

* Takes a `text` string as an argument.
* Returns an array of sentences.

#### `splitIntoWords(text)`

Splits the given text into words based on whitespace.

* Takes a `text` string as an argument.
* Returns an array of words.

#### `extractWords(text)`

Extracts words from a text, handling punctuation, special characters, contractions, and hyphenated words.

* Takes a `text` string as an argument.
* Returns an array of extracted words.

#### `countSyllablesInWord(word)`

Counts the number of syllables in a single word.

* Takes a `word` string as an argument.
* Uses a combination of regular expressions and heuristics to estimate the syllable count.
* Returns the number of syllables in the word.

#### `countSyllables(text)`

Counts the total number of syllables in a text.

* Takes a `text` string as an argument.
* Uses `extractWords()` and `countSyllablesInWord()` to count syllables.
* Returns the total syllable count.

#### `countComplexWords(text)`

Counts the number of complex words (words with 3 or more syllables) in a text.

* Takes a `text` string as an argument.
* Uses `extractWords()` and `countSyllablesInWord()` to count complex words.
* Returns the number of complex words.

#### `fleschReadingEase(text)`

Calculates the Flesch Reading Ease score. Higher scores indicate easier readability.

* Takes a `text` string as an argument.
* Uses `splitIntoSentences()`, `splitIntoWords()`, and `countSyllables()` to calculate the score.
* Returns the Flesch Reading Ease score.

#### `fleschKincaidGradeLevel(text)`

Calculates the Flesch-Kincaid Grade Level. Higher scores indicate more difficult readability.

* Takes a `text` string as an argument.
* Uses `splitIntoSentences()`, `splitIntoWords()`, and `countSyllables()` to calculate the grade level.
* Returns the Flesch-Kincaid Grade Level.

#### `gunningFogIndex(text)`

Calculates the Gunning Fog Index. Higher scores indicate more difficult readability.

* Takes a `text` string as an argument.
* Uses `splitIntoSentences()`, `splitIntoWords()`, and `countComplexWords()` to calculate the index.
* Returns the Gunning Fog Index.

#### `calculateNormalizedScores(fleschScore, kincaidScore, fogIndexScore)`

Normalizes the scores from the different readability formulas to a common scale (0 to 1).

* Takes the `fleschScore`, `kincaidScore`, and `fogIndexScore` as arguments.
* Returns an object with the normalized scores.

#### `determineGrade(averageScore, kincaidScore, fogIndexScore)`

Determines the readability grade (A, B, C, D, F) based on the average normalized score and the Flesch-Kincaid and Gunning Fog scores.

* Takes the `averageScore`, `kincaidScore`, and `fogIndexScore` as arguments.
* Uses a combination of thresholds and fine-tuning logic to determine the grade.
* Returns the readability grade.

#### `calculateReadabilityGrade(text)`

Calculates the readability grade of a text using multiple algorithms and returns an average.

* Takes a `text` string as an argument.
* Calculates readability scores using `fleschReadingEase()`, `fleschKincaidGradeLevel()`, and `gunningFogIndex()`.
* Normalizes the scores using `calculateNormalizedScores()`.
* Determines the average grade using `determineGrade()`.
* Returns an object containing the individual scores, the average grade, and a confidence metric.

## Usage

This script is used by the service worker (`service-worker.js`) and potentially other parts of the extension to analyze the readability of text content.

## Additional Sections

### Dependencies

* `global.Constants`: Provides access to configuration values and grade definitions.

### Error Handling

The `calculateReadabilityGrade` function includes a `try...catch` block to handle errors during analysis and returns an object with an error message.

### Testing

The `_test` property exposes internal functions (`countSyllablesInWord`, `extractWords`, `calculateNormalizedScores`) for testing purposes.
