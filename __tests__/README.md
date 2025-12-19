# Test Suite for Net Observation Project

## Overview

This test suite provides comprehensive coverage for the logo sigil refactoring and related changes.

## Test Files

- **script.test.js**: Unit tests for docs/script.js functionality
  - Settings management
  - Theme switching
  - Sidebar controls
  - Data visualization
  - Plugin system
  - Terminal commands
  - And much more...

- **style.test.js**: CSS validation and structure tests
  - Logo sigil styles
  - Theme-specific styles
  - Animations
  - Responsive design
  - Removed old styles

- **html-structure.test.js**: HTML validation tests
  - Logo sigil implementation across all pages
  - Accessibility compliance
  - Semantic HTML
  - Cross-file consistency

- **readme.test.js**: Documentation tests
  - Content accuracy
  - Markdown validation
  - Updated branding information

- **integration.test.js**: Integration tests
  - HTML-CSS-JS coordination
  - Theme system integration
  - Accessibility integration
  - Migration completeness

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npx jest __tests__/script.test.js
```

## Coverage Goals

- Aim for >80% code coverage
- All public APIs should be tested
- Edge cases and error conditions covered
- Integration tests for cross-file dependencies

## Test Philosophy

These tests follow a "bias for action" approach:
- Comprehensive coverage of all scenarios
- Both happy paths and edge cases
- Validation of removed code
- Future-proofing against regressions