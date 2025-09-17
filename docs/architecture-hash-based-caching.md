# Hash-Based Caching and Database Integration Architecture

## Overview

This document outlines the architecture for implementing hash-based change detection and cloud database integration for the Terms Guardian extension. This system will optimize performance by avoiding reprocessing of unchanged ToS documents and providing shared analysis results across users.

## Current Architecture Analysis

### Existing Components

- **TextCache**: Basic in-memory caching with TTL and size limits
- **Content Script**: Detects legal content on pages and initiates processing
- **Service Worker**: Handles background operations and storage
- **Processing Pipeline**: Text extraction → analysis → display

### Current Storage Mechanisms

- Chrome `storage.local` for persistent data
- In-memory `TextCache` for temporary processing results
- No content fingerprinting or change detection

## Proposed Hash-Based System

### 1. Content Hashing Service

#### Purpose

Generate unique fingerprints for ToS documents to detect changes and avoid reprocessing.

#### Implementation

```javascript
// src/services/contentHashService.js
class ContentHashService {
  constructor() {
    this.algorithm = "SHA-256";
    this.saltKey = "terms-guardian-v1";
  }

  async generateHash(url, content) {
    // Normalize content for consistent hashing
    const normalizedContent = this.normalizeContent(content);

    // Create hash input: URL + normalized content + version salt
    const hashInput = `${url}:${normalizedContent}:${this.saltKey}`;

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  normalizeContent(content) {
    return content
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s]/g, "") // Remove special characters
      .toLowerCase() // Case insensitive
      .trim();
  }

  async generateMetadata(url, content) {
    const hash = await this.generateHash(url, content);
    return {
      hash,
      url,
      contentLength: content.length,
      timestamp: Date.now(),
      version: 1,
    };
  }
}
```

### 2. Database Integration Layer

#### Purpose

Manage communication with Terms Guardian cloud database for shared processing results.

#### API Endpoints

- `GET /api/v1/document/{hash}` - Check if document analysis exists
- `POST /api/v1/document` - Store new analysis results
- `PUT /api/v1/document/{hash}` - Update existing analysis
- `GET /api/v1/user/preferences` - Get user processing preferences

#### Implementation

