const { EXT_CONSTANTS } = require("../../src/utils/constants");
const {
  createLegalDictionaryService,
} = require("../../src/utils/legalDictionaryService");

describe("Dictionary Service - cache metrics and sizing", () => {
  let originalCacheSize;

  beforeAll(() => {
    originalCacheSize = EXT_CONSTANTS.ANALYSIS.DICTIONARY.CACHE_SIZE;
  });

  afterAll(() => {
    EXT_CONSTANTS.ANALYSIS.DICTIONARY.CACHE_SIZE = originalCacheSize;
  });

  test("hits/misses update and TTL/MAX reflect constants; LRU enforces max size", async () => {
    // Use a tiny cache to make LRU behavior easy to observe
    EXT_CONSTANTS.ANALYSIS.DICTIONARY.CACHE_SIZE = 2;

    // Force reinitialize both modules with new cache size by requiring them fresh
    delete require.cache[require.resolve("../../src/utils/constants")];
    delete require.cache[
      require.resolve("../../src/utils/legalDictionaryService")
    ];
    const {
      createLegalDictionaryService: createFreshService,
    } = require("../../src/utils/legalDictionaryService");
    const svc = await createFreshService({});

    // Ensure full dictionary loaded for test determinism
    if (svc.getAllLegalTermsAsync) {
      await svc.getAllLegalTermsAsync();
    }

    // Sanity: metrics reflect constants
    let m = svc._metrics();
    expect(m.max).toBe(2);
    expect(m.ttl).toBe(EXT_CONSTANTS.ANALYSIS.DEFINITION_CACHE_TIME);

    // Ensure empty cache to start
    svc.clearCache();
    expect(svc._metrics().size).toBe(0);

    // Choose a guaranteed existing term from the dictionary index
    const terms = svc.getAllLegalTerms();
    expect(Array.isArray(terms) && terms.length > 0).toBe(true);
    const known = terms[0];

    // First lookup should be a miss; second should be a hit (cached non-null)
    const first = await svc.getDefinition(known);
    expect(first && typeof first.definition === "string").toBe(true);
    const midMetrics = svc._metrics();
    expect(midMetrics.misses).toBeGreaterThanOrEqual(1);

    const second = await svc.getDefinition(known);
    expect(second && typeof second.definition === "string").toBe(true);
    const afterHit = svc._metrics();
    expect(afterHit.hits).toBeGreaterThanOrEqual(1);

    // LRU test with non-existent keys (nulls are cached too)
    svc.clearCache();
    expect(svc._metrics().size).toBe(0);

    await svc.getDefinition("__unlikely_key_a__");
    await svc.getDefinition("__unlikely_key_b__");
    let lruMetrics = svc._metrics();
    expect(lruMetrics.size).toBe(2);

    await svc.getDefinition("__unlikely_key_c__");
    lruMetrics = svc._metrics();
    // Oldest should be evicted; size must not exceed max
    expect(lruMetrics.size).toBe(2);
  });
});
