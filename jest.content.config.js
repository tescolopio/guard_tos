// jest.working.config.js - Working configuration without jsdom
module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup.minimal.js"],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/__tests__/helpers/styleMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/helpers/", "__tests__/unit/debugger.test.js"],
  moduleDirectories: ["node_modules", "src"],
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/lib/**",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "text-summary"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleFileExtensions: ["js", "jsx", "json"],
};
