/**
 * @file enhanced-summarizer.test.js
 * @description Tests for enhanced ToS summarization functionality
 * @version 1.0.0
 */

// Mock dependencies
const mockCompromise = (text) => ({
  sentences: () => ({
    json: () => text.split('. ').map(s => ({ text: s.trim() + '.' })),
    first: () => ({ text: text.split('. ')[0] + '.' }),
    last: () => ({ text: text.split('. ').slice(-1)[0] + '.' })
  })
});

const mockCheerio = {
  load: (html) => {
    const $ = (selector) => {
      const mockElement = {
        text: () => {
          if (selector === 'body') {
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
          if (selector.includes('script, style')) {
            return { remove: () => $ };
          }
          return 'Sample section content';
        },
        each: (callback) => {
          // Mock headings based on HTML content
          if (selector.includes('h1, h2, h3')) {
            const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
            headingMatches.forEach((match, i) => {
              const text = match.replace(/<[^>]*>/g, '').trim();
              const mockEl = {
                text: () => text,
                next: () => ({ length: 1, text: () => 'Section content here', next: () => ({ length: 0 }) }),
                nextUntil: () => ({ text: () => 'Section content from nextUntil' })
              };
              callback(i, mockEl);
            });
          }
        },
        nextUntil: () => ({ text: () => 'This is sample content for the section.' }),
        next: () => ({ length: 0 }),
        remove: () => $,
        length: html.includes('<h') ? 1 : 0
      };
      
      return mockElement;
    };
    
    $.prototype.length = html.includes('<h') ? 1 : 0;
    return $;
  }
};

const mockLog = () => {};
const mockLogLevels = { INFO: 'info', DEBUG: 'debug', ERROR: 'error' };

// Import the module
const { createEnhancedSummarizer } = require('../../src/analysis/enhancedSummarizer');

describe('Enhanced Summarizer', () => {
  let enhancedSummarizer;
  
  beforeEach(() => {
    enhancedSummarizer = createEnhancedSummarizer({
      compromise: mockCompromise,
      cheerio: mockCheerio,
      log: mockLog,
      logLevels: mockLogLevels
    });
  });

  describe('Basic Functionality', () => {
    test('should create summarizer instance', () => {
      expect(enhancedSummarizer).toBeDefined();
      expect(typeof enhancedSummarizer.summarizeTos).toBe('function');
    });

    test('should return enhanced summary structure', async () => {
      const sampleHtml = `
        <html>
          <body>
            <h2>Privacy Policy</h2>
            <p>We collect your personal information including name, email, and browsing data. This information may be shared with third parties for marketing purposes.</p>
            <h2>Payment Terms</h2>
            <p>All fees are non-refundable. We may change pricing without notice. You agree to indemnify us against any claims.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(sampleHtml);

      expect(result).toMatchObject({
        overall: expect.any(String),
        overallRisk: expect.any(String),
        keyFindings: expect.any(Array),
        sections: expect.any(Array),
        metadata: expect.objectContaining({
          enhancedSummary: true,
          riskAssessment: true
        })
      });
    });
  });

  describe('Plain Language Conversion', () => {
    test('should convert legal jargon to plain language', async () => {
      const legalText = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>You shall indemnify the company. We may terminate your account forthwith. All intellectual property rights are hereby waived.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(legalText);

      // Check that plain language conversions occurred
      expect(result.overall.toLowerCase()).toMatch(/protect from legal claims|immediately|give up/);
    });

    test('should maintain user-friendly language in summaries', async () => {
      const result = await enhancedSummarizer.summarizeTos('<html><body><h2>Test</h2><p>Sample content</p></body></html>');

      // Summary should be user-friendly
      expect(result.overall).toMatch(/here's what this means|here's what this/i);
    });
  });

  describe('Risk Assessment', () => {
    test('should identify high-risk content', async () => {
      const highRiskHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>You waive all rights to legal action. We may sell your data to third parties. All fees are non-refundable. We can terminate without notice.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(highRiskHtml);

      expect(['high', 'medium-high']).toContain(result.overallRisk);
      expect(result.sections[0].riskLevel).toBe('high');
    });

    test('should identify medium-risk content', async () => {
      const mediumRiskHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>We use cookies to track your usage. Fees may change periodically. We share data with our affiliates.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(mediumRiskHtml);

      expect(['medium', 'medium-high']).toContain(result.overallRisk);
      expect(result.sections[0].riskLevel).toBe('medium');
    });

    test('should identify low-risk content', async () => {
      const lowRiskHtml = `
        <html>
          <body>
            <h2>Support</h2>
            <p>Contact our customer service for help. We protect your privacy and keep your data secure. You can opt out at any time.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(lowRiskHtml);

      expect(result.sections[0].riskLevel).toBe('low');
    });
  });

  describe('Section Analysis', () => {
    test('should categorize sections by type', async () => {
      const multiSectionHtml = `
        <html>
          <body>
            <h2>Privacy Policy</h2>
            <p>We collect your personal data and information.</p>
            <h2>Payment Terms</h2>
            <p>Monthly subscription fees apply.</p>
            <h2>User Rights</h2>
            <p>You have a license to use our content.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(multiSectionHtml);

      expect(result.sections.length).toBeGreaterThan(0);
      
      // Check section types are assigned
      const sectionTypes = result.sections.map(s => s.type);
      expect(sectionTypes).toContain('privacy');
      expect(sectionTypes).toContain('payments');
      expect(sectionTypes).toContain('rights');
    });

    test('should generate user-friendly headings', async () => {
      const result = await enhancedSummarizer.summarizeTos(`
        <html>
          <body>
            <h2>Privacy Policy</h2>
            <p>Privacy content here.</p>
          </body>
        </html>
      `);

      const section = result.sections[0];
      expect(section.userFriendlyHeading).toBe('Your Privacy & Data');
    });

    test('should extract key points from sections', async () => {
      const result = await enhancedSummarizer.summarizeTos(`
        <html>
          <body>
            <h2>Terms</h2>
            <p>You agree to our terms. We may collect your data. You cannot use this for commercial purposes.</p>
          </body>
        </html>
      `);

      const section = result.sections[0];
      expect(section.keyPoints).toBeDefined();
      expect(Array.isArray(section.keyPoints)).toBe(true);
    });
  });

  describe('Key Findings', () => {
    test('should identify concerning patterns', async () => {
      const concerningHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>No refunds available. We sell your data to third parties. We can terminate without notice.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(concerningHtml);

      expect(result.keyFindings).toBeDefined();
      expect(result.keyFindings.length).toBeGreaterThan(0);
      
      // Should identify concerning patterns
      const findings = result.keyFindings.join(' ').toLowerCase();
      expect(findings).toMatch(/refund|data|terminat/);
    });

    test('should identify positive patterns', async () => {
      const positiveHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>You can opt out of data collection. Contact our customer support team. You can delete your data at any time.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(positiveHtml);

      expect(result.keyFindings).toBeDefined();
      expect(result.keyFindings.length).toBeGreaterThan(0);
      
      // Should identify positive patterns
      const findings = result.keyFindings.join(' ').toLowerCase();
      expect(findings).toMatch(/opt.*out|delete.*data|contact.*support/);
    });
  });

  describe('Alert Generation', () => {
    test('should generate alerts for high-risk documents', async () => {
      const highRiskHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>You waive all rights.</p>
            <h2>More Terms</h2>
            <p>You indemnify us.</p>
            <h2>Even More Terms</h2>
            <p>No refunds ever.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(highRiskHtml);

      expect(result.plainLanguageAlert).toBeDefined();
      expect(result.plainLanguageAlert).toMatch(/several sections|significantly limit/i);
    });

    test('should generate moderate alerts for medium-risk documents', async () => {
      const mediumRiskHtml = `
        <html>
          <body>
            <h2>Terms</h2>
            <p>You waive some rights to legal action.</p>
          </body>
        </html>
      `;

      const result = await enhancedSummarizer.summarizeTos(mediumRiskHtml);

      if (result.plainLanguageAlert) {
        expect(result.plainLanguageAlert).toMatch(/some terms|pay special attention/i);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle empty HTML gracefully', async () => {
      const result = await enhancedSummarizer.summarizeTos('');

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.sections).toBeDefined();
    });

    test('should handle malformed HTML', async () => {
      const result = await enhancedSummarizer.summarizeTos('<html><body><h2>Test</h2><p>Content');

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
    });

    test('should handle HTML without headings', async () => {
      const result = await enhancedSummarizer.summarizeTos(`
        <html>
          <body>
            <p>This is just a paragraph without any headings. It contains some terms and conditions.</p>
          </body>
        </html>
      `);

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should complete analysis within reasonable time', async () => {
      const largeHtml = `
        <html>
          <body>
            ${'<h2>Section</h2><p>'.repeat(10)}
            ${'This is a long paragraph with lots of legal terms including indemnify, liability, and intellectual property. '.repeat(50)}
            ${'</p>'.repeat(10)}
          </body>
        </html>
      `;

      const startTime = Date.now();
      const result = await enhancedSummarizer.summarizeTos(largeHtml);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result).toBeDefined();
    });
  });
});

describe('Enhanced Summarizer Integration', () => {
  test('should integrate with existing content structure', () => {
    // Test that the enhanced summarizer produces data compatible with existing UI expectations
    const enhancedSummarizer = createEnhancedSummarizer({
      compromise: mockCompromise,
      cheerio: mockCheerio,
      log: mockLog,
      logLevels: mockLogLevels
    });

    expect(enhancedSummarizer.summarizeTos).toBeDefined();
  });

  test('should maintain backward compatibility with legacy summary format', async () => {
    const enhancedSummarizer = createEnhancedSummarizer({
      compromise: mockCompromise,
      cheerio: mockCheerio,
      log: mockLog,
      logLevels: mockLogLevels
    });

    const result = await enhancedSummarizer.summarizeTos('<html><body><h2>Test</h2><p>Content</p></body></html>');

    // Should still have the basic fields expected by existing code
    expect(result.overall).toBeDefined();
    expect(result.sections).toBeDefined();
    expect(Array.isArray(result.sections)).toBe(true);
  });
});