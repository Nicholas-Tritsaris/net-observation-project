# Test Suite for Net Observation Project

This directory contains comprehensive tests for changes made in the current branch compared to main.

## Quick Start

```bash
npm install
npm test
```

## Test Organization

- **tests/unit/** - JavaScript unit tests (150+ tests)
- **tests/integration/** - HTML and documentation tests (160+ tests)
- **tests/visual/** - CSS validation tests (85+ tests)

## Coverage Summary

| File | Tests | Suites |
|------|-------|--------|
| docs/script.js | 150+ | 15 |
| docs/style.css | 85+ | 12 |
| HTML files (6) | 120+ | 10 |
| README.md | 40+ | 6 |
| **TOTAL** | **395+** | **43** |

## Documentation

- **TESTING_QUICKSTART.md** - Quick reference guide
- **TEST_IMPLEMENTATION_SUMMARY.md** - Implementation details
- **FINAL_TEST_SUMMARY.md** - Comprehensive overview
- **tests/TEST_SUMMARY.md** - Detailed coverage breakdown

## Running Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Specific categories
npm test tests/unit              # JavaScript
npm test tests/integration       # HTML + README
npm test tests/visual            # CSS

# Validate without Jest
node tests/run-tests.js
```

## What Gets Tested

### JavaScript Changes
- ❌ Removed: `refreshChartThemes()` function
- ✅ Modified: Sidebar initialization, Auth0 logic
- ✅ Edge cases, error handling, pure functions

### CSS Changes
- ✅ New: `.logo-sigil` with animations and variants
- ❌ Removed: `.logo-placeholder`, `.logo-inline`
- ✅ Responsive design, accessibility, performance

### HTML Changes
- ✅ Class migration: old classes → `logo-sigil` variants
- ✅ All 6 files validated for consistency
- ✅ Accessibility attributes verified

### Documentation Changes
- ❌ Removed: Old branding section
- ✅ Added: New inline branding note
- ✅ References to CSS-generated sigil

## CI/CD Integration

```yaml
# GitHub Actions example
- run: npm install
- run: npm test -- --coverage
```

## References

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [JSDOM](https://github.com/jsdom/jsdom)