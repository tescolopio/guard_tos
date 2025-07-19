const path = require("path");

module.exports = {
  // Use Node environment to avoid jsdom hanging issues
  testEnvironment: "node",

  // Setup files for minimal configuration
  setupFilesAfterEnv: ["<rootDir>/jest.setup.minimal.js"],

  // Root directory configuration
  rootDir: path.resolve(__dirname),

  // Test file patterns
  testMatch: ["<rootDir>/__tests__/**/*.test.js", "<rootDir>/**/*.test.js"],

  // Module resolution
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__tests__/helpers/styleMock.js",
  },

  // Exclude problematic test files temporarily
  testPathIgnorePatterns: [
    // "<rootDir>/node_modules/",
    // "<rootDir>/__tests__/unit/serviceWorker.test.js",
    // "<rootDir>/__tests__/unit/content.test.js",
    // "<rootDir>/__tests__/unit/webpack.prod.test.js",
  ],

  // Execution configuration
  maxWorkers: 1,

  // Exit and cleanup configuration
  forceExit: true,
  detectOpenHandles: true,

  // Cache and performance
  cache: false,
  clearMocks: true,
  restoreMocks: true,

  // Coverage configuration (disabled for performance)
  collectCoverage: false,

  // Timeout configuration
  testTimeout: 10000,

  // Module file extensions
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx"],

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Verbose output
  verbose: true,

  // Bail on first failure for faster feedback
  bail: 1,

  // Silent console output during tests
  silent: false,

  // Error reporting
  errorOnDeprecated: false,

  // Global setup
  globals: {
    "process.env.NODE_ENV": "test",
  },
};
