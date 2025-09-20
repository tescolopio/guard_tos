/**
 * @file __tests__/unit/cache-flow.test.js
 * @description Tests for cache hit/miss scenarios in the hash-based caching system
 * @version 1.0.0
 */

const { ContentHashService } = require("../../src/services/contentHashService");
const {
  EnhancedCacheService,
} = require("../../src/services/enhancedCacheService");
const { DatabaseService } = require("../../src/services/databaseService");
const {
  UserPreferenceService,
} = require("../../src/services/userPreferenceService");

// Use a simple in-memory storage for tests
const mockStorage = new Map();
// Expose for services that want to read raw storage in tests
global.__TEST_MOCK_STORAGE = mockStorage;
global.localStorage = {
  getItem: jest.fn((key) => mockStorage.get(key) || null),
  setItem: jest.fn((key, value) => mockStorage.set(key, value)),
  removeItem: jest.fn((key) => mockStorage.delete(key)),
  clear: jest.fn(() => mockStorage.clear()),
};

// Mock TextCache with the interface EnhancedCacheService expects
class MockTextCache {
  constructor() {
    this.cache = new Map();
  }

  async get(hash, type) {
    return this.cache.get(`${hash}_${type}`) || null;
  }

  async set(hash, data, type) {
    this.cache.set(`${hash}_${type}`, data);
  }

  async delete(hash) {
    // Delete all entries for this hash
    for (const key of this.cache.keys()) {
      if (key.startsWith(hash)) {
        this.cache.delete(key);
      }
    }
  }
}

