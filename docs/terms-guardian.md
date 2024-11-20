# Structure

This document outlines the structure and organization of the Terms Guardian Chrome extension's codebase.

## Root Directory

* `manifest.json`: The main configuration file for the extension.

## SRC Root

* Contains all the source code for the extension.

## SRC / Analysis Directory

* `isLegalText.js`:
  * Purpose: Analyzes text content to determine if it's a legal document.
  * Associated scripts:
    * `textExtractor.js`: Extracts text from web pages.
    * `legalTerms.js`: Provides a list of legal terms.
    * `legalPatterns.js`:  (Optional) Defines patterns for identifying legal text.
    * `domManager.js`: Manages DOM interaction and analysis.
  * Summary: This script uses `textExtractor.js` to extract text and then analyzes it to determine if it's a legal document based on the number and density of legal terms. It returns `true` if the text is likely a legal document, `false` otherwise. It also triggers different actions (notifications, highlighting, prompting to read graded text) based on the number of legal terms found.
* `readabilityGrader.js`:  (Purpose and summary)
* `rightsAssessor.js`: (Purpose and summary)
* `summarizeTos.js`: (Purpose and summary)
* `textExtractor.js`: (Purpose and summary)
* `uncommonWordsIdentifier.js`: (Purpose and summary)

## SRC / Background Directory

* `service-worker.js`:
  * Purpose: The main background script for the extension, handling context menus, notifications, message passing, and analysis.
  * Summary:  (Provide a brief summary of the service worker's functionality)

## SRC / Content Directory

* `content.js`:
  * Purpose: The main content script, injected into web pages to detect legal terms, notify the user, and update the extension badge.
  * Summary: (Provide a brief summary of the content script's functionality)

## SRC / Data Directory

* `commonWords.js`: (Purpose and summary)
* `legalPatterns.js`: (Purpose and summary)
* `legalTerms.js`: (Purpose and summary)
* `legalTermsDefinitions.js`: (Purpose and summary)

### SRC / Data / Cache Subdirectory

* `textCache.js`: (Purpose and summary)
* `textCacheConfig.js`: (Purpose and summary)
* `textCacheWithRecovery.js`: (Purpose and summary)

### SRC / Data / Dictionaries Subdirectory

* `dict-a.json` through `dict-z.json`: (Purpose and summary)
* `extract.js`: (Purpose and summary)

## SRC / Panel Directory

* `sidepanel.html`: (Purpose and summary)
* `sidepanel.js`: (Purpose and summary)

## SRC / Styles Directory

* `styles.css`: (Purpose and summary)

## SRC / Utils Directory

* `constants.js`:
  * Purpose: Defines and manages all constants and configuration values for the extension.
  * Summary: Centralizes constants for maintainability, readability, and consistency.

* `debugger.js`: (Purpose and summary)
* `domManager.js`:
  * Purpose: Manages DOM interaction and analysis, delegating to specific DOM handler modules.
  * Summary: Orchestrates the process of identifying the main content area, extracting headings, and handling different DOM structures.

### SRC / Utils / Handlers Subdirectory

* `baseDomHandler.js`: (Purpose and summary)
* `dynamicDomHandler.js`: (Purpose and summary)
* `heuristicDomHandler.js`: (Purpose and summary)
* `layoutDomHandler.js`: (Purpose and summary)
* `semanticDomHandler.js`: (Purpose and summary)
* `specialCaseDomHandler.js`: (Purpose and summary)
