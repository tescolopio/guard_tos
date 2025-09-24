"use strict";

const { EXT_CONSTANTS } = require("../utils/constants");
const { createDebugger } = require("../utils/debugger");

// Alias for easier access
const Constants = EXT_CONSTANTS;

/**
 * Represents the sidepanel functionality.
 * @class
 */
class Sidepanel {
  constructor() {
    const { MESSAGES, CLASSES, DEBUG } = Constants;
    this.currentContent = null;

    // Initialize debugging
    const logger = createDebugger(DEBUG.LEVELS.DEBUG);
    this.debug = logger.debug;

    this.debug.startGroup && this.debug.startGroup(DEBUG.MODULES.SIDEPANEL);
    this.debug.startTimer && this.debug.startTimer("sidepanelInit");

    this.state = {
      isLoading: false,
      isError: false,
      lastStatus: null,
    };

    /**
     * DOM Element Cache
     */
    this.elements = {
      content: document.getElementById("sidepanel-content"),
      diagnostics: document.getElementById("diagnostics"),
      dictMetricHits: document.getElementById("dict-metric-hits"),
      dictMetricMisses: document.getElementById("dict-metric-misses"),
      dictMetricSize: document.getElementById("dict-metric-size"),
      dictMetricMax: document.getElementById("dict-metric-max"),
      dictMetricTtl: document.getElementById("dict-metric-ttl"),
      dictMetricTs: document.getElementById("dict-metric-ts"),
      termsUrl: document.getElementById("terms-url"),
      termsTitle: document.getElementById("terms-title"),
      overallGrade: document.getElementById("overall-grade"),
      readabilityGrade: document.getElementById("readability-grade"),
      userRightsIndex: document.getElementById("user-rights-index"),
      documentLevelBtn: document.getElementById("document-level-btn"),
      bySectionBtn: document.getElementById("by-section-btn"),
      contentOrganization: document.querySelector(".content-organization"),
      overallSummary: document.getElementById("overall-summary"),
      sectionSummaries: document.getElementById("section-summaries"),
      keyExcerptsList: document.getElementById("key-excerpts-list"),
      uncommonTermsList: document.getElementById("uncommon-terms-list"),
      dictionaryTermsList: document.getElementById("dictionary-terms-list"),
      statusMessage: document.getElementById("status-message"),
      loadingIndicator: document.querySelector(".loading-indicator"),
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
   */
  loadingManager = {
    start: (message = "Loading...") => {
      this.debug.info && this.debug.info("Starting loading state", { message });
      this.state.isLoading = true;
      this.elements.content.classList.add("loading");
      this.elements.loadingIndicator.textContent = message;
      this.elements.loadingIndicator.style.display = "block";
    },

    update: (message) => {
      if (this.state.isLoading) {
        this.elements.loadingIndicator.textContent = message;
      }
    },

    end: () => {
      this.debug.info && this.debug.info("Ending loading state");
      this.state.isLoading = false;
      this.elements.content.classList.remove("loading");
      this.elements.loadingIndicator.style.display = "none";
    },
  };

  /**
   * Status Message Management
   */
  statusManager = {
    show: (message, type = "info", duration = 5000) => {
      this.debug.info &&
        this.debug.info("Showing status message", { message, type });

      this.state.lastStatus = { message, type };
      this.elements.statusMessage.textContent = message;
      this.elements.statusMessage.className = `status-message ${type}`;

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.elements.statusMessage.className = "status-message";
      }, duration);
    },

    clear: () => {
      this.elements.statusMessage.className = "status-message";
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

  updateDocumentInfo(info) {
    if (!info) return;
    this.elements.termsUrl.href = info.url;
    this.elements.termsUrl.textContent = info.url;
    this.elements.termsTitle.textContent = info.title;
  }

  updateScores(scores) {
    if (!scores) return;

    // Overall Grade calculation (combination of readability and rights)
    const overallGrade = this.calculateOverallGrade(
      scores.readability,
      scores.rights,
    );
    this.elements.overallGrade.textContent = overallGrade || "N/A";

    // Readability Grade
    this.elements.readabilityGrade.textContent =
      scores.readability?.grade ||
      (scores.readability?.error ? "Error" : "N/A");

    // User Rights Index Grade
    const rightsData = scores.rights;
    let rightsGradeText = "N/A";
    if (rightsData && typeof rightsData === "object") {
      rightsGradeText =
        rightsData.grade ||
        this.getGradeFromScore(rightsData.rightsScore || rightsData.score);
    } else if (typeof rightsData === "number") {
      rightsGradeText = this.getGradeFromScore(rightsData);
    }
    // Prefer new URI grade when available
    if (scores.userRightsIndex && scores.userRightsIndex.grade) {
      this.elements.userRightsIndex.textContent = scores.userRightsIndex.grade;
    } else {
      this.elements.userRightsIndex.textContent = rightsGradeText;
    }

    // Update tooltips
    this.updatePopupContent("overallPopup", {
      readability: scores.readability,
      rights: scores.rights,
      userRightsIndex: scores.userRightsIndex,
    });
    this.updatePopupContent("readabilityPopup", scores.readability);
    // Show legacy rights popup; if URI exists, append URI breakdown
    const rightsHtml = this.formatRightsPopup(scores.rights);
    let uriHtml = "";
    if (scores.userRightsIndex && scores.userRightsIndex.categories) {
      const cats = scores.userRightsIndex.categories;
      const entries = Object.entries(cats)
        .map(([k, v]) => {
          const label =
            (EXT_CONSTANTS.ANALYSIS.USER_RIGHTS_INDEX.CATEGORIES[k] || {})
              .label || this.formatCategoryName(k);
          const sc = typeof v.score === "number" ? v.score.toFixed(0) : "N/A";
          const sent =
            v.sentiment > 0
              ? "positive"
              : v.sentiment < 0
                ? "negative"
                : "neutral";
          return `<div class="metric-row"><span class="metric-label">${label}:</span><span class="metric-value">${sc} <em class="sent-${sent}">(${sent})</em></span></div>`;
        })
        .join("");
      uriHtml = `
        <div class="popup-metrics">
          <h4>User Rights Index (8 categories):</h4>
          ${entries}
          <div class="metric-row"><span class="metric-label">Weighted Score:</span><span class="metric-value">${scores.userRightsIndex.weightedScore}</span></div>
          <div class="metric-row"><span class="metric-label">URI Grade:</span><span class="metric-value">${scores.userRightsIndex.grade}</span></div>
        </div>`;
    }
    this.updatePopupContent("rightsPopup", { __html: rightsHtml + uriHtml });
  }

  updateSummary(summary, enhancedData) {
    if (!summary) return;

    // Update main summary with enhanced formatting
    if (enhancedData && enhancedData.enhancedSummary) {
      const summaryHtml = this.formatEnhancedSummary(
        enhancedData.enhancedSummary.overall,
      );
      this.elements.overallSummary.innerHTML = summaryHtml;

      // Update risk level display
      this.updateRiskDisplay(enhancedData.riskLevel);

      // Update key findings
      this.updateKeyFindings(enhancedData.keyFindings);

      // Show risk alert if needed
      this.updateRiskAlert(enhancedData.plainLanguageAlert);
    } else {
      this.elements.overallSummary.textContent = summary;
    }
  }

  formatEnhancedSummary(summaryText) {
    if (!summaryText) return "";

    // Convert markdown-style formatting to HTML
    let html = summaryText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/📋 \*\*(.*?)\*\*/g, "<h3>📋 $1</h3>")
      .replace(/⚠️ (.*?)(?=\n|$)/g, '<div class="warning-text">⚠️ $1</div>')
      .replace(/✅ (.*?)(?=\n|$)/g, '<div class="positive-text">✅ $1</div>')
      .replace(/💰 (.*?)(?=\n|$)/g, '<div class="money-text">💰 $1</div>')
      .replace(/🔒 (.*?)(?=\n|$)/g, '<div class="privacy-text">🔒 $1</div>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
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
    const keyFindingsList = document.getElementById("key-findings-list");

    if (!keyFindings || !keyFindings.length) {
      keyFindingsSection.style.display = "none";
      return;
    }

    keyFindingsList.innerHTML = "";
    keyFindings.forEach((finding) => {
      const findingDiv = document.createElement("div");
      findingDiv.className = "key-finding-item";

      // Determine if finding is concerning or positive
      if (
        finding.includes("⚠️") ||
        finding.includes("💰") ||
        finding.includes("🔒")
      ) {
        findingDiv.classList.add("concerning");
      } else if (finding.includes("✅")) {
        findingDiv.classList.add("positive");
      }

      findingDiv.textContent = finding;
      keyFindingsList.appendChild(findingDiv);
    });

    keyFindingsSection.style.display = "block";
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

  updateSections(sections) {
    this.elements.sectionSummaries.innerHTML = "";

    if (!sections?.length) {
      this.elements.sectionSummaries.innerHTML =
        "<p>No section summaries available.</p>";
      return;
    }

    sections.forEach((section, idx) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.classList.add(Constants.CLASSES.SECTION_SUMMARY);
      const anchorId = `section-${idx + 1}`;
      sectionDiv.id = anchorId;

      // Category badges from categoryHints
      let badgesHtml = "";
      if (
        Array.isArray(section.categoryHints) &&
        section.categoryHints.length
      ) {
        const topCats = section.categoryHints.slice(0, 4);
        const miniScore = (cat) => {
          const s = section.rights?.categoryScores?.[cat]?.score;
          return typeof s === "number"
            ? ` title="${this.formatCategoryName(cat)}: ${s.toFixed(0)}"`
            : "";
        };
        const badgeItems = topCats
          .map(
            (cat) =>
              `<span class="category-badge" data-cat="${cat}"${miniScore(
                cat,
              )}>${this.formatCategoryName(cat)}</span>`,
          )
          .join(" ");
        badgesHtml = `<div class="section-category-badges">${badgeItems}</div>`;
      }

      // Enhanced section display with risk levels and key points
      if (section.riskLevel && section.keyPoints) {
        sectionDiv.innerHTML = `
          <div class="section-header">
            <h3 class="section-title">${
              section.userFriendlyHeading || section.heading
            }</h3>
            <span class="section-risk-badge ${section.riskLevel}">${
              section.riskLevel
            }</span>
          </div>
          <div class="section-content">
            ${badgesHtml}
            <div class="section-summary-text">${section.summary}</div>
            ${
              section.keyPoints && section.keyPoints.length > 0
                ? `
              <div class="section-key-points">
                <h4>Key Points:</h4>
                <ul>
                  ${section.keyPoints
                    .map((point) => `<li>${point}</li>`)
                    .join("")}
                </ul>
              </div>
            `
                : ""
            }
          </div>
        `;
      } else {
        // Fallback to original format
        sectionDiv.innerHTML = `
          <h3>${section.heading}</h3>
          ${badgesHtml}
          <p>${section.summary}</p>
        `;
      }

      this.elements.sectionSummaries.appendChild(sectionDiv);
    });
  }

  updateExcerpts(excerpts) {
    this.elements.keyExcerptsList.innerHTML = "";

    if (!excerpts?.length) {
      this.elements.keyExcerptsList.innerHTML = "<p>No key excerpts found.</p>";
      return;
    }

    excerpts.forEach((excerpt, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `"${excerpt}"`;
      listItem.setAttribute("data-index", index + 1);
      this.elements.keyExcerptsList.appendChild(listItem);
    });
  }

  updateTerms(terms) {
    this.elements.uncommonTermsList.innerHTML = "";

    if (!terms?.length) {
      this.elements.uncommonTermsList.innerHTML =
        "<p>No uncommon words found.</p>";
      return;
    }

    terms.forEach((item) => {
      const termSpan = document.createElement("span");
      termSpan.textContent = item.word;
      termSpan.classList.add(Constants.CLASSES.UNCOMMON_TERM);
      termSpan.setAttribute("data-definition", item.definition);
      this.elements.uncommonTermsList.appendChild(termSpan);
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
    if (!data || (!data.readability && !data.rights)) {
      return "No overall assessment data available";
    }

    const readability = data.readability;
    const rights = data.rights;

    const readabilityGrade = readability?.grade || "N/A";
    const rightsGrade =
      rights?.grade ||
      this.getGradeFromScore(rights?.rightsScore || rights?.score) ||
      "N/A";
    const overallGrade = this.calculateOverallGrade(readability, rights);

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
          <span class="metric-value">${rightsGrade}</span>
        </div>
      </div>
      <div class="popup-explanation">
        <p><strong>What this means:</strong></p>
        <p>The overall grade combines readability (40%) and user rights protection (60%) to give you a comprehensive assessment of this document.</p>
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

  getGradeFromScore(score) {
    const numScore =
      typeof score === "number" ? (score > 1 ? score : score * 100) : 0;
    if (numScore >= 90) return "A";
    if (numScore >= 80) return "B";
    if (numScore >= 70) return "C";
    if (numScore >= 60) return "D";
    return "F";
  }

  calculateOverallGrade(readability, rights) {
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

      let rightsScore = 0;
      if (typeof rights === "number") {
        rightsScore = rights > 1 ? rights : rights * 100;
      } else if (rights?.rightsScore !== undefined) {
        rightsScore = rights.rightsScore;
      } else if (rights?.score !== undefined) {
        rightsScore = rights.score > 1 ? rights.score : rights.score * 100;
      }

      // Weighted combination: 40% readability, 60% rights
      const combined = readabilityScore * 0.4 + rightsScore * 0.6;
      return this.getGradeFromScore(combined);
    } catch (error) {
      return "N/A";
    }
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
    this.debug.info && this.debug.info("Sidepanel initializing...");
    this.loadingManager.start("Initializing...");

    this.setupEventListeners();
    this.requestInitialData();
    this.enableDiagnosticsIfConfigured();

    this.loadingManager.end();
    this.debug.endTimer && this.debug.endTimer("sidepanelInit");
    this.debug.info && this.debug.info("Sidepanel initialized.");
    this.debug.endGroup && this.debug.endGroup();
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

    this.elements.documentLevelBtn.addEventListener("click", () =>
      this.toggleView("document"),
    );
    this.elements.bySectionBtn.addEventListener("click", () =>
      this.toggleView("section"),
    );

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
  }

  toggleView(view) {
    if (view === "document") {
      this.elements.overallSummary.style.display = "block";
      this.elements.sectionSummaries.style.display = "none";
      this.elements.documentLevelBtn.classList.add("active");
      this.elements.bySectionBtn.classList.remove("active");
    } else {
      this.elements.overallSummary.style.display = "none";
      this.elements.sectionSummaries.style.display = "block";
      this.elements.documentLevelBtn.classList.remove("active");
      this.elements.bySectionBtn.classList.add("active");
    }
  }

  requestInitialData() {
    this.loadingManager.start("Fetching analysis...");
    chrome.runtime.sendMessage({ action: "getAnalysisResults" }, (response) => {
      if (chrome.runtime.lastError) {
        this.errorManager.handle(
          chrome.runtime.lastError,
          "getAnalysisResults",
        );
        this.loadingManager.end();
      } else if (response && response.error) {
        this.errorManager.handle(response.error, "getAnalysisResults");
        this.loadingManager.end();
      } else if (response && response.data) {
        this.updateSidepanelContent(response.data);
      } else {
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

// Initialize the sidepanel on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const sidepanel = new Sidepanel();
  sidepanel.initialize();
});
