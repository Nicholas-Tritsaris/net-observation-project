# Test Execution Guide

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install

# Run all tests
npm test
```

## Detailed Test Execution

### Unit Tests Only
```bash
npm run test:unit
```
Tests JavaScript functions from `docs/script.js` focusing on:
- Theme management without `refreshChartThemes()`
- Simplified sidebar initialization
- Removed API payload display
- Streamlined Auth0 setup

### Backend Tests Only
```bash
npm run test:backend
```
Tests the Cloudflare Pages Function `functions/api/censys-summary.js` for:
- Environment variable validation
- Censys API integration
- Error handling and response structure

### E2E Tests Only
```bash
npm run test:e2e
```
Visual and functional tests for CSS changes:
- Logo sigil rendering and animation
- Responsive design across devices
- Theme switching (dark/light)
- Cross-browser compatibility

### With Coverage Report
```bash
npm run test:coverage
```
Generates coverage reports in `coverage/` directory.

### Watch Mode (Development)
```bash
npm run test:watch
```
Automatically re-runs tests on file changes.

## Test Results Interpretation

### ✅ Expected Results
All tests should pass, demonstrating:
1. Removed functions are no longer called
2. New logo CSS renders correctly
3. Backend function handles all edge cases
4. Responsive design works across viewports

### 📊 Coverage Targets
- **Unit tests**: >90% coverage of script.js
- **Backend tests**: 100% coverage of censys-summary.js
- **E2E tests**: All critical user flows validated

## Continuous Integration

Tests are CI-ready with:
- Retry logic for flaky tests
- Headless browser execution
- Coverage report generation
- Screenshot capture on failures

## Test Files Overview