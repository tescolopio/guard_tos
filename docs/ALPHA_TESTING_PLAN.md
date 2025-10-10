# Terms Guardian - Alpha Testing Plan

**Date:** January 16, 2025  
**Version:** 1.0.0-alpha  
**Phase:** Pre-release Alpha Testing  
**Status:** Ready for Testing

---

## Executive Summary

Terms Guardian has completed Phase 2 model training with production-ready performance:
- **v2025.10.13 model**: F1=0.986 (training), F1=0.757 (adversarial validation)
- **Precision**: 97.1% (training), 73.6% (validation)
- **Ready for**: Real-world alpha testing with actual ToS pages

This alpha testing phase will validate:
1. Extension functionality in real Chrome environments
2. Model performance on live ToS/Privacy Policy pages
3. User experience and interface usability
4. Performance and reliability metrics

---

## Alpha Testing Objectives

### Primary Goals
1. ✅ **Functional Validation** - Verify all features work in production Chrome
2. ✅ **Model Performance** - Test v2025.10.13 on real ToS pages
3. ✅ **User Experience** - Collect feedback on interface and workflow
4. ✅ **Performance Metrics** - Measure response times, memory usage, reliability

### Success Criteria
- Extension loads without errors in Chrome
- Analysis completes successfully on 20+ different ToS pages
- No crashes or hangs during normal usage
- User feedback indicates clear value proposition
- Performance metrics within acceptable ranges (< 3s analysis time)

---

## Pre-Alpha Checklist

### 1. Extension Build & Packaging ✅ (Verify)
- [x] manifest.json configured for Manifest V3
- [x] Icons present (16, 32, 48, 128px)
- [ ] Build process creates production bundle
- [ ] Source maps available for debugging
- [ ] Development vs. production configs

### 2. ML Model Integration 🔧 (Needs Verification)
- [x] v2025.10.13 model trained and evaluated
- [ ] Model artifacts accessible by extension
- [ ] Inference pipeline tested
- [ ] Fallback handling for model errors
- [ ] Performance benchmarking completed

### 3. Core Features 🔧 (Needs Testing)
- [ ] ToS detection on page load
- [ ] Side panel opens with extension icon click
- [ ] Analysis runs on detected ToS content
- [ ] Results display correctly
- [ ] Context menu integration works
- [ ] Storage persistence functions

### 4. Test Environment Setup 📋 (To Do)
- [ ] Chrome browser (latest stable version)
- [ ] Developer mode enabled
- [ ] Test ToS pages identified (20+ sites)
- [ ] Logging/debugging tools configured
- [ ] Performance monitoring setup

---

## Alpha Testing Protocol

### Phase 1: Local Development Testing (Week 1)

**Day 1-2: Setup & Smoke Testing**
- [ ] Load unpacked extension in Chrome Developer Mode
- [ ] Verify extension icon appears in toolbar
- [ ] Test basic interactions (open/close side panel)
- [ ] Check console for errors/warnings
- [ ] Verify storage APIs work

**Day 3-4: Feature Testing**
- [ ] Test on 5 major ToS pages (Google, Facebook, Twitter, Amazon, Microsoft)
- [ ] Verify clause detection accuracy
- [ ] Test readability grading
- [ ] Validate summarization quality
- [ ] Check flagged risks/concerns display

**Day 5-7: Model Validation**
- [ ] Run v2025.10.13 model on 20+ ToS pages
- [ ] Log model predictions vs. expected results
- [ ] Measure precision/recall on real-world data
- [ ] Document false positives/negatives
- [ ] Identify edge cases for improvement

### Phase 2: Closed Alpha with Team (Week 2)

**Participants:** 3-5 internal testers

**Testing Tasks:**
1. Install extension from unpacked source
2. Browse 10+ websites with ToS/Privacy Policies
3. Trigger analysis on each page
4. Document:
   - Any errors or crashes
   - UI/UX issues or confusion
   - Model accuracy observations
   - Feature requests
   - Performance concerns

**Feedback Collection:**
- [ ] Daily testing logs from each tester
- [ ] Bug reports via GitHub Issues
- [ ] UX feedback via shared document
- [ ] Performance metrics collection

