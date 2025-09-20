#!/usr/bin/env node
/**
 * Process all curated ToS files, run enhanced summarizer, and store results via EnhancedCacheService.
 * Persists cache to a file-backed localStorage polyfill so results are reusable across runs.
 */

const fs = require("fs");
const path = require("path");
let cheerio;
try {
  cheerio = require("cheerio");
} catch (e) {
  // Provide a stub that will cause .load to throw, triggering the summarizer's internal shim
  cheerio = {
    load: () => {
      throw new Error("cheerio unavailable in this Node runtime");
    },
  };
}

let compromise;
try {
  compromise = require("compromise");
} catch (e) {
  // Minimal sentence splitter fallback
  compromise = (text) => ({
    sentences: () => ({
      json: () =>
        String(text)
          .replace(/\s+/g, " ")
          .split(/(?<=[.!?])\s+/)
          .filter(Boolean)
          .map((t) => ({ text: t })),
    }),
  });
}

const {
  createEnhancedSummarizer,
} = require("../src/analysis/enhancedSummarizer");
const {
  createReadabilityGrader,
} = require("../src/analysis/readabilityGrader");
let createRightsAssessor;
try {
  ({ createRightsAssessor } = require("../src/analysis/rightsAssessor"));
} catch (e) {
  // Fallback: simplified rights analyzer for older Node runtimes
  createRightsAssessor = function ({ log, logLevels }) {
    function analyzeContent(text) {
      try {
        const t = String(text || "").toLowerCase();
        const wc = t.split(/\s+/).filter(Boolean).length || 1;
        const perN = 1000;
        const has = (re) => re.test(t);

        let score = 100;
        const penalties = [
          [/(arbitration|dispute\s+resolution)/i, 12],
          [/class\s+action/i, 10],
          [/unilateral|we\s+may\s+(modify|change|amend)/i, 8],
          [/limitation\s+of\s+liability|indemnif|hold\s+harmless/i, 8],
          [/(auto-?renew|negative\s+option|subscription)/i, 6],
          [/(sell|share)\s+.*(data|information)/i, 8],
        ];
        penalties.forEach(([re, pts]) => {
          if (has(re)) score -= pts;
        });
        // small bonus for opt-out/delete signals
        if (has(/opt-?out|unsubscribe/i)) score += 4;
        if (has(/delete\s+(account|data)|remove\s+information/i)) score += 3;

        score = Math.max(0, Math.min(100, score));

        const grade =
          score >= 90
            ? "A"
            : score >= 80
              ? "B"
              : score >= 70
                ? "C"
                : score >= 60
                  ? "D"
                  : "F";
        const conf = Math.max(0.2, Math.min(1, wc / perN));
        return {
          rightsScore: score,
          grade,
          confidence: Number(conf.toFixed(2)),
          details: { wordCount: wc, perN },
        };
      } catch (e) {
        log &&
          log(
            (logLevels && logLevels.ERROR) || "error",
            "Fallback rights analysis error",
            { error: e && e.message },
          );
        return {
          rightsScore: 50,
          grade: "C",
          confidence: 0.3,
          details: { error: e && e.message },
        };
      }
    }
    return { analyzeContent };
  };
}
const {
  EnhancedCacheService,
} = require("../src/services/enhancedCacheService");
const { TextCache } = require("../src/data/cache/textCache");
const {
  createUncommonWordsIdentifier,
} = require("../src/analysis/uncommonWordsIdentifier");
const {
  createLegalDictionaryService,
} = require("../src/utils/legalDictionaryService");
const { legalTermsDefinitions } = require("../src/data/legalTermsDefinitions");
const { commonWords } = require("../src/data/commonWords");

