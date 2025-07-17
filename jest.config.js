// jest.config.js - Optimized configuration for Terms Guardian
module.exports = {
  testEnvironment: "node",
  // Removed setup files - they were causing hanging issues
  // setupFiles: ["<rootDir>/jest.setup.minimal.js"],
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
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleFileExtensions: ["js", "jsx", "json"],
};
