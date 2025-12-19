# Test Suite for Net Observation Project

This directory contains comprehensive unit tests for the changes made in the current branch.

## Test Structure

### JavaScript Tests (Jest)
- `script-core.test.js` - Core functionality: settings, themes, logo placeholders
- `script-data.test.js` - Data handling, visualization, CSV/JSON parsing
- `script-terminal.test.js` - Terminal, commands, plugin system
- `script-api.test.js` - API fetching, Auth0 integration
- `script-settings.test.js` - Settings panel and form handling
- `script-navigation.test.js` - Navigation, page features, docs sidebar
- `censys-function.test.js` - Cloudflare Pages Function tests

### Validation Tests (Node.js)
- `html-validator.js` - HTML structure, accessibility, logo implementation
- `css-validator.js` - CSS styles, theme variables, logo placeholder styles

## Running Tests

Install dependencies:
```bash
npm install
```

Run all Jest tests:
```bash
npm test
```

Run with coverage:
```bash
npm test:coverage
```

Run HTML validation:
```bash
npm run test:html
```

Run CSS validation:
```bash
npm run test:css
```

Run all tests:
```bash
npm run test:all
```

## Test Coverage

The test suite covers:

### New Functionality (Primary Focus)
- ✅ `initLogoPlaceholders()` - Image fallback creation and verification
- ✅ Logo image error handling
- ✅ Fallback text generation from alt attributes
- ✅ Multiple logo image support
- ✅ Duplicate fallback prevention

### Modified Functionality
- ✅ Theme application (removed chart theme refresh)
- ✅ Sidebar initialization (simplified state setting)
- ✅ Settings panel form handling
- ✅ Auth0 initialization guard clauses

### Core Functionality
- ✅ Settings persistence (localStorage)
- ✅ Theme toggling (auto/dark/light)
- ✅ Data fetching and updates
- ✅ Table rendering and sorting
- ✅ Terminal commands
- ✅ Plugin system
- ✅ CSV/JSON parsing
- ✅ Navigation and page initialization
- ✅ Censys API integration
- ✅ Error handling

### Validation Tests
- ✅ HTML structure and accessibility
- ✅ Logo image attributes (src, alt, data-logo)
- ✅ CSS logo placeholder styles
- ✅ Theme variable definitions
- ✅ Responsive design validation

## Key Test Scenarios

### Logo Placeholder Tests
1. Creates fallback for missing images
2. Uses alt text for placeholder content
3. Verifies image dimensions before fallback
4. Prevents duplicate fallbacks
5. Handles multiple logo images
6. Validates HTML implementation
7. Validates CSS styling

### Theme Tests
1. Applies dark/light themes correctly
2. Resolves auto theme from system preference
3. Cycles through theme modes
4. Updates UI labels
5. Handles keyboard interaction

### Data Processing Tests
1. Parses CSV with various formats
2. Handles JSON objects and arrays
3. Renders tables with sorting
4. Formats numbers with locale separators
5. Handles missing/null data gracefully

### API Tests
1. Fetches from correct endpoints
2. Handles HTTP errors
3. Processes Censys data structure
4. Creates proper auth headers
5. Returns structured responses

## Coverage Goals

- Line coverage: >80%
- Branch coverage: >75%
- Function coverage: >85%

Focus areas:
- New `initLogoPlaceholders()` function: 100%
- Modified functions: >90%
- Error handling paths: >80%