/**
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

// Minimal HTML skeleton mirroring sidepanel.html key IDs
const html = `
  <div id="sidepanel-content">
    <a id="terms-url"></a>
    <h3 id="terms-title"></h3>
    <span id="overall-grade"></span>
    <span id="readability-grade"></span>
    <span id="user-rights-index"></span>
    <div id="overallPopup"><div class="popup-content"></div></div>
    <div id="readabilityPopup"><div class="popup-content"></div></div>
    <div id="rightsPopup"><div class="popup-content"></div></div>
    <div class="content-organization"></div>
    <button id="document-level-btn"></button>
    <button id="by-section-btn"></button>
    <div id="overall-summary"></div>
    <div id="section-summaries"></div>
    <ul id="key-excerpts-list"></ul>
    <div id="uncommon-terms-list"></div>
    <ul id="dictionary-terms-list"></ul>
    <div id="status-message"></div>
    <div class="loading-indicator"></div>
    <div id="diagnostics"></div>
    <div id="dict-metric-hits"></div>
    <div id="dict-metric-misses"></div>
    <div id="dict-metric-size"></div>
    <div id="dict-metric-max"></div>
    <div id="dict-metric-ttl"></div>
    <div id="dict-metric-ts"></div>
    <div id="document-risk" style="display:none"></div>
    <span id="risk-badge"></span>
    <div id="key-findings-section" style="display:none"></div>
    <div id="key-findings-list"></div>
    <section id="risk-alert" style="display:none"><div class="risk-alert"><div class="risk-message" id="risk-message"></div></div></section>
  </div>
`;

describe("Sidepanel sample data rendering", () => {
  let sample;

  beforeAll(() => {
    const samplePath = path.resolve(
      __dirname,
      "../../data/sample_analysis.json",
    );
    sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  });

  beforeEach(() => {
    document.body.innerHTML = html;

    // Mock chrome APIs used in sidepanel
    global.chrome = {
      runtime: {
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn((msg, cb) => cb({ data: sample })),
      },
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(undefined),
        },
      },
    };

    // Provide EXT_CONSTANTS minimal surface used in sidepanel.js and debugger
    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock("../../src/utils/constants", () => ({
        EXT_CONSTANTS: {
          MESSAGES: {
            UPDATE_SIDEPANEL: "updateSidepanel",
            ANALYSIS_ERROR: "analysisError",
            CLEAR_PANEL: "clearPanel",
          },
          CLASSES: {
            SECTION_SUMMARY: "section-summary",
            UNCOMMON_TERM: "uncommon-term",
          },
          DEBUG: {
            LEVELS: { DEBUG: "debug" },
            MODULES: { SIDEPANEL: "sidepanel" },
            FEATURES: {
              DICTIONARY_METRICS: { ENABLED: false, POLL_MS: 10000 },
            },
          },
          ANALYSIS: {
            RIGHTS: {
              WEIGHTS: {
                HIGH_RISK: { ARBITRATION: 1, CLASS_ACTION_WAIVER: 1 },
                MEDIUM_RISK: { AUTO_RENEWAL_FRICTION: 1 },
                POSITIVES: { CLEAR_OPT_OUT: 1 },
                CAPS: { MAX_POSITIVE_BOOST: 10 },
              },
            },
            USER_RIGHTS_INDEX: { CATEGORIES: {} },
          },
        },
      }));
      jest.doMock("../../src/utils/debugger", () => ({
        createDebugger: () => ({
          debug: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            startGroup: jest.fn(),
            endGroup: jest.fn(),
            startTimer: jest.fn(),
            endTimer: jest.fn(),
          },
        }),
      }));

      // Require sidepanel (registers DOMContentLoaded listener)
      require("../../src/panel/sidepanel");
    });

    // Fire DOMContentLoaded to trigger initialization and data load
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.chrome;
  });

  it("populates top-level document info and grades", async () => {
    // Allow any microtasks to settle
    await Promise.resolve();
    expect(document.getElementById("terms-url").textContent).toContain(
      "https://example.com/terms",
    );
    expect(document.getElementById("terms-title").textContent).toContain(
      "Example Terms of Service",
    );
    expect(document.getElementById("readability-grade").textContent).toBe("B");
    // URI grade preferred
    expect(document.getElementById("user-rights-index").textContent).toBe("B");
  });

  it("renders enhanced summary and risk elements", async () => {
    await Promise.resolve();
    expect(document.getElementById("overall-summary").innerHTML).toContain(
      "<p>",
    );
    expect(document.getElementById("document-risk").style.display).toBe(
      "block",
    );
    expect(document.getElementById("risk-badge").textContent).toBe("MEDIUM");
    expect(document.getElementById("risk-alert").style.display).toBe("block");
  });

  it("renders sections with badges and key points", async () => {
    await Promise.resolve();
    const sections = document
      .getElementById("section-summaries")
      .querySelectorAll(".section-summary");
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].innerHTML).toContain("section-category-badges");
  });

  it("renders excerpts, uncommon terms, and dictionary terms", async () => {
    await Promise.resolve();
    expect(document.querySelectorAll("#key-excerpts-list li").length).toBe(
      sample.excerpts.length,
    );
    expect(
      document.querySelectorAll("#uncommon-terms-list .uncommon-term").length,
    ).toBe(sample.terms.length);
    expect(
      document.querySelectorAll("#dictionary-terms-list .dictionary-term")
        .length,
    ).toBe(sample.dictionaryTerms.length);
  });
});
