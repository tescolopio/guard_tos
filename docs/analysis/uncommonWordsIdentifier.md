# uncommonWordsIdentifier.js

This script provides enhanced word identification functionality, integrating with a dictionary service to identify and define uncommon words in legal texts.

## Purpose

This script aims to:

* Identify uncommon words in legal documents that might be unfamiliar to users.
* Provide definitions for those uncommon words to aid comprehension.
* Prioritize legal terms and compound terms for more accurate identification.
* Improve the user experience by highlighting potentially confusing or important terminology.

## Structure

### Functions

#### `createUncommonWordsIdentifier({ log, logLevels, commonWords, legalTerms, legalTermsDefinitions, config })`

Creates and returns an object with functions for identifying and defining uncommon words.

* Takes `log` (logging function), `logLevels` (log level definitions), `commonWords` (an array of common words to exclude), `legalTerms` (an array of legal terms), `legalTermsDefinitions` (an object with legal term definitions), and `config` (configuration options) as arguments.
* Validates the input arrays (`commonWords` and `legalTerms`).
* Creates instances of `textExtractor` and `dictionaryService`.
* Sets default configuration options and merges them with the provided `config`.
* Creates a `processedCache` to store fetched definitions.
* Returns an object with the following functions:
  * `identifyUncommonWords`: Identifies uncommon words in a text and their definitions.
  * `clearCache`: Clears the internal cache and the dictionary service cache.
  * `_test`: (For testing) Exposes internal functions and variables for testing.

#### `extractWords(text)`

Extracts words from the text, prioritizing legal terms and optionally including compound terms.

* Splits the text into words using `textExtractor.splitIntoWords()`.
* Filters out common words and words shorter than the configured `minWordLength`.
* Optionally extracts compound terms (e.g., "good faith").
* Sorts the words, prioritizing legal terms.
* Returns an array of unique uncommon words.

#### `extractCompoundTerms(text)`

Extracts compound terms (multi-word expressions) from the text.

* Splits the text into words.
* Iterates through the words, checking for hyphenated words and combinations of 2 or 3 consecutive words that match legal terms or have definitions in `legalTermsDefinitions`.
* Returns an array of unique compound terms.

#### `getDefinition(word)`

Retrieves the definition of a word, prioritizing legal term definitions and using a cache to store fetched definitions.

* Checks if the word is in the `processedCache`. If found and not expired, returns the cached definition.
* If `prioritizeLegalTerms` is true and the word has a definition in `legalTermsDefinitions`, returns that definition.
* Otherwise, attempts to fetch the definition from the `dictionaryService`.
* Caches the fetched definition if found.
* Returns the definition or `null` if not found.

#### `processBatch(words)`

Processes a batch of words concurrently to fetch their definitions.

* Divides the words into batches of the configured `batchSize`.
* Uses `Promise.all` to fetch definitions for each word in a batch concurrently.
* Returns an array of words with their definitions.

#### `identifyUncommonWords(text)`

Identifies uncommon words in the given text and their definitions.

* Extracts words from the text using `extractWords()`.
* Processes the words in batches using `processBatch()`.
* Returns an array of uncommon words with their definitions.

#### `clearCache()`

Clears the internal cache (`processedCache`) and the cache of the `dictionaryService`.

## Usage

This script is used by the service worker (`service-worker.js`) to identify and define uncommon words in legal documents.

## Additional Sections

### Dependencies

* `textExtractor.js`: Used for splitting text into words.
* `legalDictionaryService.js`: Provides access to a dictionary service for fetching definitions.
* `commonWords.js`: Provides a list of common words to exclude.
* `legalTerms.js`: Provides a list of legal terms.
* `legalTermsDefinitions.js`: Provides an object with legal term definitions.

### Configuration

The `config` object allows for customization of the following options:

* `minWordLength`: The minimum length of a word to be considered uncommon.
* `definitionCacheTime`: The duration (in milliseconds) for which definitions are cached.
* `batchSize`: The number of words to process in each batch.
* `prioritizeLegalTerms`: Whether to prioritize definitions from `legalTermsDefinitions` over the dictionary service.
* `compoundTerms`: Whether to extract compound terms.

### Error Handling

The `extractWords`, `extractCompoundTerms`, and `identifyUncommonWords` functions include `try...catch` blocks to handle potential errors and provide informative logging.
