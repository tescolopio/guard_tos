/**
 * @file layoutDomHandler.js
 * @description Processes content based on visual layout and structure
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  function createLayoutDomHandler({ log, logLevels }) {
    const { DETECTION, SELECTORS } = global.Constants;
    
    // Get base handler functionality
    const baseHandler = global.BaseHandler.create({ log, logLevels });

    // State management
    const state = {
      initialized: false,
      layoutMap: new WeakMap(),
      gridElements: new Set(),
      flexElements: new Set()
    };

    // Layout patterns configuration
    const LAYOUT_PATTERNS = {
      CONTENT_CONTAINERS: [
        { selector: 'main', weight: 1.0 },
        { selector: 'article', weight: 0.9 },
        { selector: '.content, #content', weight: 0.8 },
        { selector: '.main-content', weight: 0.8 },
        { selector: '.page-content', weight: 0.7 },
        { selector: '[role="main"]', weight: 0.9 }
      ],
      GRID_PATTERNS: [
        '[class*="grid"]',
        '[style*="grid"]',
        '[class*="row"]',
        '[class*="col"]'
      ],
      FLEX_PATTERNS: [
        '[class*="flex"]',
        '[style*="flex"]',
        '[class*="layout"]'
      ]
    };

    // Visual thresholds
    const VISUAL_THRESHOLDS = {
      MIN_WIDTH: 300,          // Minimum content width in pixels
      MIN_HEIGHT: 200,         // Minimum content height in pixels
      MIN_CONTENT_RATIO: 0.3,  // Minimum content to viewport ratio
      MAX_LINK_DENSITY: 0.3,   // Maximum link text ratio
      VIEWPORT_COVERAGE: 0.4   // Minimum viewport coverage
    };

    /**
     * Checks if layout-based processing is applicable
     * @returns {boolean} Whether layout analysis should be used
     */
    function isApplicable() {
      try {
        // Check for content containers
        const hasContainers = LAYOUT_PATTERNS.CONTENT_CONTAINERS
          .some(({ selector }) => document.querySelector(selector));

        // Check for grid/flex layouts
        const hasModernLayout = !!(
          LAYOUT_PATTERNS.GRID_PATTERNS.some(pattern => 
            document.querySelector(pattern)) ||
          LAYOUT_PATTERNS.FLEX_PATTERNS.some(pattern => 
            document.querySelector(pattern))
        );

        return hasContainers || hasModernLayout;
      } catch (error) {
        log(logLevels.ERROR, "Error checking layout applicability:", error);
        return false;
      }
    }

    /**
     * Gets computed styles with caching
     * @param {Element} element Element to analyze
     * @returns {Object} Computed style properties
     */
    function getElementStyles(element) {
      let cached = state.layoutMap.get(element);
      if (cached) return cached;

      const computed = window.getComputedStyle(element);
      const styles = {
        display: computed.display,
        position: computed.position,
        width: parseInt(computed.width),
        height: parseInt(computed.height),
        padding: parseInt(computed.paddingTop) + parseInt(computed.paddingBottom),
        margin: parseInt(computed.marginTop) + parseInt(computed.marginBottom),
        columns: computed.gridTemplateColumns || computed.columnCount,
        isGrid: computed.display === 'grid' || computed.display === 'inline-grid',
        isFlex: computed.display === 'flex' || computed.display === 'inline-flex'
      };

      state.layoutMap.set(element, styles);
      return styles;
    }

    /**
     * Analyzes visual hierarchy of an element
     * @param {Element} element Element to analyze
     * @returns {Object} Hierarchy analysis results
     */
    function analyzeVisualHierarchy(element) {
      const styles = getElementStyles(element);
      const rect = element.getBoundingClientRect();
      
      const analysis = {
        isVisible: rect.width > 0 && rect.height > 0,
        isLargeEnough: rect.width >= VISUAL_THRESHOLDS.MIN_WIDTH &&
                      rect.height >= VISUAL_THRESHOLDS.MIN_HEIGHT,
        isMainContent: rect.width >= window.innerWidth * VISUAL_THRESHOLDS.VIEWPORT_COVERAGE,
        isStructured: styles.isGrid || styles.isFlex,
        metrics: {
          width: rect.width,
          height: rect.height,
          area: rect.width * rect.height,
          viewportCoverage: (rect.width * rect.height) / 
            (window.innerWidth * window.innerHeight)
        }
      };

      // Calculate visual prominence score
      analysis.visualScore = calculateVisualScore(styles, analysis.metrics);
      
      return analysis;
    }

    /**
     * Calculates visual prominence score
     * @param {Object} styles Computed styles
     * @param {Object} metrics Element metrics
     * @returns {number} Visual score between 0 and 1
     */
    function calculateVisualScore(styles, metrics) {
      let score = 0;

      // Size-based scoring
      score += Math.min(metrics.viewportCoverage * 2, 0.4);

      // Structure-based scoring
      if (styles.isGrid) {
        score += 0.2;
        state.gridElements.add(element);
      }
      if (styles.isFlex) {
        score += 0.15;
        state.flexElements.add(element);
      }

      // Position-based scoring
      if (styles.position === 'static' || styles.position === 'relative') {
        score += 0.1;
      }

      return Math.min(1, score);
    }

    /**
     * Processes content based on layout analysis
     * @returns {Promise<Object>} Processing results
     */
    async function processContent() {
      try {
        let results = {
          success: true,
          hasLegalContent: false,
          elements: []
        };

        // Process content containers in order of weight
        for (const { selector, weight } of LAYOUT_PATTERNS.CONTENT_CONTAINERS) {
          const containers = document.querySelectorAll(selector);
          
          for (const container of containers) {
            const analysis = analyzeVisualHierarchy(container);
            
            if (analysis.isVisible && analysis.isLargeEnough) {
              // Use base handler to process content
              const result = await baseHandler.processElement(container);
              
              if (result?.hasLegalContent) {
                results.hasLegalContent = true;
                results.elements.push({
                  ...result,
                  weight,
                  visualMetrics: analysis.metrics,
                  visualScore: analysis.visualScore
                });
              }
            }
          }
        }

        // Process grid/flex layouts
        if (state.gridElements.size > 0 || state.flexElements.size > 0) {
          const layoutElements = new Set([
            ...state.gridElements,
            ...state.flexElements
          ]);

          for (const element of layoutElements) {
            const analysis = analyzeVisualHierarchy(element);
            
            if (analysis.visualScore >= 0.5) {
              const result = await baseHandler.processElement(element);
              
              if (result?.hasLegalContent) {
                results.hasLegalContent = true;
                results.elements.push({
                  ...result,
                  visualMetrics: analysis.metrics,
                  visualScore: analysis.visualScore
                });
              }
            }
          }
        }

        return {
          ...results,
          confidence: determineConfidence(results.elements),
          layoutMetrics: {
            gridLayouts: state.gridElements.size,
            flexLayouts: state.flexElements.size,
            processedContainers: results.elements.length
          }
        };
      } catch (error) {
        log(logLevels.ERROR, "Error processing layout content:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Determines confidence based on visual analysis
     * @param {Array} elements Processed elements
     * @returns {string} Confidence level
     */
    function determineConfidence(elements) {
      if (elements.length === 0) return 'low';

      const avgScore = elements.reduce((sum, el) => 
        sum + el.visualScore, 0) / elements.length;

      if (avgScore >= 0.7) return 'high';
      if (avgScore >= 0.5) return 'medium';
      return 'low';
    }

    /**
     * Handles mutations in the DOM
     * @param {MutationRecord[]} mutations Array of mutations
     */
    function handleMutations(mutations) {
      const layoutChanges = mutations.some(mutation => {
        return mutation.type === 'childList' ||
               (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' ||
                 mutation.attributeName === 'style'));
      });

      if (layoutChanges) {
        // Clear cached styles for affected elements
        mutations.forEach(mutation => {
          if (state.layoutMap.has(mutation.target)) {
            state.layoutMap.delete(mutation.target);
          }
        });

        // Let base handler process the mutations
        baseHandler.handleMutations(mutations);
      }
    }

    /**
     * Gets mutation observer configuration
     * @returns {Object} Observer configuration
     */
    function getObserverConfig() {
      return {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'width', 'height']
      };
    }

    /**
     * Initializes the layout handler
     */
    async function initialize() {
      if (state.initialized) {
        return;
      }

      await processContent();
      state.initialized = true;
      log(logLevels.INFO, "Layout handler initialized");
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      state.layoutMap = new WeakMap();
      state.gridElements = new Set();
      state.flexElements = new Set();
      state.initialized = false;
      baseHandler.cleanup();
    }

    return {
      ...baseHandler,           // Include base handler functionality
      isApplicable,            // Add/override specific methods
      initialize,
      processContent,
      handleMutations,
      getObserverConfig,
      cleanup,
      // Exposed for testing
      _test: {
        analyzeVisualHierarchy,
        calculateVisualScore,
        determineConfidence
      }
    };
  }

  // Make it available globally
  global.LayoutDomHandler = {
    create: createLayoutDomHandler
  };

})(typeof self !== 'undefined' ? self : global);
