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

- **Advanced ToS Detection**: Automatically detects when you're viewing a Terms of Service agreement with 95%+ accuracy using machine learning pattern recognition.
- **Comprehensive Analysis Pipeline**: Provides a complete analysis including readability assessment, rights evaluation, content summarization, and legal term identification.
- **Multi-Algorithm Readability Assessment**: Grades text complexity using three proven algorithms:
  - Flesch Reading Ease
  - Flesch-Kincaid Grade Level
  - Gunning Fog Index
- **Comprehensive Rights Assessment**: Analyzes user rights protection using pattern detection for 15+ clause types including:
  - Arbitration clauses and class action waivers
  - Liability limitations and indemnification
  - Data collection and sharing practices
  - Automatic renewal and billing terms
  - Delegation of arbitrability and jury trial waivers
- **Intelligent Content Summarization**: Generates both overall summaries and section-by-section breakdowns in plain language.
- **Legal Dictionary Integration**: Identifies and defines uncommon legal terms with frequency analysis and comprehensive definitions.
- **Hash-Based Caching System**: Intelligent caching that detects document changes and avoids reprocessing unchanged content.
- **User Privacy Controls**: Choose between cloud processing (shared results) or local-only processing for complete privacy.
- **Interactive Analysis Interface**: Detailed side panel with:
  - Interactive tooltips with detailed metrics and explanations
  - Key excerpt extraction for quick review
  - Cache statistics and performance monitoring
  - Configurable settings and preferences
- **Performance Optimized**: Fast analysis (sub-second) with lazy-loaded components and optimized bundle size.
- **Database Backend**: Optional cloud storage for shared analysis results with full API integration.

## Additional Functionality

- Detects and highlights legal agreements on web pages
- Extracts relevant legal text for easy reading
- Opens a side panel with detailed information when activated

## Extension Installation

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

- The extracted legal text with intelligent text processing
- A comprehensive summary of the legal document with section breakdowns
- Readability grades with interactive tooltips showing detailed metrics from multiple algorithms
- Rights retention assessment with clause-by-clause breakdown and risk analysis
- Dictionary definitions for legal terms with frequency analysis
- Key excerpts highlighting the most important clauses
- Cache statistics and performance metrics
- Configurable settings for processing mode and privacy preferences

### Advanced Features

**Settings Panel**: Access advanced configuration options including:

- **Processing Mode**: Choose between cloud processing (shared results) or local-only processing
- **Cache Management**: View cache statistics, clear cached data, and configure retention policies
- **Analysis Preferences**: Enable/disable specific analysis features and debug modes
- **Export Options**: Export settings and analysis data for backup or sharing

**Hash-Based Caching**: The extension intelligently detects when documents have changed and avoids reprocessing unchanged content, improving performance and reducing server load.

**Database Integration**: Optional cloud storage allows sharing of analysis results across users while maintaining full privacy controls.

### Tooltip Features

Hover over any grade or score to see detailed information:

- **Readability Grades**: Shows individual algorithm scores (Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index) with explanations
- **Rights Assessment**: Displays detected clause types, confidence levels, and impact on overall score
- **Color-coded Indicators**: Visual risk assessment (green=good, yellow=moderate, red=concerning)
- **Performance Metrics**: Cache hit rates, processing times, and system statistics

## Performance Metrics

- **Bundle Size**: 77KB essential bundles (84% under 500KB target)
- **Analysis Speed**: Sub-second performance on most documents
- **Detection Accuracy**: 95%+ ToS page identification
- **Test Coverage**: 114 tests passing across 22 test suites
- **Memory Usage**: Optimized with lazy-loaded dictionaries (200KB+ of legal definitions)
- **Cache Performance**: Hash-based change detection with configurable retention policies
- **Database Integration**: Optional cloud storage with full API backend support
- **Privacy Controls**: Local-only processing option for sensitive documents

## Development Status

**Current Version**: Production-ready with advanced caching and database integration

### Completed Features

- Core ToS detection and analysis pipeline with hash-based caching
- Multi-algorithm readability assessment with confidence scoring
- Comprehensive rights scoring system with 15+ clause pattern detection
- Interactive tooltip system with detailed metrics and explanations
- Intelligent content summarization with section-by-section breakdowns
- Legal dictionary integration with frequency analysis and definitions
- Hash-based caching system with change detection and performance optimization
- Database backend with API integration for shared results
- User privacy controls with local-only and cloud processing modes
- Advanced settings interface with cache management and export capabilities
- Optimized build process with code splitting and performance monitoring
- Comprehensive test suite (114 tests passing across 22 suites)
- Manual QA verification on real ToS pages with performance benchmarks

### Architecture Components

- **Content Hash Service**: SHA-256 based change detection with metadata generation
- **Enhanced Cache Service**: Multi-tier caching with local and cloud storage options
- **Database Service**: RESTful API integration with PostgreSQL backend
- **User Preference Service**: Configurable settings with privacy controls
- **Analysis Pipeline**: Modular analysis system with performance optimization

