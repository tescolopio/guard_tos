# Terms Guardian - Comprehensive Manual Testing Plan

## Development Console Setup

### Extension Debugging Console Access

Chrome provides multiple console views for extension debugging:

#### 1. **Extension Pages Console** (Service Worker)

```
1. Navigate to: chrome://extensions/
2. Enable "Developer mode" (top right toggle)
3. Find "Terms Guardian" extension
4. Click "Inspect views: service worker"
   - This opens the background script console
   - Monitor service worker logs, errors, and state
```

#### 2. **Content Script Console** (Injected Scripts)

```
1. Open any webpage
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Content script logs will appear here
5. Use Console filter: Search for "Terms Guardian" or custom log prefixes
```

#### 3. **Side Panel Console** (Extension UI)

```
1. Open the Terms Guardian side panel
2. Right-click anywhere in the side panel
3. Select "Inspect" (if available) OR
4. Use chrome://extensions/ → "Inspect views: sidepanel.html"
```

#### 4. **Network Monitoring**

```
1. In DevTools, go to "Network" tab
2. Monitor extension requests (dictionaries, external APIs)
3. Check for failed requests or slow responses
```

---

## Comprehensive Test Plan

### **Pre-Test Setup Checklist**

- [ ] Build latest extension: `npm run build`
- [ ] Load unpacked extension from `dist/` folder
- [ ] Enable Developer Mode in chrome://extensions/
- [ ] Pin Terms Guardian to browser toolbar
- [ ] Open all debugging consoles (background, content, network)
- [ ] Clear browser cache and cookies for clean testing

---

## **Test Suite 1: Core Extension Functionality**

### **Test 1.1: Extension Loading & Initialization**

**Objective**: Verify extension loads correctly and all components initialize

**Test Steps**:

1. Navigate to `chrome://extensions/`
2. Verify Terms Guardian is listed and enabled
3. Check that service worker shows "Active" status
4. Click "Inspect views: service worker" to open background console

**Success Criteria**:

- [ ] Extension appears in extensions list
- [ ] Service worker status shows "Active"
- [ ] No errors in background console
- [ ] Extension icon visible in toolbar

**Console Monitoring**:

- Background console should show initialization logs
- No red error messages
- Service worker registers successfully

---

### **Test 1.2: Content Script Injection**

**Objective**: Verify content script injects on web pages

**Test Sites**:

- https://policies.google.com/terms
- https://github.com/site/terms
- https://www.linkedin.com/legal/privacy-policy

**Test Steps**:

1. Navigate to test site
2. Open DevTools Console (F12)
3. Look for Terms Guardian content script logs
4. Check for the `data-terms-guardian-loaded` attribute:
   ```javascript
   // Run in console:
   document.body.getAttribute("data-terms-guardian-loaded");
   ```

**Success Criteria**:

- [ ] Content script logs appear in console
- [ ] `data-terms-guardian-loaded="true"` attribute exists
- [ ] No content script errors
- [ ] Extension badge shows activity (if implemented)

**Console Commands for Debugging**:

```javascript
// Check if content script loaded
console.log("Content script loaded:", window.termsGuardianContentLoaded);

// Check for extension variables
console.log("Extension content:", typeof window.termsGuardian);

// Manual detection trigger (if available)
if (window.termsGuardian) window.termsGuardian.detectLegalContent();
```

---

## **Test Suite 2: Analysis Engine Testing**

### **Test 2.1: Legal Content Detection**

**Test Sites with Different Content Types**:

- **High Legal Content**: https://policies.google.com/terms
- **Medium Legal Content**: https://github.com/site/terms
- **Low Legal Content**: https://www.google.com (homepage)
- **Non-Legal Content**: https://www.wikipedia.org

**Test Steps**:

1. Navigate to each test site
2. Wait 5 seconds for detection
3. Open side panel by clicking extension icon
4. Check if legal content was detected

**Success Criteria**:

- [ ] High legal content sites: Detected with confidence >80%
- [ ] Medium legal content sites: Detected with confidence >50%
- [ ] Low/Non-legal content: Not detected or confidence <30%
- [ ] Detection completes within 5 seconds

**Console Debugging**:

```javascript
// Check detection results
console.log("Detection results:", window.termsGuardian?.lastAnalysis);

// Manual analysis trigger
window.termsGuardian?.analyzeCurrentPage();
```

---

### **Test 2.2: Rights Assessment Analysis**

**Objective**: Verify rights scoring accuracy

**Test Document**: LinkedIn Privacy Policy (known restrictive clauses)

**Test Steps**:

1. Navigate to LinkedIn Privacy Policy
2. Open Terms Guardian side panel
3. Wait for analysis completion
4. Check Rights Assessment score and details

**Expected Results**:

- Rights Score: 60-80 (moderate restrictions)
- Detected clauses: Data collection, arbitration, liability limitation
- Grade: C or D
- Specific risk factors identified

**Success Criteria**:

- [ ] Analysis completes within 10 seconds
- [ ] Rights score between 50-85
- [ ] At least 3 specific clauses identified
- [ ] Grade corresponds to score appropriately

**Console Debugging**:

