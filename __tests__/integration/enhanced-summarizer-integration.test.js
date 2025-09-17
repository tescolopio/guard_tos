/**
 * Simple integration test for enhanced summarizer
 */

// Mock the basic requirements
const cheerio = require('cheerio');

// Create a simple test
function testEnhancedSummarizer() {
  try {
    const { createEnhancedSummarizer } = require('../../src/analysis/enhancedSummarizer');
    
    const mockCompromise = (text) => ({
      sentences: () => ({
        json: () => text.split('. ').map(s => ({ text: s.trim() })),
        first: () => ({ text: text.split('. ')[0] }),
        last: () => ({ text: text.split('. ').slice(-1)[0] })
      })
    });

    const mockLog = () => {};
    const mockLogLevels = { INFO: 'info', DEBUG: 'debug', ERROR: 'error' };

    const enhancedSummarizer = createEnhancedSummarizer({
      compromise: mockCompromise,
      cheerio: cheerio,
      log: mockLog,
      logLevels: mockLogLevels
    });

    const testHtml = `
      <html>
        <body>
          <h2>Privacy Policy</h2>
          <p>We collect your personal information including name, email, and browsing data. 
             This information may be shared with third parties for marketing purposes.</p>
          <h2>Payment Terms</h2>
          <p>All fees are non-refundable. We may change pricing without notice. 
             You agree to indemnify us against any claims.</p>
        </body>
      </html>
    `;

    console.log('Testing Enhanced Summarizer...');
    
    const result = enhancedSummarizer.summarizeTos(testHtml);
    
    console.log('Enhanced Summarizer Test Results:');
    console.log('- Overall summary:', result.overall ? 'Generated' : 'Missing');
    console.log('- Sections found:', result.sections ? result.sections.length : 0);
    console.log('- Risk level:', result.overallRisk || 'Not assessed');
    console.log('- Key findings:', result.keyFindings ? result.keyFindings.length : 0);
    console.log('- Enhanced features:', result.metadata ? result.metadata.enhancedSummary : false);

    if (result.sections && result.sections.length > 0) {
      console.log('- First section type:', result.sections[0].type);
      console.log('- First section risk:', result.sections[0].riskLevel);
      console.log('- User-friendly heading:', result.sections[0].userFriendlyHeading);
    }

    return true;
  } catch (error) {
    console.error('Enhanced Summarizer Test Failed:', error.message);
    return false;
  }
}

module.exports = { testEnhancedSummarizer };

// Run test if called directly
if (require.main === module) {
  testEnhancedSummarizer();
}