### Phase 3: Extended Alpha (Week 3-4)

**Participants:** 10-15 trusted external testers

**Distribution:**
- [ ] Package extension as .crx file (unsigned)
- [ ] Share installation instructions
- [ ] Provide feedback form/survey
- [ ] Set up telemetry/analytics (privacy-preserving)

**Testing Focus:**
- Real-world usage patterns
- Diverse ToS page types
- Cross-browser compatibility (Chrome variants)
- Performance on different hardware
- Accessibility testing

---

## Test Sites & Scenarios

### Tier 1: Major Tech Companies (High Priority)
1. **Google Terms of Service** - Complex, legal language
2. **Facebook/Meta Terms** - Long, detailed
3. **Twitter/X Terms** - Frequently updated
4. **Amazon Conditions of Use** - E-commerce focused
5. **Microsoft Services Agreement** - Enterprise language

### Tier 2: Diverse Domains (Medium Priority)
6. **GitHub Terms** - Developer-focused
7. **Spotify Terms** - Entertainment/media
8. **Netflix Terms** - Streaming service
9. **PayPal User Agreement** - Financial services
10. **LinkedIn User Agreement** - Professional network

### Tier 3: Edge Cases (Low Priority)
11. **Small startup ToS** - Minimal content
12. **Non-English ToS** - Internationalization
13. **Image-based ToS** - Accessibility challenges
14. **Dynamic/lazy-loaded ToS** - SPA behavior
15. **PDF-based ToS** - Document format handling

### Test Scenarios
- [x] **Cold start**: First analysis on page load
- [x] **Cached analysis**: Second visit to same page
- [x] **Multiple tabs**: Analyzing different ToS simultaneously
- [x] **Long documents**: 10,000+ word ToS pages
- [x] **Short documents**: Minimal/simple ToS
- [x] **Scroll behavior**: Analyzing while scrolling
- [x] **Context menu**: Right-click analysis trigger

---

## Metrics & Data Collection

### Performance Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Analysis Time | < 3s | console.time() |
| Memory Usage | < 100MB | Chrome Task Manager |
| Extension Load Time | < 500ms | Performance API |
| Model Inference Time | < 1s | Profiling |
| Storage Usage | < 5MB | chrome.storage API |

### Quality Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Clause Detection Accuracy | > 80% | Manual verification |
| False Positive Rate | < 20% | Error analysis |
| False Negative Rate | < 20% | Missed clause review |
| User Satisfaction | > 4/5 | Survey feedback |
| Bug Reports | < 10 critical | Issue tracker |

### Logging Strategy
```javascript
// Performance logging
console.time('analysis-duration');
// ... analysis code ...
console.timeEnd('analysis-duration');

// Error logging
try {
  // ... risky operation ...
} catch (error) {
  console.error('[TermsGuardian] Error:', error);
  // Send to error tracking (optional)
}

// Model prediction logging
console.log('[Model] Prediction:', {
  label: prediction.label,
  confidence: prediction.confidence,
  text: prediction.text.substring(0, 100)
});
```

---

## Bug Reporting Template

```markdown
## Bug Report

**Environment:**
- Browser: Chrome 130.x
- OS: Windows/Mac/Linux
- Extension Version: 1.0.0-alpha

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Logs:**


**Severity:** Critical / High / Medium / Low
```

---

## Alpha Tester Onboarding

### Installation Instructions

**Option 1: Load Unpacked (Development)**
```bash
1. Open Chrome and navigate to chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the guard_tos directory
5. Extension icon should appear in toolbar
```

**Option 2: Load CRX (Packaged)**
```bash
1. Download terms-guardian-alpha.crx
2. Open Chrome and navigate to chrome://extensions/
3. Enable "Developer mode"
4. Drag and drop the .crx file onto the page
5. Click "Add extension" when prompted
```

### First-Time Setup
1. Click the Terms Guardian icon in Chrome toolbar
2. Side panel opens with welcome message
3. Navigate to any website with Terms of Service
4. Extension automatically detects and offers to analyze
5. Click "Analyze" button to run ML analysis

