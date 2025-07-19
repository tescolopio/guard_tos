// jest.config.js - No setup configuration
module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__tests__/helpers/styleMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/helpers/"],
  moduleDirectories: ["node_modules", "src"],
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Optimized settings to prevent hanging
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  cache: false,
  silent: false,
  // Prevent any unexpected behavior
  errorOnDeprecated: false,
};
