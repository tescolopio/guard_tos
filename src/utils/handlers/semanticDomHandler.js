/**
 * @file semanticDomHandler.js
 * @description Handles pages with semantic HTML5 structure
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  function createSemanticDomHandler({ log, logLevels }) {
    const { DETECTION, SELECTORS } = global.EXT_CONSTANTS;
    
    // Get base handler functionality
    const baseHandler = global.BaseHandler.create({ log, logLevels });

    // State management
    const state = {
      initialized: false,
      documentOutline: null,
      sectionMap: new WeakMap(),
      headingMap: new WeakMap()
    };

    // Semantic element configurations
    const SEMANTIC_ELEMENTS = {
      STRUCTURAL: {
        main: { weight: 1.0, isRoot: true },
        article: { weight: 0.9, isContainer: true },
        section: { weight: 0.8, isContainer: true },
        aside: { weight: 0.4, isContainer: true },
        footer: { weight: 0.3, isContainer: true }
      },
      CONTENT: {
        h1: { level: 1, weight: 1.0 },
        h2: { level: 2, weight: 0.9 },
        h3: { level: 3, weight: 0.8 },
        h4: { level: 4, weight: 0.7 },
        h5: { level: 5, weight: 0.6 },
        h6: { level: 6, weight: 0.5 }
      },
      ARIA_ROLES: {
        main: ['main', 'content'],
        article: ['article', 'document'],
        section: ['region', 'section'],
        complementary: ['complementary', 'aside']
      }
    };

    // Legal section characteristics
    const SECTION_CHARACTERISTICS = {
      MIN_LENGTH: 100,
      MIN_HEADINGS: 1,
      MIN_PARAGRAPHS: 2
    };

    /**
     * Checks if semantic processing is applicable
     * @returns {boolean} Whether semantic analysis should be used
     */
    function isApplicable() {
      try {
        // Check for semantic elements
        const hasSemanticElements = Object.keys(SEMANTIC_ELEMENTS.STRUCTURAL)
          .some(tag => document.querySelector(tag));

        // Check for ARIA roles
        const hasAriaRoles = Object.values(SEMANTIC_ELEMENTS.ARIA_ROLES)
          .flat()
          .some(role => document.querySelector(`[role="${role}"]`));

        // Check for schema.org markup
        const hasSchemaMarkup = document.querySelector('[itemtype*="schema.org"]');

        return hasSemanticElements || hasAriaRoles || hasSchemaMarkup;
      } catch (error) {
        log(logLevels.ERROR, "Error checking semantic structure:", error);
        return false;
      }
    }

    /**
     * Builds document outline from semantic structure
     * @returns {Object} Document outline structure
     */
    function buildDocumentOutline() {
      const outline = {
        sections: [],
        headings: new Map(),
        structure: new Map()
      };

      try {
        // Process main content areas first
        const mainElements = document.querySelectorAll('main, [role="main"]');
        for (const main of mainElements) {
          const section = processSemanticSection(main);
          if (section) {
            outline.sections.push(section);
          }
        }

        // Process articles and sections not in main
        const contentElements = document.querySelectorAll('article, section');
        for (const element of contentElements) {
          if (!elementIsWithin(element, mainElements)) {
            const section = processSemanticSection(element);
            if (section) {
              outline.sections.push(section);
            }
          }
        }

        return outline;
      } catch (error) {
        log(logLevels.ERROR, "Error building document outline:", error);
        return outline;
      }
    }

    /**
     * Processes a semantic section
     * @param {Element} element Section element
     * @returns {Object|null} Processed section data
     */
    async function processSemanticSection(element) {
      if (state.sectionMap.has(element)) {
        return state.sectionMap.get(element);
      }

      const section = {
        element,
        type: element.tagName.toLowerCase(),
        role: element.getAttribute('role'),
        heading: findSectionHeading(element),
        subsections: [],
        content: []
      };

      // Process subsections
      const childSections = element.querySelectorAll(':scope > section, :scope > article');
      for (const child of childSections) {
        const subsection = await processSemanticSection(child);
        if (subsection) {
          section.subsections.push(subsection);
        }
      }

      // Process content using base handler
      const result = await baseHandler.processElement(element);
      if (result?.hasLegalContent) {
        section.hasLegalContent = true;
        section.analysis = result;
        
        // Add semantic metrics
        section.metrics = {
          headings: countHeadings(element),
          paragraphs: element.querySelectorAll('p').length,
          lists: element.querySelectorAll('ul, ol, dl').length,
          terms: element.querySelectorAll('dt').length
        };

        state.sectionMap.set(element, section);
        return section;
      }

      return null;
    }

    /**
     * Finds heading for a section
     * @param {Element} section Section element
     * @returns {Object|null} Heading information
     */
    function findSectionHeading(section) {
      if (state.headingMap.has(section)) {
        return state.headingMap.get(section);
      }

      const headingElement = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (!headingElement) return null;

      const heading = {
        element: headingElement,
        level: parseInt(headingElement.tagName[1]),
        text: headingElement.textContent.trim()
      };

      state.headingMap.set(section, heading);
      return heading;
    }

    /**
     * Counts headings in an element
     * @param {Element} element Element to analyze
     * @returns {Object} Heading counts by level
     */
    function countHeadings(element) {
      const counts = { total: 0 };
      for (let i = 1; i <= 6; i++) {
        const count = element.querySelectorAll(`h${i}`).length;
        if (count > 0) {
          counts[`h${i}`] = count;
          counts.total += count;
        }
      }
      return counts;
    }

    /**
     * Checks if element is within containers
     * @param {Element} element Element to check
     * @param {NodeList} containers Container elements
     * @returns {boolean} Whether element is within containers
     */
    function elementIsWithin(element, containers) {
      return Array.from(containers).some(container => 
        container.contains(element));
    }

    /**
     * Processes page content using semantic structure
     * @returns {Promise<Object>} Processing results
     */
    async function processContent() {
      try {
        // Build document outline
        state.documentOutline = buildDocumentOutline();

        let results = {
          success: true,
          hasLegalContent: false,
          elements: []
        };

        // Process each section in the outline
        for (const section of state.documentOutline.sections) {
          if (section.hasLegalContent) {
            results.hasLegalContent = true;
            results.elements.push({
              ...section.analysis,
              semanticType: section.type,
              semanticRole: section.role,
              heading: section.heading,
              metrics: section.metrics
            });
          }
        }

        return {
          ...results,
          confidence: determineConfidence(results.elements),
          semanticMetrics: {
            totalSections: state.documentOutline.sections.length,
            legalSections: results.elements.length,
            outlineDepth: calculateOutlineDepth(state.documentOutline)
          }
        };
      } catch (error) {
        log(logLevels.ERROR, "Error processing semantic content:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Determines confidence based on semantic analysis
     * @param {Array} elements Processed elements
     * @returns {string} Confidence level
     */
    function determineConfidence(elements) {
      if (elements.length === 0) return 'low';

      const hasProperStructure = elements.some(el => 
        el.semanticType === 'article' || 
        (el.semanticType === 'section' && el.heading)
      );

      const avgMetrics = elements.reduce((acc, el) => ({
        headings: acc.headings + el.metrics.headings.total,
        paragraphs: acc.paragraphs + el.metrics.paragraphs,
        lists: acc.lists + el.metrics.lists
      }), { headings: 0, paragraphs: 0, lists: 0 });

      if (hasProperStructure && 
          avgMetrics.headings >= SECTION_CHARACTERISTICS.MIN_HEADINGS &&
          avgMetrics.paragraphs >= SECTION_CHARACTERISTICS.MIN_PARAGRAPHS) {
        return 'high';
      }

      return avgMetrics.headings > 0 ? 'medium' : 'low';
    }

    /**
     * Calculates outline depth
     * @param {Object} outline Document outline
     * @returns {number} Maximum outline depth
     */
    function calculateOutlineDepth(outline) {
      function getDepth(section) {
        if (!section.subsections.length) return 1;
        return 1 + Math.max(...section.subsections.map(getDepth));
      }

      return Math.max(...outline.sections.map(getDepth));
    }

    /**
     * Handles mutations in the DOM
     * @param {MutationRecord[]} mutations Array of mutations
     */
    function handleMutations(mutations) {
      const semanticChanges = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes)
          .some(node => node instanceof Element &&
            (SEMANTIC_ELEMENTS.STRUCTURAL[node.tagName.toLowerCase()] ||
             SEMANTIC_ELEMENTS.CONTENT[node.tagName.toLowerCase()]))
      );

      if (semanticChanges) {
        // Clear caches
        state.sectionMap = new WeakMap();
        state.headingMap = new WeakMap();
        
        // Let base handler process mutations
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
        attributeFilter: ['role', 'itemtype']
      };
    }

    /**
     * Initializes the semantic handler
     */
    async function initialize() {
      if (state.initialized) {
        return;
      }

      await processContent();
      state.initialized = true;
      log(logLevels.INFO, "Semantic handler initialized");
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      state.documentOutline = null;
      state.sectionMap = new WeakMap();
      state.headingMap = new WeakMap();
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
        buildDocumentOutline,
        processSemanticSection,
        determineConfidence
      }
    };
  }

  // Make it available globally
  global.SemanticDomHandler = {
    create: createSemanticDomHandler
  };

})(typeof self !== 'undefined' ? self : global);