// --- File-backed localStorage polyfill (sufficient for our cache usage) ---
function createFileBackedLocalStorage(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let data = {};
  if (fs.existsSync(filePath)) {
    try {
      const txt = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(txt || "{}");
    } catch (_) {
      data = {};
    }
  }

  const persist = () => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (_) {}
  };

  const storage = {
    get length() {
      return Object.keys(data).length;
    },
    key(n) {
      const keys = Object.keys(data);
      return keys[n] || null;
    },
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
    },
    setItem(k, v) {
      data[k] = String(v);
      // also reflect enumerable props so Object.keys(localStorage) works in our code
      storage[k] = data[k];
      persist();
    },
    removeItem(k) {
      delete data[k];
      try {
        delete storage[k];
      } catch (_) {}
      persist();
    },
    clear() {
      data = {};
      for (const k of Object.keys(storage)) {
        if (
          ![
            "length",
            "key",
            "getItem",
            "setItem",
            "removeItem",
            "clear",
          ].includes(k)
        ) {
          delete storage[k];
        }
      }
      persist();
    },
  };

  // initialize enumerable mirror
  for (const k of Object.keys(data)) storage[k] = data[k];
  return storage;
}

// Install polyfill if not present (Node)
if (typeof global.localStorage === "undefined") {
  global.localStorage = createFileBackedLocalStorage(
    path.join(process.cwd(), ".cache", "localStorage.json"),
  );
}

