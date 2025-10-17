/**
 * Sidepanel Controller for Terms Guardian Extension
 * Last Updated: 2025-10-17
 * Changes: Updated to work with new HTML structure from interactive_demo.html
 */

"use strict";

// Debug: Verify script loads
console.log("🔵 SIDEPANEL.JS LOADING...");

// Ensure webpack publicPath points to extension root for any lazy-loaded chunks
try {
  require("../runtime/publicPath");
} catch (e) {
  /* noop */
}

const { EXT_CONSTANTS } = require("../utils/constants");
const { createDebugger } = require("../utils/debugger");

console.log("🔵 SIDEPANEL.JS: Constants and debugger imported");

// Alias for easier access
const Constants = EXT_CONSTANTS;

/**
 * Represents the sidepanel functionality.
 * @class
 */
class Sidepanel {
  constructor() {
    console.log("🔵 SIDEPANEL CONSTRUCTOR CALLED");
    const { MESSAGES, CLASSES, DEBUG } = Constants;
    this.currentContent = null;

    // Initialize debugging
    const logger = createDebugger(DEBUG.LEVELS.DEBUG);
    this.debug = logger.debug;

    this.debug.startGroup && this.debug.startGroup(DEBUG.MODULES.SIDEPANEL);
    this.debug.startTimer && this.debug.startTimer("sidepanelInit");
    
    console.log("🔵 SIDEPANEL: Debugger initialized, starting state setup");

    this.state = {
      isLoading: false,
      isError: false,
      lastStatus: null,
      excerpts: { neg: [], pos: [] },
    };

    /**
     * DOM Element Cache
     * Updated: 2025-10-17 - Match new HTML structure from interactive_demo.html
     */
    this.elements = {
      // Core container
      content: document.getElementById("sidepanel-content"),
      
      // Loading spinner (2025-10-17: new loading visual feedback)
      loadingSpinner: document.getElementById("loading-spinner"),
      
      // Document info (2025-10-17: renamed from termsTitle to serviceName)
      serviceName: document.getElementById("service-name"),
      termsUrl: document.getElementById("terms-url"),
      
      // Grade display (2025-10-17: simplified to documentGrade)
      documentGrade: document.getElementById("document-grade"),
      
      // Summary view toggle (2025-10-17: new toggle buttons)
      summaryDocumentBtn: document.getElementById("summary-document-btn"),
      summarySectionBtn: document.getElementById("summary-section-btn"),
      summaryViewLabel: document.getElementById("summary-view-label"),
      
      // Overall summary view (2025-10-17: new metric card structure)
      summaryOverall: document.getElementById("summary-overall"),
      rightsScore: document.getElementById("rights-score"),
      confidence: document.getElementById("confidence"),
      readabilityScore: document.getElementById("readability-score"),
      flagsContainer: document.getElementById("flags-container"),
      summaryText: document.getElementById("summary-text"),
      
      // URI category breakdown (2025-10-17: new collapsible section)
      uriBreakdown: document.getElementById("uri-breakdown"),
      uriCategoriesContainer: document.getElementById("uri-categories-container"),
      
      // Sections summary view (2025-10-17: new accordion)
      summarySections: document.getElementById("summary-sections"),
      sectionsAccordion: document.getElementById("sections-accordion"),
      
      // Uncommon terms (2025-10-17: simplified container)
      uncommonTermsContainer: document.getElementById("uncommon-terms-container"),
    };

    /**
     * Message Handlers
     */
    this.messageHandlers = {
      [MESSAGES.UPDATE_SIDEPANEL]: this.updateSidepanelContent.bind(this),
      [MESSAGES.ANALYSIS_ERROR]: (error) =>
        this.errorManager.handle(error, "analysis"),
      [MESSAGES.CLEAR_PANEL]: this.clearPanel.bind(this),
    };
  }

  /**
   * Loading State Management
   * 2025-10-17: Updated to use visual loading spinner in header
   */
  loadingManager = {
    start: (message = "Loading...") => {
      this.debug.info && this.debug.info("Starting loading state", { message });
      this.state.isLoading = true;
      this.elements.content.classList.add("loading");
      
      // 2025-10-17: Show loading spinner
      if (this.elements.loadingSpinner) {
        this.elements.loadingSpinner.removeAttribute('hidden');
        const loadingText = this.elements.loadingSpinner.querySelector('.loading-text');
        if (loadingText) {
          loadingText.textContent = message;
        }
      }
    },

    update: (message) => {
      this.debug.info && this.debug.info("Loading update", { message });
      
      // 2025-10-17: Update loading message
      if (this.elements.loadingSpinner) {
        const loadingText = this.elements.loadingSpinner.querySelector('.loading-text');
        if (loadingText) {
          loadingText.textContent = message;
        }
      }
    },

    end: () => {
      this.debug.info && this.debug.info("Ending loading state");
      this.state.isLoading = false;
      this.elements.content.classList.remove("loading");
      
      // 2025-10-17: Hide loading spinner
      if (this.elements.loadingSpinner) {
        this.elements.loadingSpinner.setAttribute('hidden', '');
      }
    },
  };

  /**
   * Status Message Management
   * 2025-10-17: Simplified - new HTML structure doesn't have statusMessage element
   */
  statusManager = {
    show: (message, type = "info", duration = 5000) => {
      this.debug.info &&
        this.debug.info("Status message", { message, type });
      // 2025-10-17: Could use browser console or future toast notifications
      this.state.lastStatus = { message, type };
    },

    clear: () => {
      this.state.lastStatus = null;
    },
  };

  /**
   * Error Management
   */
  errorManager = {
    handle: (error, context = "") => {
      this.debug.error && this.debug.error(`Error in ${context}:`, error);

      this.state.isError = true;
      this.elements.content.classList.add("error");

      this.statusManager.show(
        error.message || "An error occurred while processing your request",
        "error",
      );

      if (context) {
        const contextElement = document.querySelector(`.${context}`);
        if (contextElement) {
          contextElement.classList.add("error");
        }
      }
    },

    clear: () => {
      this.state.isError = false;
      this.elements.content.classList.remove("error");
      document.querySelectorAll(".error").forEach((el) => {
        el.classList.remove("error");
      });
    },
  };

  /**
   * Content Update Functions
   */
  async updateSection(sectionName, updateFn) {
    try {
      this.loadingManager.update(`Updating ${sectionName}...`);
      await updateFn();
    } catch (error) {
      this.errorManager.handle(error, sectionName);
    }
  }

  // 2025-10-17: Updated to use serviceName instead of termsTitle
  updateDocumentInfo(info) {
    if (!info) return;
    this.elements.termsUrl.href = info.url;
    this.elements.termsUrl.textContent = info.url;
    this.elements.serviceName.textContent = info.title;
  }

  // 2025-10-17: Updated to use documentGrade instead of combinedGrade
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

