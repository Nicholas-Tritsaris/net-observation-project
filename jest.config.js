module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'docs/**/*.js',
    'functions/**/*.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};