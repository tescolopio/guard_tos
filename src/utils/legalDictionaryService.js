// src/utils/legalDictionaryService.js
// Loads alphabetized legal dictionaries and provides lookup utilities

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .trim();
}

function tokenizeTitle(title) {
  return normalize(title)
    .split(/[^a-z0-9]+/)
    .filter((t) => t && t.length >= 3);
}

async function createLegalDictionaryService({
  log = () => {},
  logLevels = {},
}) {
  // Dynamic import strategy (code-split in browser) with Node/Jest fallback to static requires
  const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
  let entries = [];
  let allLoaded = false;
  const loadedLetters = new Set();
  let initialized = false;

  // Individual loaders to enable per-letter lazy loading without dynamic expression warnings
  const staticReq = (p) => require(p);
  const letterLoaders = {
    a: () =>
      import(
        /* webpackChunkName: "dict-a" */ "../data/dictionaries/dict-a.json"
      ),
    b: () =>
      import(
        /* webpackChunkName: "dict-b" */ "../data/dictionaries/dict-b.json"
      ),
    c: () =>
      import(
        /* webpackChunkName: "dict-c" */ "../data/dictionaries/dict-c.json"
      ),
    d: () =>
      import(
        /* webpackChunkName: "dict-d" */ "../data/dictionaries/dict-d.json"
      ),
    e: () =>
      import(
        /* webpackChunkName: "dict-e" */ "../data/dictionaries/dict-e.json"
      ),
    f: () =>
      import(
        /* webpackChunkName: "dict-f" */ "../data/dictionaries/dict-f.json"
      ),
    g: () =>
      import(
        /* webpackChunkName: "dict-g" */ "../data/dictionaries/dict-g.json"
      ),
    h: () =>
      import(
        /* webpackChunkName: "dict-h" */ "../data/dictionaries/dict-h.json"
      ),
    i: () =>
      import(
        /* webpackChunkName: "dict-i" */ "../data/dictionaries/dict-i.json"
      ),
    j: () =>
      import(
        /* webpackChunkName: "dict-j" */ "../data/dictionaries/dict-j.json"
      ),
    k: () =>
      import(
        /* webpackChunkName: "dict-k" */ "../data/dictionaries/dict-k.json"
      ),
    l: () =>
      import(
        /* webpackChunkName: "dict-l" */ "../data/dictionaries/dict-l.json"
      ),
    m: () =>
      import(
        /* webpackChunkName: "dict-m" */ "../data/dictionaries/dict-m.json"
      ),
    n: () =>
      import(
        /* webpackChunkName: "dict-n" */ "../data/dictionaries/dict-n.json"
      ),
    o: () =>
      import(
        /* webpackChunkName: "dict-o" */ "../data/dictionaries/dict-o.json"
      ),
    p: () =>
      import(
        /* webpackChunkName: "dict-p" */ "../data/dictionaries/dict-p.json"
      ),
    q: () =>
      import(
        /* webpackChunkName: "dict-q" */ "../data/dictionaries/dict-q.json"
      ),
    r: () =>
      import(
        /* webpackChunkName: "dict-r" */ "../data/dictionaries/dict-r.json"
      ),
    s: () =>
      import(
        /* webpackChunkName: "dict-s" */ "../data/dictionaries/dict-s.json"
      ),
    t: () =>
      import(
        /* webpackChunkName: "dict-t" */ "../data/dictionaries/dict-t.json"
      ),
    u: () =>
      import(
        /* webpackChunkName: "dict-u" */ "../data/dictionaries/dict-u.json"
      ),
    v: () =>
      import(
        /* webpackChunkName: "dict-v" */ "../data/dictionaries/dict-v.json"
      ),
    w: () =>
      import(
        /* webpackChunkName: "dict-w" */ "../data/dictionaries/dict-w.json"
      ),
    x: () =>
      import(
        /* webpackChunkName: "dict-x" */ "../data/dictionaries/dict-x.json"
      ),
    y: () =>
      import(
        /* webpackChunkName: "dict-y" */ "../data/dictionaries/dict-y.json"
      ),
    z: () =>
      import(
        /* webpackChunkName: "dict-z" */ "../data/dictionaries/dict-z.json"
      ),
  };

  async function loadLetter(letter) {
    if (loadedLetters.has(letter)) return;
    try {
      let data;
      if (runningInBrowser) {
        const mod = await letterLoaders[letter]();
        data = mod && mod.default ? mod.default : mod;
      } else {
        data = staticReq(`../data/dictionaries/dict-${letter}.json`);
      }
      if (Array.isArray(data)) {
        for (const e of data) {
          const t = normalize(e.title);
          if (t && !titleIndex.has(t)) titleIndex.set(t, e);
          for (const tok of tokenizeTitle(e.title)) {
            if (!tokenIndex.has(tok)) tokenIndex.set(tok, []);
            tokenIndex.get(tok).push(e);
          }
        }
        entries.push(...data);
      }
    } catch (_) {
      // ignore load failure for individual letter
    } finally {
      loadedLetters.add(letter);
    }
  }

  async function loadAll() {
    if (allLoaded) return;
    await Promise.all(LETTERS.map((l) => loadLetter(l)));
    allLoaded = true;
  }

  const runningInBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const titleIndex = new Map();
  const tokenIndex = new Map();

  // Simple LRU cache & configuration - must be declared before ensureInitialized
  const cache = new Map();
  const serviceConfig = {
    MAX_CACHE: 1000,
    TTL: 24 * 60 * 60 * 1000,
  };

  // Lazy initialization function - only initialize when first accessed
  function ensureInitialized() {
    if (initialized) return;
    initialized = true;

    // Initialize constants only when needed
    try {
      const { EXT_CONSTANTS } = require("../utils/constants");
      if (
        EXT_CONSTANTS &&
        EXT_CONSTANTS.ANALYSIS &&
        EXT_CONSTANTS.ANALYSIS.DICTIONARY
      ) {
        Object.assign(serviceConfig, {
          MAX_CACHE: EXT_CONSTANTS.ANALYSIS.DICTIONARY.CACHE_SIZE || 1000,
          TTL:
            EXT_CONSTANTS.ANALYSIS.DEFINITION_CACHE_TIME || 24 * 60 * 60 * 1000,
        });
      }
    } catch (e) {
      // Use defaults if constants can't be loaded
    }
  }

  let hits = 0;
  let misses = 0;
  // metricsInterval retained for compatibility if later needed
  let metricsInterval = null;

  function getCached(key) {
    ensureInitialized();
    const now = Date.now();
    if (!cache.has(key)) return null;
    const item = cache.get(key);
    if (now - item.ts > serviceConfig.TTL) {
      cache.delete(key);
      return null;
    }
    // bump recency
    cache.delete(key);
    cache.set(key, item);
    return item.val;
  }

  function setCached(key, val) {
    ensureInitialized();
    cache.set(key, { ts: Date.now(), val });
    if (cache.size > serviceConfig.MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }

  function bestEntryForToken(tok) {
    const list = tokenIndex.get(tok);
    if (!list || list.length === 0) return null;
    // Prefer exact title-token alignment first
    const exact = list.find((e) => normalize(e.title) === tok);
    return exact || list[0];
  }

  // Lightweight fuzzy matcher for multi-word legal terms
  function fuzzyFind(phrase) {
    const norm = normalize(phrase);
    const tokens = tokenizeTitle(norm);
    if (!tokens.length) return null;

    const candidateMap = new Map();
    for (const tok of tokens) {
      const list = tokenIndex.get(tok) || [];
      for (const e of list) {
        const id = e.permalink || e.title;
        const curr = candidateMap.get(id) || { entry: e, matches: 0 };
        curr.matches += 1;
        candidateMap.set(id, curr);
      }
    }
    const candidates = Array.from(candidateMap.values());
    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      const at = normalize(a.entry.title);
      const bt = normalize(b.entry.title);
      const aIncl = at.includes(norm) ? 1 : 0;
      const bIncl = bt.includes(norm) ? 1 : 0;
      if (aIncl !== bIncl) return bIncl - aIncl;
      if (a.matches !== b.matches) return b.matches - a.matches;
      const aDiff = Math.abs(at.length - norm.length);
      const bDiff = Math.abs(bt.length - norm.length);
      return aDiff - bDiff;
    });

    return candidates[0].entry;
  }

  async function getDefinition(word) {
    ensureInitialized();
    const key = normalize(word);
    if (!key) return null;
    const first = key[0];
    if (first >= "a" && first <= "z") {
      await loadLetter(first);
    } else if (!allLoaded) {
      // Non a-z leading char, fallback to full load
      await loadAll();
    }
    if (!key) return null;
    const cached = getCached(key);
    if (cached !== null) {
      hits += 1;
      return cached;
    }
    misses += 1;
    const exact = titleIndex.get(key);
    if (exact) {
      const val = {
        definition: exact.body,
        source: exact.source || "Dictionary",
        title: exact.title,
      };
      setCached(key, val);
      return val;
    }
    const e = bestEntryForToken(key);
    if (e) {
      const val = {
        definition: e.body,
        source: e.source || "Dictionary",
        title: e.title,
      };
      setCached(key, val);
      return val;
    }
    const f = fuzzyFind(key);
    if (f) {
      const val = {
        definition: f.body,
        source: f.source || "Dictionary",
        title: f.title,
      };
      setCached(key, val);
      return val;
    }
    setCached(key, null);
    return null;
  }

  function isLegalTerm(word) {
    const key = normalize(word);
    if (!allLoaded && !(loadedLetters.has(key[0]) || !key[0])) return false;
    return titleIndex.has(key) || tokenIndex.has(key);
  }

  async function getAllLegalTermsAsync() {
    if (!allLoaded) await loadAll();
    return Array.from(titleIndex.keys());
  }

  function getAllLegalTerms() {
    // Backward compatibility (tests call synchronously after await createService)
    // Kick off full load if not already started (fire-and-forget) and return current snapshot.
    if (!allLoaded && loadedLetters.size === 0) {
      loadAll();
    }
    return Array.from(titleIndex.keys());
  }

  function clearCache() {
    cache.clear();
  }

  /**
   * Scans arbitrary text for words that appear in the legal dictionary.
   * Returns an array of { word, count, definition, source } objects.
   * Letters are lazily loaded – only the starting letter for each unique token is fetched.
   * @param {string} text
   * @param {object} options
   * @param {number} options.maxTerms Maximum number of terms to return (after sorting by frequency desc then alpha)
   */
  async function scanDictionaryTerms(text, { maxTerms = 50 } = {}) {
    try {
      if (!text || typeof text !== "string") return [];
      // Collect tokens (length >=3) and frequency
      const tokens = text.toLowerCase().match(/\b[a-z][a-z0-9]{2,}\b/g);
      if (!tokens || tokens.length === 0) return [];
      const freq = new Map();
      for (const t of tokens) {
        freq.set(t, (freq.get(t) || 0) + 1);
      }

      const entriesOut = [];
      // Iterate unique tokens; load letter lazily
      for (const [tok, count] of freq.entries()) {
        const first = tok[0];
        if (first >= "a" && first <= "z" && !loadedLetters.has(first)) {
          await loadLetter(first);
        }
        // Fast membership check (avoid triggering full load unless necessary)
        if (!titleIndex.has(tok) && !tokenIndex.has(tok)) continue;
        const def = await getDefinition(tok);
        if (!def) continue;
        entriesOut.push({
          word: tok,
          count,
          definition: def.definition || def.body || def,
          source: def.source || "Dictionary",
        });
      }

      entriesOut.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count; // freq desc
        return a.word.localeCompare(b.word);
      });
      return entriesOut.slice(0, maxTerms);
    } catch (e) {
      log(logLevels.WARN || console.warn, "scanDictionaryTerms failed", e);
      return [];
    }
  }

  return {
    getDefinition,
    // alias for compatibility
    lookup: getDefinition,
    isLegalTerm,
    getAllLegalTerms,
    getAllLegalTermsAsync,
    clearCache,
    scanDictionaryTerms,
    _metrics: () => {
      ensureInitialized();
      return {
        hits,
        misses,
        size: cache.size,
        ttl: serviceConfig.TTL,
        max: serviceConfig.MAX_CACHE,
      };
    },
  };
}

