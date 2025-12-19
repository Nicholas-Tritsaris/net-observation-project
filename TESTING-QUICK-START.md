# Testing Quick Start Guide

## 🚀 Get Started in 30 Seconds

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 What Gets Tested

### ✅ Frontend (docs/script.js)
- Logo placeholder system with fallbacks
- Theme management (auto/dark/light)
- Sidebar navigation
- Data visualization
- Plugin system
- Terminal commands

### ✅ Backend (functions/api/censys-summary.js) ⭐ NEW
- Censys API integration
- Authentication & security
- Data aggregation
- Error handling
- Response formatting

### ✅ UI (HTML/CSS)
- 6 HTML files validated
- Logo markup changes
- CSS styling verification
- Accessibility compliance

### ✅ Documentation (README.md)
- Structure validation
- Content accuracy
- Code examples

## 📁 Test Files

| File | Purpose | Tests | Lines |
|------|---------|-------|-------|
| `__tests__/script.test.js` | Frontend JS unit tests | 60+ | 914 |
| `__tests__/integration.test.js` | Component interactions | 40+ | 617 |
| `__tests__/html.test.js` | HTML validation | 100+ | 254 |
| `__tests__/css.test.js` | CSS validation | 30+ | 244 |
| `__tests__/readme.test.js` | Documentation tests | 50+ | 478 |
| `__tests__/censys-summary-api.test.js` | Backend API tests ⭐ | 70+ | 827 |

**Total: 400+ tests, 4,321 lines**

## 🎯 Run Specific Tests

```bash
# Backend API tests only
npm test censys-summary-api

# Frontend tests only
npm test script.test

# HTML/CSS validation
npm test html.test
npm test css.test

# Integration tests
npm test integration.test

# Tests matching a pattern
npm test -- --testNamePattern="logo"
npm test -- --testNamePattern="theme"
npm test -- --testNamePattern="API"
```

## 📈 Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in your browser to see:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines

## ✅ Expected Results

When you run `npm test`, you should see: