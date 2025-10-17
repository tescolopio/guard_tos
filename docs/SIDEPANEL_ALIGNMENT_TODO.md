# Sidepanel Alignment Action Plan

## Overview
This document outlines the specific updates needed to align the production sidepanel with the documented Terms Guardian methodology and interactive demo UX.

---

## ✅ **Already Implemented (No Changes Needed)**

### 1. Combined Grade Calculation (Backend)
**Location:** `src/analysis/userRightsIndex.js` - `computeCombinedGrade()`
**Status:** ✅ Correct
- Uses 70% URI weight, 30% readability weight
- Properly validates inputs and provides fallbacks
- Returns grade, score, and breakdown

### 2. URI Category Scoring
**Location:** `src/analysis/userRightsIndex.js` - `compute()`
**Status:** ✅ Correct
- All 8 categories computed
- Weighted scoring applied
- Guardrails for high-risk categories
- ML model fusion (when available)

### 3. Grade Scale
**Location:** `src/analysis/userRightsIndex.js` - `gradeFrom()`
**Status:** ✅ Correct
- Matches documented scale:
  - A+ (97-100), A (93-97), A- (90-93)
  - B+ (87-90), B (83-87), B- (80-83)
  - C+ (77-80), C (73-77), C- (70-73)
  - D+ (67-70), D (63-67), D- (60-63)
  - F+ (50-60), F (30-50), F- (0-30)

---

## 🔧 **Updates Needed**

### **Priority 1: DOM Element Cache (CRITICAL)**

**File:** `src/panel/sidepanel.js`
**Current Issue:** Element cache references don't fully match the new HTML markup

**Required Changes:**

```javascript
// In constructor, update this.elements to:
this.elements = {
  // Existing (keep these)
  content: document.getElementById("sidepanel-content"),
  diagnostics: document.getElementById("diagnostics"),
  termsUrl: document.getElementById("terms-url"),
  termsTitle: document.getElementById("terms-title"),
  statusMessage: document.getElementById("status-message"),
  loadingIndicator: document.querySelector(".loading-indicator"),
  
  // NEW: Grade display elements
  combinedGrade: document.getElementById("combined-grade"),
  combinedGradeLabel: document.getElementById("combined-grade-label"),
  gradeDisplay: document.querySelector(".grade-display"),
  
  // NEW: Summary toggle buttons (renamed from document-level/by-section)
  summaryDocumentBtn: document.getElementById("summary-document-btn"),
  summarySectionBtn: document.getElementById("summary-section-btn"),
  summaryHeading: document.getElementById("summary-heading"),
  summaryViewLabel: document.getElementById("summary-view-label"),
  
  // NEW: Summary metric elements
  summaryRightsScore: document.getElementById("summary-rights-score"),
  summaryReadabilityScore: document.getElementById("summary-readability-score"),
  summaryConfidence: document.getElementById("summary-confidence"),
  summaryRiskChip: document.getElementById("summary-risk-chip"),
  summaryConfidenceChip: document.getElementById("summary-confidence-chip"),
  summaryTermsChip: document.getElementById("summary-terms-chip"),
  summaryFlags: document.getElementById("summary-flags"),
  
  // Existing content sections (keep)
  overallSummary: document.getElementById("overall-summary"),
  sectionSummaries: document.getElementById("section-summaries"),
  keyExcerptsList: document.getElementById("key-excerpts-list"),
  uncommonTermsList: document.getElementById("uncommon-terms-list"),
  
  // Excerpts toggles (keep)
  excerptsNegBtn: document.getElementById("excerpts-neg-btn"),
  excerptsPosBtn: document.getElementById("excerpts-pos-btn"),
  
  // REMOVE: These elements no longer exist in new markup
  // readabilityGrade: document.getElementById("readability-grade"),
  // userRightsIndex: document.getElementById("user-rights-index"),
  // documentLevelBtn: document.getElementById("document-level-btn"),
  // bySectionBtn: document.getElementById("by-section-btn"),
  // loadSampleBtn: document.getElementById("load-sample-btn"),
  // contentOrganization: document.querySelector(".content-organization"),
  // dictionaryTermsList: document.getElementById("dictionary-terms-list"),
  
  // Diagnostics (keep for advanced users)
  dictMetricHits: document.getElementById("dict-metric-hits"),
  dictMetricMisses: document.getElementById("dict-metric-misses"),
  dictMetricSize: document.getElementById("dict-metric-size"),
  dictMetricMax: document.getElementById("dict-metric-max"),
  dictMetricTtl: document.getElementById("dict-metric-ttl"),
  dictMetricTs: document.getElementById("dict-metric-ts"),
};
```

---

### **Priority 2: Update Summary Metrics Display**

**File:** `src/panel/sidepanel.js`
**Function:** `updateSummaryMetrics()` (NEW - needs to be created)

**Required Implementation:**

```javascript
/**
 * Update the summary metrics cards and chips
 * @param {Object} metrics - Contains rightsScore, readabilityScore, confidence, risk, etc.
 */
updateSummaryMetrics(metrics) {
  try {
    const {
      uriScore,
      rightsGrade,
      readabilityEase,
      confidencePct,
      riskLevel,
      wordCount,
      clauseCount
    } = metrics;

    // Update Rights Score card
    if (this.elements.summaryRightsScore) {
      this.elements.summaryRightsScore.textContent = 
        typeof uriScore === 'number' ? Math.round(uriScore) : '--';
    }

    // Update Confidence in Rights card
    if (this.elements.summaryConfidence) {
      this.elements.summaryConfidence.textContent = 
        typeof confidencePct === 'number' ? `${confidencePct}%` : '--';
    }

    // Update Readability Score card
    if (this.elements.summaryReadabilityScore) {
      this.elements.summaryReadabilityScore.textContent = 
        typeof readabilityEase === 'number' ? readabilityEase.toFixed(1) : '--';
    }

    // Update Risk chip
    if (this.elements.summaryRiskChip && riskLevel) {
      const riskText = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
      this.elements.summaryRiskChip.textContent = `Risk ${riskText}`;
      
      // Set data-theme for CSS styling
      const themeMap = {
        'high': 'risk-high',
        'critical': 'risk-critical',
        'medium': 'risk-medium',
        'low': 'risk-low',
        'positive': 'risk-positive'
      };
      this.elements.summaryRiskChip.setAttribute('data-theme', themeMap[riskLevel] || 'risk-neutral');
    }

    // Update Confidence chip
    if (this.elements.summaryConfidenceChip && typeof confidencePct === 'number') {
      this.elements.summaryConfidenceChip.textContent = `Confidence ${confidencePct}%`;
    }

    // Update Terms analyzed chip
    if (this.elements.summaryTermsChip) {
      let termsText = '--';
      if (typeof clauseCount === 'number' && clauseCount > 0) {
        termsText = `${clauseCount} clauses analyzed`;
      } else if (typeof wordCount === 'number') {
        termsText = `${Math.round(wordCount / 100)}+ terms analyzed`;
      }
      this.elements.summaryTermsChip.textContent = termsText;
    }

  } catch (error) {
    console.error('Error updating summary metrics:', error);
  }
}
```

**Call Location:** Inside `updateSummary()` method after enhanced summary formatting

---

### **Priority 3: Simplify updateScores()**

**File:** `src/panel/sidepanel.js`
**Function:** `updateScores()`

**Current Issue:** Overly complex with too many fallback paths. Should trust backend calculation.

**Simplified Implementation:**

