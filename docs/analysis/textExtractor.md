# textExtractor.js

This script provides a service for extracting and caching text content from various document formats, including HTML, PDF, DOCX, and plain text. It also includes functionality for preprocessing and analyzing the extracted text.

## Purpose

This script aims to:

* **Extract text:** Efficiently extract text content from different document formats.
* **Cache text:** Cache extracted text to improve performance and reduce redundant processing.
* **Preprocess text:** Clean and normalize extracted text for analysis (e.g., removing extra whitespace, converting to lowercase).
* **Analyze text:** Perform basic analysis on the text, such as counting words and identifying legal terms.
* **Handle errors:** Provide robust error handling and reporting during extraction and analysis.

## Structure

### Functions

#### `createTextExtractor({ log, logLevels, utilities })`

Creates and returns an object with functions for extracting, processing, and analyzing text.

* Takes `log` (a logging function), `logLevels` (log level definitions), and `utilities` (an object with utility functions) as arguments.
* Uses constants from `global.Constants` for configuration.
* Sets up a `textCache` instance for managing cached text.
* Returns an object with the following functions:
  * `extract`: Extracts and processes text from various input formats.
  * `extractFromHTML`: Extracts text from HTML content.
  * `extractFromPDF`: (Placeholder) Extracts text from PDF content.
  * `extractFromDOCX`: (Placeholder) Extracts text from DOCX content.
  * `extractFromText`: Extracts text from plain text content.
  * `splitIntoSentences`: Splits text into sentences.
  * `splitIntoWords`: Splits text into words.
  * `preprocessText`: Preprocesses text by removing extra whitespace and normalizing case.
  * `clearCache`: Clears the cache.
  * `getCacheStats`: Returns statistics about the cache.

#### `handleExtractionError(error, errorType)`

Handles extraction errors by logging the error and returning an object with error information.

* Takes an `error` object and an `errorType` string as arguments.
* Logs the error using the provided `log` function and `logLevels`.
* Returns an object containing the error message and error type.

#### `extract(input, type)`

Extracts and processes text from the given input, handling different content types (HTML, PDF, DOCX, plain text).

* Takes `input` (the content to extract from) and `type` (the content type) as arguments.
* Generates a cache key using `generateFingerprint()`.
* Checks the cache for a cached result.
* If not cached, extracts the text based on the content type.
* Preprocesses the text using `preprocessText()`.
* Performs batch processing for large documents using `processBatchedContent()`.
* Analyzes the text (e.g., counts words, identifies legal terms).
* Caches the results if they meet the minimum requirements.
* Enriches the metadata using `enrichMetadata()`.
* Returns an object containing the processed text, metadata, and a flag indicating whether the result was from the cache.

#### `extractFromHTML(html)`

Extracts text from HTML content, handling potential parsing errors.

* Takes an `html` string as an argument.
* Uses `DOMParser` to parse the HTML.
* Checks for parser errors and handles them using `handleExtractionError()`.
* Analyzes the HTML structure using `analyzeHTMLStructure()`.
* Removes unwanted elements (scripts, styles, etc.) from the DOM.
* Extracts the text content while preserving the structure.
* Returns an object containing the extracted text and the structure analysis.

#### `analyzeHTMLStructure(root)`

Analyzes the structure of an HTML document to extract metadata such as headings, sections, lists, and paragraph count.

* Takes a `root` element (usually the `<body>`) as an argument.
* Uses `querySelectorAll` to find and analyze different elements.
* Returns an object with the structure analysis results.

#### `preprocessText(text)`

Preprocesses the given text by removing extra whitespace and converting it to lowercase.

* Takes a `text` string as an argument.
* Returns the preprocessed text.

#### `processBatchedContent(text)`

Processes the given text content in batches to improve performance for large documents.

* Takes a `text` string as an argument.
* Splits the text into chunks and processes each chunk concurrently using `Promise.all`.
* Returns the processed text.

#### `generateFingerprint(content)`

Generates a fingerprint for the given content based on its length, structure, and a sample of the text.

* Takes a `content` string as an argument.
* Returns a string representing the fingerprint.

#### `enrichMetadata(metadata, content)`

Enriches the metadata with additional information derived from the content, such as content statistics and analysis timestamps.

* Takes a `metadata` object and a `content` string as arguments.
* Returns the enriched metadata object.

#### `extractTextFromHighlights()`

Extracts text from highlighted elements on the page if the number of highlights exceeds a threshold.

* Returns the extracted text or null if not enough highlights are found.

#### `extractTextFromSections()`

Extracts and analyzes text from sections on the page, filtering out non-textual elements.

* Returns the extracted legal text or null if none is found.

#### `extractTextFromSection(section)`

Extracts text from a specific section, filtering out non-textual elements.

* Takes a `section` element as an argument.
* Returns the extracted text from the section or null if an error occurs.

#### `isLegalText(text)`

Checks if a given text contains enough legal terms to be considered legal text.

* Takes a `text` string as an argument.
* Returns true if the text contains enough legal terms, false otherwise.

## Usage

This script is used by the `content.js` script to extract and analyze text content from web pages. It is also used by the `isLegalText.js` script for preprocessing text before analysis.

## Additional Sections

### Dependencies

* `global.Constants`: Provides access to configuration values and thresholds.
* `global.TextCacheConfig`: Provides configuration for the text cache.
* `global.TextCacheWithRecovery`: Provides a cache implementation with recovery mechanisms.
* `global.legalTerms`: Provides a list of legal terms.

### Error Handling

The `extract` and `extractFromHTML` functions include `try...catch` blocks to handle errors during extraction and return an object with error information using `handleExtractionError()`.

### Testing

(Add any information about testing the script, if applicable.)
