// jest.config.js - Main Jest configuration
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.minimal.js"],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__tests__/helpers/styleMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Ignore build artifacts and external libraries
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
  moduleDirectories: ["node_modules", "src"],
  // Find all .test.js files within the project
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  verbose: true,
  testTimeout: 60000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Optimized settings for CI/local debugging to prevent hanging
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  cache: false,
  silent: false,
  errorOnDeprecated: false,
};