### Troubleshooting
- **Extension won't load**: Check console for errors, verify manifest.json
- **Analysis fails**: Check if content is actually ToS, verify model is loaded
- **Side panel blank**: Check serviceWorker.js is running, inspect background page
- **No detection**: Navigate to explicit ToS URL, use context menu as fallback

---

## Alpha Testing Timeline

### Week 1: Internal Validation
- **Day 1**: Setup, smoke testing
- **Day 2-3**: Feature testing on 10 sites
- **Day 4-5**: Model validation on 20+ sites
- **Day 6-7**: Bug fixes, performance optimization

### Week 2: Closed Alpha
- **Day 8**: Recruit 3-5 team members as testers
- **Day 9**: Onboard testers, distribute extension
- **Day 10-12**: Daily testing, feedback collection
- **Day 13-14**: Address critical bugs, iterate

### Week 3-4: Extended Alpha
- **Day 15**: Recruit 10-15 external alpha testers
- **Day 16**: Distribute packaged extension, onboard users
- **Day 17-25**: Extended real-world testing
- **Day 26-28**: Analyze feedback, plan beta release

---

## Success Indicators

### Green Flags (Ready for Beta)
✅ No critical bugs in 1 week of testing  
✅ Positive feedback from 80%+ of alpha testers  
✅ Analysis succeeds on 90%+ of test ToS pages  
✅ Performance within target metrics  
✅ Model accuracy meets expectations (F1 > 0.70)  

### Red Flags (Needs Work)
❌ Frequent crashes or hangs  
❌ Model accuracy significantly lower than validation (F1 < 0.60)  
❌ Overwhelmingly negative user feedback  
❌ Performance issues (>5s analysis time, >200MB memory)  
❌ Privacy/security concerns raised  

---

## Post-Alpha Action Items

### If Testing Succeeds
1. Package for Chrome Web Store beta release
2. Create beta testing program with wider audience
3. Set up analytics/telemetry for production
4. Prepare marketing materials
5. Draft privacy policy and support documentation

### If Issues Found
1. Prioritize and fix critical bugs
2. Retrain models if accuracy is insufficient
3. Optimize performance bottlenecks
4. Improve UX based on feedback
5. Run additional alpha round if needed

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Model accuracy lower than validation | Medium | High | Have Phase 2c refinement plan ready |
| Extension crashes on certain sites | Medium | High | Comprehensive error handling, fallbacks |
| Performance issues on low-end hardware | Low | Medium | Performance profiling, optimization |
| User confusion about features | Medium | Medium | Improved onboarding, tooltips |
| Privacy concerns raised | Low | High | Clear privacy policy, local processing |

---

## Next Steps (Immediate)

### 1. Verify Extension Build 🔧
- [ ] Run webpack build for production
- [ ] Test with unpacked extension in Chrome
- [ ] Verify all assets load correctly
- [ ] Check for console errors

### 2. ML Model Integration 🔧
- [ ] Confirm model artifacts are accessible
- [ ] Test inference pipeline with sample ToS
- [ ] Benchmark inference performance
- [ ] Implement error handling

### 3. Create Test Package 📦
- [ ] Package extension as .crx (if needed)
- [ ] Write installation guide
- [ ] Create feedback form/survey
- [ ] Set up bug tracking system

### 4. Recruit Alpha Testers 👥
- [ ] Identify 3-5 internal team members
- [ ] Reach out to 10-15 trusted external users
- [ ] Schedule onboarding sessions
- [ ] Distribute testing materials

---

## Resources

### Documentation
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Testing Best Practices](https://developer.chrome.com/docs/extensions/mv3/testing/)

### Tools
- Chrome DevTools (debugging)
- Chrome Task Manager (performance)
- Extension Reloader (development)
- Lighthouse (performance auditing)

### Communication
- GitHub Issues for bug tracking
- Shared Google Doc for feedback
- Slack/Discord for real-time discussion
- Weekly sync meetings for alpha team

---

## Contact & Support

**Alpha Testing Lead:** [Your Name]  
**Technical Support:** [Support Email/Slack]  
**Bug Reports:** GitHub Issues  
**Feedback Form:** [Survey Link]

---

**Status:** 🚀 Ready to begin Week 1 internal validation

Let's start alpha testing and validate Terms Guardian in real-world Chrome environments!