describe("Cache Flow Tests", () => {
  let contentHashService;
  let enhancedCacheService;
  let databaseService;
  let userPreferenceService;
  let textCache;

  const mockUrl = "https://example.com/terms";
  const mockContent =
    "Sample terms of service content for testing cache flows.";
  const mockAnalysisResults = {
    readability: { grade: "B", score: 75.5 },
    rights: { score: 85, clauses: [] },
    summary: { text: "Sample summary" },
    uncommonWords: ["exemplar", "jurisdiction"],
  };

  beforeEach(() => {
    // Clear storage before each test
    mockStorage.clear();
    jest.clearAllMocks();

    // Initialize services with test mode
    contentHashService = new ContentHashService();
    databaseService = new DatabaseService({ testMode: true });
    userPreferenceService = new UserPreferenceService();
    textCache = new MockTextCache();

    enhancedCacheService = new EnhancedCacheService(
      textCache,
      databaseService,
      userPreferenceService,
    );
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe("Cache Miss Scenarios", () => {
    test("should return cache miss when no cache exists for new content", async () => {
      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result.cached).toBe(false);
      expect(result.data).toBeNull();
      expect(result.source).toBeNull();
      expect(result.metadata).toBeDefined();
    });

    test("should return null when content hash changes", async () => {
      // Store analysis for original content
      await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );

      // Try to get analysis for modified content
      const modifiedContent = mockContent + " Additional clause added.";
      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        modifiedContent,
      );

      expect(result).toBeNull();
    });

    test("should return null when URL changes but content stays same", async () => {
      // Store analysis for original URL
      await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );

      // Try to get analysis for different URL with same content
      const differentUrl = "https://different.com/terms";
      const result = await enhancedCacheService.getCachedAnalysis(
        differentUrl,
        mockContent,
      );

      expect(result).toBeNull();
    });

    test("should return null when cache entry is expired", async () => {
      // Mock an expired cache entry by manipulating localStorage directly
      const hash = await contentHashService.generateHash(mockUrl, mockContent);
      const expiredEntry = {
        analysis: mockAnalysisResults,
        metadata: await contentHashService.generateMetadata(
          mockUrl,
          mockContent,
        ),
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        source: "local",
      };

      mockStorage.set(`tg_analysis_${hash}`, JSON.stringify(expiredEntry));

      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).toBeNull();
    });
  });

  describe("Cache Hit Scenarios", () => {
    test("should return cached analysis for exact URL and content match", async () => {
      // Store analysis
      const storeResult = await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );
      expect(storeResult).toBe(true);

      // Retrieve analysis
      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).not.toBeNull();
      expect(result.analysis).toEqual(mockAnalysisResults);
      expect(result.source).toBe("local");
      expect(result.metadata.url).toBe(mockUrl);
    });

    test("should return cached analysis even with different whitespace/formatting", async () => {
      // Store analysis for original content
      await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );

      // Try with content that has different whitespace but same normalized form
      const whitespaceVariation =
        "  Sample   terms  of   service \n content for testing cache flows.  ";
      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        whitespaceVariation,
      );

      expect(result).not.toBeNull();
      expect(result.analysis).toEqual(mockAnalysisResults);
    });

    test("should prioritize local cache over database cache", async () => {
      const localAnalysis = { ...mockAnalysisResults, source: "local" };
      const dbAnalysis = { ...mockAnalysisResults, source: "database" };

      // Store in database (simulated via localStorage with different key pattern)
      const hash = await contentHashService.generateHash(mockUrl, mockContent);
      mockStorage.set(
        `tg_analysis_${hash}`,
        JSON.stringify({
          analysis: localAnalysis,
          metadata: await contentHashService.generateMetadata(
            mockUrl,
            mockContent,
          ),
          timestamp: Date.now(),
          source: "local",
        }),
      );

      // Mock database having different data
      jest.spyOn(databaseService, "checkDocumentExists").mockResolvedValue({
        exists: true,
        analysis: dbAnalysis,
      });

      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).not.toBeNull();
      expect(result.analysis).toEqual(localAnalysis);
      expect(result.source).toBe("local");
    });

    test("should fall back to database cache when local cache unavailable", async () => {
      const dbAnalysis = { ...mockAnalysisResults, processingTime: 1500 };

      // Mock database having the data
      jest.spyOn(databaseService, "checkDocumentExists").mockResolvedValue({
        exists: true,
        analysis: {
          analysis: dbAnalysis,
          metadata: await contentHashService.generateMetadata(
            mockUrl,
            mockContent,
          ),
          timestamp: Date.now(),
        },
      });

      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).not.toBeNull();
      expect(result.analysis).toEqual(dbAnalysis);
      expect(result.source).toBe("cloud");
    });
  });

  describe("Cache Storage Scenarios", () => {
    test("should store analysis in both local and cloud caches", async () => {
      const storeSpy = jest
        .spyOn(databaseService, "storeAnalysis")
        .mockResolvedValue(true);

      const result = await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );

      expect(result).toBe(true);

      // Verify local storage
      const hash = await contentHashService.generateHash(mockUrl, mockContent);
      const localEntry = mockStorage.get(`tg_analysis_${hash}`);
      expect(localEntry).not.toBeNull();

      const parsed = JSON.parse(localEntry);
      expect(parsed.analysis).toEqual(mockAnalysisResults);

      // Verify database storage was attempted
      expect(storeSpy).toHaveBeenCalledWith(
        hash,
        expect.any(Object),
        mockAnalysisResults,
      );
    });

    test("should handle storage failures gracefully", async () => {
      // Mock database storage failure
      jest.spyOn(databaseService, "storeAnalysis").mockResolvedValue(false);

      const result = await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );

      // Should still succeed with local storage
      expect(result).toBe(true);

      // Verify local storage still works
      const hash = await contentHashService.generateHash(mockUrl, mockContent);
      const localEntry = mockStorage.get(`tg_analysis_${hash}`);
      expect(localEntry).not.toBeNull();
    });
  });

  describe("Cache Validation", () => {
    test("should validate cache entry structure", async () => {
      // Create invalid cache entry
      const hash = await contentHashService.generateHash(mockUrl, mockContent);
      const invalidEntry = {
        analysis: mockAnalysisResults,
        // Missing required fields: metadata, timestamp
      };

      mockStorage.set(`tg_analysis_${hash}`, JSON.stringify(invalidEntry));

      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).toBeNull();
    });

    test("should handle corrupted cache entries", async () => {
      const hash = await contentHashService.generateHash(mockUrl, mockContent);

      // Store corrupted JSON
      mockStorage.set(`tg_analysis_${hash}`, "invalid json");

      const result = await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent,
      );

      expect(result).toBeNull();
    });
  });

  describe("Content Hash Consistency", () => {
    test("should generate consistent hashes for identical content", async () => {
      const hash1 = await contentHashService.generateHash(mockUrl, mockContent);
      const hash2 = await contentHashService.generateHash(mockUrl, mockContent);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex pattern or fallback
    });

    test("should generate different hashes for different content", async () => {
      const hash1 = await contentHashService.generateHash(mockUrl, mockContent);
      const hash2 = await contentHashService.generateHash(
        mockUrl,
        mockContent + " modified",
      );

      expect(hash1).not.toBe(hash2);
    });

    test("should generate different hashes for different URLs", async () => {
      const hash1 = await contentHashService.generateHash(mockUrl, mockContent);
      const hash2 = await contentHashService.generateHash(
        "https://other.com/terms",
        mockContent,
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Cache Statistics", () => {
    test("should track cache statistics correctly", async () => {
      // Generate some cache activity
      await enhancedCacheService.getCachedAnalysis(mockUrl, mockContent); // miss
      await enhancedCacheService.storeAnalysis(
        mockUrl,
        mockContent,
        mockAnalysisResults,
      );
      await enhancedCacheService.getCachedAnalysis(mockUrl, mockContent); // hit
      await enhancedCacheService.getCachedAnalysis(
        mockUrl,
        mockContent + " modified",
      ); // miss

      const stats = await enhancedCacheService.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.33, 2);
      expect(stats.totalEntries).toBe(1);
    });
  });
});
