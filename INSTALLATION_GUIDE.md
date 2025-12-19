# Test Suite Installation & Usage Guide

## ✅ What Has Been Created

A complete test suite with **2,302 lines of test code** covering all changes in your branch.

### Files Created (13 total):
1. `package.json` - Jest configuration and npm scripts
2. `tests/setup.js` - Test environment configuration
3. `tests/script-core.test.js` - 340 lines, 25 tests
4. `tests/script-data.test.js` - 256 lines, 21 tests
5. `tests/script-terminal.test.js` - 304 lines, 23 tests
6. `tests/script-api.test.js` - 241 lines, 17 tests
7. `tests/script-settings.test.js` - 204 lines, 14 tests
8. `tests/script-navigation.test.js` - 193 lines, 15 tests
9. `tests/censys-function.test.js` - 342 lines, 22 tests
10. `tests/html-validator.js` - 143 lines
11. `tests/css-validator.js` - 116 lines
12. `tests/README.md` - Complete documentation
13. `TEST_SUMMARY.md` - Detailed overview

### Total Test Coverage:
- **137 unit tests** (Jest)
- **HTML validation** for 6 files
- **CSS validation** for styles
- **~2,300 lines** of test code

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

This will install:
- `jest` - Testing framework
- `jest-environment-jsdom` - DOM environment for browser testing
- `@jest/globals` - Jest global functions

### Step 2: Run Tests
```bash
npm test
```

Expected output: