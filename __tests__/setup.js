/**
 * Test Setup and Configuration
 * Global test utilities and mocks
 */

// Mock browser APIs for jsdom
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Suppress console warnings in tests unless debugging
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Add custom matchers if needed
expect.extend({
  toContainClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to contain class "${className}"`
    };
  }
});