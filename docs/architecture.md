# Terms Guardian Architecture Document

## Overview

Terms Guardian is a Chrome extension designed to analyze, summarize, and assess the legal content of Terms of Service (ToS) and Privacy Policy documents on the web. It provides users with clear, actionable insights about their rights, obligations, and risks when interacting with online services. The extension leverages a modular architecture, separating concerns across analysis, background processing, content scripting, UI presentation, and data management.

---

## High-Level Architecture

**Main Components:**

- **Analysis Modules (`src/analysis/`)**: Core logic for legal text analysis, summarization, extraction, rights assessment, readability grading, and uncommon word identification.
- **Background Service Worker (`src/background/serviceWorker.js`)**: Handles background events, context menus, notifications, and state management.
- **Content Script (`src/content/content.js`)**: Injected into web pages to detect legal documents, trigger analysis, update badges, and communicate with the background script.
- **Panel UI (`src/panel/sidepanel.js` & `src/panel/sidepanel.html`)**: Renders analysis results and user interface elements in a side panel.
- **Utilities (`src/utils/`)**: Shared constants, debugging/logging, DOM management, and general-purpose utilities.
- **Data Sources (`src/data/`)**: Legal terms, patterns, definitions, and supporting data for analysis modules.

---

## Data Flow & Extension Lifecycle

1. **Content Script Activation**: When a user navigates to a page, the content script (`content.js`) checks for the presence of legal documents (ToS, Privacy Policy, etc.) using pattern matching and keyword detection.
2. **Analysis Trigger**: If a legal document is detected, the content script invokes analysis modules (e.g., `isLegalText`, `summarizeTos`, `rightsAssessor`) to process the text.
3. **Background Coordination**: The content script communicates with the background service worker for persistent state, notifications, and context menu actions.
4. **Badge & Notification Updates**: The background script updates the extension badge and may trigger notifications based on analysis results.
5. **Panel UI Rendering**: Results are sent to the side panel, where `sidepanel.js` renders summaries, highlights, and actionable insights for the user.
6. **User Interaction**: Users can interact with the side panel to view details, summaries, and definitions of legal terms.

---

## Module Responsibilities

### 1. Analysis Modules (`src/analysis/`)

- **isLegalText.js**: Detects whether a given text is likely a legal document.
- **summarizeTos.js**: Summarizes lengthy legal documents for user-friendly consumption.
- **textExtractor.js**: Extracts relevant sections from legal documents.
- **rightsAssessor.js**: Identifies user rights, obligations, and risks.
- **readabilityGrader.js**: Grades the readability of legal text.
- **uncommonWordsIdentifier.js**: Flags uncommon or complex legal terms.

### 2. Background Service Worker (`src/background/serviceWorker.js`)

- Manages extension lifecycle events, context menus, persistent state, and notifications.
- Coordinates communication between content scripts and UI components.

### 3. Content Script (`src/content/content.js`)

- Injected into web pages to detect and extract legal documents.
- Triggers analysis and communicates with the background script.
- Updates extension badge and triggers UI updates.

### 4. Panel UI (`src/panel/sidepanel.js` & `src/panel/sidepanel.html`)

- Renders analysis results, summaries, and highlights.
- Handles user interactions within the side panel.

### 5. Utilities (`src/utils/`)

- **constants.js**: Centralized constants for use across modules.
- **debugger.js**: Debugging and logging utilities.
- **domManager.js**: DOM manipulation helpers for content and panel scripts.
- **utilities.js**: General-purpose utility functions.

### 6. Data Sources (`src/data/`)

- **legalTerms.js**: List of legal terms for detection.
- **legalTermsDefinitions.js**: Definitions for legal terms.
- **legalPatterns.js**: Regex and phrase patterns for legal analysis.
- **docPatterns.js**: Patterns for document structure (sections, lists, citations).
- **commonWords.js**: List of common words for filtering and analysis.

---

## Extension Communication & State

- **Messaging**: Uses Chrome extension messaging APIs for communication between content scripts, background scripts, and the panel UI.
- **State Management**: Persistent state (e.g., analysis results, user settings) is managed by the background service worker.
- **Notifications**: The background script can trigger Chrome notifications based on analysis outcomes.

---

## Testing & Development

- **Jest**: Unit and integration tests for core logic and analysis modules.
- **Webpack**: Bundles scripts for efficient loading and modularity.
- **Development Notes**: See `dev_progress.md` for outstanding issues and ongoing work.

---

## Future Improvements

- Enhanced NLP for deeper legal analysis
- Improved UI/UX for the side panel
- More robust test coverage (especially for background and content scripts)
- Internationalization and support for additional legal systems

---

## Diagram

```
[Web Page]
   |
[Content Script] <--> [Background Service Worker] <--> [Panel UI]
   |                        |                          |
[Analysis Modules] <--------+                          |
   |                        |                          |
[Data Sources] <------------+--------------------------+
```

---

## Authors & Contributors

- Timmothy Escolopio (tescolopio)
- 3D Tech Solutions LLC

---

## License

See `LICENSE` in the project root.
