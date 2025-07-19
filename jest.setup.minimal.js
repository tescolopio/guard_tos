// jest.setup.minimal.js - Minimal setup without potential hanging issues
const { TextEncoder, TextDecoder } = require("util");

// Basic polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Basic DOM-like objects for Node.js environment
global.document = {
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
    },
    style: {},
    innerHTML: "",
    textContent: "",
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
  },
  readyState: "complete",
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = {
  document: global.document,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    href: "http://localhost",
    hostname: "localhost",
    pathname: "/",
  },
};
