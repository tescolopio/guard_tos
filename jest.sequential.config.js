// jest.config.js - Sequential test execution configuration
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.minimal.js"],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__tests__/helpers/styleMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/helpers/"],
  moduleDirectories: ["node_modules", "src"],
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  verbose: true,
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Force absolute sequential execution
  maxWorkers: 1,
  maxConcurrency: 1,
  forceExit: true,
  detectOpenHandles: true,
  cache: false,
  silent: false,
  // Prevent any unexpected behavior
  errorOnDeprecated: false,
  // Bail on first failure to prevent cascading issues
  bail: false,
};
