# Structure

This document outlines the structure and organization of the Terms Guardian Chrome extension's codebase.

## Root Directory

- `manifest.json`: The main configuration file for the extension.

## SRC Root

- Contains all the source code for the extension.

## SRC / Analysis Directory

- `isLegalText.js`:
  - Purpose: Analyzes text content to determine if it's a legal document.
  - Associated scripts:
    - `textExtractor.js`: Extracts text from web pages.
    - `legalTerms.js`: Provides a list of legal terms.
    - `legalPatterns.js`: (Optional) Defines patterns for identifying legal text.
    - `domManager.js`: Manages DOM interaction and analysis.
  - Summary: This script uses `textExtractor.js` to extract text and then analyzes it to determine if it's a legal document based on the number and density of legal terms. It returns `true` if the text is likely a legal document, `false` otherwise. It also triggers different actions (notifications, highlighting, prompting to read graded text) based on the number of legal terms found.
- `readabilityGrader.js`:
  - Purpose: Grades the readability of legal text using algorithms such as Flesch-Kincaid, Dale-Chall, and Gunning Fog Index.
  - Summary: Analyzes the complexity of legal documents and assigns a readability grade to help users understand how difficult the text is to read.
- `rightsAssessor.js`:
  - Purpose: Assesses the rights, obligations, and risks present in legal documents.
  - Summary: Identifies clauses that affect user rights, highlights obligations, and flags potential risks or limitations in the agreement.
- `summarizeTos.js`:
  - Purpose: Summarizes lengthy Terms of Service documents for user-friendly consumption.
  - Summary: Extracts and condenses key sections and clauses, providing a concise summary and section-by-section breakdown for easier understanding.
- `textExtractor.js`:
  - Purpose: Extracts relevant sections and content from legal documents.
  - Summary: Identifies and pulls out the main body of legal agreements, removing extraneous or unrelated content for focused analysis.
- `uncommonWordsIdentifier.js`:
  - Purpose: Flags uncommon or complex legal terms within documents.
  - Summary: Scans the text for rare or difficult words, providing definitions to help users understand specialized legal language.

## SRC / Background Directory

- `service-worker.js`:
  - Purpose: The main background script for the extension, handling context menus, notifications, message passing, and analysis.
  - Summary: (Provide a brief summary of the service worker's functionality)

## SRC / Content Directory

- `content.js`:
  - Purpose: The main content script, injected into web pages to detect legal terms, notify the user, and update the extension badge.
  - Summary: (Provide a brief summary of the content script's functionality)

## SRC / Data Directory

- `commonWords.js`:
  - Purpose: Provides a list of common English words for filtering and analysis.
  - Summary: Used to distinguish between common and uncommon words, supporting readability grading and uncommon word identification.
- `legalPatterns.js`:
  - Purpose: Defines regex and phrase patterns for legal analysis.
  - Summary: Contains patterns for detecting rights, obligations, privacy clauses, liability, dispute resolution, and other legal concepts in text.
- `legalTerms.js`:
  - Purpose: Lists legal terms for detection in documents.
  - Summary: Supplies the core vocabulary for identifying legal agreements and relevant clauses within web page content.
- `legalTermsDefinitions.js`:
  - Purpose: Provides definitions for legal terms.
  - Summary: Maps legal vocabulary to plain-language definitions, enabling the extension to explain complex terms to users.

### SRC / Data / Cache Subdirectory

- `textCache.js`:
  - Purpose: Caches extracted legal text for performance and reliability.
  - Summary: Temporarily stores analyzed text to avoid redundant processing and improve extension responsiveness.
- `textCacheConfig.js`:
  - Purpose: Configures caching behavior for legal text extraction.
  - Summary: Sets cache duration, size limits, and recovery strategies for the text cache system.
- `textCacheWithRecovery.js`:
  - Purpose: Adds recovery mechanisms to the text cache.
  - Summary: Ensures cached data can be restored after errors or browser restarts, improving robustness.

### SRC / Data / Dictionaries Subdirectory

- `dict-a.json` through `dict-z.json`:
  - Purpose: Dictionary files for word lookup and definitions.
  - Summary: Contain word lists and definitions used for uncommon word identification and explanation.
- `extract.js`:
  - Purpose: Extracts and processes dictionary data.
  - Summary: Handles loading and parsing of dictionary files for use in analysis modules.

## SRC / Panel Directory

- `sidepanel.html`:
  - Purpose: Provides the HTML structure for the extension's side panel UI.
  - Summary: Defines the layout and elements for displaying analysis results, summaries, and user interactions.
- `sidepanel.js`:
  - Purpose: Manages the logic and interactivity of the side panel UI.
  - Summary: Handles rendering of analysis results, user actions, and communication with background/content scripts.

## SRC / Styles Directory

- `styles.css`:
  - Purpose: Defines styles for highlighted text, the side panel, and popup interface.
  - Summary: Ensures a consistent and visually appealing user experience across the extension's UI components.

## SRC / Utils Directory

- `constants.js`:

  - Purpose: Defines and manages all constants and configuration values for the extension.
  - Summary: Centralizes constants for maintainability, readability, and consistency.

- `debugger.js`:
  - Purpose: Provides logging and debugging utilities for the extension.
  - Summary: Implements configurable log levels, performance monitoring, and error tracking to aid development and troubleshooting.
- `domManager.js`:
  - Purpose: Manages DOM interaction and analysis, delegating to specific DOM handler modules.
  - Summary: Orchestrates the process of identifying the main content area, extracting headings, and handling different DOM structures.

### SRC / Utils / Handlers Subdirectory

- `baseDomHandler.js`:
  - Purpose: Provides a base class for DOM handler modules.
  - Summary: Supplies shared logic and interfaces for specialized DOM handlers to extend.
- `dynamicDomHandler.js`:
  - Purpose: Handles dynamic or JavaScript-rendered web page content.
  - Summary: Detects and processes content that changes after initial page load, ensuring accurate extraction.
- `heuristicDomHandler.js`:
  - Purpose: Applies heuristics to identify main content areas in complex layouts.
  - Summary: Uses rules and scoring to select the most relevant DOM nodes for legal text extraction.
- `layoutDomHandler.js`:
  - Purpose: Handles extraction based on page layout and structure.
  - Summary: Analyzes the visual and structural layout to accurately extract legal documents from multi-column or grid-based pages.
- `semanticDomHandler.js`:
  - Purpose: Uses semantic HTML tags and attributes to identify legal content.
  - Summary: Leverages elements like `<section>`, `<article>`, and ARIA roles to improve extraction accuracy.
- `specialCaseDomHandler.js`:
  - Purpose: Handles known special cases and exceptions in web page structures.
  - Summary: Implements custom logic for sites with unique or problematic layouts that require tailored extraction strategies.
