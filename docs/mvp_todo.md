# [ARCHIVED] MVP TODO Checklist — Terms Guardian (as of 2025-09-17)

> Status: Archived. This file represents historical planning notes and is superseded by README, docs/launch/mvp.md, and current QA guides. For active machine-learning readiness tasks, see `docs/ml-enhancement-plan.md` and the Phase 3 workstreams in `docs/roadmap-and-todos.md`.

## UPDATED NEXT ACTIONS

1. **COMPLETED**: All core analysis modules integrated into main pipeline
2. **COMPLETED**: Data structure alignment between analysis and UI
3. **COMPLETED**: Key excerpts and section summaries implemented
4. **COMPLETED**: Build system working (non-minified)
5. **COMPLETED**: Integration tested on sample ToS pages
6. **COMPLETED**: Hash-based caching system with change detection
7. **COMPLETED**: API layer with PostgreSQL database backend
8. **COMPLETED**: Settings UI with privacy controls and cache management
9. **COMPLETED**: Comprehensive test suite with cache flow testing
10. **Fix Terser Issues**: Resolve minification errors for production build
11. **Bundle Optimization**: Address large dictionary bundle sizes
12. **Document Training Progress**: Keep `docs/training_progress.md` updated with model/dataset/thresholds

- [x] Dev and prod webpack configs
- [x] Verify production build bundles (use `npm run build:verify`)
- [x] Lightweight manual smoke test on a known ToS page (local HTML fixture ok)
- [x] Hash-based content caching with performance optimization
- [x] Database integration with API server and Docker infrastructure
- [x] User settings interface with processing mode controls
- [x] Cache flow testing and validation
- [ ] **Bundle Size Optimization** - Large dictionary bundles need code splitting

## Documentation

- [x] README and architecture overview
- [x] Short "How to run tests and build" developer quickstart (see `docs/dev_quickstart.md`)
- [x] Minimal QA checklist for MVP manual verification (see `docs/qa_checklist.md`)

## **🔥 CRITICAL PATH TO MVP**

### Phase 1: Core Integration (Week 1)

1. **Integrate Readability Grading** - Add `ReadabilityGrader` to `performFullAnalysis()`
2. **Integrate Summarization** - Add `SummarizeTos` to analysis pipeline
3. **Fix Data Structure** - Align analysis results with sidepanel expectations
4. **Fix Rights Score Format** - Convert rights object to percentage for UI

### Phase 2: Enhanced Features (Week 2)

1. **Implement Key Excerpts** - Extract important legal clauses/sections
2. **Generate Section Summaries** - Create structured section-by-section summaries
3. **Add Runtime Diagnostics Toggle** - UI toggle for diagnostics mode
4. **✅ Create Local Test Fixtures** - HTML fixtures under `docs/fixtures/` for testing

### Phase 3: Optimization & Testing (Week 3)

1. **Bundle Optimization** - Code splitting for dictionaries and optional modules
2. **Performance Optimization** - Web workers for heavy analysis, better caching
3. **✅ Manual Smoke Testing** - 10-minute test on sample ToS page
4. **QA Checklist Finalization** - Pass/fail verification with test results

## IMPLEMENTATION STATUS MATRIX

| Feature              | Module Status | Integration Status | UI Status | Priority |
| -------------------- | ------------- | ------------------ | --------- | -------- |
| Legal Detection      | Complete      | Complete           | Complete  | -        |
| Rights Assessment    | Complete      | Complete           | Complete  | -        |
| Readability Grading  | Complete      | Complete           | Complete  | -        |
| Summarization        | Complete      | Complete           | Complete  | -        |
| Uncommon Words       | Complete      | Complete           | Complete  | -        |
| Key Excerpts         | Complete      | Complete           | Complete  | -        |
| Section Summaries    | Complete      | Complete           | Complete  | -        |
| Dictionary Terms     | Complete      | Complete           | Complete  | -        |
| Hash-Based Caching   | Complete      | Complete           | Complete  | -        |
| Database Integration | Complete      | Complete           | Complete  | -        |
| Settings UI          | Complete      | Complete           | Complete  | -        |
| Cache Management     | Complete      | Complete           | Complete  | -        |
| Test Infrastructure  | Complete      | Complete           | Complete  | -        |

