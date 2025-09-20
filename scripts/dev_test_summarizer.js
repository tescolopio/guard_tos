/* quick harness to run enhanced summarizer with inline mocks similar to unit tests */
const {
  createEnhancedSummarizer,
} = require("../src/analysis/enhancedSummarizer");

const mockCompromise = (text = "") => ({
  sentences: () => ({
    json: () =>
      text ? text.split(". ").map((s) => ({ text: s.trim() + "." })) : [],
    first: () => ({ text: (text.split(". ")[0] || "") + "." }),
    last: () => ({ text: (text.split(". ").slice(-1)[0] || "") + "." }),
  }),
});

const mockCheerio = {
  load: (html) => {
    const $ = (selector) => {
      const mockElement = {
        text: () => {
          if (selector === "body") {
            return html
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          }
          if (selector.includes("script, style")) {
            return { remove: () => $ };
          }
          return "Sample section content";
        },
        each: (callback) => {
          // Mock headings based on HTML content
          if (selector.includes("h1, h2, h3")) {
            const headingMatches =
              html.match(/<h[1-6][^>]*>(.*?)<\/[hH][1-6]>/g) || [];
            headingMatches.forEach((match, i) => {
              const text = match.replace(/<[^>]*>/g, "").trim();
              const mockEl = {
                text: () => text,
                next: () => ({
                  length: 1,
                  text: () => "Section content here",
                  next: () => ({ length: 0 }),
                }),
                nextUntil: () => ({
                  text: () => "Section content from nextUntil",
                }),
              };
              callback(i, mockEl);
            });
          }
        },
        nextUntil: () => ({
          text: () => "This is sample content for the section.",
        }),
        next: () => ({ length: 0 }),
        remove: () => $,
        length: html.includes("<h") ? 1 : 0,
      };
      return mockElement;
    };
    $.prototype.length = html.includes("<h") ? 1 : 0;
    return $;
  },
};

const mockLog = (...args) => {
  // console.log('[LOG]', ...args);
};
const mockLogLevels = { INFO: "info", DEBUG: "debug", ERROR: "error" };

async function main() {
  const enhancedSummarizer = createEnhancedSummarizer({
    compromise: mockCompromise,
    cheerio: mockCheerio,
    log: mockLog,
    logLevels: mockLogLevels,
  });

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

  const res = await enhancedSummarizer.summarizeTos(sampleHtml);
  console.log("sections len:", res.sections && res.sections.length);
  console.log("overallRisk:", res.overallRisk);
  console.log("overall:", res.overall);
  if (res && res.error) {
    console.log("error field:", res.error);
  }
}

main().catch((e) => {
  console.error("Error running summarizer:", (e && e.stack) || e);
});
