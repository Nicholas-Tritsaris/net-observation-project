# Test Suite Documentation

This directory contains comprehensive unit tests for the Net Observation Project.

## Test Files

### `script.test.js`
Unit tests for `docs/script.js` focusing on:
- **initLogoPlaceholders()** - NEW function for logo fallback handling
- **applyTheme()** - Modified to remove chart refresh call
- **initSidebar()** - Modified initialization logic
- **updateStatsView()** - Removed payload display logic
- **fetchCensysSummary()** - Removed payload error display
- Theme toggle functionality
- Plugin system
- Data visualization
- localStorage integration

### `html.test.js`
Validation tests for HTML files focusing on:
- Logo markup changes (text placeholders → img tags)
- Proper use of `data-logo` attribute
- Accessibility requirements (alt text, ARIA labels)
- Consistency across all HTML files
- Removal of old `.logo-placeholder` and `.logo-inline` divs

### `css.test.js`
CSS validation tests focusing on:
- Logo styling changes
- `.logo-placeholder` class definition
- Header logo styles (`header img.logo`)
- Removal of `.logo-inline` styles
- Syntax validation
- Theme consistency

### `readme.test.js`
Documentation validation tests focusing on:
- Branding note relocation (from section to blockquote)
- Documentation structure and completeness
- Code examples and technical accuracy
- Link integrity
- Markdown formatting

### `censys-summary.test.js`
Comprehensive unit tests for `functions/api/censys-summary.js` Cloudflare Pages Function focusing on:
- **Environment validation** - Missing API credentials handling (CENSYS_API_ID, CENSYS_API_SECRET)
- **Successful API calls** - Correct data fetching, authentication, and aggregation from Censys API
- **Parallel request handling** - Verifies Promise.all usage for host, service, and country stats
- **Data aggregation** - Service count totals, country code uppercasing, bucket processing
- **Edge cases** - Empty buckets, missing result objects, null keys, very large numbers, zero counts, mixed-case country codes
- **Error handling** - HTTP errors (401, 429, 500, 502), network failures, JSON parsing errors, timeout errors, malformed responses
- **Response format validation** - Valid JSON structure, correct data types (numbers, objects, strings), required fields
- **Header validation** - Content-Type and Cache-Control headers for both success and error responses
- **Performance optimization** - Auth header reuse, parallel API calls timing
- **Integration scenarios** - Realistic production data volumes, rate limiting behavior
- **JSDoc completeness** - Validation of function documentation

### `integration.test.js`
Integration tests for component interactions and user workflows

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test file
npm test censys-summary.test.js

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Coverage

The test suite provides comprehensive coverage for:
- All modified functions in the current branch
- Backend API functions (Cloudflare Pages Functions)
- Edge cases and error conditions
- Accessibility requirements
- Cross-file consistency
- Documentation accuracy

## Testing Framework

- **Jest**: Test runner and assertion library
- **jsdom**: DOM implementation for Node.js
- Built-in mocks for localStorage, matchMedia, console, fetch, and btoa