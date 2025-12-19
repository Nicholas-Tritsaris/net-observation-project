# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Net Observation Project.

## Test Structure

### `script.test.js`
Tests for the frontend JavaScript functionality in `docs/script.js`:
- **Logo Placeholder System**: Tests the new `initLogoPlaceholders` function including:
  - Fallback creation when images fail to load
  - Handling of missing image dimensions
  - Prevention of duplicate fallbacks
  - Multiple logo image processing
  - Default alt text handling
- **Theme Management**: Tests for dark/light/auto theme switching
- **Settings Management**: LocalStorage persistence and error handling
- **Sidebar Management**: Responsive behavior and toggle functionality
- **Data Processing**: CSV parsing and JSON handling
- **Color Palette Generation**: HSL color generation for charts
- **Plugin System**: Plugin registration and command handling

### `censys-summary.test.js`
Tests for the Cloudflare Pages Function in `functions/api/censys-summary.js`:
- **Environment Variable Validation**: Ensures proper credential checking
- **Successful API Responses**: Tests data aggregation from three Censys endpoints
- **Error Handling**: Network failures, API errors, and malformed responses
- **Data Processing Edge Cases**: Null values, missing fields, special characters
- **Response Format Validation**: Ensures consistent response structure

### `html-validation.test.js`
Tests for HTML file structure and logo implementation:
- **Logo Implementation**: Validates img elements with data-logo attributes
- **Migration Verification**: Ensures old placeholder divs are removed
- **Cross-file Consistency**: Validates consistent implementation across all pages
- **Accessibility**: Checks for proper alt text and semantic HTML

### `css-validation.test.js`
Tests for CSS styling changes:
- **Logo Placeholder Styles**: New gradient-based placeholder styling
- **Header Logo Styles**: Logo sizing and drop-shadow effects
- **Removed Styles**: Verification that old .logo-inline styles are removed
- **Theme Support**: Dark/light theme variables
- **Responsive Design**: Media query presence

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite provides comprehensive coverage of:
- ✅ New logo placeholder fallback system (script.js)
- ✅ Backend API function (censys-summary.js)
- ✅ HTML structure validation (all .html files)
- ✅ CSS styling changes (style.css)
- ✅ Theme management
- ✅ Settings persistence
- ✅ Data processing utilities
- ✅ Plugin system
- ✅ Error handling and edge cases

## Key Testing Scenarios

### Happy Paths
- Successful API responses with valid data
- Logo images loading successfully
- Theme switching between auto/dark/light
- Settings save and load operations
- Plugin registration and execution

### Edge Cases
- Missing or null data values
- Empty API responses
- Malformed JSON
- Missing environment variables
- Corrupted localStorage data
- Images failing to load
- Zero or very large numbers
- Special characters in data

### Failure Conditions
- Network failures
- API authentication errors
- Missing required fields
- Invalid data formats
- Duplicate operations

## Dependencies

- **Jest**: Test framework
- **@jest/globals**: Jest ESM support
- **jest-environment-jsdom**: DOM testing environment for frontend tests

## Notes

- Tests use ES modules (type: "module" in package.json)
- Frontend tests run in jsdom environment
- Backend tests run in Node environment
- All tests mock external dependencies (fetch, localStorage, etc.)
- Tests are designed to be deterministic and run in isolation