async function main() {
  const curatedDir = path.join(process.cwd(), "test-pages", "curated-tos");
  const manifestPath = path.join(curatedDir, "manifest.json");
  const hasManifest = fs.existsSync(manifestPath);

  const includedFiles = [];
  if (hasManifest) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      for (const item of manifest.included || []) {
        includedFiles.push(path.join(curatedDir, item.file));
      }
    } catch (e) {
      // fallback to directory scan
    }
  }

  if (includedFiles.length === 0) {
    // Fallback: scan for html and txt
    const all = fs.readdirSync(curatedDir).map((f) => path.join(curatedDir, f));
    for (const f of all) {
      if (fs.statSync(f).isFile() && /(\.html?|\.txt)$/i.test(f)) {
        includedFiles.push(f);
      }
    }
  }

  // Setup summarizer and cache
  const log = (..._args) => {};
  const logLevels = { DEBUG: "debug", INFO: "info", ERROR: "error" };
  const summarizer = createEnhancedSummarizer({
    compromise,
    cheerio,
    log,
    logLevels,
  });
  const readabilityGrader = createReadabilityGrader({ log, logLevels });
  const rightsAssessor = createRightsAssessor({ log, logLevels });
  const uncommonWordsIdentifier = await createUncommonWordsIdentifier({
    log,
    logLevels,
    legalTermsDefinitions,
  });
  const dictionaryService = await createLegalDictionaryService({
    log,
    logLevels,
  });

  // Additional stopwords to eliminate technical/CSS/JS noise from uncommon terms
  const TECH_STOPWORDS = new Set([
    // Generic UI/HTML/CSS
    "text",
    "color",
    "border",
    "margin",
    "padding",
    "body",
    "header",
    "footer",
    "nav",
    "section",
    "article",
    "div",
    "span",
    "style",
    "class",
    "id",
    "default",
    "start",
    "end",
    "left",
    "right",
    "top",
    "bottom",
    "display",
    "inline",
    "block",
    "font",
    "size",
    // JS tokens
    "function",
    "return",
    "window",
    "document",
    "false",
    "true",
    "null",
    "undefined",
  ]);
  const COMMON_STOPWORDS = new Set(commonWords || []);
  function isStopToken(word) {
    if (!word) return true;
    const w = String(word).toLowerCase();
    if (w.length < 3) return true;
    if (COMMON_STOPWORDS.has(w)) return true;
    if (TECH_STOPWORDS.has(w)) return true;
    if (/-$|^-/.test(w)) return true; // dangling hyphen noise like "text-"
    return false;
  }

  function extractText(html) {
    try {
      const $ = cheerio.load(html);
      $(
        "script, style, nav, header, footer, aside, .advertisement, .ad, .sidebar",
      ).remove();
      const selectors = [
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
      for (const sel of selectors) {
        const node = $(sel);
        const t = node && typeof node.text === "function" ? node.text() : "";
        if (t && t.length > text.length) text = t;
      }
      if (!text) {
        const body = $("body");
        const bt = body && typeof body.text === "function" ? body.text() : "";
        text = bt || "";
      }
      return String(text).replace(/\s+/g, " ").trim();
    } catch (e) {
      // Fallback: strip tags
      return String(html)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  // Heuristic rights index category scoring (Node-friendly)
  const CATEGORY_REGEX = {
    DISPUTE_RESOLUTION: /(arbitration|dispute\s+resolution|jury\s+trial)/i,
    CLASS_ACTIONS: /class\s+action/i,
    UNILATERAL_CHANGES: /(we\s+may\s+(modify|change|amend)|unilateral)/i,
    DATA_PRACTICES:
      /((sell|share)\s+.*(data|information)|third\s+part(y|ies)\s+.*data)/i,
    BILLING_AND_AUTORENEWAL:
      /(auto-?renew|negative\s+option|subscription|billing)/i,
    CONTENT_AND_IP: /(moral\s+rights|intellectual\s+property|license)/i,
    LIABILITY_AND_REMEDIES:
      /(limitation\s+of\s+liability|indemnif|hold\s+harmless)/i,
    RETENTION_AND_DELETION:
      /((delete|erase)\s+your\s+(account|data)|retain\s+data|storage\s+for\s+\d+)/i,
  };

  const CATEGORY_WEIGHTS = {
    DISPUTE_RESOLUTION: 15,
    CLASS_ACTIONS: 12,
    UNILATERAL_CHANGES: 8,
    DATA_PRACTICES: 8,
    BILLING_AND_AUTORENEWAL: 6,
    CONTENT_AND_IP: 5,
    LIABILITY_AND_REMEDIES: 10,
    RETENTION_AND_DELETION: -5, // positive right → boost
  };

  function scoreCategoriesForText(text) {
    const t = String(text || "").toLowerCase();
    const scores = {};
    Object.keys(CATEGORY_REGEX).forEach((cat) => {
      const re = CATEGORY_REGEX[cat];
      const m = t.match(new RegExp(re.source, "gi"));
      const count = m ? m.length : 0;
      const w = CATEGORY_WEIGHTS[cat] || 0;
      const penalty = count * Math.abs(w);
      var base = 100;
      if (w >= 0) {
        base = Math.max(0, base - Math.min(30, penalty));
      } else {
        base = Math.min(100, base + Math.min(10, penalty));
      }
      scores[cat] = {
        raw: count * w,
        adjusted: w >= 0 ? -penalty : penalty,
        score: base,
      };
    });
    return scores;
  }

  function wordCount(str) {
    return String(str || "")
      .split(/\s+/)
      .filter(Boolean).length;
  }

  // --- User Rights Index (URX) scoring helpers ---
  function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
  }
  function scoreFromFlesch(flesch) {
    return clamp(Math.round(Number(flesch || 0)), 0, 100);
  }
  function computeUrxScores(fullText, readability, aggregatedCats) {
    const text = String(fullText || "").toLowerCase();
    const agg = aggregatedCats || {};
    function aggScore(cat, def) {
      const o = agg[cat];
      return typeof (o && o.score) === "number" ? o.score : def;
    }
    const WEIGHTS = {
      CLARITY_TRANSPARENCY: 20,
      DATA_COLLECTION_USE: 25,
      USER_PRIVACY: 20,
      CONTENT_RIGHTS: 15,
      ACCOUNT_MANAGEMENT: 10,
      DISPUTE_RESOLUTION: 10,
      TERMS_CHANGES: 5,
      ALGORITHMIC_DECISIONS: 5,
    };
    var clarity = scoreFromFlesch(readability && readability.flesch);
    var clarityBoostSignals =
      /summary|plain\s+language|key\s+points|overview|highlights|in\s+plain\s+english/.test(
        text,
      )
        ? 5
        : 0;
    clarity = clamp(clarity + clarityBoostSignals, 0, 100);
    var dataPract = aggScore("DATA_PRACTICES", 80);
    var controlSignals =
      /(opt-?out|manage\s+preferences|privacy\s+controls|settings|do\s+not\s+sell|do\s+not\s+share)/.test(
        text,
      )
        ? 5
        : 0;
    var dataCollectionUse = clamp(dataPract + controlSignals, 0, 100);
    var retention = aggScore("RETENTION_AND_DELETION", 85);
    var privacyBase = (retention + dataPract) / 2;
    var privacySignalCount = 0;
    var PRIVACY_SIGNS = [
      /gdpr/,
      /ccpa/,
      /security|secure|encrypt|encryption|https/,
      /two[-\s]?factor|2fa/,
      /privacy\s+policy/,
      /data\s+protection/,
    ];
    for (var i = 0; i < PRIVACY_SIGNS.length; i++)
      if (PRIVACY_SIGNS[i].test(text)) privacySignalCount++;
    var privacyBonus = Math.min(10, privacySignalCount * 2);
    var userPrivacy = clamp(Math.round(privacyBase + privacyBonus), 0, 100);
    var contentRights = aggScore("CONTENT_AND_IP", 85);
    var acctSignals = 0;
    if (/delete\s+(account|profile)/.test(text)) acctSignals += 4;
    if (/(export|download)\s+(your\s+)?data/.test(text)) acctSignals += 3;
    if (/(two[-\s]?factor|2fa)/.test(text)) acctSignals += 2;
    var accountManagement = clamp(Math.round(retention + acctSignals), 0, 100);
    var disp = aggScore("DISPUTE_RESOLUTION", 85);
    var classActions = aggScore("CLASS_ACTIONS", 95);
    var disputeResolution = Math.round((disp + classActions) / 2);
    var termsChanges = aggScore("UNILATERAL_CHANGES", 90);
    var algoBase = 60;
    var algoSignals = 0;
    if (/automated\s+decision|automated\s+process|profiling/.test(text))
      algoSignals += 10;
    if (
      /(algorithm|algorithms|machine\s+learning|ai|artificial\s+intelligence)/.test(
        text,
      )
    )
      algoSignals += 5;
    if (/(explain|explanation|appeal|contest).*automated/.test(text))
      algoSignals += 10;
    if (/opt-?out.*automated/.test(text)) algoSignals += 10;
    var algorithmicDecisions = clamp(algoBase + algoSignals, 0, 100);
    var categories = {
      CLARITY_TRANSPARENCY: { score: clarity },
      DATA_COLLECTION_USE: { score: dataCollectionUse },
      USER_PRIVACY: { score: userPrivacy },
      CONTENT_RIGHTS: { score: contentRights },
      ACCOUNT_MANAGEMENT: { score: accountManagement },
      DISPUTE_RESOLUTION: { score: disputeResolution },
      TERMS_CHANGES: { score: termsChanges },
      ALGORITHMIC_DECISIONS: { score: algorithmicDecisions },
    };
    var totalWeight = 0;
    for (var k in WEIGHTS) totalWeight += WEIGHTS[k];
    var weighted = 0;
    for (var c in categories) {
      var w = WEIGHTS[c] || 0;
      var s = categories[c] && categories[c].score;
      if (typeof s !== "number") s = 0;
      weighted += s * w;
    }
    var overall = totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
    return { categories: categories, weights: WEIGHTS, overallScore: overall };
  }

  const textCache = new TextCache({
    TTL: 30 * 24 * 60 * 60 * 1000,
    MAX_ENTRIES: 500,
  });
  const cache = new EnhancedCacheService(textCache, null, null);

  const report = [];
  for (const absPath of includedFiles) {
    const fileName = path.basename(absPath);
    const ext = path.extname(fileName).toLowerCase();
    const pseudoUrl = `tg://curated-tos/${encodeURIComponent(fileName)}`;

    if (![".html", ".htm", ".txt"].includes(ext)) {
      report.push({
        file: fileName,
        url: pseudoUrl,
        status: "skipped",
        reason: `unsupported extension ${ext}`,
      });
      continue;
    }

    try {
      let raw = fs.readFileSync(absPath, "utf-8");
      if (ext === ".txt") {
        // wrap plain text as minimal HTML so summarizer can digest structure
        raw = `<pre>${raw.replace(/[&<>]/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[s])}</pre>`;
      }

      // Process
      const result = summarizer.summarizeTos(raw) || {};

      // Derive plain text for readability/rights
      const text = extractText(raw);
      const readability = readabilityGrader.calculateReadabilityGrade(text);
      const rights = await rightsAssessor.analyzeContent(text);

      // Identify uncommon words and attach plain-language definitions
      function countOccurrences(word, haystack) {
        try {
          if (!word) return 0;
          const w = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(`\\b${w}\\b`, "gi");
          const m = String(haystack || "").match(re);
          return m ? m.length : 0;
        } catch (_) {
          return 0;
        }
      }

      // Use two sources: (1) identifier (broad uncommon + legal) and (2) dictionary scan (legal terms with counts)
      const idTermsRaw =
        await uncommonWordsIdentifier.identifyUncommonWords(text);
      const idTerms = (idTermsRaw || []).filter(
        (t) => t && t.word && !isStopToken(t.word),
      );
      const dictTermsRaw = await dictionaryService.scanDictionaryTerms(text, {
        maxTerms: 50,
      });
      const dictTerms = (dictTermsRaw || []).filter(
        (t) => t && t.word && !isStopToken(t.word),
      );

      const termsMap = new Map();
      // Seed from identifier; compute counts here
      for (const t of idTerms || []) {
        const word = t && t.word;
        if (!word) continue;
        const count = countOccurrences(word, text);
        const entry = termsMap.get(word) || {
          word,
          count: 0,
          definition: null,
          source: null,
        };
        entry.count = Math.max(entry.count, count);
        entry.definition = entry.definition || t.definition || t.body || null;
        entry.source = entry.source || t.source || null;
        termsMap.set(word, entry);
      }
      // Merge dictionary scan (has counts)
      for (const d of dictTerms || []) {
        const word = d && d.word;
        if (!word) continue;
        const entry = termsMap.get(word) || {
          word,
          count: 0,
          definition: null,
          source: null,
        };
        entry.count = Math.max(entry.count, d.count || 0);
        entry.definition = entry.definition || d.definition || null;
        entry.source = entry.source || d.source || null;
        termsMap.set(word, entry);
      }
      // Build sorted list
      const uncommonDocTerms = Array.from(termsMap.values())
        .filter((e) => e && e.word && e.count > 0 && !isStopToken(e.word))
        .sort((a, b) =>
          b.count === a.count
            ? a.word.localeCompare(b.word)
            : b.count - a.count,
        );
      const withDefs = uncommonDocTerms.filter((e) => e && e.definition);
      const uncommonSummaryTop = (
        withDefs.length > 0 ? withDefs : uncommonDocTerms
      )
        .slice(0, 10)
        .map((e) => `${e.word}:${e.count}`);
      const uncommonSummaryTopDefs = (
        withDefs.length > 0 ? withDefs : uncommonDocTerms
      )
        .slice(0, 5)
        .map((e) => ({
          word: e.word,
          count: e.count,
          definition:
            typeof e.definition === "string"
              ? e.definition.length > 160
                ? e.definition.slice(0, 157) + "..."
                : e.definition
              : null,
          source: e.source || null,
        }));

      // Compute per-section category scores and aggregate to document-level
      var sectionInfos = Array.isArray(result.sections)
        ? result.sections.slice()
        : [];
      var totals = Object.create(null);
      var weights = Object.create(null);
      for (var si = 0; si < sectionInfos.length; si++) {
        var s = sectionInfos[si];
        var sText = s.originalText || s.content || "";
        if (!sText || sText.length < 20) continue;
        var catScores = scoreCategoriesForText(sText);
        if (!s.rights) s.rights = {};
        s.rights.categoryScores = catScores;
        s.rights.wordCount = wordCount(sText);
        var wc = s.rights.wordCount;
        Object.keys(catScores).forEach(function (cat) {
          var obj = catScores[cat];
          var sc = typeof obj.score === "number" ? obj.score : null;
          if (sc == null) return;
          totals[cat] = (totals[cat] || 0) + sc * wc;
          weights[cat] = (weights[cat] || 0) + wc;
        });
      }
      var aggregated = {};
      Object.keys(totals).forEach(function (cat) {
        var total = totals[cat];
        var w = weights[cat] || 0;
        if (w > 0) {
          aggregated[cat] = { raw: null, adjusted: null, score: total / w };
        }
      });

      // Compute User Rights Index (URX) with 8-category weighted scores
      const urx = computeUrxScores(text, readability, aggregated);

      // Merge into a single analysis payload
      const merged = { ...result, readability, rights };
      merged.rights = merged.rights || {};
      merged.rights.details = merged.rights.details || {};
      // Only set categoryScores if missing, or always override to ensure presence
      merged.rights.details.categoryScores = aggregated;
      merged.rights.details.sectionAggregated = true;
      merged.rights.details.userRightsIndex = urx;

      // Attach uncommon words with definitions to cached analysis
      merged.uncommonWords = {
        total: uncommonDocTerms.length,
        terms: uncommonDocTerms.slice(0, 50), // cap to keep cache size reasonable
      };

      // Store using raw content for hashing; stable per file
      const stored = await cache.storeAnalysis(pseudoUrl, raw, merged);

      // Verify retrieval
      const retrieved = await cache.getCachedAnalysis(pseudoUrl, raw);
      const cached = Boolean(
        retrieved && (retrieved.cached || retrieved.analysis),
      );

      // Add compact category summary to the report
      var cats = Object.keys(aggregated)
        .map(function (cat) {
          return [cat, aggregated[cat] && aggregated[cat].score];
        })
        .filter(function (pair) {
          return typeof pair[1] === "number";
        })
        .sort(function (a, b) {
          return a[1] - b[1];
        })
        .slice(0, 3)
        .map(function (pair) {
          return pair[0] + ":" + Math.round(pair[1]);
        });

      report.push({
        file: fileName,
        url: pseudoUrl,
        status: "processed",
        stored,
        cached,
        rightsTopCategories: cats,
        uncommon: {
          total: uncommonDocTerms.length,
          top: uncommonSummaryTop,
          topWithDefinitions: uncommonSummaryTopDefs,
        },
        sections: Array.isArray(result.sections) ? result.sections.length : 0,
        overallRisk: result.overallRisk || null,
        readability:
          readability && (readability.averageGrade || readability.grade)
            ? {
                grade: readability.averageGrade || readability.grade,
                flesch: readability.flesch,
                kincaid: readability.kincaid,
                fogIndex: readability.fogIndex,
              }
            : null,
        rights:
          rights && (rights.grade || rights.rightsScore !== undefined)
            ? {
                grade: rights.grade,
                score: rights.rightsScore,
                confidence: rights.confidence,
                topCategories: cats,
                userRightsIndex: { overall: urx.overallScore },
              }
            : {
                topCategories: cats,
                userRightsIndex: { overall: urx.overallScore },
              },
      });
    } catch (e) {
      report.push({
        file: fileName,
        url: pseudoUrl,
        status: "error",
        error: e.message,
      });
    }
  }

  // Persist report
  const outDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "curated-cache-report.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2),
    "utf-8",
  );

  // Print concise summary
  const counts = report.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log("Curated ToS processing complete.");
  console.log(
    `Processed: ${counts.processed || 0}, Skipped: ${counts.skipped || 0}, Errors: ${counts.error || 0}`,
  );
  console.log(`Report: ${path.relative(process.cwd(), outFile)}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
