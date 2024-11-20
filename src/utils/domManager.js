/**
 * @file domManager.js
 * @description Orchestrates different DOM handling strategies based on page characteristics
 * @version 1.0.0
 */
const { EXT_CONSTANTS } = require('./constants');
const { TextExtractor } = require('../analysis/textExtractor');
const baseDomHandler = require('./handlers/baseDomHandler');
const DynamicDomHandler = require('./handlers/dynamicDomHandler');
const HeuristicDomHandler = require('./handlers/heuristicDomHandler');
const LayoutDomHandler = require('./handlers/layoutDomHandler');
const utilities = require('./utilities');

  // Initialize core services
(function(global) {
  'use strict';

  /**
   * Creates a DOM manager instance that coordinates different handling strategies
   * @param {Object} config Configuration object
   * @param {Function} config.log Logging function
   * @param {Object} config.logLevels Log level constants
   * @returns {Object} DOM manager instance
   */
  function createDomManager({ log, logLevels }) {
    
    const { SELECTORS } = EXT_CONSTANTS;
    
    // Initialize handlers
    const handlers = {
      basze: baseDomHandler.create({ log, logLevels }),
      dynamic: createDynamicDomHandler.create({ log, logLevels }),
      heuristic: HeuristicDomHandler.create({ log, logLevels }),
      layout: LayoutDomHandler.create({ log, logLevels }),
      semantic: SemanticDomHandler.create({ log, logLevels }),
      specialCase: SpecialCaseDomHandler.create({ log, logLevels })
      }

    // State management
    const state = {
      currentHandler: null,
      pageType: null,
      initialized: false,
      observer: null,
      analysisResults: new Map()
    };

    /**
     * Performs initial content analysis before handler selection
     * @returns {Promise<Object>} Analysis results
     */
    async function analyzeInitialContent() {
      try {
        // Extract text from the main content areas first
        let mainContent = '';
        for (const selector of SELECTORS.LEGAL_SECTIONS) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = await textExtractor.extract(element.innerHTML, 'html');
            mainContent += text + '\n';
          }
        }

        // Analyze the extracted content
        const analysis = await legalAnalyzer.analyzeText(mainContent);
        
        log(logLevels.INFO, "Initial content analysis:", {
          isLegal: analysis.isLegal,
          confidence: analysis.confidence,
          metrics: analysis.metrics
        });

        return analysis;
      } catch (error) {
        log(logLevels.ERROR, "Error in initial content analysis:", error);
        return null;
      }
    }

    /**
     * Analyzes the page structure to determine the most appropriate handler
     * @returns {Promise<string>} The identified page type
     */
    async function analyzePageStructure() {
      try {
        // First analyze the content
        const contentAnalysis = await analyzeInitialContent();
        
        // If no legal content found, we can use the heuristic handler
        if (!contentAnalysis?.isLegal) {
          log(logLevels.INFO, "No legal content detected, using heuristic handler");
          return 'heuristic';
        }

        // Store analysis results for handler use
        state.analysisResults.set('initial', contentAnalysis);

        // Select handler based on content confidence and page structure
        if (contentAnalysis.confidence === 'high') {
          // For high confidence content, prefer semantic or special case handlers
          if (handlers.specialCase.isApplicable()) {
            return 'specialCase';
          }
          if (handlers.semantic.isApplicable()) {
            return 'semantic';
          }
        }

        // Check for dynamic content
        if (handlers.dynamic.isApplicable()) {
          return 'dynamic';
        }

        // Check for layout-based structure
        if (handlers.layout.isApplicable()) {
          return 'layout';
        }

        return 'heuristic';
      } catch (error) {
        log(logLevels.ERROR, "Error analyzing page structure:", error);
        return 'heuristic';
      }
    }

    /**
     * Sets up the appropriate handler based on page analysis
     */
    async function setupHandler() {
      try {
        state.pageType = await analyzePageStructure();
        state.currentHandler = handlers[state.pageType];

        log(logLevels.INFO, `Using ${state.pageType} handler for page processing`);

        // Pass initial analysis results to handler
        await state.currentHandler.initialize(state.analysisResults.get('initial'));
        
        setupObserver();
        return true;
      } catch (error) {
        log(logLevels.ERROR, "Error setting up handler:", error);
        return false;
      }
    }

    /**
     * Processes the page content using the selected handler
     */
    async function processPage() {
      try {
        if (!state.currentHandler) {
          throw new Error('No handler selected');
        }

        // Process content with selected handler
        const result = await state.currentHandler.processContent();
        
        if (result.hasLegalContent) {
          // Store results for future reference
          state.analysisResults.set('current', result);
          notifyExtension(result);
        }

        return result;
      } catch (error) {
        log(logLevels.ERROR, "Error processing page:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Handles mutation observations and content updates
     * @param {MutationRecord[]} mutations Array of mutations
     */
    async function handleMutations(mutations) {
      // Only process significant content changes
      const significantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        Array.from(mutation.addedNodes)
          .some(node => node.nodeType === Node.ELEMENT_NODE)
      );

      if (significantChanges) {
        // Analyze new content
        const newAnalysis = await analyzeInitialContent();
        
        if (newAnalysis?.isLegal) {
          // Update stored results
          state.analysisResults.set('current', newAnalysis);
          
          // Let handler process the changes
          state.currentHandler.handleMutations(mutations);
        }
      }
    }

    /**
     * Sets up mutation observer
     */
    function setupObserver() {
      if (state.observer) {
        state.observer.disconnect();
      }

      state.observer = new MutationObserver(handleMutations);

      const observerConfig = {
        childList: true,
        subtree: true,
        characterData: true
      };

      state.observer.observe(document.body, observerConfig);
    }

    /**
     * Initializes the DOM manager system
     */
    async function initialize() {
      if (state.initialized) {
        log(logLevels.WARN, "DOM manager already initialized");
        return;
      }

      try {
        await setupHandler();
        await processPage();
        
        state.initialized = true;
        log(logLevels.INFO, "DOM manager initialized successfully");
      } catch (error) {
        log(logLevels.ERROR, "Error initializing DOM manager:", error);
        throw error;
      }
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }

      if (state.currentHandler) {
        state.currentHandler.cleanup();
      }

      state.initialized = false;
      log(logLevels.INFO, "DOM manager cleaned up");
    }

    return {
      initialize,
      cleanup,
      processPage,
      // Exposed for testing
      _test: {
        analyzePageStructure,
        setupHandler,
        analyzeInitialContent
      }
    };
  }

  // Make it available globally
  global.DomManager = {
    create: createDomManager
  };

})(typeof self !== 'undefined' ? self : global);
