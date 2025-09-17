/**
 * @file sidepanel.js
 * @description Manages the Terms Guardian analysis sidepanel UI
 * @version 2.0.0
 * @date 2024-10-29
 */

(function (global) {
  "use strict";

  function createSidepanel({ log, logLevels }) {
    const { SELECTORS, MESSAGES, CLASSES, DEBUG, STORAGE_KEYS } =
      global.Constants;
    let currentContent = null;

    // Initialize debugging
    debug.startGroup(DEBUG.MODULES.SIDEPANEL);
    debug.startTimer("sidepanelInit");

    const state = {
      isLoading: false,
      isError: false,
      lastStatus: null,
    };

    /**
     * DOM Element Cache
     */
    const elements = {
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
      readabilityGrade: document.getElementById("readability-grade"),
      userRightsIndex: document.getElementById("user-rights-index"),
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
    const messageHandlers = {
      [MESSAGES.UPDATE_SIDEPANEL]: updateSidepanelContent,
      [MESSAGES.ANALYSIS_ERROR]: (error) =>
        errorManager.handle(error, "analysis"),
      [MESSAGES.CLEAR_PANEL]: clearPanel,
    };

    /**
     * Loading State Management
     */
    const loadingManager = {
      start(message = "Loading...") {
        debug.info("Starting loading state", { message });
        state.isLoading = true;
        elements.content.classList.add("loading");
        elements.loadingIndicator.textContent = message;
        elements.loadingIndicator.style.display = "block";
      },

      update(message) {
        if (state.isLoading) {
          elements.loadingIndicator.textContent = message;
        }
      },

      end() {
        debug.info("Ending loading state");
        state.isLoading = false;
        elements.content.classList.remove("loading");
        elements.loadingIndicator.style.display = "none";
      },
    };

    /**
     * Status Message Management
     */
    const statusManager = {
      show(message, type = "info", duration = 5000) {
        debug.info("Showing status message", { message, type });

        state.lastStatus = { message, type };
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status-message ${type}`;

        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          elements.statusMessage.className = "status-message";
        }, duration);
      },

      clear() {
        elements.statusMessage.className = "status-message";
        state.lastStatus = null;
      },
    };

    /**
     * Error Management
     */
    const errorManager = {
      handle(error, context = "") {
        debug.error(`Error in ${context}:`, error);

        state.isError = true;
        elements.content.classList.add("error");

        statusManager.show(
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

      clear() {
        state.isError = false;
        elements.content.classList.remove("error");
        document.querySelectorAll(".error").forEach((el) => {
          el.classList.remove("error");
        });
      },
    };

    /**
     * Content Update Functions
     */
    async function updateSection(sectionName, updateFn) {
      try {
        loadingManager.update(`Updating ${sectionName}...`);
        await updateFn();
      } catch (error) {
        errorManager.handle(error, sectionName);
      }
    }

    function updateDocumentInfo(info) {
      if (!info) return;
      elements.termsUrl.href = info.url;
      elements.termsUrl.textContent = info.url;
      elements.termsTitle.textContent = info.title;
    }

    function updateScores(scores) {
      if (!scores) return;
      elements.readabilityGrade.textContent =
        scores.readability?.grade ||
        (scores.readability?.error ? "Error" : "N/A");
      elements.userRightsIndex.textContent = scores.rights
        ? `${(scores.rights * 100).toFixed(0)}%`
        : scores.rights?.error
          ? "Error"
          : "N/A";

      updatePopupContent("readabilityPopup", scores.readability);
      updatePopupContent("rightsPopup", scores.rights);
    }

    function updateSummary(summary) {
      if (!summary) return;
      elements.overallSummary.textContent = summary;
    }

    function updateSections(sections) {
      elements.sectionSummaries.innerHTML = "";

      if (!sections?.length) {
        elements.sectionSummaries.innerHTML =
          "<p>No section summaries available.</p>";
        return;
      }

      sections.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add(CLASSES.SECTION_SUMMARY);
        sectionDiv.innerHTML = `
          <h3>${section.heading}</h3>
          <p>${section.summary}</p>
        `;
        elements.sectionSummaries.appendChild(sectionDiv);
      });
    }

    function updateExcerpts(excerpts) {
      elements.keyExcerptsList.innerHTML = "";

      if (!excerpts?.length) {
        elements.keyExcerptsList.innerHTML = "<p>No key excerpts found.</p>";
        return;
      }

      excerpts.forEach((excerpt, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = `"${excerpt}"`;
        listItem.setAttribute("data-index", index + 1);
        elements.keyExcerptsList.appendChild(listItem);
      });
    }

    function updateTerms(terms) {
      elements.uncommonTermsList.innerHTML = "";

      if (!terms?.length) {
        elements.uncommonTermsList.innerHTML =
          "<p>No uncommon words found.</p>";
        return;
      }

      terms.forEach((item) => {
        const termSpan = document.createElement("span");
        termSpan.textContent = item.word;
        termSpan.classList.add(CLASSES.UNCOMMON_TERM);
        termSpan.setAttribute("data-definition", item.definition);
        elements.uncommonTermsList.appendChild(termSpan);
      });
    }

    function updateDictionaryTerms(dictTerms) {
      if (!elements.dictionaryTermsList) return; // backward safety if HTML not updated
      elements.dictionaryTermsList.innerHTML = "";
      if (!dictTerms || !dictTerms.length) {
        elements.dictionaryTermsList.innerHTML =
          "<p>No dictionary terms found.</p>";
        return;
      }
      dictTerms.forEach((item) => {
        const li = document.createElement("li");
        li.className = "dictionary-term";
        li.textContent = `${item.word} (${item.count})`;
        li.setAttribute("data-definition", item.definition || "");
        elements.dictionaryTermsList.appendChild(li);
      });
    }

    /**
     * Popup Management
     */
    function formatReadabilityPopup(data) {
      if (!data) return "No readability data available";

      // Handle error case
      if (data.error) {
        return `<p class="error">Error: ${data.error}</p>`;
      }

      const grade = data.averageGrade || data.grade || "N/A";
      const confidence = (data.confidence * 100).toFixed(0);

      return `
        <div class="popup-header">
          <strong>Readability Grade: ${grade}</strong>
        </div>
        <div class="popup-metrics">
          <h4>Individual Scores:</h4>
          <div class="metric-row">
            <span class="metric-label">Flesch Reading Ease:</span>
            <span class="metric-value">${data.flesch?.toFixed(1) || "N/A"}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Flesch-Kincaid Grade:</span>
            <span class="metric-value">${data.kincaid?.toFixed(1) || "N/A"}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Gunning Fog Index:</span>
            <span class="metric-value">${data.fogIndex?.toFixed(1) || "N/A"}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Confidence:</span>
            <span class="metric-value">${confidence}%</span>
          </div>
        </div>
        <div class="popup-explanation">
          <p><strong>What this means:</strong></p>
          <p>${getReadabilityExplanation(grade, data.flesch)}</p>
        </div>
      `;
    }

    function formatRightsPopup(data) {
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
      const grade = data.grade || getGradeFromScore(score);
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
              <strong>High Risk:</strong> ${highRiskClauses.map(formatClauseName).join(", ")}
            </div>
          `
              : ""
          }
          ${
            mediumRiskClauses.length > 0
              ? `
            <div class="clause-category medium-risk">
              <strong>Medium Risk:</strong> ${mediumRiskClauses.map(formatClauseName).join(", ")}
            </div>
          `
              : ""
          }
          ${
            positiveClauses.length > 0
              ? `
            <div class="clause-category positive">
              <strong>User-Friendly:</strong> ${positiveClauses.map(formatClauseName).join(", ")}
            </div>
          `
              : ""
          }
        `;
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
        ${clauseInfo ? `<div class="popup-clauses">${clauseInfo}</div>` : ""}
        <div class="popup-explanation">
          <p><strong>What this means:</strong></p>
          <p>${getRightsExplanation(score, grade)}</p>
        </div>
      `;
    }

    // Helper functions for explanations
    function getReadabilityExplanation(grade, fleschScore) {
      const scoreDescriptions = {
        A: "This document is very easy to read and understand.",
        B: "This document is fairly easy to read with some education.",
        C: "This document requires average reading skills.",
        D: "This document is somewhat difficult to read.",
        F: "This document is very difficult to read and may require specialized knowledge.",
      };

      let explanation =
        scoreDescriptions[grade] || "Reading difficulty varies.";

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
        else if (fleschScore >= 30)
          explanation += " Written at a college level.";
        else explanation += " Written at a graduate level.";
      }

      return explanation;
    }

    function getRightsExplanation(score, grade) {
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

    function getGradeFromScore(score) {
      const numScore =
        typeof score === "number" ? (score > 1 ? score : score * 100) : 0;
      if (numScore >= 90) return "A";
      if (numScore >= 80) return "B";
      if (numScore >= 70) return "C";
      if (numScore >= 60) return "D";
      return "F";
    }

    function formatClauseName(clauseName) {
      return clauseName
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    function updatePopupContent(popupId, data) {
      const popup = document.getElementById(popupId);
      if (!popup) return;

      const content = popup.querySelector(".popup-content");
      if (!content) return;

      switch (popupId) {
        case "readabilityPopup":
          content.innerHTML = formatReadabilityPopup(data);
          break;
        case "rightsPopup":
          content.innerHTML = formatRightsPopup(data);
          break;
      }
    }

    /**
     * Diagnostics (Dictionary Metrics)
     */
    let diagInterval = null;
    async function setDiagnosticsEnabled(enabled) {
      try {
        await chrome.storage.local.set({
          __diag_dictionary_enabled: !!enabled,
        });
        const checkbox = document.getElementById("toggle-diagnostics");
        if (checkbox) checkbox.checked = !!enabled;
        if (elements.diagnostics) {
          elements.diagnostics.style.display = enabled ? "" : "none";
        }
      } catch (_) {}
    }

    function enableDiagnosticsIfConfigured() {
      try {
        const flag =
          DEBUG &&
          DEBUG.FEATURES &&
          DEBUG.FEATURES.DICTIONARY_METRICS &&
          DEBUG.FEATURES.DICTIONARY_METRICS.ENABLED;
        const toggleEl = document.getElementById("toggle-diagnostics");
        if (toggleEl) {
          toggleEl.addEventListener("change", (e) =>
            setDiagnosticsEnabled(e.target.checked),
          );
        }
        if (!elements.diagnostics) return;
        if (!flag) {
          elements.diagnostics.style.display = "none";
          return;
        }
        // Populate pattern weights card once
        try {
          const grid = document.getElementById("pattern-weights-grid");
          const countsGrid = document.getElementById(
            "pattern-clausecounts-grid",
          );
          const countsToggle = document.getElementById("toggle-clause-counts");
          if (countsToggle) {
            countsToggle.addEventListener("change", (e) => {
              if (countsGrid) {
                countsGrid.style.display = e.target.checked ? "grid" : "none";
                if (e.target.checked) populateClauseCountsGrid();
              }
            });
          }
          if (grid && grid.childElementCount === 0) {
            const weights = (global.EXT_CONSTANTS || EXT_CONSTANTS).ANALYSIS
              .RIGHTS.WEIGHTS;
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
          debug.warn("Failed to populate pattern weights", e);
        }
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local
        ) {
          chrome.storage.local.get("__diag_dictionary_enabled").then((data) => {
            setDiagnosticsEnabled(!!data.__diag_dictionary_enabled);
          });
        } else {
          setDiagnosticsEnabled(true);
        }
        const POLL_MS = DEBUG.FEATURES.DICTIONARY_METRICS.POLL_MS || 10000;
        const KEY = STORAGE_KEYS.DICTIONARY_METRICS || "dictionaryMetrics";

        const render = (m) => {
          if (!m) return;
          elements.dictMetricHits.textContent = m.hits ?? 0;
          elements.dictMetricMisses.textContent = m.misses ?? 0;
          elements.dictMetricSize.textContent = m.size ?? 0;
          elements.dictMetricMax.textContent = m.max ?? 0;
          elements.dictMetricTtl.textContent = m.ttl ?? 0;
          const dateStr = m.ts ? new Date(m.ts).toLocaleTimeString() : "-";
          elements.dictMetricTs.textContent = dateStr;
        };

        const fetchAndRender = async () => {
          try {
            if (
              typeof chrome !== "undefined" &&
              chrome.storage &&
              chrome.storage.local
            ) {
              const data = await chrome.storage.local.get(KEY);
              render(data[KEY]);
            } else if (
              typeof globalThis !== "undefined" &&
              globalThis.__DICTIONARY_METRICS__
            ) {
              render(globalThis.__DICTIONARY_METRICS__);
            }
          } catch (_) {}
        };

        // Initial fetch and interval
        fetchAndRender();
        diagInterval = setInterval(fetchAndRender, POLL_MS);
      } catch (_) {}
    }

    function populateClauseCountsGrid() {
      try {
        const countsGrid = document.getElementById("pattern-clausecounts-grid");
        if (!countsGrid || !currentContent) return;
        const rights = currentContent?.scores?.rights;
        const clauseCounts = rights?.details?.clauseCounts;
        if (!clauseCounts) return;
        // clear existing
        while (countsGrid.firstChild)
          countsGrid.removeChild(countsGrid.firstChild);
        const sections = [
          ["HIGH_RISK", clauseCounts.HIGH_RISK || {}],
          ["MEDIUM_RISK", clauseCounts.MEDIUM_RISK || {}],
          ["POSITIVES", clauseCounts.POSITIVES || {}],
        ];
        sections.forEach(([label, map]) => {
          const header = document.createElement("div");
          header.className = "diag-subheader";
          header.textContent = label + " (counts)";
          header.style.gridColumn = "1 / -1";
          countsGrid.appendChild(header);
          Object.entries(map).forEach(([k, v]) => {
            const keyDiv = document.createElement("div");
            keyDiv.textContent = k;
            const valDiv = document.createElement("div");
            valDiv.textContent = v;
            countsGrid.appendChild(keyDiv);
            countsGrid.appendChild(valDiv);
          });
        });
      } catch (e) {
        debug.warn("Failed to populate clause counts", e);
      }
    }

    function showPopup(popupId) {
      const popup = document.getElementById(popupId);
      if (popup) popup.style.display = "block";
    }

    function hidePopup(popupId) {
      const popup = document.getElementById(popupId);
      if (popup) popup.style.display = "none";
    }

    /**
     * Main Content Update
     */
    async function updateSidepanelContent(content) {
      debug.startTimer("updatePanel");

      try {
        loadingManager.start("Updating analysis...");
        errorManager.clear();
        elements.content.classList.add("updating");
        currentContent = content;

        if (content.error) {
          errorManager.handle(new Error(content.error), "analysis");
          return;
        }

        await Promise.all([
          updateSection("documentInfo", () =>
            updateDocumentInfo(content.documentInfo),
          ),
          updateSection("scores", () => updateScores(content.scores)),
          updateSection("summary", () => updateSummary(content.summary)),
          updateSection("sections", () => updateSections(content.sections)),
          updateSection("excerpts", () => updateExcerpts(content.excerpts)),
          updateSection("terms", () => updateTerms(content.terms)),
          updateSection("dictionaryTerms", () =>
            updateDictionaryTerms(
              content?.scores?.rights?.details?.dictionaryTerms ||
                content?.rights?.details?.dictionaryTerms ||
                content?.dictionaryTerms,
            ),
          ),
        ]);

        // If counts toggle is active, refresh clause counts grid
        const countsToggle = document.getElementById("toggle-clause-counts");
        if (countsToggle && countsToggle.checked) {
          populateClauseCountsGrid();
        }

        statusManager.show("Analysis complete", "success");
        debug.info("Panel update complete");
      } catch (error) {
        errorManager.handle(error, "panel-update");
      } finally {
        loadingManager.end();
        elements.content.classList.remove("updating");
        const duration = debug.endTimer("updatePanel");
        debug.info("Panel update duration", { duration });
      }
    }

    /**
     * Action Buttons Setup
     */
    function setupActionButtons() {
      const buttons = {
        contactBtn: () => window.open("mailto:support@termsguardian.com"),
        reportBtn: () => window.open("https://github.com/termsguardian/issues"),
        githubBtn: () => window.open("https://github.com/termsguardian"),
        feedbackBtn: () => window.open("https://termsguardian.com/feedback"),
        donateBtn: () => window.open("https://termsguardian.com/donate"),
      };

      Object.entries(buttons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
          button.addEventListener("click", handler);
        }
      });
    }

    /**
     * Clear Panel
     */
    function clearPanel() {
      currentContent = null;
      elements.content.classList.remove("loading", "updating", "error");
      elements.sectionSummaries.innerHTML = "";
      elements.keyExcerptsList.innerHTML = "";
      elements.uncommonTermsList.innerHTML = "";
      statusManager.clear();
      errorManager.clear();
    }

    /**
     * Event Listeners Setup
     */
    function setupEventListeners() {
      // Popup handlers
      document.querySelectorAll("[data-popup]").forEach((element) => {
        const popupId = element.dataset.popup;
        element.addEventListener("mouseenter", () => showPopup(popupId));
        element.addEventListener("mouseleave", () => hidePopup(popupId));
      });

      // Term and excerpt handlers
      document.addEventListener("mouseover", (event) => {
        const termSpan = event.target.closest(`.${CLASSES.UNCOMMON_TERM}`);
        if (termSpan) {
          const definition = termSpan.getAttribute("data-definition");
          showPopup(SELECTORS.POPUPS.TERMS);
          updatePopupContent(SELECTORS.POPUPS.TERMS, [
            { word: termSpan.textContent, definition },
          ]);
        }

        const excerptItem = event.target.closest(
          `#${SELECTORS.SIDEPANEL.KEY_EXCERPTS_LIST} li`,
        );
        if (excerptItem) {
          const excerptIndex = excerptItem.getAttribute("data-index");
          showPopup(SELECTORS.POPUPS.EXCERPTS);
          updatePopupContent(SELECTORS.POPUPS.EXCERPTS, [
            currentContent.excerpts[excerptIndex - 1],
          ]);
        }
      });

      document.addEventListener("mouseout", (event) => {
        const termSpan = event.target.closest(`.${CLASSES.UNCOMMON_TERM}`);
        if (termSpan) hidePopup(SELECTORS.POPUPS.TERMS);

        const excerptItem = event.target.closest(
          `#${SELECTORS.SIDEPANEL.KEY_EXCERPTS_LIST} li`,
        );
        if (excerptItem) hidePopup(SELECTORS.POPUPS.EXCERPTS);
      });

      setupActionButtons();
    }

    // Initialize
    setupEventListeners();
    enableDiagnosticsIfConfigured();
    debug.endTimer("sidepanelInit");
    debug.endGroup();

    /**
     * Settings Management
     */
    const settingsManager = {
      userPreferenceService: null,
      enhancedCacheService: null,

      async init() {
        // Initialize services if available
        if (typeof UserPreferenceService !== "undefined") {
          this.userPreferenceService = new UserPreferenceService();
        }

        this.setupEventListeners();
        await this.loadSettings();
        await this.updateCacheStats();
      },

      setupEventListeners() {
        // Settings toggle
        const settingsToggle = document.createElement("button");
        settingsToggle.className = "settings-toggle";
        settingsToggle.innerHTML = "⚙️";
        settingsToggle.title = "Toggle Settings";
        document.body.appendChild(settingsToggle);

        settingsToggle.addEventListener("click", () => {
          const settingsSection = document.getElementById("settings");
          const isVisible = settingsSection.style.display !== "none";
          settingsSection.style.display = isVisible ? "none" : "block";
          settingsToggle.classList.toggle("active", !isVisible);
        });

        // Settings controls
        const enableCaching = document.getElementById("enable-hash-caching");
        const processingMode = document.getElementById("processing-mode");
        const cacheRetention = document.getElementById("cache-retention");
        const autoUpdate = document.getElementById("auto-update");
        const debugMode = document.getElementById("debug-mode");

        if (enableCaching) {
          enableCaching.addEventListener("change", async (e) => {
            await this.saveSetting("enableHashCaching", e.target.checked);
          });
        }

        if (processingMode) {
          processingMode.addEventListener("change", async (e) => {
            await this.saveSetting("processingMode", e.target.value);
          });
        }

        if (cacheRetention) {
          cacheRetention.addEventListener("change", async (e) => {
            const days = parseInt(e.target.value);
            if (days >= 1 && days <= 365) {
              await this.saveSetting("cacheRetentionDays", days);
            }
          });
        }

        if (autoUpdate) {
          autoUpdate.addEventListener("change", async (e) => {
            await this.saveSetting("autoUpdateEnabled", e.target.checked);
          });
        }

        if (debugMode) {
          debugMode.addEventListener("change", async (e) => {
            await this.saveSetting("debugMode", e.target.checked);
            // Toggle debug mode immediately
            if (typeof debug !== "undefined") {
              debug.setLevel(e.target.checked ? "DEBUG" : "INFO");
            }
          });
        }

        // Action buttons
        const clearCacheBtn = document.getElementById("clear-cache-btn");
        const refreshStatsBtn = document.getElementById("refresh-stats-btn");
        const resetSettingsBtn = document.getElementById("reset-settings-btn");
        const exportSettingsBtn = document.getElementById(
          "export-settings-btn",
        );

        if (clearCacheBtn) {
          clearCacheBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to clear all cached data?")) {
              await this.clearCache();
              await this.updateCacheStats();
            }
          });
        }

        if (refreshStatsBtn) {
          refreshStatsBtn.addEventListener("click", async () => {
            await this.updateCacheStats();
          });
        }

        if (resetSettingsBtn) {
          resetSettingsBtn.addEventListener("click", async () => {
            if (confirm("Reset all settings to defaults?")) {
              await this.resetSettings();
              await this.loadSettings();
            }
          });
        }

        if (exportSettingsBtn) {
          exportSettingsBtn.addEventListener("click", async () => {
            await this.exportSettings();
          });
        }
      },

      async loadSettings() {
        if (!this.userPreferenceService) return;

        try {
          const preferences = await this.userPreferenceService.getPreferences();

          const enableCaching = document.getElementById("enable-hash-caching");
          const processingMode = document.getElementById("processing-mode");
          const cacheRetention = document.getElementById("cache-retention");
          const autoUpdate = document.getElementById("auto-update");
          const debugMode = document.getElementById("debug-mode");

          if (enableCaching)
            enableCaching.checked = preferences.enableHashCaching;
          if (processingMode) processingMode.value = preferences.processingMode;
          if (cacheRetention)
            cacheRetention.value = preferences.cacheRetentionDays;
          if (autoUpdate) autoUpdate.checked = preferences.autoUpdateEnabled;
          if (debugMode) debugMode.checked = preferences.debugMode;
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      },

      async saveSetting(key, value) {
        if (!this.userPreferenceService) return;

        try {
          const preferences = await this.userPreferenceService.getPreferences();
          preferences[key] = value;
          await this.userPreferenceService.setPreferences(preferences);
          debug.info(`Setting saved: ${key} = ${value}`);
        } catch (error) {
          console.error("Failed to save setting:", error);
        }
      },

      async updateCacheStats() {
        try {
          // Get cache stats from enhanced cache service or fallback to storage
          let stats = {
            localHits: 0,
            cloudHits: 0,
            misses: 0,
            totalEntries: 0,
            hitRate: 0,
            totalSizeBytes: 0,
          };

          // Try to get stats from localStorage analysis entries
          const keys = Object.keys(localStorage).filter((key) =>
            key.startsWith("tg_analysis_"),
          );
          stats.totalEntries = keys.length;

          let totalSize = 0;
          keys.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value) totalSize += value.length;
          });
          stats.totalSizeBytes = totalSize;

          // Update UI
          const elements = {
            localHits: document.getElementById("cache-local-hits"),
            cloudHits: document.getElementById("cache-cloud-hits"),
            misses: document.getElementById("cache-misses"),
            totalEntries: document.getElementById("cache-total-entries"),
            hitRate: document.getElementById("cache-hit-rate"),
            storageUsed: document.getElementById("cache-storage-used"),
          };

          if (elements.localHits)
            elements.localHits.textContent = stats.localHits;
          if (elements.cloudHits)
            elements.cloudHits.textContent = stats.cloudHits;
          if (elements.misses) elements.misses.textContent = stats.misses;
          if (elements.totalEntries)
            elements.totalEntries.textContent = stats.totalEntries;
          if (elements.hitRate) {
            const total = stats.localHits + stats.cloudHits + stats.misses;
            const rate =
              total > 0
                ? (((stats.localHits + stats.cloudHits) / total) * 100).toFixed(
                    1,
                  )
                : 0;
            elements.hitRate.textContent = `${rate}%`;
          }
          if (elements.storageUsed) {
            const kb = (stats.totalSizeBytes / 1024).toFixed(1);
            elements.storageUsed.textContent = `${kb} KB`;
          }
        } catch (error) {
          console.error("Failed to update cache stats:", error);
        }
      },

      async clearCache() {
        try {
          // Clear localStorage cache entries
          const keys = Object.keys(localStorage).filter((key) =>
            key.startsWith("tg_analysis_"),
          );
          keys.forEach((key) => localStorage.removeItem(key));

          debug.info(`Cleared ${keys.length} cache entries`);
          return true;
        } catch (error) {
          console.error("Failed to clear cache:", error);
          return false;
        }
      },

      async resetSettings() {
        if (!this.userPreferenceService) return;

        try {
          await this.userPreferenceService.resetToDefaults();
          debug.info("Settings reset to defaults");
        } catch (error) {
          console.error("Failed to reset settings:", error);
        }
      },

      async exportSettings() {
        if (!this.userPreferenceService) return;

        try {
          const preferences = await this.userPreferenceService.getPreferences();

          const exportData = {
            preferences,
            exportDate: new Date().toISOString(),
            version: "1.0.0",
          };

          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `terms-guardian-settings-${new Date().toISOString().split("T")[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          debug.info("Settings exported successfully");
        } catch (error) {
          console.error("Failed to export settings:", error);
        }
      },
    };

    // Initialize settings
    settingsManager.init().catch((error) => {
      console.error("Failed to initialize settings:", error);
    });

    // Listen for messages
    chrome.runtime.onMessage.addListener((message) => {
      debug.info("Received message", { type: message.type });
      const handler = messageHandlers[message.type];
      if (handler) {
        handler(message.content);
      }
    });

    return {
      updateContent: updateSidepanelContent,
      loading: loadingManager,
      status: statusManager,
      error: errorManager,
      clearPanel,
      getState: () => ({ ...state, currentContent }),
    };
  }

  // Export for Chrome extension environment
  if (typeof window !== "undefined") {
    global.Sidepanel = {
      create: createSidepanel,
    };
  }
})(typeof window !== "undefined" ? window : global);

// Initialize the sidepanel
const sidepanel = global.Sidepanel.create({
  log: global.debug.log,
  logLevels: global.debug.levels,
});
