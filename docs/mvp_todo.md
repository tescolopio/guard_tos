# MVP TODO Checklist — Terms Guardian (as of 2025-09-10)

## **🚀 UPDATED NEXT ACTIONS**

1. **✅ COMPLETED**: All core analysis modules integrated into main pipeline
2. **✅ COMPLETED**: Data structure alignment between analysis and UI
3. **✅ COMPLETED**: Key excerpts and section summaries implemented
4. **✅ COMPLETED**: Build system working (non-minified)
5. **✅ COMPLETED**: Test the integration on sample ToS page
6. **Fix Terser Issues**: Resolve minification errors for production build
7. **Bundle Optimization**: Address large dictionary bundle sizes

- [x] Dev and prod webpack configs
- [x] Verify production build bundles (use `npm run build:verify`)
- [x] Lightweight manual smoke test on a known ToS page (local HTML fixture ok)
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

## **📊 IMPLEMENTATION STATUS MATRIX**

| Feature             | Module Status | Integration Status | UI Status   | Priority |
| ------------------- | ------------- | ------------------ | ----------- | -------- |
| Legal Detection     | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Rights Assessment   | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Readability Grading | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Summarization       | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Uncommon Words      | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Key Excerpts        | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Section Summaries   | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Dictionary Terms    | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |
| Test Infrastructure | ✅ Complete   | ✅ Complete        | ✅ Complete | -        |

## MVP Definition

- Detect legal/ToS pages and extract text
- Provide summary, readability, and rights assessment
- Identify uncommon legal terms with definitions
- Present results in side panel and update the extension badge
- Basic stability: no runtime errors in common flows; production build works
- Core tests pass for critical paths (content <-> background messaging, analysis pipeline, sidepanel render)

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
