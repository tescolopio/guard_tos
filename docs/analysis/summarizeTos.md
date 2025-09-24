# summarizeTos.js

This script implements the Terms of Service (ToS) summarization functionality for the Terms Guardian Chrome extension. See also: `docs/enhanced-summarization-demo.md` for an example of the enhanced summarization UX and output.

## Purpose

This script aims to provide users with concise and informative summaries of legal documents, specifically Terms of Service. It analyzes the structure and content of the ToS to extract key information and present it in a more digestible format.

## Structure

### Functions

#### `createSummarizer({ compromise, cheerio, log, logLevels })`

Creates and returns an object with the `summarizeTos` function for summarizing Terms of Service.

- Takes `compromise` (a natural language processing library), `cheerio` (an HTML parsing library), `log` (a logging function), and `logLevels` (log level definitions) as arguments.
- Returns an object with the `summarizeTos` function.

#### `summarizeTos(html)`

Summarizes the given HTML content, which is assumed to be a Terms of Service document.

- Loads the HTML content using Cheerio.
- Identifies sections within the ToS using headings (`identifySections()`).
- Processes each section by extracting its text (`extractSectionText()`), summarizing it (`summarizeSection()`), and storing the original text.
- Combines the section summaries into an overall summary (`combineSummaries()`).
- Returns an object containing:
  - `overall`: The overall summary of the ToS.
  - `sections`: An array of section summaries, each with the heading, summary, and original text.
  - `metadata`: Metadata about the summarization process, including the section count and a timestamp.

#### `identifySections($)`

Identifies sections in the HTML using heading tags (h1, h2, etc.).

- Takes a Cheerio instance (`$`) as an argument.
- Iterates through the headings and extracts the heading text and the content following it until the next heading.
- Returns an array of section objects, each with a `heading` and `content` property.

#### `extractSectionText(section)`

Extracts the text content from a section object.

- Takes a `section` object as an argument.
- Returns the `content` property of the section, which is the extracted text.

#### `summarizeSection(sectionText)`

Summarizes a section of text using the `compromise.js` natural language processing library.

- Takes `sectionText` as an argument.
- Identifies key sentences in the section, including the first sentence, the last sentence, and any sentences containing important legal terms (related to conditions, legal aspects, or money).
- Combines the key sentences into a summary, removing duplicates.
- Returns the summarized text for the section.

#### `combineSummaries(sectionSummaries)`

Combines the summaries of individual sections into an overall summary.

- Takes an array of `sectionSummaries` as an argument.
- Formats each section summary with its heading.
- Concatenates the formatted section summaries into a single overall summary.
- Returns the combined summary.

## Usage

This script is used by the service worker (`service-worker.js`) to summarize the Terms of Service content extracted from web pages.

## Additional Sections

### Dependencies

- `compromise`: A natural language processing library used for text summarization.
- `cheerio`: An HTML parsing library used to extract content from web pages.

### Error Handling

The `summarizeTos`, `identifySections`, `extractSectionText`, `summarizeSection`, and `combineSummaries` functions include `try...catch` blocks to handle potential errors during the summarization process and provide informative logging.