```javascript
updateScores(scores) {
  try {
    if (!scores) {
      console.warn("updateScores called with no scores data");
      return;
    }

    // Get combined grade from backend calculation
    let combinedGradeData = scores.combinedGrade;
    
    // Fallback: check top-level if not in scores
    if (!combinedGradeData && this.currentContent?.combinedGrade) {
      combinedGradeData = this.currentContent.combinedGrade;
    }

    // Update Combined Grade Display
    if (combinedGradeData?.grade && this.elements.combinedGrade) {
      const grade = combinedGradeData.grade;
      
      // Set text
      this.elements.combinedGrade.textContent = grade;
      this.elements.combinedGrade.setAttribute("data-grade-value", grade);
      
      // Set gradient color
      this.elements.combinedGrade.style.backgroundImage = this.getColorForGrade(grade);
      
      // Update label
      const docType = window.currentDocumentType || "Document";
      if (this.elements.combinedGradeLabel) {
        this.elements.combinedGradeLabel.textContent = `${docType} Grade`;
      }
      
      // Accessibility
      this.elements.combinedGrade.setAttribute(
        "aria-label",
        `${docType} grade ${grade}`
      );
      
      console.log(`✅ Combined grade displayed: ${grade}`);
    } else {
      // Only simple fallback - don't recalculate
      if (this.elements.combinedGrade) {
        this.elements.combinedGrade.textContent = "N/A";
        this.elements.combinedGrade.setAttribute("data-grade-value", "N/A");
      }
      console.warn("No combined grade available in analysis results");
    }

  } catch (error) {
    console.error("Error in updateScores:", error);
    if (this.elements?.combinedGrade) {
      this.elements.combinedGrade.textContent = "Error";
    }
  }
}
```

**Rationale:** Backend (`content.js` via `userRightsIndex.computeCombinedGrade()`) already does the calculation correctly. Sidepanel should just display it, not recalculate.

---

### **Priority 4: Update Summary Toggle Event Listeners**

**File:** `src/panel/sidepanel.js`
**Function:** `setupEventListeners()`

**Required Changes:**

```javascript
// REPLACE this section:
/*
this.elements.documentLevelBtn.addEventListener("click", () =>
  this.toggleView("document"),
);
this.elements.bySectionBtn.addEventListener("click", () =>
  this.toggleView("section"),
);
*/

// WITH:
this.elements.summaryDocumentBtn.addEventListener("click", () =>
  this.toggleView("document"),
);
this.elements.summarySectionBtn.addEventListener("click", () =>
  this.toggleView("section"),
);
```

**Function:** `toggleView()`

```javascript
// UPDATE to use new button references:
toggleView(view) {
  if (view === "document") {
    this.elements.overallSummary.style.display = "block";
    this.elements.sectionSummaries.style.display = "none";
    this.elements.summaryDocumentBtn.classList.add("active");
    this.elements.summarySectionBtn.classList.remove("active");
    
    // Update view label
    if (this.elements.summaryViewLabel) {
      this.elements.summaryViewLabel.textContent = "Document Summary";
    }
  } else {
    this.elements.overallSummary.style.display = "none";
    this.elements.sectionSummaries.style.display = "block";
    this.elements.summaryDocumentBtn.classList.remove("active");
    this.elements.summarySectionBtn.classList.add("active");
    
    // Update view label
    if (this.elements.summaryViewLabel) {
      this.elements.summaryViewLabel.textContent = "Section Summaries";
    }
  }
}
```

---

### **Priority 5: Enhanced Summary Formatting**

**File:** `src/panel/sidepanel.js`
**Function:** `formatEnhancedSummary()`

**Required Update:** Support structured `keyFindings` array format from enhanced summarizer

```javascript
formatEnhancedSummary(summaryData) {
  if (!summaryData) return "";

  // NEW: Handle structured key findings array (from demo)
  if (Array.isArray(summaryData)) {
    return summaryData.map((finding, idx) => {
      const num = idx + 1;
      return `
        <div class="summary-finding">
          <h3>${num}. ${this.escapeHtml(finding.title)}</h3>
          <p><strong>What it says:</strong> ${this.escapeHtml(finding.whatItSays)}</p>
          <p class="plain-terms"><strong>In plain terms:</strong> "${this.escapeHtml(finding.inPlainTerms)}"</p>
        </div>
      `;
    }).join('');
  }

  // FALLBACK: Handle plain text with markdown (existing logic)
  // ... keep existing markdown parsing code ...
}
```

---

### **Priority 6: Section Accordion Updates**

**File:** `src/panel/sidepanel.js`
**Function:** `updateSections()`

**Required Updates:**
1. Use simpler risk chip format (no "risk" word)
2. Cleaner accordion structure
3. Match demo's collapsible behavior