## Technical Architecture

- `background.js`: Handles background processes and communication between components
- `content.js`: Detects and highlights legal text on web pages
- `popup.js`: Manages the extension's popup interface
- `textExtractor.js`: Extracts relevant legal text from web pages
- `summarizer.js`: Generates summaries of legal documents
- `readabilityGrader.js`: Calculates readability scores using various algorithms
- `rightsAssessor.js`: Evaluates the rights retention based on the ToS content
- `styles.css`: Defines styles for highlighted text and the popup interface

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for database integration)
- Chrome browser for extension testing

### Installation

```bash
# Clone and install dependencies
npm install

# Install API server dependencies
cd api && npm install && cd ..

# Start development environment with database
docker-compose up -d

# Build extension in development mode
npm run build:dev

# Run comprehensive test suite
npm test

# Start development server with hot reload
npm run watch
```

### Project Structure

```text
src/
├── analysis/          # Core analysis algorithms and pattern detection
├── background/        # Service worker and background processing
├── content/          # Content script for page interaction
├── data/             # Legal patterns, dictionaries, and cached data
├── panel/            # Side panel UI and settings interface
├── services/         # Hash service, cache service, database integration
├── styles/           # CSS styling and responsive design
└── utils/            # Shared utilities and DOM management

api/                  # REST API server for database integration
__tests__/           # Comprehensive test suite with mocking utilities
config/              # Webpack and build configuration
docs/                # Architecture documentation and design specifications
```

### Testing

- **Unit Tests**: 114 tests covering all core functionality
- **Integration Tests**: Cache flow and database interaction testing
- **Mock Services**: Comprehensive mocking for browser APIs and external services
- **Performance Tests**: Bundle size and runtime performance validation

### Database Integration

The extension includes an optional API server for shared results and advanced caching:

```bash
# Start database services
docker-compose up postgres redis

# Initialize database schema
npm run db:migrate

# Start API server
cd api && npm start
```

## Permissions

The extension requires the following permissions:

- `activeTab`: To access and modify the content of the active tab
- `notifications`: To display notifications when legal agreements are detected
- `tabs`: To interact with browser tabs
- `scripting`: To inject content scripts into web pages

## Contributing

### Code Standards

- ES6+ JavaScript with comprehensive JSDoc documentation
- Modular architecture with clear separation of concerns
- Comprehensive test coverage for all new features
- Performance-first development with bundle size monitoring
- Privacy-by-design with configurable data handling

### Development Workflow

1. Create feature branch following conventional commit patterns
2. Implement changes with corresponding test coverage
3. Validate with comprehensive test suite and manual QA
4. Submit pull request with detailed description and performance impact analysis

Contributions to Terms Guardian are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with descriptive commit messages
4. Push your changes to your fork
5. Submit pull request to the main repository

## Developer docs

- Developer quickstart: docs/dev_quickstart.md
- QA checklist: docs/qa_checklist.md

### Optional: Train the on-device classifier

We include a minimal Python script to train a small TF‑IDF + Logistic Regression model and export it to the JSON format consumed by `src/ml/clauseClassifier.js`.

Steps:

1. Prepare a CSV/JSONL file with columns `text` and `label` (or `labels`). See `docs/analysis/datasets-and-mapping.md` for sources and mapping.
2. Run `scripts/train_tfidf_logreg.py` to produce a new model JSON file under `src/data/dictionaries/` (e.g., `tfidf_logreg_v2.json`).
3. Update `EXT_CONSTANTS.ML.MODEL_VERSION` and `ASSET_PATH` in `src/utils/constants.js` to point to the new asset.

This enables fully local, browser-first ML augmentation behind the feature flag in constants.

## License

MIT License

## Contact

[time@3dtechsolutions.us](mailto:time@3dtechsolutions.us)

## ML pipeline quickstart

- Ensure your Python venv is available at `/mnt/d/guard_tos/.venv` and has the required packages (datasets, scikit-learn, pandas, numpy, tqdm).
- End-to-end:
  - `npm run ml:full`
- Individual steps:

  - `npm run ml:prep` # fetch and prepare datasets into data/clauses.jsonl
  - `npm run ml:train` # train TF‑IDF+LR and write src/data/dictionaries/tfidf_logreg_v2.json
  - `npm run ml:calibrate` # generate data/calibration_suggestions.json and docs/analysis/model-calibration.md

- Augment CLASS_ACTION_WAIVER coverage:
  - Harvest candidates: `python scripts/harvest_class_action_positives.py --input_dir ./tos_folder --out data/harvested_class_action.jsonl`
  - Option A: manually review and append approved rows into `data/clauses.jsonl`.
  - Option B: use `npm run ml:prep:aug` to include `data/harvested_class_action.jsonl` automatically, then:
    - `npm run ml:train`
    - `npm run ml:calibrate`
