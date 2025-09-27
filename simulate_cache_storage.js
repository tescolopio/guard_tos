/**
 * @file simulate_cache_storage.js
 * @description Simulate how Terms Guardian would store analysis in hash-based cache
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load the analysis results
const analysisFile = path.join(
  process.cwd(),
  ".cache",
  "complex-tos-analysis.json",
);
const analysisResults = JSON.parse(fs.readFileSync(analysisFile, "utf8"));

// Simulate URL and content for hash generation
const url = "file:///mnt/d/guard_tos/__tests__/fixtures/complex-tos.html";
const htmlContent = fs.readFileSync(
  "__tests__/fixtures/complex-tos.html",
  "utf8",
);

// Normalize content (similar to ContentHashService)
const normalizedContent = htmlContent
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/\s+/g, " ")
  .trim();

// Generate hash (similar to ContentHashService.generateHash)
const salt = "terms-guardian-v1.0";
const hashInput = `${url}:${normalizedContent}:${salt}`;
const contentHash = crypto.createHash("sha256").update(hashInput).digest("hex");

// Create cache entry structure (similar to EnhancedCacheService.storeAnalysis)
const cacheEntry = {
  hash: contentHash,
  url: url,
  timestamp: new Date().toISOString(),
  metadata: {
    contentLength: htmlContent.length,
    normalizedLength: normalizedContent.length,
    documentTitle:
      "TERMS OF SERVICE AND END USER LICENSE AGREEMENT FOR THE HUNT MASTER FIELD GUIDE ECOSYSTEM",
    cacheVersion: "1.0.0",
  },
  analysis: analysisResults,
  storageInfo: {
    source: "local-analysis",
    storedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    cacheType: "enhanced",
    compressionUsed: false,
  },
};

// Write hash-based cache file
const hashCacheFile = path.join(
  process.cwd(),
  ".cache",
  `${contentHash.substring(0, 16)}-analysis.json`,
);
fs.writeFileSync(hashCacheFile, JSON.stringify(cacheEntry, null, 2), "utf8");

console.log("🔐 HASH-BASED CACHE SIMULATION");
console.log("===============================");
console.log(
  `📄 Source Document: complex-tos.html (${htmlContent.length} chars)`,
);
console.log(`🔗 URL: ${url}`);
console.log(`#️⃣  Content Hash: ${contentHash}`);
console.log(`💾 Cache File: ${hashCacheFile}`);
console.log(`📊 Cache Entry Size: ${fs.statSync(hashCacheFile).size} bytes`);
console.log(`⏰ Expires: ${cacheEntry.storageInfo.expiresAt}`);

console.log("\n📋 CACHED ANALYSIS SUMMARY:");
console.log(
  `├─ Rights Score: ${analysisResults.rights.rightsScore}/100 (${analysisResults.rights.grade})`,
);
console.log(
  `├─ Readability: ${analysisResults.readability.grade} (${analysisResults.readability.difficulty})`,
);
console.log(`├─ Risk Level: ${analysisResults.rights.riskLevel}`);
console.log(
  `├─ High-Risk Clauses: ${Object.keys(cacheEntry.analysis.clauseDetection.HIGH_RISK).length}`,
);
console.log(`└─ Processing Time: ${analysisResults.analysis.processingTime}`);

console.log("\n🔍 CACHE LOOKUP SIMULATION:");
console.log("When the same document is accessed again:");
console.log(
  `1. Generate hash from URL + content: ${contentHash.substring(0, 16)}...`,
);
console.log(`2. Check cache file: ${path.basename(hashCacheFile)}`);
console.log(`3. Cache HIT ✅ - Return stored analysis`);
console.log(`4. Skip expensive re-analysis (save ~4.8 seconds)`);

// Also update localStorage simulation
const localStorageData = {
  [`tg-cache-${contentHash}`]: {
    data: analysisResults,
    timestamp: Date.now(),
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    source: "local-analysis",
  },
};

const localStorageFile = path.join(
  process.cwd(),
  ".cache",
  "localStorage.json",
);
fs.writeFileSync(
  localStorageFile,
  JSON.stringify(localStorageData, null, 2),
  "utf8",
);

console.log(`\n💾 Updated localStorage.json with cache entry`);
console.log(`🏷️  Cache Key: tg-cache-${contentHash.substring(0, 16)}...`);