```javascript
updateSections(sections) {
  this.elements.sectionSummaries.innerHTML = "";

  if (!sections?.length) {
    this.elements.sectionSummaries.innerHTML = 
      "<p class='placeholder'>No section summaries available.</p>";
    return;
  }

  sections.forEach((section, idx) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("section-accordion-item");
    sectionDiv.id = `section-${idx + 1}`;

    // Accordion header
    const header = document.createElement("button");
    header.className = "accordion-header";
    header.type = "button";
    header.setAttribute("aria-expanded", "false");
    
    // Risk chip (simplified - no "risk" word)
    const riskLevel = section.riskLevel || 'unknown';
    const riskText = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
    
    header.innerHTML = `
      <span class="section-title">${this.escapeHtml(section.userFriendlyHeading || section.heading)}</span>
      <span class="risk-chip risk-${riskLevel}">${riskText}</span>
      <span class="accordion-icon">▼</span>
    `;

    // Accordion content
    const content = document.createElement("div");
    content.className = "accordion-content";
    content.setAttribute("aria-hidden", "true");

    // Build key points
    let keyPointsHtml = "";
    if (section.keyPoints?.length > 0) {
      keyPointsHtml = `
        <ul class="section-key-points">
          ${section.keyPoints.map(point => `<li>${this.escapeHtml(point)}</li>`).join('')}
        </ul>
      `;
    } else if (section.summary) {
      keyPointsHtml = `<p>${this.escapeHtml(section.summary)}</p>`;
    }

    content.innerHTML = keyPointsHtml;

    // Toggle functionality
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !isExpanded);
      content.setAttribute('aria-hidden', isExpanded);
      header.classList.toggle('active');
      content.classList.toggle('active');
    });

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(content);
    this.elements.sectionSummaries.appendChild(sectionDiv);
  });
}
```

---

### **Priority 7: Add Direct Link Highlighting**

**File:** `src/panel/sidepanel.js`
**New Method:** `addSectionLinks()`

**Purpose:** Enable clicking findings to jump to source sections with highlighting

```javascript
/**
 * Add clickable links to section anchors in summary findings
 * @param {string} summaryHtml - HTML string with findings
 * @returns {string} Enhanced HTML with anchor links
 */
addSectionLinks(summaryHtml, sections) {
  if (!sections?.length) return summaryHtml;

  // Wrap section references in anchor links
  sections.forEach((section, idx) => {
    const anchorId = `section-${idx + 1}`;
    const sectionTitle = section.heading || section.userFriendlyHeading;
    
    // Create regex to find section mentions
    const regex = new RegExp(`(${this.escapeRegex(sectionTitle)})`, 'gi');
    summaryHtml = summaryHtml.replace(regex, 
      `<a href="#${anchorId}" class="section-link" data-section="${anchorId}">$1</a>`
    );
  });

  return summaryHtml;
}

/**
 * Setup click handlers for section links
 */
setupSectionLinkHandlers() {
  document.body.addEventListener('click', (event) => {
    const link = event.target.closest('.section-link');
    if (!link) return;

    event.preventDefault();
    const sectionId = link.dataset.section;
    
    // Scroll to section in accordion
    const sectionEl = document.getElementById(sectionId);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Expand if collapsed
      const header = sectionEl.querySelector('.accordion-header');
      if (header && header.getAttribute('aria-expanded') !== 'true') {
        header.click();
      }
      
      // Highlight temporarily
      sectionEl.classList.add('highlight-flash');
      setTimeout(() => sectionEl.classList.remove('highlight-flash'), 3000);
    }

    // Also send message to content script to highlight on page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'highlightSection',
          sectionId: sectionId
        });
      }
    });
  });
}
```

**Call in `initialize()`:** Add `this.setupSectionLinkHandlers();`

---

### **Priority 8: Enhanced URI Popup**

**File:** `src/panel/sidepanel.js`
**Function:** `formatRightsPopup()` or `formatUriPopup()`

**Required Update:** Show all 8 category scores in table format

