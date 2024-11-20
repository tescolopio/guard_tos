import { mockChromeAPI, mockAnalyzers } from './mockData';

/**
 * Sets up a clean DOM environment for testing
 * @param {string} innerHTML - Optional HTML to insert into body
 */
export const setupTestDOM = (innerHTML = '') => {
  document.body.innerHTML = innerHTML;
};

/**
 * Resets all mocks and cleans up the testing environment
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
};

/**
 * Creates a mock Chrome API environment
 * @param {Object} customImplementation - Optional custom implementation
 * @returns {Object} Mock Chrome API
 */
export const setupChromeAPI = (customImplementation = {}) => {
  global.chrome = {
    ...mockChromeAPI,
    ...customImplementation
  };
  return global.chrome;
};

/**
 * Sets up mock analyzers
 */
export const setupMockAnalyzers = () => {
  Object.assign(global, mockAnalyzers);
};

/**
 * Helper to wait for promises to resolve
 * @param {number} ms - Milliseconds to wait
 */
export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to wait for all promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

/**
 * Creates a mock storage event
 * @param {string} key - Storage key
 * @param {*} newValue - New value
 * @param {*} oldValue - Old value
 */
export const createStorageEvent = (key, newValue, oldValue = null) => {
  return new StorageEvent('storage', {
    key,
    newValue: JSON.stringify(newValue),
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    storageArea: localStorage
  });
};

/**
 * Simulates a DOM mutation
 * @param {Element} target - Target element
 * @param {string} type - Mutation type
 */
export const simulateMutation = (target, type = 'childList') => {
  const observer = new MutationObserver(() => {});
  observer.observe(target, { childList: true, subtree: true });
  
  if (type === 'childList') {
    const div = document.createElement('div');
    target.appendChild(div);
    target.removeChild(div);
  }
  
  observer.disconnect();
};

/**
 * Creates a mock message event
 * @param {Object} message - Message data
 * @returns {MessageEvent} Mock message event
 */
export const createMessageEvent = (message) => {
  return new MessageEvent('message', {
    data: message,
    origin: 'chrome-extension://mock-id'
  });
};

/**
 * Simulates script injection
 * @param {string} src - Script source
 */
export const injectScript = (src) => {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
  return script;
};
