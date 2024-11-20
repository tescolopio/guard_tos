/**
 * @file specialCaseDomHandler.js
 * @description Handles known platforms and special case layouts
 * @version 2.0.0
 */

(function(global) {
  'use strict';

  function createSpecialCaseHandler({ log, logLevels }) {
    const { DETECTION, SELECTORS } = global.Constants;
    
    // Get base handler functionality
    const baseHandler = global.BaseHandler.create({ log, logLevels });

    // State management
    const state = {
      initialized: false,
      platformCache: new Map(),
      currentPlatform: null
    };

    // Platform configurations
    const PLATFORMS = {
      GOOGLE: {
        name: 'Google',
        pattern: /google\.com\/(?:policies|privacy|terms)/i,
        selectors: {
          main: '.main-content, [role="main"]',
          sections: '.section-content',
          headings: '.section-title',
          contentWrapper: '.content-wrapper'
        },
        navigation: '.page-navigation',
        waitForElement: '[data-page-loaded="true"]',
        excludeSelectors: ['.feedback-section', '.footer-links'],
        language: {
          container: '[data-language-selector]',
          attribute: 'data-language'
        }
      },
      FACEBOOK: {
        name: 'Facebook',
        pattern: /facebook\.com\/(?:policies|terms|privacy)/i,
        selectors: {
          main: '[data-testid="tos-content"]',
          sections: '[role="article"]',
          headings: '[role="heading"]',
          contentWrapper: '.legal-content-container'
        },
        navigation: '[role="navigation"]',
        waitForElement: '[data-content-loaded="true"]',
        excludeSelectors: ['.related-policies', '.social-plugins'],
        language: {
          container: '[data-language-settings]',
          attribute: 'data-locale'
        }
      },
      MICROSOFT: {
        name: 'Microsoft',
        pattern: /microsoft\.com\/(?:servicesagreement|privacy|terms)/i,
        selectors: {
          main: '#legalContent',
          sections: '.clause-section',
          headings: '.clause-title',
          contentWrapper: '.legal-container'
        },
        navigation: '.agreement-navigation',
        waitForElement: '[data-state="loaded"]',
        excludeSelectors: ['.support-links', '.locale-selector'],
        language: {
          container: '#locale-picker',
          attribute: 'data-market'
        }
      },
      GITHUB: {
        name: 'GitHub',
        pattern: /github\.com\/(?:terms|privacy|security)/i,
        selectors: {
          main: '.markdown-body',
          sections: 'article',
          headings: 'h1, h2, h3',
          contentWrapper: '.container-xl'
        },
        navigation: '.article-nav',
        waitForElement: '[data-hydrated="true"]',
        excludeSelectors: ['.contribution', '.footer'],
        language: {
          container: '[data-locale-selector]',
          attribute: 'data-locale'
        }
      },
      APPLE: {
        name: 'Apple',
        pattern: /apple\.com\/legal/i,
        selectors: {
          main: '#main',
          sections: '.section',
          headings: '.section-headline',
          contentWrapper: '.main-wrapper'
        },
        navigation: '.section-nav',
        waitForElement: '[data-page-loaded]',
        excludeSelectors: ['.locale-switcher', '.footer-directory'],
        language: {
          container: '#locale-selector',
          attribute: 'data-geo'
        }
      }
    };

    /**
     * Checks if current page matches a known platform
     * @returns {boolean} Whether a platform is recognized
     */
    function isApplicable() {
      try {
        return Object.values(PLATFORMS)
          .some(platform => platform.pattern.test(window.location.href));
      } catch (error) {
        log(logLevels.ERROR, "Error checking platform applicability:", error);
        return false;
      }
    }

    /**
     * Gets configuration for current platform
     * @returns {Object|null} Platform configuration
     */
    function getPlatformConfig() {
      if (state.currentPlatform) {
        return state.currentPlatform;
      }

      const platform = Object.values(PLATFORMS)
        .find(p => p.pattern.test(window.location.href));

      if (platform) {
        state.currentPlatform = platform;
        log(logLevels.INFO, `Detected ${platform.name} platform`);
      }

      return platform;
    }

    /**
     * Waits for platform-specific content to load
     * @param {Object} platform Platform configuration
     * @returns {Promise<boolean>} Whether content loaded
     */
    async function waitForPlatformContent(platform) {
      return new Promise((resolve) => {
        const maxWait = 5000;
        const startTime = Date.now();

        function check() {
          const element = document.querySelector(platform.waitForElement);
          if (element) {
            resolve(true);
            return;
          }

          if (Date.now() - startTime >= maxWait) {
            resolve(false);
            return;
          }

          requestAnimationFrame(check);
        }

        requestAnimationFrame(check);
      });
    }

    /**
     * Gets language information for platform
     * @param {Object} platform Platform configuration
     * @returns {Object} Language information
     */
    function getPlatformLanguage(platform) {
      const container = document.querySelector(platform.language.container);
      if (!container) return null;

      return {
        current: container.getAttribute(platform.language.attribute),
        available: Array.from(container.querySelectorAll('option, [role="option"]'))
          .map(el => el.getAttribute(platform.language.attribute))
          .filter(Boolean)
      };
    }

    /**
     * Processes content for known platform
     * @returns {Promise<Object>} Processing results
     */
    async function processContent() {
      try {
        const platform = getPlatformConfig();
        if (!platform) {
          return {
            success: false,
            reason: 'unknown_platform'
          };
        }

        // Wait for platform content
        const contentLoaded = await waitForPlatformContent(platform);
        if (!contentLoaded) {
          log(logLevels.WARN, `Timeout waiting for ${platform.name} content`);
        }

        let results = {
          success: true,
          hasLegalContent: false,
          elements: []
        };

        // Process main content
        const mainContent = document.querySelector(platform.selectors.main);
        if (mainContent) {
          const mainResult = await baseHandler.processElement(mainContent);
          if (mainResult?.hasLegalContent) {
            results.hasLegalContent = true;
            results.elements.push({
              ...mainResult,
              role: 'main'
            });
          }
        }

        // Process sections
        const sections = document.querySelectorAll(platform.selectors.sections);
        for (const section of sections) {
          if (platform.excludeSelectors.some(selector => 
            section.matches(selector))) {
            continue;
          }

          const result = await baseHandler.processElement(section);
          if (result?.hasLegalContent) {
            results.hasLegalContent = true;
            results.elements.push({
              ...result,
              heading: findSectionHeading(section, platform),
              role: 'section'
            });
          }
        }

        // Add platform metadata
        results.platformInfo = {
          name: platform.name,
          language: getPlatformLanguage(platform),
          structure: {
            hasSections: sections.length > 0,
            hasNavigation: !!document.querySelector(platform.navigation),
            excludedSections: document.querySelectorAll(
              platform.excludeSelectors.join(',')
            ).length
          }
        };

        return {
          ...results,
          confidence: results.hasLegalContent ? 'high' : 'low'
        };
      } catch (error) {
        log(logLevels.ERROR, "Error processing platform content:", error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Finds section heading using platform config
     * @param {Element} section Section element
     * @param {Object} platform Platform configuration
     * @returns {Object|null} Heading information
     */
    function findSectionHeading(section, platform) {
      const heading = section.querySelector(platform.selectors.headings);
      if (!heading) return null;

      return {
        text: heading.textContent.trim(),
        level: heading.getAttribute('role') === 'heading' ? 
          parseInt(heading.getAttribute('aria-level')) || 2 :
          parseInt(heading.tagName[1])
      };
    }

    /**
     * Handles mutations in platform content
     * @param {MutationRecord[]} mutations Array of mutations
     */
    function handleMutations(mutations) {
      const platform = getPlatformConfig();
      if (!platform) return;

      const platformChanges = mutations.some(mutation => {
        const target = mutation.target;
        return target.matches?.(platform.selectors.main) ||
               target.matches?.(platform.selectors.sections) ||
               target.closest?.(platform.selectors.main) ||
               target.closest?.(platform.selectors.sections);
      });

      if (platformChanges) {
        baseHandler.handleMutations(mutations);
      }
    }

    /**
     * Gets mutation observer configuration
     * @returns {Object} Observer configuration
     */
    function getObserverConfig() {
      const platform = getPlatformConfig();
      if (!platform) return null;

      return {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'data-testid',
          'role',
          'aria-level',
          platform.language.attribute
        ]
      };
    }

    /**
     * Initializes the handler
     */
    async function initialize() {
      if (state.initialized) {
        return;
      }

      const platform = getPlatformConfig();
      if (platform) {
        await processContent();
      }

      state.initialized = true;
      log(logLevels.INFO, "Special case handler initialized");
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      state.platformCache.clear();
      state.currentPlatform = null;
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
        getPlatformConfig,
        waitForPlatformContent,
        findSectionHeading
      }
    };
  }

  // Make it available globally
  global.SpecialCaseHandler = {
    create: createSpecialCaseHandler
  };

})(typeof self !== 'undefined' ? self : global);
