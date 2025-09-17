/**
 * @file enhancedSummarizer.js
 * @description Enhanced ToS summarization with plain language conversion
 * @version 2.0.0
 * @date 2025-09-17
 */

(function (global) {
  "use strict";

  // Legal jargon to plain language mappings
  const PLAIN_LANGUAGE_MAPPINGS = {
    // Common legal terms
    aforementioned: "mentioned above",
    heretofore: "before now",
    thereafter: "after that",
    "pursuant to": "according to",
    notwithstanding: "despite",
    hereunder: "under this agreement",
    whereas: "because",
    therein: "in that",
    thereof: "of that",
    whereby: "by which",
    herein: "in this document",
    forthwith: "immediately",
    "provided that": "as long as",
    "in consideration of": "in exchange for",
    shall: "will",
    "may not": "cannot",
    "shall not": "will not",

    // Rights and obligations
    indemnify: "protect from legal claims",
    "hold harmless": "protect from responsibility",
    liability: "responsibility for damages",
    damages: "money you might owe",
    breach: "breaking the rules",
    violation: "breaking the rules",
    terminate: "end your account",
    suspend: "temporarily stop your account",
    revoke: "take away",
    waive: "give up your right to",
    forfeit: "lose",
    relinquish: "give up",

    // Data and privacy
    "personally identifiable information": "information that identifies you",
    "aggregate data": "combined data from many users",
    "third parties": "other companies",
    affiliates: "related companies",
    subsidiaries: "companies we own",
    "data processing": "using your information",
    "data retention": "keeping your information",
    cookies: "small files stored on your device",

    // Service terms
    "intellectual property": "ownership rights",
    proprietary: "owned by the company",
    license: "permission to use",
    sublicense: "permission to give others permission",
    "derivative works": "new things based on existing content",
    modifications: "changes",
    enhancements: "improvements",
    "user-generated content": "things you create or post",

    // Financial terms
    fees: "money you pay",
    charges: "costs",
    refund: "money back",
    "billing cycle": "payment period",
    subscription: "ongoing paid service",
    "premium features": "paid extras",
    "free trial": "test period at no cost",

    // Legal process
    arbitration: "private dispute resolution",
    mediation: "help resolving disagreements",
    jurisdiction: "which courts handle disputes",
    "governing law": "which laws apply",
    "class action": "group lawsuit",
    "injunctive relief": "court order to stop something",
  };

  // Section type patterns for better categorization
  const SECTION_PATTERNS = {
    privacy: /privacy|data|personal\s+information|cookies|tracking/i,
    payments: /payment|billing|fees|charges|refund|subscription|money/i,
    rights: /rights|license|intellectual\s+property|ownership|content/i,
    liability: /liability|damages|indemnif|harm|responsible|lawsuit|legal/i,
    termination: /terminat|suspend|cancel|end|close|account/i,
    changes: /changes|modif|update|amend|revise/i,
    contact: /contact|support|help|email|phone|address/i,
    general: /general|miscellaneous|other|additional/i,
  };

  function createEnhancedSummarizer({ compromise, cheerio, log, logLevels }) {
    /**
     * Enhanced summarization with plain language conversion
     * @param {string} html The HTML content to summarize
     * @return {object} Enhanced summary object
     */
    function summarizeTos(html) {
      try {
        log(logLevels.INFO, "Starting enhanced ToS summarization...");

        const $ = cheerio.load(html);

        // Extract text content for analysis
        const fullText = extractCleanText($);

        // Identify sections with improved detection
        const sections = identifyEnhancedSections($, fullText);
        log(logLevels.DEBUG, "Enhanced sections identified:", {
          count: sections.length,
        });

        // Process each section with plain language conversion
        const sectionSummaries = sections.map((section) => {
          try {
            const plainLanguageSummary = createPlainLanguageSummary(section);
            const keyPoints = extractKeyPoints(section);
            const riskLevel = assessSectionRisk(section);

            return {
              heading: section.heading,
              type: section.type,
              summary: plainLanguageSummary,
              keyPoints: keyPoints,
              riskLevel: riskLevel,
              originalText: section.content,
              userFriendlyHeading: createUserFriendlyHeading(
                section.heading,
                section.type,
              ),
            };
          } catch (error) {
            log(logLevels.ERROR, "Error processing section:", {
              heading: section.heading,
              error: error.message,
            });
            return {
              heading: section.heading,
              summary: "We couldn't analyze this section properly.",
              error: error.message,
              riskLevel: "unknown",
            };
          }
        });

        // Create comprehensive overall summary
        const overallSummary = createOverallPlainLanguageSummary(
          sectionSummaries,
          fullText,
        );
        const documentRisk = assessOverallRisk(sectionSummaries);

        log(logLevels.INFO, "Enhanced summarization complete");

        return {
          overall: overallSummary.text,
          overallRisk: documentRisk,
          keyFindings: overallSummary.keyFindings,
          plainLanguageAlert: overallSummary.alert,
          sections: sectionSummaries,
          metadata: {
            sectionCount: sections.length,
            timestamp: new Date().toISOString(),
            enhancedSummary: true,
            riskAssessment: true,
          },
        };
      } catch (error) {
        log(logLevels.ERROR, "Error in enhanced summarization:", error);
        return {
          overall:
            "We had trouble analyzing this document. It may contain complex legal terms that need review.",
          sections: [],
          error: error.message,
          overallRisk: "unknown",
          keyFindings: [],
          plainLanguageAlert: null,
          metadata: {
            sectionCount: 0,
            timestamp: new Date().toISOString(),
            enhancedSummary: true,
            riskAssessment: true,
            error: true
          },
        };
      }
    }

    /**
     * Extract clean text from HTML with better content detection
     */
    function extractCleanText($) {
      // Remove script, style, and other non-content elements
      $(
        "script, style, nav, header, footer, aside, .advertisement, .ad, .sidebar",
      ).remove();

      // Focus on main content areas
      const contentSelectors = [
        "main",
        '[role="main"]',
        ".main-content",
        ".content",
        ".terms",
        ".privacy-policy",
        ".legal-content",
        "article",
        ".document-content",
      ];

      let text = "";
      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > text.length) {
          text = content;
        }
      }

      // Fallback to body if no main content found
      if (!text) {
        text = $("body").text();
      }

      return text.trim();
    }

    /**
     * Enhanced section identification with better content grouping
     */
    function identifyEnhancedSections($, fullText) {
      const sections = [];
      const headings = $("h1, h2, h3, h4, h5, h6");

      if (headings.length === 0) {
        // If no headings, try to break by paragraphs or other markers
        return createSectionsFromText(fullText);
      }

      headings.each((i, el) => {
        const $el = $(el);
        const heading = $el.text().trim();

        if (!heading) return;

        // Get content until next heading
        let content = "";
        let $next = $el.next();

        while ($next.length && !$next.is("h1, h2, h3, h4, h5, h6")) {
          content += $next.text() + " ";
          $next = $next.next();
        }

        // If no content found, try siblings
        if (!content.trim()) {
          content = $el.nextUntil("h1, h2, h3, h4, h5, h6").text();
        }

        if (content.trim()) {
          sections.push({
            heading: heading,
            content: content.trim(),
            type: categorizeSection(heading, content),
          });
        }
      });

      return sections.length > 0 ? sections : createSectionsFromText(fullText);
    }

    /**
     * Create sections from text when no clear headings exist
     */
    function createSectionsFromText(text) {
      const paragraphs = text.split(/\n\s*\n|\.\s+(?=[A-Z])/);
      const sections = [];

      let currentSection = "";
      let sectionCount = 1;

      for (const paragraph of paragraphs) {
        if (paragraph.trim().length < 50) continue;

        currentSection += paragraph + " ";

        // Create a section every few paragraphs or when we detect a topic change
        if (
          currentSection.length > 800 ||
          detectTopicChange(currentSection, paragraph)
        ) {
          sections.push({
            heading: `Section ${sectionCount}`,
            content: currentSection.trim(),
            type: categorizeSection("", currentSection),
          });
          currentSection = "";
          sectionCount++;
        }
      }

      // Add remaining content
      if (currentSection.trim()) {
        sections.push({
          heading: `Section ${sectionCount}`,
          content: currentSection.trim(),
          type: categorizeSection("", currentSection),
        });
      }

      return sections;
    }

    /**
     * Categorize section by content type
     */
    function categorizeSection(heading, content) {
      const text = (heading + " " + content).toLowerCase();

      for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(text)) {
          return type;
        }
      }

      return "general";
    }

    /**
     * Detect topic changes in text
     */
    function detectTopicChange(currentSection, newParagraph) {
      // Simple heuristic: if new paragraph starts with certain phrases
      const topicChangeIndicators = [
        /^(in addition|furthermore|moreover|however|nevertheless|on the other hand)/i,
        /^(we may|you agree|you understand|by using|when you)/i,
        /^(privacy|payment|refund|termination|liability)/i,
      ];

      return topicChangeIndicators.some((pattern) =>
        pattern.test(newParagraph.trim()),
      );
    }

    /**
     * Create plain language summary for a section
     */
    function createPlainLanguageSummary(section) {
      let text = section.content;

      // Apply plain language mappings
      for (const [legal, plain] of Object.entries(PLAIN_LANGUAGE_MAPPINGS)) {
        const regex = new RegExp(`\\b${legal}\\b`, "gi");
        text = text.replace(regex, plain);
      }

      // Use compromise.js for better sentence extraction
      const doc = compromise(text);
      const sentences = doc.sentences().json();

      // Extract the most important sentences
      const importantSentences = extractImportantSentences(
        sentences,
        section.type,
      );

      // Create user-friendly summary
      return createUserFriendlySummary(importantSentences, section.type);
    }

    /**
     * Extract important sentences based on section type
     */
    function extractImportantSentences(sentences, sectionType) {
      if (!sentences || sentences.length === 0) return [];

      // Keywords that indicate importance for each section type
      const importanceKeywords = {
        privacy: [
          "collect",
          "share",
          "sell",
          "third party",
          "data",
          "information",
          "tracking",
        ],
        payments: [
          "fee",
          "charge",
          "payment",
          "refund",
          "billing",
          "subscription",
          "cost",
        ],
        rights: [
          "license",
          "own",
          "copyright",
          "trademark",
          "property",
          "use",
          "permission",
        ],
        liability: [
          "liable",
          "responsible",
          "damages",
          "lawsuit",
          "indemnify",
          "harm",
        ],
        termination: [
          "terminate",
          "suspend",
          "cancel",
          "end",
          "close",
          "disable",
        ],
        changes: ["change", "modify", "update", "amend", "revise", "notice"],
        general: [
          "must",
          "required",
          "prohibited",
          "allowed",
          "agree",
          "accept",
        ],
      };

      const keywords =
        importanceKeywords[sectionType] || importanceKeywords.general;

      // Score sentences based on importance
      const scoredSentences = sentences.map((sentence) => {
        const text = sentence.text.toLowerCase();
        let score = 0;

        // Higher score for sentences with important keywords
        keywords.forEach((keyword) => {
          if (text.includes(keyword)) score += 2;
        });

        // Higher score for shorter, clearer sentences
        if (sentence.text.length < 150) score += 1;

        // Higher score for sentences with specific actions
        if (
          /\b(will|must|cannot|may not|required|prohibited)\b/i.test(
            sentence.text,
          )
        ) {
          score += 2;
        }

        return { ...sentence, score };
      });

      // Sort by score and take top sentences
      return scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(3, Math.ceil(sentences.length / 3)))
        .map((s) => s.text);
    }

    /**
     * Create user-friendly summary from important sentences
     */
    function createUserFriendlySummary(sentences, sectionType) {
      if (!sentences || sentences.length === 0) {
        return "This section doesn't contain clear information we can summarize.";
      }

      const typeIntros = {
        privacy: "Here's what this means for your personal information:",
        payments: "Here's what this means for your money:",
        rights: "Here's what this means for your rights:",
        liability: "Here's what this means for your responsibility:",
        termination: "Here's what this means for your account:",
        changes: "Here's what this means for future updates:",
        general: "Here's what this section means:",
      };

      const intro = typeIntros[sectionType] || typeIntros.general;

      // Join sentences with bullet points for clarity
      const bulletPoints = sentences
        .map((sentence) => {
          // Clean up the sentence
          let clean = sentence.replace(/\s+/g, " ").replace(/^\W+/, "").trim();

          // Ensure it starts with capital letter
          clean = clean.charAt(0).toUpperCase() + clean.slice(1);

          // Ensure it ends with a period
          if (!/[.!?]$/.test(clean)) {
            clean += ".";
          }

          return `• ${clean}`;
        })
        .join("\n");

      return `${intro}\n\n${bulletPoints}`;
    }

    /**
     * Extract key points for quick scanning
     */
    function extractKeyPoints(section) {
      const text = section.content.toLowerCase();
      const points = [];

      // Look for specific patterns that indicate key points
      const patterns = [
        {
          pattern:
            /you (?:agree|acknowledge|understand|consent) (?:to|that) ([^.]+)/gi,
          prefix: "You agree:",
        },
        { pattern: /we (?:may|will|can) ([^.]+)/gi, prefix: "We may:" },
        {
          pattern: /you (?:may not|cannot|must not) ([^.]+)/gi,
          prefix: "You cannot:",
        },
        { pattern: /fees? (?:are|will be|may be) ([^.]+)/gi, prefix: "Fees:" },
        {
          pattern: /your (?:data|information) (?:is|will be|may be) ([^.]+)/gi,
          prefix: "Your data:",
        },
      ];

      patterns.forEach(({ pattern, prefix }) => {
        const matches = [...section.content.matchAll(pattern)];
        matches.forEach((match) => {
          if (match[1] && match[1].length < 100) {
            points.push(`${prefix} ${match[1].trim()}`);
          }
        });
      });

      return points.slice(0, 3); // Limit to top 3 points
    }

    /**
     * Assess risk level for a section
     */
    function assessSectionRisk(section) {
      const text = section.content.toLowerCase();
      const content = section.heading.toLowerCase() + " " + text;

      // High risk indicators
      const highRiskPatterns = [
        /waive.*rights?/,
        /indemnify/,
        /hold.*harmless/,
        /unlimited.*liability/,
        /no.*refund/,
        /sell.*data/,
        /share.*third.*part/,
        /terminate.*without.*notice/,
        /change.*terms.*without.*notice/,
      ];

      // Medium risk indicators
      const mediumRiskPatterns = [
        /fees?.*may.*change/,
        /suspend.*account/,
        /limited.*liability/,
        /cookies/,
        /track/,
        /third.*part/,
        /affiliates/,
      ];

      // Low risk indicators
      const lowRiskPatterns = [
        /contact.*support/,
        /help/,
        /customer.*service/,
        /privacy.*protect/,
        /secure/,
        /opt.*out/,
      ];

      if (highRiskPatterns.some((pattern) => pattern.test(content))) {
        return "high";
      } else if (mediumRiskPatterns.some((pattern) => pattern.test(content))) {
        return "medium";
      } else if (lowRiskPatterns.some((pattern) => pattern.test(content))) {
        return "low";
      }

      return "medium"; // Default to medium risk
    }

    /**
     * Create user-friendly heading
     */
    function createUserFriendlyHeading(originalHeading, sectionType) {
      const friendlyHeadings = {
        privacy: "Your Privacy & Data",
        payments: "Costs & Payments",
        rights: "Your Rights & Permissions",
        liability: "Your Responsibilities",
        termination: "Account Cancellation",
        changes: "Future Changes",
        contact: "Getting Help",
        general: "Important Terms",
      };

      return friendlyHeadings[sectionType] || originalHeading;
    }

    /**
     * Create comprehensive overall summary
     */
    function createOverallPlainLanguageSummary(sectionSummaries, fullText) {
      const highRiskSections = sectionSummaries.filter(
        (s) => s.riskLevel === "high",
      );
      const mediumRiskSections = sectionSummaries.filter(
        (s) => s.riskLevel === "medium",
      );

      let summary = "Here's what this agreement means in plain language:\n\n";

      // Add overview
      summary += "📋 **Quick Overview:**\n";
      summary += `This document has ${sectionSummaries.length} main sections. `;

      if (highRiskSections.length > 0) {
        summary += `⚠️ ${highRiskSections.length} section(s) need your attention because they affect your rights or money. `;
      }

      if (mediumRiskSections.length > 0) {
        summary += `⚡ ${mediumRiskSections.length} section(s) have moderate impact on how you use the service.`;
      }

      summary += "\n\n";

      // Key findings
      const keyFindings = [];

      // Analyze for common concerning patterns
      const concerningFindings = findConcerningPatterns(sectionSummaries);
      const positiveFindings = findPositivePatterns(sectionSummaries);

      keyFindings.push(...concerningFindings, ...positiveFindings);

      // Create alert if needed
      let alert = null;
      if (highRiskSections.length > 2) {
        alert =
          "⚠️ This agreement has several sections that significantly limit your rights or increase your responsibilities. Consider reviewing carefully before agreeing.";
      } else if (highRiskSections.length > 0) {
        alert =
          "⚠️ This agreement has some terms that affect your rights. Pay special attention to the highlighted sections.";
      }

      return {
        text: summary,
        keyFindings: keyFindings,
        alert: alert,
      };
    }

    /**
     * Find concerning patterns across sections
     */
    function findConcerningPatterns(sections) {
      const findings = [];

      const patterns = [
        {
          check: (sections) =>
            sections.some((s) =>
              /no.*refund|non.*refundable/i.test(s.originalText),
            ),
          finding: "💰 Refunds may be limited or not available",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /sell.*data|share.*third.*part/i.test(s.originalText),
            ),
          finding: "🔒 Your personal data may be shared with other companies",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /terminate.*without.*notice/i.test(s.originalText),
            ),
          finding: "⚠️ Your account can be terminated without warning",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /change.*terms.*without.*notice/i.test(s.originalText),
            ),
          finding: "📝 Terms can be changed without notifying you",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /waive.*rights?|indemnify/i.test(s.originalText),
            ),
          finding: "⚖️ You may be giving up important legal rights",
        },
      ];

      patterns.forEach(({ check, finding }) => {
        if (check(sections)) {
          findings.push(finding);
        }
      });

      return findings;
    }

    /**
     * Find positive patterns across sections
     */
    function findPositivePatterns(sections) {
      const findings = [];

      const patterns = [
        {
          check: (sections) =>
            sections.some((s) => /opt.*out|unsubscribe/i.test(s.originalText)),
          finding: "✅ You can opt out of data collection or communications",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /delete.*data|remove.*information/i.test(s.originalText),
            ),
          finding: "✅ You can request deletion of your personal data",
        },
        {
          check: (sections) =>
            sections.some((s) => /30.*day|trial.*period/i.test(s.originalText)),
          finding: "✅ There appears to be a trial period or grace period",
        },
        {
          check: (sections) =>
            sections.some((s) =>
              /contact.*support|customer.*service/i.test(s.originalText),
            ),
          finding: "✅ Customer support contact information is provided",
        },
      ];

      patterns.forEach(({ check, finding }) => {
        if (check(sections)) {
          findings.push(finding);
        }
      });

      return findings;
    }

    /**
     * Assess overall document risk
     */
    function assessOverallRisk(sections) {
      const riskCounts = {
        high: sections.filter((s) => s.riskLevel === "high").length,
        medium: sections.filter((s) => s.riskLevel === "medium").length,
        low: sections.filter((s) => s.riskLevel === "low").length,
      };

      const totalSections = sections.length;
      const highRiskRatio = riskCounts.high / totalSections;

      if (highRiskRatio > 0.3) return "high";
      if (highRiskRatio > 0.1 || riskCounts.high > 2) return "medium-high";
      if (riskCounts.medium > riskCounts.low) return "medium";
      return "low-medium";
    }

    // Return public interface
    return {
      summarizeTos,
    };
  }

  // Export for both Chrome extension and test environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createEnhancedSummarizer };
  } else if (typeof window !== "undefined") {
    global.EnhancedTosSummarizer = {
      create: createEnhancedSummarizer,
    };
  }
})(typeof window !== "undefined" ? window : global);
