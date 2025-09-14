# Terms Guardian

[![Project Banner/Logo](./images/icon128.png)]

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## We believe

- You should always know what rights you are retaining or surrendering when you agree to any Terms of Service, because knowledge is power and clear, accessible information empowers you to make informed decisions.
- Everyone deserves to understand the agreements they enter into without needing a law degree, and complex legal jargon should not stand in the way of understanding your rights and responsibilities.
- Everyone, regardless of their background, should have access to clear and concise legal documents, and companies should be held accountable for the clarity and fairness of their Terms of Service.
- Building trust between users and service providers starts with clear and honest communication, and leveraging technology to simplify legal language is a step towards a more user-friendly internet.

## What is Terms Guardian?

Terms Guardian is a web browser extension designed to empower users by demystifying the complex language often found in Terms of Service (ToS) agreements. It automatically detects ToS text on websites, grades its readability, summarizes its content into plain language, and assesses the rights retained or surrendered.

## Features

- **🔍 ToS Detection**: Automatically detects when you're viewing a Terms of Service agreement with 95%+ accuracy.
- **📄 Summary Generation**: Provides a concise summary of the ToS in plain language with section-by-section breakdowns.
- **📊 Comprehensive Readability Analysis**: Grades text complexity using three algorithms:
  - Flesch Reading Ease
  - Flesch-Kincaid Grade Level
  - Gunning Fog Index
- **⚖️ Rights Assessment**: Analyzes user rights protection using pattern detection for 15+ clause types including:
  - Arbitration clauses
  - Class action waivers
  - Liability limitations
  - Data collection practices
- **💡 Interactive Tooltips**: Hover over grades to see detailed metrics and explanations
- **📚 Legal Dictionary**: Identifies and defines uncommon legal terms with frequency analysis
- **🎯 Key Excerpts**: Extracts the most important clauses for quick review
- **⚡ Performance Optimized**: Fast analysis (<1 second) with lazy-loaded components (77KB initial bundle)

## Additional Functionality

- Detects and highlights legal agreements on web pages
- Extracts relevant legal text for easy reading
- Opens a side panel with detailed information when activated

## Installation

1. Clone this repository or download the source code.
2. Open your browser's extension management page:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
3. Enable "Developer mode" (usually a toggle in the top right corner).
4. Click "Load unpacked" (Chrome) or "Load Temporary Add-on" (Firefox).
5. Select the directory containing the extension files.

## Usage

Terms Guardian can be activated in three ways:

1. **Context Window**: Right-click on highlighted text and select the Terms Guardian option from the context menu.
2. **Popup Notification**: Click on the popup notification that appears when a legal agreement is detected on a page.
3. **Extension Icon**: Click the Terms Guardian icon in the browser's toolbar.

Once activated, a side panel will open, displaying:

- The extracted legal text (if applicable)
- A summary of the legal document
- Readability grades with interactive tooltips showing detailed metrics
- Rights retention assessment with clause-by-clause breakdown
- Dictionary definitions for legal terms
- Additional information about the detected agreement

### Tooltip Features

Hover over any grade or score to see detailed information:

- **Readability Grades**: Shows individual algorithm scores (Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index) with explanations
- **Rights Assessment**: Displays detected clause types, confidence levels, and impact on overall score
- **Color-coded Indicators**: Visual risk assessment (green=good, yellow=moderate, red=concerning)

## Performance Metrics

- **Bundle Size**: 77KB essential bundles (84% under 500KB target)
- **Analysis Speed**: Sub-second performance on most documents
- **Detection Accuracy**: 95%+ ToS page identification
- **Test Coverage**: 99 tests passing across 20 test suites
- **Memory Usage**: Optimized with lazy-loaded dictionaries (200KB+ of legal definitions)

## Development Status

**Current Version**: Production-ready for alpha testing

### ✅ Completed Features

- Core ToS detection and analysis pipeline
- Multi-algorithm readability assessment
- Comprehensive rights scoring system
- Interactive tooltip system with detailed metrics
- Optimized build process with code splitting
- Comprehensive test suite (99 tests passing)
- Manual QA verification on real ToS pages

### 🔧 In Development

- Loading state indicators for analysis
- Extended user guide documentation
- Performance monitoring dashboard

### 📋 Ready for Alpha Testing

The extension is fully functional and ready for limited user testing. All core features are implemented and tested.

## Technical Architecture

- `background.js`: Handles background processes and communication between components
- `content.js`: Detects and highlights legal text on web pages
- `popup.js`: Manages the extension's popup interface
- `textExtractor.js`: Extracts relevant legal text from web pages
- `summarizer.js`: Generates summaries of legal documents
- `readabilityGrader.js`: Calculates readability scores using various algorithms
- `rightsAssessor.js`: Evaluates the rights retention based on the ToS content
- `styles.css`: Defines styles for highlighted text and the popup interface

## Permissions

The extension requires the following permissions:

- `activeTab`: To access and modify the content of the active tab
- `notifications`: To display notifications when legal agreements are detected
- `tabs`: To interact with browser tabs
- `scripting`: To inject content scripts into web pages

## Contributing

Contributions to Terms Guardian are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with descriptive commit messages
4. Push your changes to your fork
5. Submit a pull request to the main repository

## Developer docs

- Developer quickstart: docs/dev_quickstart.md
- QA checklist: docs/qa_checklist.md

## License

MIT License

## Contact

[time@3dtechsolutions.us](mailto:time@3dtechsolutions.us)
