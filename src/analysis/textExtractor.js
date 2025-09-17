/**
 * @file textExtractor.js
 * @description Service for extracting and caching text from various document formats
 * @version 2.1.0
 */

(function (global) {
  "use strict";

  function createTextExtractor({ log, logLevels, utilities }) {
    if (!utilities) {
      throw new Error("Utilities service must be provided to text extractor");
    }

    /**
     * Splits text into words, removing punctuation and converting to lower case.
     * @param {string} text The text to split.
     * @returns {string[]} An array of words.
     */
    function splitIntoWords(text) {
      return text ? text.toLowerCase().split(/\W+/).filter(Boolean) : [];
    }

    /**
     * Splits text into sentences based on punctuation.
     * @param {string} text The text to split.
     * @returns {string[]} An array of sentences.
     */
    function splitIntoSentences(text) {
      return text
        ? text.split(/[.!?]+/).filter((sentence) => sentence.trim())
        : [];
    }

    // ANALYSIS from constants for BATCH_THRESHOLD and CHUNK_SIZE
    // Prefer test-provided globals; fallback to project constants
    const constantsSource =
      (global && global.Constants) ||
      (global && global.EXT_CONSTANTS) ||
      require("../utils/constants").EXT_CONSTANTS;
    const { ANALYSIS, ERROR_TYPES } = constantsSource;

    async function handleExtractionError(error, errorType) {
      log(logLevels.ERROR, `Extraction error (${errorType}):`, error);
      return {
        success: false,
        error: error.message,
        errorType,
      };
    }

    /**
     * Generates a simple cache key from a string.
     * @param {string} str The string to key.
     * @param {string} prefix A prefix for the key.
     * @returns {string} The cache key.
     */
    function generateCacheKey(str, prefix = "key") {
      // A simple non-crypto hash function
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      return `${prefix}_${Math.abs(hash)}`;
    }
    // Initialize cache system
    // Use global if provided by tests, else require project implementations
    const TextCacheConfig =
      (global && global.TextCacheConfig) ||
      require("../data/cache/textCacheConfig").TextCacheConfig;
    const TextCacheWithRecovery =
      (global && global.TextCacheWithRecovery) ||
      require("../data/cache/textCacheWithRecovery").TextCacheWithRecovery;

    const cacheConfig = new TextCacheConfig();
    const textCache = new TextCacheWithRecovery(cacheConfig, log, logLevels);

    async function extract(input, type) {
      try {
        if (!input) {
          throw new Error("No input provided for extraction");
        }

        // Generate cache key using generateFingerprint
        const cacheKey = generateFingerprint(input);

        // Check cache
        const cachedResult = await textCache.get(cacheKey, "processed");
        if (cachedResult) {
          log(logLevels.DEBUG, "Retrieved from cache:", cacheKey);
          return {
            text: cachedResult,
            metadata: await textCache.get(cacheKey, "metadata"),
            fromCache: true,
          };
        }

        // Extract and process text
        let extractedText = "";
        let metadata = {
          format: type,
          structure: null,
        };

        // Handle different content types
        switch (type?.toLowerCase()) {
          case "html": {
            const result = await extractFromHTML(input);
            if (!result.success) {
              return result;
            }
            extractedText = result.text;
            metadata.structure = result.structure;
            break;
          }
          case "text":
            extractedText = extractFromText(input);
            break;
          default:
            if (typeof input === "string") {
              if (input.trim().startsWith("<")) {
                const htmlResult = await extractFromHTML(input);
                extractedText = htmlResult.text;
                metadata.structure = htmlResult.structure;
                type = "html";
              } else {
                extractedText = extractFromText(input);
                type = "text";
              }
            }
        }

        // Process and analyze text
        let processedText = preprocessText(extractedText);

        // Batch processing for large documents if needed
        if (processedText.length > ANALYSIS.BATCH_THRESHOLD) {
          processedText = await processBatchedContent(
            processedText,
            ANALYSIS.CHUNK_SIZE,
          );
        }

        // Analyze words
        const words = splitIntoWords(processedText);

        // Update metadata
        metadata.wordCount = words.length;
        if (!metadata.wordCount && processedText) {
          metadata.wordCount = processedText
            .split(/\s+/)
            .filter(Boolean).length;
        }
        metadata.hasLegalTerms = words.some((word) =>
          global.legalTerms?.includes(word.toLowerCase()),
        );

        // Cache if meets minimum requirements
        if (words.length >= cacheConfig.MIN_CACHE_LENGTH) {
          // Enrich metadata before caching
          metadata = enrichMetadata(metadata, processedText);

          // Store in cache
          await textCache.set(cacheKey, extractedText, "raw");
          await textCache.set(cacheKey, processedText, "processed");
          await textCache.set(cacheKey, metadata, "metadata");

          // Store DOM structure if HTML
          if (metadata.structure && type === "html") {
            await textCache.set(cacheKey, metadata.structure, "structure");
          }
        }

        return {
          text: processedText,
          metadata,
          fromCache: false,
        };
      } catch (error) {
        return handleExtractionError(
          error,
          ERROR_TYPES.EXTRACTION.INVALID_INPUT,
        );
      }
    }

    /**
     * Enhanced HTML extraction with structure analysis
     */
    async function extractFromHTML(html) {
      try {
        if (!html) return { text: "", structure: null };

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Check for parser errors
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
          return handleExtractionError(
            new Error(parserError.textContent),
            ERROR_TYPES.EXTRACTION.INCOMPLETE_HTML,
          );
        }

        // Analyze structure before cleaning
        const structure = analyzeHTMLStructure(doc.body);

        // Remove unwanted elements
        const excludeSelectors = [
          "script",
          "style",
          "noscript",
          "iframe",
          "svg",
          "header",
          "footer",
          "nav",
          '[role="navigation"]',
          ".cookie-banner",
          ".ad",
          ".advertisement",
          "meta",
          "link",
          "head",
        ];

        excludeSelectors.forEach((selector) => {
          doc.querySelectorAll(selector).forEach((el) => el.remove());
        });

        // Extract text while preserving structure
        function extractNodeText(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim();
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            const text = Array.from(node.childNodes)
              .map(extractNodeText)
              .filter(Boolean)
              .join(" ");

            if (
              [
                "div",
                "p",
                "section",
                "article",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
              ].includes(tag)
            ) {
              return `\n${text}\n`;
            }

            return text;
          }

          return "";
        }

        return {
          success: true,
          text: extractNodeText(doc.body),
          structure,
        };
      } catch (error) {
        return handleExtractionError(
          error,
          ERROR_TYPES.EXTRACTION.MALFORMED_HTML,
        );
      }
    }

    /**
     * Analyzes HTML structure for metadata
     * @param {Element} root Root element
     * @returns {Object} Structure analysis
     */
    function analyzeHTMLStructure(root) {
      return {
        headings: Array.from(
          root.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        ).map((h) => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent.trim(),
        })),
        sections: Array.from(root.querySelectorAll("section, article")).map(
          (section) => ({
            tag: section.tagName.toLowerCase(),
            id: section.id,
            classes: Array.from(section.classList),
          }),
        ),
        lists: {
          ordered: root.querySelectorAll("ol").length,
          unordered: root.querySelectorAll("ul").length,
          definition: root.querySelectorAll("dl").length,
        },
        paragraphs: root.querySelectorAll("p").length,
      };
    }

    /**
     * Preprocesses text by removing extra whitespace and normalizing case
     * @param {string} text The text to preprocess
     * @return {string} The preprocessed text
     */
    function preprocessText(text) {
      log(logLevels.DEBUG, "Preprocessing text");
      const preprocessedText = text.replace(/\s+/g, " ").trim().toLowerCase();
      log(logLevels.DEBUG, "Text preprocessed", {
        originalText: text,
        preprocessedText,
      });
      return preprocessedText;
    }

    /**
     * Processes the given text content in batches, where each batch is processed concurrently.
     *
     * @param {string} text - The text content to be processed.
     * @returns {Promise<string>} A promise that resolves to the processed text content.
     */
    async function processBatchedContent(text) {
      const BATCH_SIZE = ANALYSIS.CHUNK_SIZE;
      const sections = text.split(/\n\s*\n/);
      const results = [];

      for (let i = 0; i < sections.length; i += BATCH_SIZE) {
        const batch = sections.slice(i, i + BATCH_SIZE);
        const processedBatch = await Promise.all(
          batch.map((section) => preprocessText(section)),
        );
        results.push(...processedBatch);
      }

      return results.join("\n\n");
    }

    /**
     * Generates a fingerprint for the given content.
     *
     * The fingerprint is a string that combines the length of the content,
     * the number of HTML tags in the content, and a cache key generated
     * from the first 1000 characters of the content.
     *
     * @param {string} content - The content to generate a fingerprint for.
     * @returns {string} The generated fingerprint.
     */
    function generateFingerprint(content) {
      const sample = content.slice(0, 1000); // First 1000 chars
      const length = content.length;
      const structure = content.match(/<[^>]+>/g)?.length || 0;
      return `${length}_${structure}_${generateCacheKey(sample, "sample")}`;
    }

    /**
     * Enriches the provided metadata with additional information derived from the content.
     *
     * @param {Object} metadata - The original metadata object to be enriched.
     * @param {string} content - The content from which additional metadata will be derived.
     * @returns {Object} The enriched metadata object.
     *
     * @property {string} contentFingerprint - A unique fingerprint generated from the content.
     * @property {number} analysisTimestamp - The timestamp when the analysis was performed.
     * @property {Object} contentStats - Statistics about the content.
     * @property {number} contentStats.paragraphs - The number of paragraphs in the content.
     * @property {number} contentStats.sentences - The number of sentences in the content.
     * @property {number} contentStats.estimatedReadingTime - The estimated reading time in minutes.
     */
    function enrichMetadata(metadata, content) {
      return {
        ...metadata,
        contentFingerprint: generateFingerprint(content),
        analysisTimestamp: Date.now(),
        contentStats: {
          paragraphs: (content.match(/\n\s*\n/g) || []).length,
          sentences: (content.match(/[.!?]+/g) || []).length,
          estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200),
        },
      };
    }

    /**
     * Extracts and analyzes text from the entire page, section by section.
     * @return {Promise<object>} A promise that resolves to the extracted legal text and metadata
     */
    async function extractAndAnalyzePageText() {
      try {
        log(logLevels.DEBUG, "Starting text extraction and analysis");

        // Attempt to extract legal text based on highlighted elements
        const extractedTextFromHighlights = extractTextFromHighlights();

        if (extractedTextFromHighlights) {
          log(
            logLevels.INFO,
            "Legal text extracted from highlights successfully.",
          );
          return {
            text: extractedTextFromHighlights,
            metadata: {
              legalTermCount: splitIntoWords(extractedTextFromHighlights)
                .length,
              source: "highlights",
            },
          };
        }

        // If extraction from highlights fails, try section-based extraction
        const extractedTextFromSections = await extractTextFromSections();

        if (extractedTextFromSections) {
          log(
            logLevels.INFO,
            "Legal text extracted from sections successfully.",
          );
          return {
            text: extractedTextFromSections,
            metadata: {
              legalTermCount: splitIntoWords(extractedTextFromSections).length,
              source: "sections",
            },
          };
        }

        log(logLevels.INFO, "No legal text found on the page.");
        return {
          text: "",
          metadata: { legalTermCount: 0, source: "none" },
        };
      } catch (error) {
        log(logLevels.ERROR, "Error extracting and analyzing page text", {
          error,
        });
        return {
          text: "",
          metadata: { legalTermCount: 0, source: "error" },
        };
      }
    }

    /**
     * Simple text extraction from a DOM element
     * @param {Element} element - DOM element to extract text from
     * @return {string} Extracted text
     */
    function extractText(element) {
      if (!element) return "";
      return element.textContent || element.innerText || "";
    }

    /**
     * Extracts text based on number of highlighted sections
     * @return {string|null} The extracted text or null if not enough highlights are found
     */
    function extractTextFromHighlights() {
      try {
        log(logLevels.DEBUG, "Starting text extraction from highlights");

        const legalElements = document.querySelectorAll(
          ".legal-term-highlight",
        );
        log(logLevels.DEBUG, "Number of legal-term-highlight elements found", {
          count: legalElements.length,
        });

        if (legalElements.length > config.highlightThreshold) {
          log(
            logLevels.INFO,
            "Highlight threshold exceeded, extracting full body text",
          );
          return document.body.innerText;
        } else {
          let fullText = "";
          legalElements.forEach((element) => {
            fullText += element.textContent + "\n\n";
          });
          const preprocessedText = preprocessText(fullText);
          log(
            logLevels.DEBUG,
            "Extracted and preprocessed text from highlights",
            {
              preprocessedText,
            },
          );
          return preprocessedText;
        }
      } catch (error) {
        log(logLevels.ERROR, "Error extracting text from highlights", {
          error,
        });
        return null;
      }
    }

    /**
     * Extracts and analyzes text from sections on the page
     * @return {Promise<string|null>} The extracted legal text or null if none is found
     */
    async function extractTextFromSections() {
      try {
        log(logLevels.DEBUG, "Starting text extraction from sections");

        const sections = document.querySelectorAll(
          'main, article, section, div[class*="terms"], div[id*="terms"]',
        );
        log(logLevels.DEBUG, "Number of sections found", {
          count: sections.length,
        });

        if (sections.length === 0) {
          log(logLevels.WARN, "No sections found for extraction");
          return null;
        }

        let legalText = "";

        sections.forEach((section) => {
          const sectionText = extractTextFromSection(section);
          log(logLevels.DEBUG, "Extracted text from section", { sectionText });

          if (isLegalText(sectionText)) {
            legalText += sectionText + "\n\n";
            log(logLevels.DEBUG, "Section text identified as legal text", {
              sectionText,
            });
          }
        });

        const trimmedText = preprocessText(legalText);
        log(logLevels.DEBUG, "Trimmed and preprocessed legal text", {
          trimmedText,
        });

        return trimmedText || null;
      } catch (error) {
        log(logLevels.ERROR, "Error extracting text from sections", { error });
        return null;
      }
    }

    /**
     * Extracts text from a section, filtering out non-textual elements
     * @param {Element} section The section element to extract text from
     * @return {string|null} The extracted text from the section or null if an error occurs
     */
    function extractTextFromSection(section) {
      try {
        log(logLevels.DEBUG, "Starting text extraction from section", {
          section,
        });

        const filteredContent = Array.from(section.children).filter(
          (child) =>
            ![
              "NAV",
              "HEADER",
              "FOOTER",
              "SCRIPT",
              "STYLE",
              "IFRAME",
              "OBJECT",
              "EMBED",
            ].includes(child.tagName),
        );
        const sectionText = filteredContent
          .map((el) => el.textContent)
          .join(" ")
          .trim();
        const preprocessedText = preprocessText(sectionText);

        log(logLevels.DEBUG, "Extracted and preprocessed text from section", {
          preprocessedText,
        });
        return preprocessedText || null;
      } catch (error) {
        log(logLevels.ERROR, "Error extracting text from section", { error });
        return null;
      }
    }

    /**
     * Checks if a given text contains enough legal terms to be considered legal text
     * @param {string} text The text to analyze
     * @return {boolean} True if the text contains enough legal terms, false otherwise
     */
    function isLegalText(text) {
      try {
        log(logLevels.DEBUG, "Starting legal text analysis", { text });

        const words = text.toLowerCase().split(/\s+/);
        const legalTermCount = words.filter((word) =>
          legalTerms.includes(word),
        ).length;

        const threshold = config.sectionThreshold;
        const isLegal = legalTermCount >= threshold;

        log(logLevels.DEBUG, "Legal text analysis result", {
          legalTermCount,
          threshold,
          isLegal,
        });
        return isLegal;
      } catch (error) {
        log(logLevels.ERROR, "Error analyzing legal text", { error });
        return false;
      }
    }

    /**
     * Extracts text from plain text input
     * @param {string} input Plain text content
     * @returns {string} Cleaned text
     */
    function extractFromText(input) {
      if (typeof input !== "string") {
        return "";
      }
      return preprocessText(input);
    }

    return {
      extract,
      extractFromHTML,
      extractFromText,
      splitIntoSentences,
      splitIntoWords,
      preprocessText,
      extractAndAnalyzePageText,
      extractText,
      // Cache management
      clearCache: () => textCache.cleanup(),
      getCacheStats: () => textCache.getStats(),
    };
  }

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createTextExtractor };
  } else {
    global.TextExtractor = { create: createTextExtractor };
  }
})(typeof window !== "undefined" ? window : global);