module.exports = { createLegalDictionaryService };

// When debugging is enabled via constants, periodically persist dictionary metrics for diagnostics
(function setupDictionaryMetricsDiagnostics() {
  try {
    // Only enable in browser/extension contexts, not in Node CLI or tests
    const isBrowser =
      typeof window !== "undefined" && typeof document !== "undefined";
    const isTestEnv =
      (typeof process !== "undefined" &&
        process &&
        process.env &&
        (process.env.JEST_WORKER_ID || process.env.NODE_ENV === "test")) ||
      (typeof globalThis !== "undefined" && globalThis.__JEST__);
    const isCli =
      typeof process !== "undefined" &&
      process &&
      process.argv &&
      Array.isArray(process.argv) &&
      process.argv.some((arg) => /scripts\/process-curated-tos\.js$/.test(arg));
    if (!isBrowser || isTestEnv || isCli) {
      return; // do not start diagnostics polling outside extension UI
    }
    const { EXT_CONSTANTS } = require("../utils/constants");
    const enabled = !!(
      EXT_CONSTANTS &&
      EXT_CONSTANTS.DEBUG &&
      EXT_CONSTANTS.DEBUG.FEATURES &&
      EXT_CONSTANTS.DEBUG.FEATURES.DICTIONARY_METRICS &&
      EXT_CONSTANTS.DEBUG.FEATURES.DICTIONARY_METRICS.ENABLED
    );
    if (!enabled) return;

    const POLL_MS =
      EXT_CONSTANTS.DEBUG.FEATURES.DICTIONARY_METRICS.POLL_MS || 10000;
    const STORAGE_KEY =
      EXT_CONSTANTS.STORAGE_KEYS.DICTIONARY_METRICS || "dictionaryMetrics";

    // Lazily get a service instance to read metrics; avoid creating multiple
    const {
      createLegalDictionaryService,
    } = require("./legalDictionaryService");
    let servicePromise = null;
    function getService() {
      if (!servicePromise) {
        servicePromise = createLegalDictionaryService({});
      }
      return servicePromise;
    }

    async function pollAndPersist() {
      try {
        const svc = await getService();
        const m = svc && svc._metrics ? svc._metrics() : null;
        if (!m) return;
        // Respect user runtime toggle if available
        let userEnabled = true;
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local &&
          chrome.storage.local.get
        ) {
          try {
            const pref = await chrome.storage.local.get(
              "__diag_dictionary_enabled",
            );
            userEnabled = !!pref.__diag_dictionary_enabled;
          } catch (_) {}
        }
        if (!userEnabled) return;
        const payload = {
          ...m,
          ts: Date.now(),
        };
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local
        ) {
          await chrome.storage.local.set({ [STORAGE_KEY]: payload });
        } else if (typeof globalThis !== "undefined") {
          // Test fallback for non-extension envs
          globalThis.__DICTIONARY_METRICS__ = payload;
        }
      } catch (e) {
        // Swallow errors in diagnostics path
      }
    }

    // Start polling unless running under a Jest/test environment to avoid open handle warnings
    if (!isTestEnv) {
      setInterval(pollAndPersist, POLL_MS);
    }
  } catch (e) {
    // ignore if constants or chrome not available
  }
})();
