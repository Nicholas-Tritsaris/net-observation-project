module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'docs/**/*.js',
    'functions/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  verbose: true
};