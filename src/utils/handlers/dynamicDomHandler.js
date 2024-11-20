/**
 * @file dynamicDomHandler.js
 * @description Handles dynamic content loading and SPA-style pages
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  /**
   * Creates a handler for dynamic DOM content
   * @param {Object} config Configuration object
   * @param {Function} config.log Logging function
   * @param {Object} config.logLevels Log level constants
   * @returns {Object} Dynamic DOM handler instance
   */
  function createDynamicDomHandler({ log, logLevels }) {
    const { DETECTION, SELECTORS } = global.Constants;
    
    // Get base handler functionality
    const baseHandler = global.BaseHandler.create({ log, logLevels });

    // Framework detection patterns
    const FRAMEWORKS = {
      ANGULAR: {
        selectors: ['[ng-app]', '[ng-controller]', '[ng-model]'],
        global: 'angular',
        ready: () => !!document.querySelector('[ng-app]') && !document.querySelector('[ng-app].ng-loading')
      },
      REACT: {
        selectors: ['[data-reactroot]', '[data-reactid]', '#root'],
        global: 'React',
        ready: () => {
          const root = document.querySelector('#root, [data-reactroot]');
          return root && root.children.length > 0;
        }
      },
      VUE: {
        selectors: ['#app', '[data-v-app]', '[v-cloak]'],
        global: 'Vue',
        ready: () => {
          const app = document.querySelector('#app, [data-v-app]');
          return app && !app.hasAttribute('v-cloak');
        }
      }
    };

    // State management
    const state = {
      initialized: false,
      routeChangeListeners: new Set(),
      pendingUpdates: new Map(),
      loadingTimeout: null
    };

    /**
     * Detects which framework(s) are present
     * @returns {Set<string>} Set of detected frameworks
     */
    function detectFrameworks() {
      const detected = new Set();

      Object.entries(FRAMEWORKS).forEach(([framework, config]) => {
        if (
          config.selectors.some(selector => document.querySelector(selector)) ||
          window[config.global]
        ) {
          detected.add(framework);
          log(logLevels.INFO, `Detected ${framework} framework`);
        }
      });

      return detected;
    }

    /**
     * Checks if this handler is applicable
     * @returns {boolean} Whether handler should be used
     */
    function isApplicable() {
      try {
        // Check for framework-specific indicators
        const hasFramework = detectFrameworks().size > 0;

        // Check for general dynamic content indicators
        const hasDynamicIndicators = !!(
          document.querySelector('[data-dynamic]') ||
          document.querySelector('[data-async]') ||
          document.querySelector('[data-loading]') ||
          document.querySelector('script[type="module"]')
        );

        return hasFramework || hasDynamicIndicators;
      } catch (error) {
        log(logLevels.ERROR, "Error checking applicability:", error);
        return false;
      }
    }

    /**
     * Waits for content to stabilize
     * @param {number} timeout Maximum wait time in ms
     * @returns {Promise<boolean>} Whether content stabilized
     */
    async function waitForContentStability(timeout = 5000) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        let lastMutationTime = startTime;

        const observer = new MutationObserver(() => {
          lastMutationTime = Date.now();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });

        const checkStability = () => {
          const currentTime = Date.now();
          
          if (currentTime - startTime > timeout) {
            observer.disconnect();
            resolve(false);
            return;
          }

          if (currentTime - lastMutationTime > 500) {
            observer.disconnect();
            resolve(true);
            return;
          }

          requestAnimationFrame(checkStability);
        };

        requestAnimationFrame(checkStability);
      });
    }

    /**
     * Sets up route change detection
     */
    function setupRouteChangeDetection() {
      // Handle React Router
      if (window.React) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function() {
          originalPushState.apply(this, arguments);
          handleRouteChange();
        };
      }

      // Handle Angular Router
      if (window.angular) {
        document.addEventListener('$routeChangeSuccess', handleRouteChange);
      }

      // Handle Vue Router
      if (window.Vue) {
        window.addEventListener('popstate', handleRouteChange);
      }

      // Generic handling
      window.addEventListener('hashchange', handleRouteChange);
    }

    /**
     * Handles route changes
     */
    async function handleRouteChange() {
      log(logLevels.INFO, "Route change detected");
      
      if (state.loadingTimeout) {
        clearTimeout(state.loadingTimeout);
      }

      state.loadingTimeout = setTimeout(async () => {
        if (await waitForContentStability()) {
          await processContent();
        }
      }, 500);
    }

    /**
     * Processes dynamic content
     * @returns {Promise<Object>} Processing results
     */
    async function processContent() {
      try {
        let results = {
          success: true,
          hasLegalContent: false,
          elements: []
        };

        // Wait for framework-specific ready state
        const frameworks = detectFrameworks();
        for (const framework of frameworks) {
          const config = FRAMEWORKS[framework];
          if (!config.ready()) {
            log(logLevels.INFO, `Waiting for ${framework} content`);
            await waitForContentStability();
          }
        }

        // Process dynamic containers
        const containers = document.querySelectorAll('#app, [data-reactroot], [ng-app]');
        for (const container of containers) {
          const result = await baseHandler.processElement(container);
          if (result?.hasLegalContent) {
            results.hasLegalContent = true;
            results.elements.push(result);
          }
        }

        // Process visible legal sections
        const visibleSections = Array.from(document.querySelectorAll(SELECTORS.LEGAL_SECTIONS.join(', ')))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });

        for (const section of visibleSections) {
          const result = await baseHandler.processElement(section);
          if (result?.hasLegalContent) {
            results.hasLegalContent = true;
            results.elements.push(result);
          }
        }

        return results;
      } catch (error) {
        log(logLevels.ERROR, "Error processing dynamic content:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Handles mutations
     * @param {MutationRecord[]} mutations Array of mutations
     */
    async function handleMutations(mutations) {
      const significantChanges = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes)
          .some(node => node.nodeType === Node.ELEMENT_NODE)
      );

      if (significantChanges) {
        const now = Date.now();
        
        if (state.pendingUpdates.size === 0) {
          setTimeout(async () => {
            const updates = Array.from(state.pendingUpdates.entries());
            state.pendingUpdates.clear();

            const uniqueUpdates = new Map(updates);
            for (const [element, timestamp] of uniqueUpdates) {
              if (now - timestamp < 1000) {
                await processContent();
                break;
              }
            }
          }, 500);
        }

        mutations.forEach(mutation => {
          state.pendingUpdates.set(mutation.target, now);
        });
      }
    }

    /**
     * Gets observer configuration
     * @returns {Object} Observer configuration
     */
    function getObserverConfig() {
      return {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ['class', 'style', 'hidden']
      };
    }

    /**
     * Initializes the handler
     */
    async function initialize() {
      if (state.initialized) {
        return;
      }

      setupRouteChangeDetection();
      await waitForContentStability();
      
      state.initialized = true;
      log(logLevels.INFO, "Dynamic handler initialized");
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      if (state.loadingTimeout) {
        clearTimeout(state.loadingTimeout);
      }

      state.routeChangeListeners.clear();
      state.pendingUpdates.clear();
      state.initialized = false;

      // Call base handler cleanup
      baseHandler.cleanup();
    }

    return {
      ...baseHandler,           // Include all base handler functionality
      isApplicable,            // Override/add specific methods
      initialize,
      processContent,
      handleMutations,
      getObserverConfig,
      cleanup,
      // Exposed for testing
      _test: {
        detectFrameworks,
        waitForContentStability
      }
    };
  }

  // Make it available globally
  global.DynamicDomHandler = {
    create: createDynamicDomHandler
  };

})(typeof self !== 'undefined' ? self : global);