      // 2025-10-17: Update Grade Display (now using documentGrade element)
      if (combinedGradeData?.grade && this.elements.documentGrade) {
        const grade = combinedGradeData.grade;
        
        // Set text
        this.elements.documentGrade.textContent = grade;
        this.elements.documentGrade.setAttribute("data-grade-value", grade);
        
        // 2025-10-17: Grade styling now handled by CSS classes in new structure
        this.elements.documentGrade.className = `grade grade-${grade.toLowerCase().replace(/[+\-]/g, '')}`;
        
        // Accessibility
        this.elements.documentGrade.setAttribute(
          "aria-label",
          `Document grade ${grade}`
        );
        
        this.debug.info && this.debug.info(`Combined grade displayed: ${grade}`);
      } else {
        // Only simple fallback - don't recalculate
        if (this.elements.documentGrade) {
          this.elements.documentGrade.textContent = "N/A";
          this.elements.documentGrade.setAttribute("data-grade-value", "N/A");
        }
        this.debug.warn && this.debug.warn("No combined grade available in analysis results");
      }

    } catch (error) {
      this.debug.error && this.debug.error("Error in updateScores:", error);
      if (this.elements?.documentGrade) {
        this.elements.documentGrade.textContent = "Error";
      }
    }
  }

  /**
   * Update the summary metrics cards
   * 2025-10-17: Updated to use new element names (rightsScore, confidence, readabilityScore, flagsContainer)
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

      // 2025-10-17: Update Rights Score card (renamed from summaryRightsScore)
      if (this.elements.rightsScore) {
        this.elements.rightsScore.textContent = 
          typeof uriScore === 'number' ? Math.round(uriScore) : '--';
      }

      // 2025-10-17: Update Confidence card (renamed from summaryConfidence)
      if (this.elements.confidence) {
        this.elements.confidence.textContent = 
          typeof confidencePct === 'number' ? `${confidencePct}%` : '--';
      }

      // 2025-10-17: Update Readability Score card (renamed from summaryReadabilityScore)
      if (this.elements.readabilityScore) {
        this.elements.readabilityScore.textContent = 
          typeof readabilityEase === 'number' ? readabilityEase.toFixed(1) : '--';
      }

      // 2025-10-17: Update flags/chips in flagsContainer (new structure)
      if (this.elements.flagsContainer) {
        const chips = [];
        
        // Risk chip
        if (riskLevel) {
          const riskText = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
          const themeMap = {
            'high': 'risk-high',
            'critical': 'risk-high',
            'medium': 'risk-medium',
            'low': 'risk-low',
            'positive': 'risk-low'
          };
          const theme = themeMap[riskLevel] || 'risk-medium';
          chips.push(`<span class="chip ${theme}">Risk ${riskText}</span>`);
        }
        
        // Confidence chip
        if (typeof confidencePct === 'number') {
          chips.push(`<span class="chip">Confidence ${confidencePct}%</span>`);
        }
        
        // Terms analyzed chip
        let termsText = null;
        if (typeof clauseCount === 'number' && clauseCount > 0) {
          termsText = `${clauseCount} clauses analyzed`;
        } else if (typeof wordCount === 'number') {
          termsText = `${Math.round(wordCount / 100)}+ terms analyzed`;
        }
        if (termsText) {
          chips.push(`<span class="chip">${termsText}</span>`);
        }
        
        this.elements.flagsContainer.innerHTML = chips.join('');
      }

    } catch (error) {
      this.debug.error && this.debug.error('Error updating summary metrics:', error);
    }
  }

  /**
   * Update URI Category Breakdown
   * 2025-10-17: Display all 8 URI categories with scores and grades
   */
  updateUriCategoryBreakdown(userRightsIndex) {
    if (!this.elements.uriCategoriesContainer || !userRightsIndex) return;

    try {
      const categories = userRightsIndex.categories || {};
      
      // Category labels in display order
      const categoryOrder = [
        { key: 'DATA_COLLECTION_USE', label: 'Data Collection & Use' },
        { key: 'USER_PRIVACY', label: 'User Privacy' },
        { key: 'DISPUTE_RESOLUTION', label: 'Dispute Resolution' },
        { key: 'TERMS_CHANGES', label: 'Terms Changes' },
        { key: 'CONTENT_RIGHTS', label: 'Content Rights' },
        { key: 'ACCOUNT_MANAGEMENT', label: 'Account Management' },
        { key: 'ALGORITHMIC_DECISIONS', label: 'Algorithmic Decisions' },
        { key: 'CLARITY_TRANSPARENCY', label: 'Clarity & Transparency' }
      ];

      const categoryItems = categoryOrder.map(({ key, label }) => {
        const cat = categories[key];
        const score = typeof cat?.score === 'number' ? cat.score : null;
        const grade = cat?.grade || 'N/A';
        
        // Determine score class for color coding
        let scoreClass = '';
        if (score !== null) {
          if (score >= 85) scoreClass = 'score-high';
          else if (score >= 70) scoreClass = 'score-medium';
          else if (score >= 50) scoreClass = 'score-low';
          else scoreClass = 'score-critical';
        }

        const scoreText = score !== null ? `${Math.round(score)}%` : '--';

        return `
          <div class="uri-category-item">
            <span class="uri-category-label">${label}</span>
            <div class="uri-category-score ${scoreClass}">
              <span class="score-value">${scoreText}</span>
              <span class="score-grade">${grade}</span>
            </div>
          </div>
        `;
      }).join('');

      this.elements.uriCategoriesContainer.innerHTML = categoryItems;

      // Show the breakdown section if we have valid data
      if (this.elements.uriBreakdown && categoryItems) {
        this.elements.uriBreakdown.style.display = 'block';
      }

      this.debug.info && this.debug.info('URI category breakdown updated');
    } catch (error) {
      this.debug.error && this.debug.error('Error updating URI category breakdown:', error);
    }
  }

  updateSummary(summary, enhancedData) {
    if (!summary) return;

    const data = this.currentContent || {};
    const scores = data.scores || {};
    const uriData = scores.userRightsIndex || data.userRightsIndex || null;
    const rightsData = data.rightsDetails || scores.rights || {};
    const readabilityData = data.readability || scores.readability || {};

    // Calculate metrics for chips
    const uriScore = typeof uriData?.weightedScore === "number"
      ? uriData.weightedScore
      : typeof rightsData?.rightsScore === "number"
        ? rightsData.rightsScore
        : null;

    const readabilityEase = typeof readabilityData?.flesch === "number"
      ? readabilityData.flesch
      : null;

    const confidencePct = typeof rightsData?.confidence === "number"
      ? Math.round(rightsData.confidence * 100)
      : null;

    const summaryBundle = enhancedData || {
      enhancedSummary: data.enhancedSummary,
      riskLevel: data.riskLevel,
      keyFindings: data.keyFindings,
      sections: data.sections,
    };

    const riskLevel = summaryBundle?.riskLevel || rightsData?.riskLevel || null;

    // Update summary metrics chips
    this.updateSummaryMetrics({
      uriScore,
      rightsGrade: uriData?.grade,
      readabilityEase,
      confidencePct,
      riskLevel,
      wordCount: readabilityData?.wordCount,
      clauseCount: this.calculateTotalClauses(rightsData),
    });

    // 2025-10-17: Update URI category breakdown
    if (this.currentContent?.userRightsIndex) {
      this.updateUriCategoryBreakdown(this.currentContent.userRightsIndex);
    }

    // 2025-10-17: Update main summary text (renamed from overallSummary to summaryText)
    if (summaryBundle?.keyFindings && Array.isArray(summaryBundle.keyFindings)) {
      // Use structured format from enhancedSummarizer
      const summaryHtml = this.formatEnhancedSummary(summaryBundle.keyFindings);
      this.elements.summaryText.innerHTML = summaryHtml;
    } else if (summaryBundle?.enhancedSummary?.overall) {
      // Fallback to text-based summary
      const summaryHtml = this.formatEnhancedSummary(summaryBundle.enhancedSummary.overall);
      this.elements.summaryText.innerHTML = summaryHtml;
    } else {
      this.elements.summaryText.innerHTML = `<p>${summary || 'No summary available.'}</p>`;
    }
  }

  /**
   * Helper to calculate total clause count
   */
  calculateTotalClauses(rightsData) {
    const clauseCounts = rightsData?.details?.clauseCounts;
    if (!clauseCounts) return null;

    return Object.values(clauseCounts).reduce((total, group) => {
      if (typeof group === "number") return total + group;
      if (group && typeof group === "object") {
        return total + Object.values(group).reduce(
          (groupTotal, value) => groupTotal + (typeof value === "number" ? value : 0),
          0
        );
      }
      return total;
    }, 0);
  }

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
    const summaryText = summaryData;
    
    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const renderInline = (text) => {
      let result = "";
      let lastIndex = 0;
      const boldRegex = /\*\*(.+?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
        result += escapeHtml(text.slice(lastIndex, match.index));
        result += `<strong>${escapeHtml(match[1])}</strong>`;
        lastIndex = match.index + match[0].length;
      }

      result += escapeHtml(text.slice(lastIndex));
      return result;
    };

    const lines = summaryText.split("\n");
    const parts = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length) {
        parts.push(`<ul>${listItems.join("")}</ul>`);
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i += 1) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        flushList();
        continue;
      }

      if (trimmed.startsWith("•")) {
        const item = trimmed.slice(1).trim();
        listItems.push(`<li>${renderInline(item)}</li>`);
        continue;
      }

      flushList();

      const headingMatch = trimmed.match(/\*\*(.+?)\*\*\s*:?$/);
      if (headingMatch) {
        const headingText = headingMatch[1].replace(/:\s*$/, "");
        parts.push(`<h3>${renderInline(headingText)}</h3>`);
        continue;
      }

      const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
      if (trimmed.endsWith(":") && nextLine && nextLine.startsWith("•")) {
        const heading = trimmed.slice(0, -1).trim();
        parts.push(`<h4>${renderInline(heading)}</h4>`);
        continue;
      }

      parts.push(`<p>${renderInline(trimmed)}</p>`);
    }

    flushList();

    return parts.join("");
  }

  updateRiskDisplay(riskLevel) {
    const riskDisplay = document.getElementById("document-risk");
    const riskBadge = document.getElementById("risk-badge");

    if (riskLevel && riskDisplay && riskBadge) {
      riskBadge.textContent = riskLevel.replace("-", " ").toUpperCase();
      riskBadge.className = `risk-badge ${riskLevel}`;
      riskDisplay.style.display = "block";
    }
  }

  updateKeyFindings(keyFindings) {
    const keyFindingsSection = document.getElementById("key-findings-section");
    if (keyFindingsSection) keyFindingsSection.style.display = "none";
  }

  updateRiskAlert(alertMessage) {
    const riskAlert = document.getElementById("risk-alert");
    const riskMessageEl = document.getElementById("risk-message");

    if (alertMessage && riskAlert && riskMessageEl) {
      riskMessageEl.textContent = alertMessage;
      riskAlert.style.display = "block";

      // Add appropriate risk class based on message content
      const alertDiv = riskAlert.querySelector(".risk-alert");
      if (alertMessage.includes("several sections")) {
        alertDiv.className = "risk-alert high-risk";
      } else if (alertMessage.includes("some terms")) {
        alertDiv.className = "risk-alert medium-risk";
      } else {
        alertDiv.className = "risk-alert";
      }
    } else if (riskAlert) {
      riskAlert.style.display = "none";
    }
  }

  // 2025-10-17: Updated to use sectionsAccordion instead of sectionSummaries
  updateSections(sections) {
    this.elements.sectionsAccordion.innerHTML = "";

    if (!sections?.length) {
      this.elements.sectionsAccordion.innerHTML = 
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
      this.elements.sectionsAccordion.appendChild(sectionDiv);
    });
  }

  // 2025-10-17: Excerpts feature not in new HTML structure - keeping for API compatibility but not rendering
  updateExcerpts(excerpts) {
    // Store in state for potential future use
    if (Array.isArray(excerpts)) {
      this.state.excerpts = { neg: excerpts.slice(0), pos: [] };
    } else if (excerpts && typeof excerpts === "object") {
      const neg = Array.isArray(excerpts.negative)
        ? excerpts.negative
        : Array.isArray(excerpts.neg)
          ? excerpts.neg
          : [];
      const pos = Array.isArray(excerpts.positive)
        ? excerpts.positive
        : Array.isArray(excerpts.pos)
          ? excerpts.pos
          : [];
      this.state.excerpts = { neg, pos };
    } else {
      this.state.excerpts = { neg: [], pos: [] };
    }

    // 2025-10-17: No rendering - keyExcerptsList element doesn't exist in new structure
    this.debug.info && this.debug.info('Excerpts stored but not rendered in new UI');
  }

  // 2025-10-17: Excerpts rendering disabled - not in new HTML structure
  renderExcerpts(view = "neg") {
    this.debug.info && this.debug.info('renderExcerpts called but disabled in new UI structure');
    // No-op: keyExcerptsList element doesn't exist in new HTML
    return;
  }

  // 2025-10-17: Updated to use uncommonTermsContainer instead of uncommonTermsList
  updateTerms(terms) {
    this.elements.uncommonTermsContainer.innerHTML = "";

    if (!terms?.length) {
      this.elements.uncommonTermsContainer.innerHTML =
        "<p>No uncommon words found.</p>";
      return;
    }

    terms.forEach((item, idx) => {
      const termSpan = document.createElement("span");
      termSpan.textContent = item.word;
      termSpan.classList.add(Constants.CLASSES.UNCOMMON_TERM);
      termSpan.setAttribute("data-definition", item.definition);
      termSpan.setAttribute("title", item.definition || "");
      this.elements.uncommonTermsContainer.appendChild(termSpan);
      if (idx < terms.length - 1) {
        this.elements.uncommonTermsContainer.appendChild(
          document.createTextNode(" | "),
        );
      }
    });
  }

  updateDictionaryTerms(dictTerms) {
    if (!this.elements.dictionaryTermsList) return; // backward safety if HTML not updated
    this.elements.dictionaryTermsList.innerHTML = "";
    if (!dictTerms || !dictTerms.length) {
      this.elements.dictionaryTermsList.innerHTML =
        "<p>No dictionary terms found.</p>";
      return;
    }
    dictTerms.forEach((item) => {
      const li = document.createElement("li");
      li.className = "dictionary-term";
      li.textContent = `${item.word} (${item.count})`;
      li.setAttribute("data-definition", item.definition || "");
      this.elements.dictionaryTermsList.appendChild(li);
    });
  }

  /**
   * Popup Management
   */
  formatOverallPopup(data) {
    if (!data || (!data.readability && !data.userRightsIndex)) {
      return "No overall assessment data available";
    }

    const readability = data.readability || {};
    const uri = data.userRightsIndex || {};

    const readabilityGrade = readability?.grade || "N/A";
    const uriScore =
      typeof uri.weightedScore === "number"
        ? uri.weightedScore.toFixed(0)
        : null;
    const uriGrade = uri?.grade
      ? uri.grade
      : typeof uri.weightedScore === "number"
        ? this.getGradeFromScore(uri.weightedScore)
        : "N/A";
    const overallGrade = this.calculateOverallGrade(readability, uri);

    return `
      <div class="popup-header">
        <strong>Overall Grade: ${overallGrade}</strong>
      </div>
      <div class="popup-metrics">
        <h4>Component Grades:</h4>
        <div class="metric-row">
          <span class="metric-label">Readability Grade:</span>
          <span class="metric-value">${readabilityGrade}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">User Rights Index Grade:</span>
          <span class="metric-value">${uriScore !== null ? `${uriGrade} (${uriScore}%)` : uriGrade}</span>
        </div>
      </div>
      <div class="popup-explanation">
        <p><strong>What this means:</strong></p>
        <p>The overall grade combines readability (40%) and the User Rights Index (60%) to provide a balanced assessment of clarity and user protections.</p>
      </div>
    `;
  }

  formatReadabilityPopup(data) {
    if (!data) return "No readability data available";

    // Handle error case
    if (data.error) {
      return `<p class="error">Error: ${data.error}</p>`;
    }

    const grade = data.grade || data.averageGrade || "N/A";
    const flesch =
      typeof data.flesch === "number" ? data.flesch.toFixed(1) : "N/A";
    const kincaid =
      typeof data.kincaid === "number" ? data.kincaid.toFixed(1) : "N/A";
    const fogIndex =
      typeof data.fogIndex === "number" ? data.fogIndex.toFixed(1) : "N/A";

    // Document statistics
    const wordCount = data.wordCount || data.totalWords || "N/A";
    const sentenceCount = data.sentenceCount || data.totalSentences || "N/A";
    const asl =
      typeof data.averageSentenceLength === "number"
        ? data.averageSentenceLength.toFixed(1)
        : "N/A";
    const asw =
      typeof data.averageSyllablesPerWord === "number"
        ? data.averageSyllablesPerWord.toFixed(1)
        : "N/A";

    return `
      <div class="popup-header">
        <strong>Readability Grade: ${grade}</strong>
      </div>
      <div class="popup-metrics">
        <h4>Reading Metrics:</h4>
        <div class="metric-row">
          <span class="metric-label">Flesch Reading Ease:</span>
          <span class="metric-value">${flesch}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Flesch-Kincaid Grade Level:</span>
          <span class="metric-value">${kincaid}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Gunning Fog Index:</span>
          <span class="metric-value">${fogIndex}</span>
        </div>
        <h4>Document Statistics:</h4>
        <div class="metric-row">
          <span class="metric-label">Word count:</span>
          <span class="metric-value">${wordCount}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Sentence count:</span>
          <span class="metric-value">${sentenceCount}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Average sentence length (ASL):</span>
          <span class="metric-value">${asl}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Average syllables per word (ASW):</span>
          <span class="metric-value">${asw}</span>
        </div>
      </div>
      <div class="popup-explanation">
        <p><strong>What this means:</strong></p>
        <p>${this.getReadabilityExplanation(grade, data.flesch)}</p>
      </div>
    `;
  }

  formatRightsPopup(data) {
    if (!data) return "No rights data available";

    // Handle error case
    if (data.error) {
      return `<p class="error">Error: ${data.error}</p>`;
    }

    const score =
      typeof data === "number" ? data : data.rightsScore || data.score || 0;
    const displayScore =
      typeof score === "number"
        ? (score > 1 ? score : score * 100).toFixed(0)
        : "N/A";
    const grade = data.grade || this.getGradeFromScore(score);
    const confidence = data.confidence
      ? (data.confidence * 100).toFixed(0)
      : "N/A";

    let clauseInfo = "";
    if (data.details && data.details.clauseCounts) {
      const highRisk = data.details.clauseCounts.HIGH_RISK || {};
      const mediumRisk = data.details.clauseCounts.MEDIUM_RISK || {};
      const positives = data.details.clauseCounts.POSITIVES || {};

      const highRiskClauses = Object.keys(highRisk).filter(
        (k) => highRisk[k] > 0,
      );
      const mediumRiskClauses = Object.keys(mediumRisk).filter(
        (k) => mediumRisk[k] > 0,
      );
      const positiveClauses = Object.keys(positives).filter(
        (k) => positives[k] > 0,
      );

      clauseInfo = `
        <h4>Detected Clauses:</h4>
        ${
          highRiskClauses.length > 0
            ? `
          <div class="clause-category high-risk">
            <strong>High Risk:</strong> ${highRiskClauses
              .map(this.formatClauseName)
              .join(", ")}
          </div>
        `
            : ""
        }
        ${
          mediumRiskClauses.length > 0
            ? `
          <div class="clause-category medium-risk">
            <strong>Medium Risk:</strong> ${mediumRiskClauses
              .map(this.formatClauseName)
              .join(", ")}
          </div>
        `
            : ""
        }
        ${
          positiveClauses.length > 0
            ? `
          <div class="clause-category positive">
            <strong>User-Friendly:</strong> ${positiveClauses
              .map(this.formatClauseName)
              .join(", ")}
          </div>
        `
            : ""
        }
      `;
    }

    // Category breakdown (actual available categories)
    let categoryInfo = "";
    if (data.details && data.details.categoryScores) {
      const categories = data.details.categoryScores;

      // Use actual available categories from the data
      const availableCategories = Object.keys(categories).sort();

      // Category labels mapping for user-friendly display
      const categoryLabels = {
        // Clause-based categories from rights assessor
        ARBITRATION: "Arbitration Requirements",
        CLASS_ACTION_WAIVER: "Class Action Limitations",
        UNILATERAL_CHANGES: "Unilateral Changes",
        DATA_SALE_OR_SHARING: "Data Sale/Sharing",
        AUTO_RENEWAL_FRICTION: "Auto-Renewal Terms",
        NEGATIVE_OPTION_BILLING: "Negative Option Billing",
        DELEGATION_ARBITRABILITY: "Arbitration Delegation",
        ARBITRATION_CARVEOUTS: "Arbitration Exceptions",
        VAGUE_CONSENT: "Consent Terms",
        LIMITED_RETENTION_DISCLOSURE: "Data Retention",
        MORAL_RIGHTS_WAIVER: "Moral Rights Waiver",
        JURY_TRIAL_WAIVER: "Jury Trial Waiver",
        CLEAR_OPT_OUT: "Opt-Out Options",
        SELF_SERVICE_DELETION: "Data Deletion Rights",
        NO_DATA_SALE: "Data Sale Restrictions",
        TRANSPARENT_RETENTION: "Clear Retention Policies",
        // Heuristic categories from processing script
        DISPUTE_RESOLUTION: "Dispute Resolution",
        CLASS_ACTIONS: "Class Actions",
        DATA_PRACTICES: "Data Practices",
        BILLING_AND_AUTORENEWAL: "Billing & Auto-Renewal",
        CONTENT_AND_IP: "Content & IP Rights",
        LIABILITY_AND_REMEDIES: "Liability & Remedies",
        RETENTION_AND_DELETION: "Data Retention & Deletion",
      };

      const items = availableCategories
        .filter((k) => categories[k] && typeof categories[k].score === "number")
        .map((k) => {
          const val = categories[k].score;
          const displayScore = val.toFixed(0);
          const label = categoryLabels[k] || this.formatCategoryName(k);
          return `<div class="metric-row"><span class="metric-label">${label}:</span><span class="metric-value">${displayScore}</span></div>`;
        })
        .join("");

      if (items) {
        categoryInfo = `
          <div class="popup-metrics">
            <h4>Category Breakdown:</h4>
            ${items}
          </div>
        `;
      }
      if (
        data.details.unmappedClauseKeys &&
        data.details.unmappedClauseKeys.length
      ) {
        categoryInfo += `
            <div class="popup-clauses">
              <div class="clause-category">
                <strong>Unmapped Clauses:</strong> ${data.details.unmappedClauseKeys
                  .map(this.formatClauseName)
                  .join(", ")}
              </div>
            </div>
          `;
      }

      // Top risk sections by category (uses this.currentContent.sections)
      try {
        if (
          this.currentContent &&
          Array.isArray(this.currentContent.sections)
        ) {
          const sections = this.currentContent.sections;
          const byCat = Object.create(null);
          sections.forEach((s, idx) => {
            const cs = s?.rights?.categoryScores;
            if (!cs) return;
            Object.entries(cs).forEach(([cat, obj]) => {
              const sc = typeof obj?.score === "number" ? obj.score : NaN;
              if (isNaN(sc)) return;
              if (!byCat[cat]) byCat[cat] = [];
              byCat[cat].push({
                idx: idx + 1,
                title:
                  s.userFriendlyHeading || s.heading || `Section ${idx + 1}`,
                score: sc,
              });
            });
          });

          const order = Object.keys(
            Constants.ANALYSIS.RIGHTS.WEIGHTS.HIGH_RISK,
          ).concat(Object.keys(Constants.ANALYSIS.RIGHTS.WEIGHTS.MEDIUM_RISK));

          const orderForTop = order.filter((c) => byCat[c] && byCat[c].length);
          const blocks = orderForTop
            .map((cat) => {
              const list = byCat[cat]
                .sort((a, b) => a.score - b.score) // lower score = higher risk
                .slice(0, 3)
                .map(
                  (e) =>
                    `<li><a href="#section-${e.idx}">${
                      e.title
                    }</a> — ${e.score.toFixed(0)}</li>`,
                ) // anchor links
                .join("");
              if (!list) return "";
              return `<div class="top-risk-category"><strong>${this.formatCategoryName(
                cat,
              )}:</strong><ul class="top-risk-list">${list}</ul></div>`;
            })
            .join("");
          if (blocks) {
            categoryInfo += `
              <div class="popup-top-risk">
                <h4>Top risk sections by category:</h4>
                ${blocks}
              </div>
            `;
          }
        }
      } catch (e) {
        // Non-fatal
      }
    }

    return `
      <div class="popup-header">
        <strong>Rights Score: ${displayScore}% (Grade ${grade})</strong>
      </div>
      <div class="popup-metrics">
        <div class="metric-row">
          <span class="metric-label">User Rights Protection:</span>
          <span class="metric-value">${displayScore}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Confidence:</span>
          <span class="metric-value">${confidence}%</span>
        </div>
        ${
          data.details?.dictionaryTerms
            ? `
        <div class="metric-row">
          <span class="metric-label">Legal Terms Found:</span>
          <span class="metric-value">${data.details.dictionaryTerms.length}</span>
        </div>
        `
            : ""
        }
      </div>
      ${categoryInfo}
      ${clauseInfo ? `<div class="popup-clauses">${clauseInfo}</div>` : ""}
      <div class="popup-explanation">
        <p><strong>What this means:</strong></p>
        <p>${this.getRightsExplanation(score, grade)}</p>
      </div>
    `;
  }

  // Helper functions for explanations
  getReadabilityExplanation(grade, fleschScore) {
    const scoreDescriptions = {
      A: "This document is very easy to read and understand.",
      B: "This document is fairly easy to read with some education.",
      C: "This document requires average reading skills.",
      D: "This document is somewhat difficult to read.",
      F: "This document is very difficult to read and may require specialized knowledge.",
    };

    let explanation = scoreDescriptions[grade] || "Reading difficulty varies.";

    if (fleschScore !== undefined) {
      if (fleschScore >= 90) explanation += " Written at a 5th grade level.";
      else if (fleschScore >= 80)
        explanation += " Written at a 6th grade level.";
      else if (fleschScore >= 70)
        explanation += " Written at a 7th grade level.";
      else if (fleschScore >= 60)
        explanation += " Written at an 8th-9th grade level.";
      else if (fleschScore >= 50)
        explanation += " Written at a 10th-12th grade level.";
      else if (fleschScore >= 30) explanation += " Written at a college level.";
      else explanation += " Written at a graduate level.";
    }

    return explanation;
  }

  getRightsExplanation(score, grade) {
    const numScore =
      typeof score === "number" ? (score > 1 ? score : score * 100) : 0;

    if (numScore >= 80) {
      return "This document appears to be user-friendly with good protection of user rights.";
    } else if (numScore >= 60) {
      return "This document has moderate user protection but may contain some concerning clauses.";
    } else if (numScore >= 40) {
      return "This document contains several clauses that may limit user rights.";
    } else {
      return "This document contains many clauses that significantly limit user rights. Review carefully.";
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getGradeFromScore(score) {
    const numScore =
      typeof score === "number" ? (score > 1 ? score : score * 100) : 0;
    if (numScore >= 90) return "A";
    if (numScore >= 80) return "B";
    if (numScore >= 70) return "C";
    if (numScore >= 60) return "D";
    return "F";
  }

  calculateOverallGrade(readability, userRightsIndex) {
    try {
      // Get numeric scores
      let readabilityScore = 0;
      if (readability?.flesch !== undefined) {
        // Convert Flesch (0-100) to grade-like score
        readabilityScore = Math.max(0, Math.min(100, readability.flesch));
      } else if (readability?.grade) {
        // Convert letter grade to numeric
        const gradeMap = { A: 95, B: 85, C: 75, D: 65, F: 50 };
        readabilityScore = gradeMap[readability.grade] || 50;
      }

      let uriScore = null;
      if (typeof userRightsIndex === "number") {
        uriScore = userRightsIndex;
      } else if (userRightsIndex?.weightedScore !== undefined) {
        uriScore = userRightsIndex.weightedScore;
      } else if (userRightsIndex?.score !== undefined) {
        uriScore = userRightsIndex.score;
      }

      const hasUriScore =
        typeof uriScore === "number" && !Number.isNaN(uriScore);

      if (!hasUriScore) {
        return this.getGradeFromScore(readabilityScore);
      }

      // Weighted combination: 40% readability, 60% user rights index
      const combined = readabilityScore * 0.4 + uriScore * 0.6;
      return this.getGradeFromScore(combined);
    } catch (error) {
      return "N/A";
    }
  }

  /**
   * Returns a linear-gradient CSS string for a given grade.
   * @param {string} grade The grade ('A+' through 'F-').
   * @returns {string} A CSS linear-gradient.
   */
  getColorForGrade(grade) {
    const gradeMap = {
      'A+': 100, 'A': 95, 'A-': 92,
      'B+': 88, 'B': 85, 'B-': 82,
      'C+': 78, 'C': 75, 'C-': 72,
      'D+': 68, 'D': 65, 'D-': 62,
      'F+': 55, 'F': 40, 'F-': 20
    };

    const score = gradeMap[grade] || 50;

    // Color stops for gradient (green → yellow → orange → red)
    const stops = [
      { score: 100, hex: '#28a745' },  // Green A+
      { score: 90, hex: '#8fbc8f' },   // Sea Green A-
      { score: 80, hex: '#ffc107' },   // Amber B-
      { score: 70, hex: '#fd7e14' },   // Orange C-
      { score: 60, hex: '#dc3545' },   // Red D-
      { score: 0, hex: '#a52a2a' }     // Deep Red F-
    ];

    // Find surrounding color stops
    let startStop = stops[stops.length - 1];
    let endStop = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (score >= stops[i].score) {
        startStop = stops[i];
        endStop = stops[i];
        break;
      }
      if (score < stops[i].score && score >= stops[i + 1].score) {
        startStop = stops[i];
        endStop = stops[i + 1];
        break;
      }
    }

    // Calculate blend factor
    const blendFactor = startStop.score === endStop.score
      ? 0
      : (score - endStop.score) / (startStop.score - endStop.score);

    // Helper to convert hex to RGB
    const hexToRgb = (hex) => {
      const value = parseInt(hex.slice(1), 16);
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
      };
    };

    // Interpolate between colors
    const startRgb = hexToRgb(startStop.hex);
    const endRgb = hexToRgb(endStop.hex);
    
    const mixChannel = (start, end, factor) =>
      Math.round(end + (start - end) * factor);

    const mixed = {
      r: mixChannel(startRgb.r, endRgb.r, blendFactor),
      g: mixChannel(startRgb.g, endRgb.g, blendFactor),
      b: mixChannel(startRgb.b, endRgb.b, blendFactor),
    };

    const midColor = `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
    return `linear-gradient(135deg, ${midColor}, ${startStop.hex})`;
  }

  formatClauseName(clauseName) {
    return clauseName
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  formatCategoryName(cat) {
    return cat
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  updatePopupContent(popupId, data) {
    const popup = document.getElementById(popupId);
    if (!popup) return;

    const content = popup.querySelector(".popup-content");
    if (!content) return;

    if (
      data &&
      typeof data === "object" &&
      Object.prototype.hasOwnProperty.call(data, "__html")
    ) {
      content.innerHTML = data.__html || "";
      return;
    }

    switch (popupId) {
      case "overallPopup":
        content.innerHTML = this.formatOverallPopup(data);
        break;
      case "readabilityPopup":
        content.innerHTML = this.formatReadabilityPopup(data);
        break;
      case "rightsPopup":
        content.innerHTML = this.formatRightsPopup(data);
        break;
    }
  }

  /**
   * Diagnostics (Dictionary Metrics)
   */
  diagInterval = null;
  async setDiagnosticsEnabled(enabled) {
    try {
      await chrome.storage.local.set({
        __diag_dictionary_enabled: !!enabled,
      });
      const checkbox = document.getElementById("toggle-diagnostics");
      if (checkbox) checkbox.checked = !!enabled;
      if (this.elements.diagnostics) {
        this.elements.diagnostics.style.display = enabled ? "" : "none";
      }
    } catch (_) {}
  }

  enableDiagnosticsIfConfigured() {
    try {
      const flag =
        Constants.DEBUG &&
        Constants.DEBUG.FEATURES &&
        Constants.DEBUG.FEATURES.DICTIONARY_METRICS &&
        Constants.DEBUG.FEATURES.DICTIONARY_METRICS.ENABLED;
      const toggleEl = document.getElementById("toggle-diagnostics");
      if (toggleEl) {
        toggleEl.addEventListener("change", (e) =>
          this.setDiagnosticsEnabled(e.target.checked),
        );
      }
      if (!this.elements.diagnostics) return;
      if (!flag) {
        this.elements.diagnostics.style.display = "none";
        return;
      }
      // Populate pattern weights card once
      try {
        const grid = document.getElementById("pattern-weights-grid");
        const countsGrid = document.getElementById("pattern-clausecounts-grid");
        const countsToggle = document.getElementById("toggle-clause-counts");
        if (countsToggle) {
          countsToggle.addEventListener("change", (e) => {
            if (countsGrid) {
              countsGrid.style.display = e.target.checked ? "grid" : "none";
              if (e.target.checked) this.populateClauseCountsGrid();
            }
          });
        }
        if (grid && grid.childElementCount === 0) {
          const weights = EXT_CONSTANTS.ANALYSIS.RIGHTS.WEIGHTS;
          const sections = [
            ["HIGH_RISK", weights.HIGH_RISK],
            ["MEDIUM_RISK", weights.MEDIUM_RISK],
            ["POSITIVES", weights.POSITIVES],
          ];
          sections.forEach(([label, map]) => {
            const header = document.createElement("div");
            header.className = "diag-subheader";
            header.textContent = label;
            header.style.gridColumn = "1 / -1";
            grid.appendChild(header);
            Object.entries(map).forEach(([k, v]) => {
              const keyDiv = document.createElement("div");
              keyDiv.textContent = k;
              const valDiv = document.createElement("div");
              valDiv.textContent = v;
              grid.appendChild(keyDiv);
              grid.appendChild(valDiv);
            });
          });
          // Caps
          const capsHeader = document.createElement("div");
          capsHeader.className = "diag-subheader";
          capsHeader.textContent = "CAPS";
          capsHeader.style.gridColumn = "1 / -1";
          grid.appendChild(capsHeader);
          Object.entries(weights.CAPS).forEach(([k, v]) => {
            const keyDiv = document.createElement("div");
            keyDiv.textContent = k;
            const valDiv = document.createElement("div");
            valDiv.textContent = v;
            grid.appendChild(keyDiv);
            grid.appendChild(valDiv);
          });
        }
      } catch (e) {
        this.debug.warn &&
          this.debug.warn("Failed to populate pattern weights", e);
      }
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get("__diag_dictionary_enabled").then((data) => {
          this.setDiagnosticsEnabled(!!data.__diag_dictionary_enabled);
        });
      } else {
        this.setDiagnosticsEnabled(true);
      }
      const POLL_MS =
        Constants.DEBUG.FEATURES.DICTIONARY_METRICS.POLL_MS || 10000;
      if (this.diagInterval) clearInterval(this.diagInterval);
      this.diagInterval = setInterval(
        () => this.updateDictionaryMetrics(),
        POLL_MS,
      );
      this.updateDictionaryMetrics();
    } catch (e) {
      this.debug.warn &&
        this.debug.warn("Error enabling diagnostics", { error: e });
    }
  }

  async updateDictionaryMetrics() {
    try {
      const { dictionaryMetrics } =
        await chrome.storage.local.get("dictionaryMetrics");
      if (!dictionaryMetrics) return;
      const { hits, misses, size, max, ttl, ts } = dictionaryMetrics;
      if (this.elements.dictMetricHits)
        this.elements.dictMetricHits.textContent = hits || 0;
      if (this.elements.dictMetricMisses)
        this.elements.dictMetricMisses.textContent = misses || 0;
      if (this.elements.dictMetricSize)
        this.elements.dictMetricSize.textContent = size || 0;
      if (this.elements.dictMetricMax)
        this.elements.dictMetricMax.textContent = max || 0;
      if (this.elements.dictMetricTtl)
        this.elements.dictMetricTtl.textContent = ttl
          ? `${(ttl / 36e5).toFixed(2)}h`
          : "N/A";
      if (this.elements.dictMetricTs)
        this.elements.dictMetricTs.textContent = ts
          ? new Date(ts).toLocaleTimeString()
          : "N/A";
    } catch (e) {
      this.debug.warn &&
        this.debug.warn("Could not update dictionary metrics", { error: e });
    }
  }

  async populateClauseCountsGrid() {
    const grid = document.getElementById("pattern-clausecounts-grid");
    if (!grid) return;
    grid.innerHTML = ""; // Clear previous
    try {
      const { analysisResults } =
        await chrome.storage.local.get("analysisResults");
      if (
        !analysisResults ||
        !analysisResults.rights ||
        !analysisResults.rights.details ||
        !analysisResults.rights.details.clauseCounts
      ) {
        grid.textContent = "No clause data available.";
        return;
      }
      const { clauseCounts } = analysisResults.rights.details;
      const sections = [
        ["HIGH_RISK", clauseCounts.HIGH_RISK],
        ["MEDIUM_RISK", clauseCounts.MEDIUM_RISK],
        ["POSITIVES", clauseCounts.POSITIVES],
      ];
      sections.forEach(([label, map]) => {
        if (!map || Object.keys(map).length === 0) return;
        const header = document.createElement("div");
        header.className = "diag-subheader";
        header.textContent = label;
        header.style.gridColumn = "1 / -1";
        grid.appendChild(header);
        Object.entries(map).forEach(([k, v]) => {
          const keyDiv = document.createElement("div");
          keyDiv.textContent = k;
          const valDiv = document.createElement("div");
          valDiv.textContent = v;
          grid.appendChild(keyDiv);
          grid.appendChild(valDiv);
        });
      });
    } catch (e) {
      grid.textContent = "Error loading clause data.";
      this.debug.warn && this.debug.warn("Failed to populate clause counts", e);
    }
  }

  /**
   * Main Initialization
   */
  initialize() {
    console.log("🔵 SIDEPANEL INITIALIZE() CALLED");
    this.debug.info && this.debug.info("Sidepanel initializing...");
    this.loadingManager.start("Initializing...");

    this.setupEventListeners();
    console.log("🔵 SIDEPANEL: Event listeners set up");
    
    // 2025-10-17: Setup interactive tooltips for metric cards
    this.setupTooltips();
    console.log("🔵 SIDEPANEL: Tooltips initialized");
    
    // Ensure default view is Document-Level on load
    try {
      this.toggleView("document");
    } catch (_) {}
    console.log("🔵 SIDEPANEL: About to request initial data...");
    this.requestInitialData();
    this.enableDiagnosticsIfConfigured();

    this.loadingManager.end();
    this.debug.endTimer && this.debug.endTimer("sidepanelInit");
    this.debug.info && this.debug.info("Sidepanel initialized.");
    this.debug.endGroup && this.debug.endGroup();
  }

  /**
   * Setup interactive tooltips for metric cards
   * 2025-10-17: Added for URI category breakdown and readability metrics display
   */
  setupTooltips() {
    // Create tooltip element (shared for all metrics)
    if (!document.getElementById('metric-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'metric-tooltip';
      tooltip.className = 'metric-tooltip';
      document.body.appendChild(tooltip);
      this.tooltipElement = tooltip;
    } else {
      this.tooltipElement = document.getElementById('metric-tooltip');
    }

    // Setup Rights Score tooltip (shows URI breakdown)
    const rightsCard = this.elements.rightsScore?.parentElement;
    if (rightsCard) {
      rightsCard.addEventListener('mouseenter', (e) => {
        const uri = this.currentContent?.userRightsIndex;
        if (uri) {
          const content = this.formatUriPopup(uri);
          this.showTooltip(rightsCard, content);
        }
      });

      rightsCard.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    }

    // Setup Readability Score tooltip (shows Flesch/Kincaid/Fog metrics)
    const readabilityCard = this.elements.readabilityScore?.parentElement;
    if (readabilityCard) {
      readabilityCard.addEventListener('mouseenter', (e) => {
        const readability = this.currentContent?.readability;
        if (readability) {
          const content = this.formatReadabilityPopup(readability);
          this.showTooltip(readabilityCard, content);
        }
      });

      readabilityCard.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    }

    // Setup Confidence tooltip (shows what confidence means)
    const confidenceElement = this.elements.confidence;
    if (confidenceElement) {
      confidenceElement.style.cursor = 'help';
      confidenceElement.addEventListener('mouseenter', (e) => {
        const rightsData = this.currentContent?.rightsDetails || this.currentContent?.rights;
        if (rightsData) {
          const content = this.formatConfidencePopup(rightsData);
          this.showTooltip(confidenceElement, content);
        }
      });

      confidenceElement.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    }

    this.debug.info && this.debug.info('Tooltips initialized for metric cards');
  }

  /**
   * Show tooltip with content
   * 2025-10-17: Position tooltip near target element
   */
  showTooltip(targetElement, htmlContent) {
    if (!this.tooltipElement) return;

    this.tooltipElement.innerHTML = htmlContent;
    this.tooltipElement.classList.add('visible');

    // Position tooltip
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    
    // Position below the target by default
    let top = rect.bottom + 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Adjust if tooltip would go off-screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    // If tooltip would go below viewport, show above instead
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = rect.top - tooltipRect.height - 10;
    }

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  /**
   * Hide tooltip
   * 2025-10-17: Remove visible class with fade out
   */
  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.classList.remove('visible');
    }
  }

  /**
   * Format confidence tooltip
   * 2025-10-17: Explain what confidence percentage means
   */
  formatConfidencePopup(rightsData) {
    const confidence = typeof rightsData.confidence === 'number' 
      ? Math.round(rightsData.confidence * 100) 
      : null;

    return `
      <div class="popup-header">
        <strong>Confidence: ${confidence !== null ? confidence + '%' : 'N/A'}</strong>
      </div>
      <div class="popup-metrics">
        <h4>What This Measures:</h4>
        <p style="margin: 8px 0; font-size: 0.88rem; line-height: 1.5;">
          Confidence indicates how certain we are about the rights assessment, based on:
        </p>
        <div class="metric-row">
          <span class="metric-label">Coverage (40%):</span>
          <span class="metric-value">Document completeness</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Signal Strength (40%):</span>
          <span class="metric-value">Clear clause matches</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Type Quality (20%):</span>
          <span class="metric-value">Legal term clarity</span>
        </div>
      </div>
      <div class="popup-explanation">
        <p><strong>What this means:</strong></p>
        <p>${this.getConfidenceExplanation(confidence)}</p>
      </div>
    `;
  }

  /**
   * Get explanation for confidence level
   * 2025-10-17: User-friendly confidence interpretation
   */
  getConfidenceExplanation(confidence) {
    if (confidence === null) return 'Confidence data not available.';
    if (confidence >= 80) return 'We have high confidence in this assessment. The document is clear and contains strong indicators.';
    if (confidence >= 60) return 'We have good confidence in this assessment. Most indicators are clear, though some areas may be ambiguous.';
    if (confidence >= 40) return 'We have moderate confidence. Some document sections are unclear or contain conflicting signals.';
    return 'We have lower confidence in this assessment. The document may be incomplete, ambiguous, or lack clear legal language.';
  }

  setupEventListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const handler = this.messageHandlers[message.action];
      if (handler) {
        handler(message.data);
        sendResponse({ status: "ok" });
      }
      return true; // Keep message channel open for async response
    });

    // Summary toggle buttons (updated IDs)
    this.elements.summaryDocumentBtn.addEventListener("click", () =>
      this.toggleView("document"),
    );
    this.elements.summarySectionBtn.addEventListener("click", () =>
      this.toggleView("section"),
    );

    // Key Excerpts toggles
    if (this.elements.excerptsNegBtn) {
      this.elements.excerptsNegBtn.addEventListener("click", () => {
        this.elements.excerptsNegBtn.classList.add("active");
        if (this.elements.excerptsPosBtn)
          this.elements.excerptsPosBtn.classList.remove("active");
        this.renderExcerpts("neg");
      });
    }
    if (this.elements.excerptsPosBtn) {
      this.elements.excerptsPosBtn.addEventListener("click", () => {
        this.elements.excerptsPosBtn.classList.add("active");
        if (this.elements.excerptsNegBtn)
          this.elements.excerptsNegBtn.classList.remove("active");
        this.renderExcerpts("pos");
      });
    }

    // Event delegation for popups
    document.body.addEventListener("click", (event) => {
      const popupTrigger = event.target.closest("[data-popup]");
      if (popupTrigger) {
        const popupId = popupTrigger.dataset.popup;
        const popup = document.getElementById(popupId);
        if (popup) {
          // Toggle active class on the popup itself
          popup.classList.toggle("active");

          // Hide all other popups
          document
            .querySelectorAll(".popup.active")
            .forEach((p) => p !== popup && p.classList.remove("active"));
        }
      } else if (!event.target.closest(".popup")) {
        // If click is outside any popup, hide all
        document
          .querySelectorAll(".popup.active")
          .forEach((p) => p.classList.remove("active"));
      }
    });

    // Setup section link handlers for direct highlighting
    this.setupSectionLinkHandlers();
  }

  /**
   * Setup click handlers for section links to enable direct highlighting
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

  // Enhanced User Rights Index popup with all 8 categories displayed
  formatUriPopup(uri) {
    if (!uri) return "No User Rights Index data available";
    
    const categories = uri.categories || {};
    const weightedScore = typeof uri.weightedScore === 'number' 
      ? uri.weightedScore 
      : null;
    const grade = uri.grade || 'N/A';

    // Build category rows with all 8 categories
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
      const score = typeof cat?.score === 'number' ? cat.score : null;
      const catGrade = cat?.grade || 'N/A';
      
      // Color coding based on score
      let scoreClass = '';
      if (score !== null) {
        if (score >= 85) scoreClass = 'score-high';
        else if (score >= 70) scoreClass = 'score-medium';
        else if (score >= 50) scoreClass = 'score-low';
        else scoreClass = 'score-critical';
      }

      const scoreText = score !== null ? `${Math.round(score)}%` : 'N/A';

      return `
        <div class="metric-row">
          <span class="metric-label">${label}:</span>
          <span class="metric-value ${scoreClass}">${scoreText} (${catGrade})</span>
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
        <strong>User Rights Index: ${weightedScore !== null ? Math.round(weightedScore) + '%' : 'N/A'} (Grade ${grade})</strong>
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

  getUriExplanation(weightedScore, grade) {
    const score = typeof weightedScore === "number" ? weightedScore : 0;
    if (score >= 80)
      return "Strong user protections with clear terms and fair practices.";
    if (score >= 65)
      return "Generally balanced terms with some areas to review.";
    if (score >= 50)
      return "Several clauses may impact your rights; proceed with caution.";
    return "Many terms may limit your rights. Review key sections carefully.";
  }

  async loadSampleData() {
    try {
      this.statusManager.show("Loading sample data…", "info", 2000);
      const sampleUrl = chrome.runtime.getURL("sample/sample_analysis.json");
      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sample = await res.json();
      // Persist for panel reloads and diagnostics
      const key = EXT_CONSTANTS.STORAGE_KEYS.ANALYSIS_RESULTS;
      await chrome.storage.local.set({ [key]: sample });
      await this.updateSidepanelContent(sample);
      this.statusManager.show("Sample data loaded.", "success", 2500);
      this.toggleView("document");
      // Open the referenced sample web page to verify highlights/anchors
      try {
        const refUrl = sample?.documentInfo?.url;
        if (refUrl && chrome?.tabs?.create) {
          await chrome.tabs.create({ url: refUrl });
        }
      } catch (_) {}
    } catch (e) {
      this.errorManager.handle(e, "loadSample");
    }
  }

  // 2025-10-17: Updated to use summaryOverall/summarySections instead of overallSummary/sectionSummaries
  toggleView(view) {
    if (view === "document") {
      this.elements.summaryOverall.style.display = "block";
      this.elements.summarySections.style.display = "none";
      this.elements.summaryDocumentBtn.classList.add("active");
      this.elements.summarySectionBtn.classList.remove("active");
      
      // Update view label
      if (this.elements.summaryViewLabel) {
        this.elements.summaryViewLabel.textContent = "Document Summary";
      }
    } else {
      this.elements.summaryOverall.style.display = "none";
      this.elements.summarySections.style.display = "block";
      this.elements.summaryDocumentBtn.classList.remove("active");
      this.elements.summarySectionBtn.classList.add("active");
      
      // Update view label
      if (this.elements.summaryViewLabel) {
        this.elements.summaryViewLabel.textContent = "Section Summaries";
      }
    }
  }

  requestInitialData() {
    console.log("🔵 SIDEPANEL: requestInitialData() called");
    this.loadingManager.start("Fetching analysis...");
    console.log("🔵 SIDEPANEL: Sending getAnalysisResults message...");
    chrome.runtime.sendMessage({ action: "getAnalysisResults" }, (response) => {
      console.log("🔵 SIDEPANEL: Received response from getAnalysisResults:", response);
      if (chrome.runtime.lastError) {
        console.error("🔴 SIDEPANEL: chrome.runtime.lastError:", chrome.runtime.lastError);
        this.errorManager.handle(
          chrome.runtime.lastError,
          "getAnalysisResults",
        );
        this.loadingManager.end();
      } else if (response && response.error) {
        console.error("🔴 SIDEPANEL: Response contains error:", response.error);
        this.errorManager.handle(response.error, "getAnalysisResults");
        this.loadingManager.end();
      } else if (response && response.data) {
        console.log("✅ SIDEPANEL: Got analysis data, updating content...");
        this.updateSidepanelContent(response.data);
      } else {
        console.warn("⚠️ SIDEPANEL: No data in response");
        this.loadingManager.update("No analysis data found.");
        setTimeout(() => this.loadingManager.end(), 2000);
      }
    });
  }

  clearPanel() {
    this.updateSidepanelContent(null);
    this.statusManager.show("Panel cleared.", "info");
  }

  async updateSidepanelContent(data) {
    this.loadingManager.start("Updating content...");
    this.errorManager.clear();

    if (!data) {
      this.elements.content.classList.add("no-data");
      this.statusManager.show("No analysis data available.", "warn");
      this.loadingManager.end();
      return;
    }

    this.elements.content.classList.remove("no-data");
    this.currentContent = data;

    await this.updateSection("document info", () =>
      this.updateDocumentInfo(data.documentInfo),
    );
    await this.updateSection("scores", () => this.updateScores(data.scores));
    await this.updateSection("summary", () =>
      this.updateSummary(data.summary, data.enhancedData),
    );
    await this.updateSection("sections", () =>
      this.updateSections(data.sections),
    );
    await this.updateSection("excerpts", () =>
      this.updateExcerpts(data.excerpts),
    );
    await this.updateSection("terms", () => this.updateTerms(data.terms));
    await this.updateSection("dictionary terms", () =>
      this.updateDictionaryTerms(data.dictionaryTerms),
    );

    this.loadingManager.end();
    this.debug.info &&
      this.debug.info("Sidepanel content updated successfully.");
  }
}

console.log("🔵 SIDEPANEL.JS: Class definition complete, setting up DOMContentLoaded listener...");

// Initialize the sidepanel on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔵 DOMContentLoaded EVENT FIRED!");
  const sidepanel = new Sidepanel();
  sidepanel.initialize();
  console.log("✅ SIDEPANEL INITIALIZED SUCCESSFULLY");
});

console.log("🔵 SIDEPANEL.JS: Script loaded completely, waiting for DOMContentLoaded...");