```javascript
formatUriPopup(uri) {
  if (!uri) return "No User Rights Index data available";
  
  const categories = uri.categories || {};
  const weightedScore = typeof uri.weightedScore === 'number' 
    ? uri.weightedScore 
    : null;
  const grade = uri.grade || 'N/A';

  // Build category rows
  const categoryLabels = {
    'DATA_COLLECTION_USE': 'Data Collection & Use',
    'USER_PRIVACY': 'User Privacy',
    'DISPUTE_RESOLUTION': 'Dispute Resolution',
    'CONTENT_RIGHTS': 'Content Rights',
    'ACCOUNT_MANAGEMENT': 'Account Management',
    'TERMS_CHANGES': 'Terms Changes',
    'CLARITY_TRANSPARENCY': 'Clarity & Transparency',
    'ALGORITHMIC_DECISIONS': 'Algorithmic Decisions'
  };

  const rows = Object.entries(categoryLabels).map(([key, label]) => {
    const cat = categories[key];
    const score = typeof cat?.score === 'number' ? cat.score : 'N/A';
    const catGrade = cat?.grade || 'N/A';
    
    // Color coding
    const scoreClass = typeof score === 'number'
      ? score >= 85 ? 'score-high' 
      : score >= 70 ? 'score-medium'
      : score >= 50 ? 'score-low'
      : 'score-critical'
      : '';

    return `
      <div class="metric-row">
        <span class="metric-label">${label}:</span>
        <span class="metric-value ${scoreClass}">${score}${typeof score === 'number' ? '%' : ''} (${catGrade})</span>
      </div>
    `;
  }).join('');

  // Explanation based on overall score
  let explanation = '';
  if (weightedScore !== null) {
    if (weightedScore >= 80) {
      explanation = 'Strong user protections with clear terms and fair practices.';
    } else if (weightedScore >= 65) {
      explanation = 'Generally balanced terms with some areas to review.';
    } else if (weightedScore >= 50) {
      explanation = 'Several clauses may impact your rights; proceed with caution.';
    } else {
      explanation = 'Many terms may limit your rights. Review key sections carefully.';
    }
  }

  return `
    <div class="popup-header">
      <strong>User Rights Index: ${weightedScore !== null ? weightedScore + '%' : 'N/A'} (Grade ${grade})</strong>
    </div>
    <div class="popup-metrics">
      <h4>Category Scores:</h4>
      ${rows}
    </div>
    <div class="popup-explanation">
      <p><strong>What this means:</strong></p>
      <p>${explanation}</p>
    </div>
  `;
}
```

---

### **Priority 9: CSS Updates for New Elements**

**File:** `src/styles/styles.css`

**Required Additions:**

```css
/* Summary Finding Cards (Whole Document view) */
.summary-finding {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 8px;
  border-left: 3px solid #60a5fa;
}

.summary-finding h3 {
  color: #60a5fa;
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.summary-finding p {
  margin: 0.5rem 0;
  line-height: 1.6;
  color: #e2e8f0;
}

.summary-finding p strong {
  color: #94a3b8;
  font-weight: 600;
}

.summary-finding .plain-terms {
  font-style: italic;
  color: #cbd5e1;
  padding-left: 1rem;
  border-left: 2px solid rgba(96, 165, 250, 0.3);
}

/* Section Links (clickable references) */
a.section-link {
  color: #60a5fa;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

a.section-link:hover {
  color: #93c5fd;
}

/* Highlight flash animation */
.highlight-flash {
  animation: flashHighlight 3s ease-in-out;
}

@keyframes flashHighlight {
  0%, 100% { background-color: transparent; }
  10%, 90% { background-color: rgba(250, 204, 21, 0.3); }
}

/* Section Accordion (updated) */
.section-accordion-item {
  margin-bottom: 0.5rem;
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.section-accordion-item:hover {
  border-color: rgba(96, 165, 250, 0.5);
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.3);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.accordion-header:hover {
  background: rgba(30, 41, 59, 0.5);
}

.accordion-header.active {
  background: rgba(30, 41, 59, 0.6);
}

.accordion-header .section-title {
  flex: 1;
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.95rem;
}

.accordion-header .risk-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.risk-chip.risk-high,
.risk-chip.risk-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.risk-chip.risk-medium {
  background: rgba(251, 146, 60, 0.2);
  color: #fdba74;
}

.risk-chip.risk-low,
.risk-chip.risk-positive {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.risk-chip.risk-unknown {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.accordion-icon {
  color: #94a3b8;
  transition: transform 0.2s ease;
  font-size: 0.75rem;
}

.accordion-header.active .accordion-icon {
  transform: rotate(180deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion-content.active {
  max-height: 1000px;
  padding: 1rem;
}

.section-key-points {
  list-style: none;
  padding: 0;
  margin: 0;
}

.section-key-points li {
  padding: 0.5rem 0 0.5rem 1.5rem;
  position: relative;
  line-height: 1.5;
  color: #cbd5e1;
}

.section-key-points li::before {
  content: "•";
  position: absolute;
  left: 0.5rem;
  color: #60a5fa;
  font-weight: bold;
}

/* URI Popup score coloring */
.metric-value.score-high {
  color: #86efac;
}

.metric-value.score-medium {
  color: #fbbf24;
}

.metric-value.score-low {
  color: #fdba74;
}

.metric-value.score-critical {
  color: #fca5a5;
}
```