## Latest Milestone Achievements (September 17, 2025)

### Hash-Based Caching System

- **Content Hash Service**: SHA-256 based change detection with crypto fallback for Jest compatibility
- **Enhanced Cache Service**: Multi-tier caching with local and cloud storage options
- **Performance Optimization**: Intelligent cache hit/miss detection reduces redundant processing

### Database Backend Integration

- **REST API Server**: Full CRUD operations with Express.js and PostgreSQL
- **Docker Infrastructure**: Containerized services with health checks and persistence
- **Database Service**: Auto-detection of Jest vs production environments

### Advanced Settings Interface

- **User Privacy Controls**: Local-only vs cloud processing mode selection
- **Cache Management**: Statistics display, manual cache clearing, export functionality
- **Settings Persistence**: User preferences stored and synchronized across sessions

### Testing Infrastructure Enhancements

- **Cache Flow Testing**: Comprehensive test suite covering 16 cache scenarios
- **Node Crypto Compatibility**: Multi-tier crypto fallback eliminates Jest test errors
- **Mock Services**: Enhanced testing utilities for localStorage and service interfaces

## MVP Definition

- Detect legal/ToS pages and extract text
- Provide summary, readability, and rights assessment
- Identify uncommon legal terms with definitions
- Present results in side panel and update the extension badge
- Basic stability: no runtime errors in common flows; production build works
- Core tests pass for critical paths (content <-> background messaging, analysis pipeline, sidepanel render)

Note: ML augmentation is additive and considered Post‑MVP. For MVP we rely on the rule-based rights rubric; the browser ML assists precision/recall when enabled. Progress and thresholds tracked in `docs/training_progress.md`.

## Status Snapshot

- Core analysis modules implemented: done
- Content script and background service worker: implemented; key flows covered by tests
- Side panel UI and assets: implemented; diagnostics toggle available
- Build system (webpack/babel) and Jest setup: implemented and recently optimized; prod build verified
- **⚠️ CRITICAL GAP**: Core features exist but are not integrated into main analysis pipeline

## MVP Checklist

### Core Features

- [x] Legal text detection (`isLegalText`)
- [x] Readability grading module (`readabilityGrader`) - **MODULE EXISTS**
- [x] Rights assessment (baseline rules; ML later)
- [x] Summarization module (`summarizeTos`) - **MODULE EXISTS**
- [x] Uncommon words with definitions
- [x] Badge updates and side panel display

### Integration & Messaging

- [x] Content script triggers analysis when legal text detected
- [x] Background service worker routes messages and state
- [x] End-to-end smoke path validated in tests (content -> background -> panel)

### **🚨 CRITICAL INTEGRATION GAPS**

- [x] **Readability Grading Integration** - Module exists and is called in `performFullAnalysis()`
- [x] **Summarization Integration** - Module exists and is used in analysis pipeline
- [x] **Key Excerpts Feature** - UI exists and extraction logic is implemented
- [x] **Section Summaries Generation** - UI exists and summarizer creates section data
- [x] **Analysis Results Structure** - Aligned analysis output with sidepanel expectations
- [x] **Rights Score Format** - Analysis returns proper format for UI (0-1 scale)

### Testing (critical for MVP)

- [x] Constants/config tests stable
- [x] Content script tests (jsdom env and DOM mocks)
- [x] Service worker tests (Chrome APIs and env mocked)
- [x] Debugger utility tests (performance.now mocked and expectations aligned)
- [x] Webpack prod config tests (plugin order/mocks stabilized)

## References

- Progress details and historical notes: `dev_progress.md`
- Architecture: `docs/architecture.md`
- Test helpers and Chrome mocks: `__tests__/helpers/*`
- **CRITICAL**: Core features exist but users can't access them due to integration gaps
