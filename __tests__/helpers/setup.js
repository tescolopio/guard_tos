import '@testing-library/jest-dom';
import { setupMockAnalyzers } from './testUtils';

// Setup test environment
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock timing functions
  jest.useFakeTimers();

  // Setup analyzers
  setupMockAnalyzers();

  // Mock console methods
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

// Cleanup after all tests
afterAll(() => {
  jest.useRealTimers();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test in case of unhandled rejections
  throw reason;
});