---

## 📋 **Implementation Checklist**

### Phase 1: Element Cache (Must Do First)
- [ ] Update `this.elements` object in constructor
- [ ] Remove references to deleted elements
- [ ] Test that all new elements are found

### Phase 2: Core Display Logic
- [ ] Simplify `updateScores()` function
- [ ] Create `updateSummaryMetrics()` function
- [ ] Update `updateSummary()` to call metrics function
- [ ] Test grade display with sample data

### Phase 3: Summary Formatting
- [ ] Update `formatEnhancedSummary()` for structured findings
- [ ] Update `updateSections()` for accordion style
- [ ] Add CSS for new components
- [ ] Test with both formats (structured & markdown)

### Phase 4: Interactive Features
- [ ] Create `addSectionLinks()` method
- [ ] Create `setupSectionLinkHandlers()` method
- [ ] Add highlight animation CSS
- [ ] Test click-to-highlight flow

### Phase 5: Popups & Details
- [ ] Update `formatUriPopup()` with 8 categories
- [ ] Add CSS for score color coding
- [ ] Test hover tooltips

### Phase 6: Event Listeners
- [ ] Update `setupEventListeners()` for new button IDs
- [ ] Update `toggleView()` for new references
- [ ] Add section link handler setup
- [ ] Test all interactive features

### Phase 7: Testing & Validation
- [ ] Load sample ToS and verify grade displays correctly
- [ ] Verify metrics cards populate
- [ ] Test summary toggle switches views
- [ ] Test section accordion expand/collapse
- [ ] Test clicking findings jumps to sections
- [ ] Test URI popup shows all categories
- [ ] Test with multiple documents (A, B, C, D, F grades)

---

## 🎯 **Expected Outcome**

After completing these updates, the production sidepanel will:

1. ✅ Display combined grade with correct 70/30 weighting
2. ✅ Show all 8 URI category scores in hover popup
3. ✅ Present structured "What it says / In plain terms" findings
4. ✅ Use clean accordion for sections with simple risk chips
5. ✅ Enable direct linking from findings to source sections
6. ✅ Match the interactive demo's clean, user-friendly UX
7. ✅ Maintain all advanced features (diagnostics, popups, tooltips)

---

## 📝 **Notes**

- **Backend is correct:** No changes needed to analysis logic
- **Data flow works:** Problem is purely in presentation layer
- **Keep diagnostics:** Advanced features stay, just hidden by default
- **Maintain compatibility:** Old data formats should still work with fallbacks
- **Testing critical:** Each priority should be tested before moving to next

---

## 🔗 **Related Files**

- Analysis logic: `src/analysis/userRightsIndex.js` (no changes)
- Content script: `src/content/content.js` (no changes)
- Markup: `src/panel/sidepanel.html` (already updated)
- Styles: `src/styles/styles.css` (needs additions)
- Controller: `src/panel/sidepanel.js` (main work here)
