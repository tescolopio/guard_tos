/**
 * @file heuristicDomHandler.js
 * @description Advanced pattern matching and heuristic analysis for unstructured content
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  function createHeuristicDomHandler({ log, logLevels }) {
    const { DETECTION, SELECTORS } = global.Constants;
    
    // Get base handler functionality
    const baseHandler = global.BaseHandler.create({ log, logLevels });

    // Handler state
    const state = {
      initialized: false,
      contentScores: new WeakMap(),
      textBlocks: new Map()
    };

    // Heuristic scoring weights
    const WEIGHTS = {
      KEYWORD_DENSITY: 0.3,
      TEXT_LENGTH: 0.2,
      FORMATTING: 0.15,
      PROXIMITY: 0.15,
      POSITION: 0.1,
      LINK_RATIO: 0.1
    };

    // Content patterns
    const PATTERNS = {
      LEGAL_SECTION_START: /^(terms|privacy|cookie|disclaimer|agreement|notice)/i,
      LEGAL_HEADINGS: /(terms\s+(?:of\s+)?(?:service|use)|privacy\s+policy|user\s+agreement|legal\s+notice)/i,
      LEGAL_LISTS: /^\s*(?:\d+\.|[a-z]\.|[\u2022\u2023\u25E6\u2043\u2219])\s+/,
      CITATION_PATTERN: /(?:\d+\s+U\.S\.C\.|§+\s*\d+|\bCFR\b|\bFR\b)/i,
      DEFINITION_PATTERN: /(?:^|\n)\s*["']?\w+["']?\s+(?:shall )?(?:mean|refer to|be defined as)\s/i
    };

    // Text block characteristics
    const TEXT_CHARACTERISTICS = {
      MIN_BLOCK_LENGTH: 100,
      MAX_LINK_RATIO: 0.3,
      MIN_SENTENCE_LENGTH: 10,
      LEGAL_TERM_THRESHOLD: 0.05
    };

    /**
     * Analyzes node position and context
     * @param {Element} node Node to analyze
     * @returns {number} Position score between 0 and 1
     */
    function analyzeNodePosition(node) {
      let score = 0;
      
      if (node.closest('main, article, .content, #content')) {
        score += 0.5;
      }

      const previousHeading = getPreviousHeading(node);
      if (previousHeading && PATTERNS.LEGAL_HEADINGS.test(previousHeading.textContent)) {
        score += 0.3;
      }

      const bodyHeight = document.body.scrollHeight;
      const nodePosition = node.getBoundingClientRect().top + window.scrollY;
      if (nodePosition < bodyHeight * 0.75) {
        score += 0.2;
      }

      return score;
    }

    /**
     * Gets the previous heading element
     * @param {Element} node Starting node
     * @returns {Element|null} Previous heading element
     */
    function getPreviousHeading(node) {
      let current = node;
      while (current = current.previousElementSibling) {
        if (/^h[1-6]$/i.test(current.tagName)) {
          return current;
        }
      }
      return null;
    }

    /**
     * Analyzes link density in a node
     * @param {Element} node Node to analyze
     * @returns {number} Link ratio between 0 and 1
     */
    function analyzeLinkDensity(node) {
      const text = node.textContent;
      const linkText = Array.from(node.querySelectorAll('a'))
        .map(a => a.textContent)
        .join(' ');

      return linkText.length / Math.max(text.length, 1);
    }

    /**
     * Default handler - always applicable as fallback
     * @returns {boolean} Always returns true
     */
    function isApplicable() {
      return true;
    }

    /**
     * Processes content using heuristic analysis
     * @returns {Promise<Object>} Processing results
     */
    async function processContent() {
      try {
        let results = {
          success: true,
          hasLegalContent: false,
          elements: []
        };

        // Process content blocks
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: (node) => {
              if (node.children.length === 0) return NodeFilter.FILTER_SKIP;
              if (node.matches(SELECTORS.EXCLUDE_ELEMENTS.join(','))) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let node;
        while (node = walker.nextNode()) {
          // Skip nodes with high link density
          if (analyzeLinkDensity(node) > TEXT_CHARACTERISTICS.MAX_LINK_RATIO) {
            continue;
          }

          // Get position score
          const positionScore = analyzeNodePosition(node);
          if (positionScore > 0.3) { // Only process well-positioned nodes
            // Use base handler to process the node
            const result = await baseHandler.processElement(node);
            if (result?.hasLegalContent) {
              // Store score for future reference
              state.contentScores.set(node, positionScore);
              results.hasLegalContent = true;
              results.elements.push({
                ...result,
                positionScore,
                nodeInfo: {
                  tag: node.tagName,
                  path: getNodePath(node)
                }
              });
            }
          }
        }

        // Store results for future use
        state.textBlocks = new Map(
          results.elements.map(result => [result.nodeInfo.path, result])
        );

        return {
          ...results,
          confidence: results.elements.length > 0 ? 
            determineConfidence(results.elements) : 'low',
          blockCount: results.elements.length
        };
      } catch (error) {
        log(logLevels.ERROR, "Error processing content:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Gets unique path to node for identification
     * @param {Element} node Element to get path for
     * @returns {string} Node path
     */
    function getNodePath(node) {
      const path = [];
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        let selector = node.nodeName.toLowerCase();
        if (node.id) {
          selector += `#${node.id}`;
        } else {
          let siblings = node.parentNode ? 
            Array.from(node.parentNode.children).filter(s => s.nodeName === node.nodeName) : [];
          if (siblings.length > 1) {
            selector += `:nth-child(${siblings.indexOf(node) + 1})`;
          }
        }
        path.unshift(selector);
        node = node.parentNode;
      }
      return path.join(' > ');
    }

    /**
     * Determines confidence level based on results
     * @param {Array} elements Processed elements
     * @returns {string} Confidence level
     */
    function determineConfidence(elements) {
      const avgScore = elements.reduce((sum, el) => 
        sum + el.positionScore, 0) / elements.length;
      
      if (avgScore > 0.7) return 'high';
      if (avgScore > 0.5) return 'medium';
      return 'low';
    }

    /**
     * Handles mutations in the DOM
     * @param {MutationRecord[]} mutations Array of mutations
     */
    function handleMutations(mutations) {
      baseHandler.handleMutations(mutations);
    }

    /**
     * Gets mutation observer configuration
     * @returns {Object} Observer configuration
     */
    function getObserverConfig() {
      return {
        childList: true,
        subtree: true,
        characterData: true
      };
    }

    /**
     * Initializes the handler
     */
    async function initialize() {
      if (state.initialized) {
        return;
      }

      await processContent();
      state.initialized = true;
      log(logLevels.INFO, "Heuristic handler initialized");
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      state.contentScores = new WeakMap();
      state.textBlocks = new Map();
      state.initialized = false;
      baseHandler.cleanup();
    }

    return {
      ...baseHandler,         // Include base handler functionality
      isApplicable,          // Add/override specific methods
      initialize,
      processContent,
      handleMutations,
      getObserverConfig,
      cleanup,
      // Exposed for testing
      _test: {
        analyzeNodePosition,
        analyzeLinkDensity,
        determineConfidence
      }
    };
  }

  // Make it available globally
  global.HeuristicDomHandler = {
    create: createHeuristicDomHandler
  };

})(typeof self !== 'undefined' ? self : global);
