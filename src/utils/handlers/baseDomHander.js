/**
 * @file baseHandler.js
 * @description Base functionality for all DOM handlers
 */
(function(global) {
  'use strict';

  function createBaseHandler({ log, logLevels }) {
    const { DETECTION, CLASSES } = global.Constants;

    // Initialize core services
    const textExtractor = global.TextExtractor.create({
      log,
      logLevels,
      utilities: global.utilities
    });

    const legalAnalyzer = global.LegalTextAnalyzer.create({
      log,
      logLevels,
      legalTerms: global.legalTerms
    });

    // Track processed elements
    const state = {
      processedElements: new WeakSet(),
      highlights: new WeakMap()
    };

    /**
     * Processes a single element for legal content
     * @param {Element} element Element to process
     * @returns {Promise<Object>} Processing results
     */
    async function processElement(element) {
      try {
        if (state.processedElements.has(element)) {
          return null;
        }

        // Extract text from element
        const text = await textExtractor.extract(element.innerHTML, 'html');
        if (!text) {
          return { success: false, reason: 'no_content' };
        }

        // Analyze for legal content
        const analysis = await legalAnalyzer.analyzeText(text);
        if (!analysis.isLegal) {
          return { success: true, hasLegalContent: false };
        }

        // Mark as processed
        state.processedElements.add(element);

        // Highlight terms if meets threshold
        if (analysis.metrics.termCount >= DETECTION.THRESHOLDS.HIGHLIGHT) {
          await highlightLegalTerms(element, analysis);
        }

        return {
          success: true,
          hasLegalContent: true,
          confidence: analysis.confidence,
          metrics: analysis.metrics,
          element: {
            tag: element.tagName,
            id: element.id,
            classes: Array.from(element.classList)
          }
        };
      } catch (error) {
        log(logLevels.ERROR, "Error processing element:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Highlights legal terms in element
     * @param {Element} element Element to highlight
     * @param {Object} analysis Legal analysis results
     */
    async function highlightLegalTerms(element, analysis) {
      try {
        const text = element.innerHTML;
        const terms = Object.keys(analysis.metrics.termDistribution || {});
        
        let highlightedHtml = text;
        for (const term of terms) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          highlightedHtml = highlightedHtml.replace(
            regex,
            `<span class="${CLASSES.HIGHLIGHT}" data-term="${term.toLowerCase()}" title="Legal term">$&</span>`
          );
        }

        // Store original content
        state.highlights.set(element, {
          original: text,
          highlighted: highlightedHtml
        });

        element.innerHTML = highlightedHtml;
      } catch (error) {
        log(logLevels.ERROR, "Error highlighting terms:", error);
      }
    }

    /**
     * Removes highlights from element
     * @param {Element} element Element to clean
     */
    function removeHighlights(element) {
      const stored = state.highlights.get(element);
      if (stored) {
        element.innerHTML = stored.original;
        state.highlights.delete(element);
      }
    }

    /**
     * Cleans up handler resources
     */
    function cleanup() {
      for (const element of state.processedElements) {
        removeHighlights(element);
      }
      state.processedElements = new WeakSet();
      state.highlights = new WeakMap();
    }

    return {
      processElement,
      highlightLegalTerms,
      removeHighlights,
      cleanup
    };
  }

  // Make it available globally
  global.BaseHandler = { create: createBaseHandler };

})(typeof self !== 'undefined' ? self : global);