```javascript
// Check rights analysis
console.log("Rights analysis:", window.termsGuardian?.rightsAnalysis);

// Check detected clauses
console.log("Detected clauses:", window.termsGuardian?.detectedClauses);
```

---

### **Test 2.3: Readability Analysis**

**Objective**: Verify readability grading accuracy

**Test Sites with Different Complexity**:

- **Simple**: Basic privacy policy
- **Complex**: Legal document with technical language
- **Very Complex**: Corporate ToS with legal jargon

**Test Steps**:

1. Navigate to test document
2. Trigger analysis
3. Check readability metrics in side panel

**Success Criteria**:

- [ ] Flesch Reading Ease score reasonable (0-100)
- [ ] Grade level corresponds to complexity
- [ ] Multiple readability metrics shown
- [ ] Results consistent with document complexity

---

## 🧪 **Test Suite 3: User Interface Testing**

### **Test 3.1: Side Panel Functionality**

**Objective**: Verify all UI components work correctly

**Test Steps**:

1. Open side panel on a ToS page
2. Test all interactive elements:
   - Scorecard clicks (should show details)
   - View toggles (Document-Level vs By Section)
   - Expand/collapse sections
   - External links

**Success Criteria**:

- [ ] Side panel opens without errors
- [ ] All sections load with content
- [ ] Interactive elements respond correctly
- [ ] No layout issues or broken styling
- [ ] Loading states show appropriately

**Console Monitoring**:

- Side panel console (right-click → Inspect)
- Check for JavaScript errors
- Monitor API calls and responses

---

### **Test 3.2: Performance Testing**

**Objective**: Verify acceptable performance

**Test Documents**:

- Short document (~1,000 words)
- Medium document (~5,000 words)
- Long document (~15,000 words)

**Metrics to Track**:

- Initial load time
- Analysis completion time
- Memory usage
- CPU usage

**Success Criteria**:

- [ ] Short doc analysis: <2 seconds
- [ ] Medium doc analysis: <5 seconds
- [ ] Long doc analysis: <15 seconds
- [ ] Memory usage: <50MB
- [ ] No browser freezing or lag

**Performance Monitoring**:

```javascript
// Timing analysis
console.time("Analysis Duration");
// ... trigger analysis ...
console.timeEnd("Analysis Duration");

// Memory usage
console.log("Memory:", performance.memory);
```

---

## 🧪 **Test Suite 4: Error Handling & Edge Cases**

### **Test 4.1: Network Connectivity Issues**

**Test Steps**:

1. Open side panel on ToS page
2. Disable internet connection
3. Trigger re-analysis
4. Check error handling

**Success Criteria**:

- [ ] Graceful degradation when offline
- [ ] Appropriate error messages shown
- [ ] No crashes or undefined behavior
- [ ] Recovery when connection restored

---

### **Test 4.2: Malformed Content Testing**

**Test Cases**:

- Pages with broken HTML
- Pages with unusual character encoding
- Pages with extremely long text blocks
- Pages with embedded scripts/iframes

**Success Criteria**:

- [ ] Extension doesn't crash on malformed content
- [ ] Appropriate error messages or fallbacks
- [ ] Security: No XSS vulnerabilities

---

## 📊 **Test Execution Tracking**

### **Test Session Template**

```
Date: ___________
Tester: _________
Extension Version: 1.0.0
Chrome Version: ___________

Test Results:
□ Core Functionality: PASS / FAIL
□ Analysis Engine: PASS / FAIL
□ User Interface: PASS / FAIL
□ Error Handling: PASS / FAIL

Critical Issues Found:
1. ___________________________
2. ___________________________
3. ___________________________

Performance Notes:
- Analysis Speed: ____________
- Memory Usage: _____________
- User Experience: __________

Overall Assessment: READY / NEEDS WORK
```

---

## 🔧 **Development Console Commands**

### **Useful Debugging Commands**

```javascript
// Force content script reload
chrome.runtime.reload();

// Check extension state
chrome.runtime.getManifest();

// Manual analysis trigger
window.termsGuardian?.forceAnalysis();

// Clear extension storage
chrome.storage.local.clear();

// Check message passing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
});

// Monitor service worker state
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log("Service Workers:", registrations);
});
```

### **Log Filtering in Console**

```
Filter by Terms Guardian logs:
- Search: "Terms Guardian" or "TG:"
- Use custom prefixes in logs for easy filtering
```

---

## ⚡ **Quick Start Testing Sequence**

For rapid validation, follow this 15-minute test sequence:

1. **Setup** (2 minutes): Load extension, open consoles
2. **Basic Function** (3 minutes): Test on Google ToS
3. **Analysis Quality** (5 minutes): Test on LinkedIn Privacy Policy
4. **UI Interaction** (3 minutes): Test all side panel features
5. **Error Check** (2 minutes): Review all console logs for errors

This provides a quick confidence check that core functionality is working.

---

## 📞 **Support During Testing**

If you encounter issues during testing:

1. **Check Console Logs**: All three console types for error messages
2. **Network Tab**: Look for failed requests or slow responses
3. **Extension Status**: Verify service worker is active
4. **Test Environment**: Clear cache, restart browser if needed
5. **Documentation**: Reference this guide and architecture docs

Ready to begin testing? The development console setup will give you complete visibility into the extension's operation!