```javascript
// src/services/databaseService.js
class DatabaseService {
  constructor(apiBaseUrl, userToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.userToken = userToken;
    this.timeout = 5000; // 5 second timeout
  }

  async checkDocumentExists(hash) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/v1/document/${hash}`,
        {
          method: "GET",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.timeout),
        },
      );

      if (response.status === 404) {
        return { exists: false, analysis: null };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { exists: true, analysis: data };
    } catch (error) {
      console.warn(
        "Database check failed, falling back to local processing:",
        error,
      );
      return { exists: false, analysis: null };
    }
  }

  async storeAnalysis(hash, metadata, analysisResults) {
    try {
      const payload = {
        hash,
        metadata,
        analysis: analysisResults,
        timestamp: Date.now(),
      };

      const response = await fetch(`${this.apiBaseUrl}/api/v1/document`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      return response.ok;
    } catch (error) {
      console.warn("Failed to store analysis in database:", error);
      return false;
    }
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.userToken}`,
      "X-Extension-Version": chrome.runtime.getManifest().version,
    };
  }
}
```

### 3. User Preference Management

#### Purpose

Manage local vs cloud processing preferences based on user subscription status.

#### Implementation

```javascript
// src/services/userPreferenceService.js
class UserPreferenceService {
  constructor() {
    this.storageKey = "termsGuardianPreferences";
    this.defaults = {
      processingMode: "cloud", // 'cloud' | 'local'
      isPaidUser: false,
      cloudDatabaseUrl: "https://api.termsguardian.com",
      cacheRetentionDays: 30,
      autoUpdateEnabled: true,
    };
  }

  async getPreferences() {
    try {
      const result = await chrome.storage.sync.get(this.storageKey);
      return { ...this.defaults, ...result[this.storageKey] };
    } catch (error) {
      console.warn("Failed to load preferences, using defaults:", error);
      return this.defaults;
    }
  }

  async setPreferences(preferences) {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await chrome.storage.sync.set({ [this.storageKey]: updated });
      return true;
    } catch (error) {
      console.error("Failed to save preferences:", error);
      return false;
    }
  }

  async shouldUseCloudProcessing() {
    const prefs = await this.getPreferences();
    return prefs.processingMode === "cloud" && !prefs.isPaidUser;
  }
}
```

### 4. Enhanced Cache Management

#### Purpose

Manage both local and remote cache data with intelligent lookup strategies.

#### Implementation

```javascript
// src/services/enhancedCacheService.js
class EnhancedCacheService {
  constructor(textCache, databaseService, preferenceService) {
    this.textCache = textCache;
    this.databaseService = databaseService;
    this.preferenceService = preferenceService;
    this.hashService = new ContentHashService();
  }

  async getCachedAnalysis(url, content) {
    // Generate content hash
    const metadata = await this.hashService.generateMetadata(url, content);

    // Check local cache first
    const localResult = await this.textCache.get(metadata.hash, "processed");
    if (localResult && this.isValidCacheEntry(localResult)) {
      return { source: "local", data: localResult, metadata };
    }

    // Check cloud database if enabled
    if (await this.preferenceService.shouldUseCloudProcessing()) {
      const cloudResult = await this.databaseService.checkDocumentExists(
        metadata.hash,
      );
      if (cloudResult.exists) {
        // Cache locally for future use
        await this.textCache.set(
          metadata.hash,
          cloudResult.analysis,
          "processed",
        );
        return { source: "cloud", data: cloudResult.analysis, metadata };
      }
    }

    return { source: null, data: null, metadata };
  }

  async storeAnalysis(metadata, analysisResults) {
    // Always store locally
    await this.textCache.set(metadata.hash, analysisResults, "processed");

    // Store in cloud if enabled
    if (await this.preferenceService.shouldUseCloudProcessing()) {
      await this.databaseService.storeAnalysis(
        metadata.hash,
        metadata,
        analysisResults,
      );
    }
  }

  isValidCacheEntry(entry) {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    return entry && entry.timestamp && Date.now() - entry.timestamp < maxAge;
  }
}
```

## Processing Flow Modifications

### Current Flow

1. User navigates to page
2. Content script detects legal content
3. Extracts and processes text
4. Displays results in sidepanel

### New Hash-Based Flow

1. User navigates to page
2. Content script detects legal content
3. **Generate content hash and check cache**
4. If cached and valid → Display existing results
5. If not cached → Extract, process, and cache results
6. Display results in sidepanel

### Implementation in Content Script

```javascript
// Modified detectLegalAgreements method
async detectLegalAgreements(inputText) {
  try {
    const extractionResult = await this.textExtractor.extractAndAnalyzePageText();
    const url = window.location.href;

    // Check for cached analysis first
    const cacheResult = await this.enhancedCache.getCachedAnalysis(url, extractionResult.text);

    if (cacheResult.data) {
      console.log(`Using ${cacheResult.source} cached analysis for ${url}`);
      await this.displayCachedResults(cacheResult.data);
      return true;
    }

    // No cache hit - proceed with full analysis
    console.log(`Processing new content for ${url}`);
    const analysisResults = await this.performFullAnalysis(extractionResult.text);

    // Cache the results
    await this.enhancedCache.storeAnalysis(cacheResult.metadata, analysisResults);

    await this.displayResults(analysisResults);
    return true;

  } catch (error) {
    this.log(this.logLevels.ERROR, "Error in legal agreement detection:", error);
    return false;
  }
}
```

## Implementation Timeline

### Phase 1: Basic Hash System (Week 1-2)

- [ ] Implement ContentHashService
- [ ] Add hash generation to existing processing flow
- [ ] Create local hash-based cache lookup
- [ ] Test with existing content detection

### Phase 2: Enhanced Cache Management (Week 3-4)

- [ ] Implement EnhancedCacheService
- [ ] Integrate with existing TextCache
- [ ] Add cache validation and cleanup
- [ ] Implement preference management

### Phase 3: Database Integration (Week 5-8)

- [ ] Design and implement database API
- [ ] Create DatabaseService client
- [ ] Add cloud lookup and storage
- [ ] Implement user authentication

### Phase 4: User Experience (Week 9-10)

- [ ] Add settings UI for processing preferences
- [ ] Implement paid user features
- [ ] Add cache statistics and management
- [ ] Performance optimization and testing

## Benefits

1. **Performance**: Avoid reprocessing unchanged documents
2. **User Experience**: Instant results for previously analyzed content
3. **Scalability**: Shared analysis results across all users
4. **Cost Efficiency**: Reduced processing load and API calls
5. **Reliability**: Graceful fallback to local processing if cloud fails

## Considerations

1. **Privacy**: Hash-based lookups don't expose actual content
2. **Security**: Use secure hashing and API authentication
3. **Fallback**: Always maintain local processing capability
4. **Storage**: Implement cache size limits and cleanup
5. **Network**: Handle offline scenarios gracefully
