# Test Suite Documentation

This directory contains comprehensive tests for the Net Observation Project, focusing on changes made in the current branch.

## Test Coverage

### 1. Unit Tests (`tests/unit/`)

Tests for JavaScript functionality in `docs/script.js`:

- **Theme Management**: Tests for the simplified theme application (removed `refreshChartThemes()`)
- **Sidebar Initialization**: Tests for the new direct `classList.add('open')` approach
- **API Payload Display**: Verifies removal of `#apiPayload` element handling
- **Auth0 Integration**: Tests for simplified early-return pattern
- **Data Visualization**: CSV/JSON parsing and rendering
- **Plugin System**: Plugin registration and command execution
- **Terminal Commands**: Command parsing and execution
- **Chart Generation**: Color palette generation and chart updates
- **Settings Persistence**: LocalStorage operations
- **Navigation**: Active link highlighting
- **Error Handling**: Graceful degradation

**Run unit tests:**
```bash
npm run test:unit
```

### 2. End-to-End Tests (`tests/e2e/`)

Visual and functional tests for CSS changes in `docs/style.css`:

- **Logo Sigil Rendering**: CSS-generated neon logo with pseudo-elements
- **Animation**: `logoSweep` keyframes and transitions
- **Responsive Design**: Size adjustments across viewports
- **Theme Variants**: Dark and light theme styling
- **Hover Effects**: Transform and box-shadow transitions
- **Accessibility**: ARIA labels, keyboard navigation, color contrast
- **Cross-Page Consistency**: Logo rendering across all pages
- **Performance**: Layout stability and render efficiency

**Run E2E tests:**
```bash
npm run test:e2e
```

**Prerequisites for E2E tests:**
- Install Playwright browsers: `npx playwright install`
- Tests automatically start a local server on port 8080

### 3. Backend Tests (`tests/backend/`)

Tests for the Cloudflare Pages Function in `functions/api/censys-summary.js`:

- **Environment Variables**: Credential validation
- **Authentication**: Basic auth header construction
- **API Endpoints**: URL construction and request formatting
- **Response Processing**: Data aggregation and normalization
- **Error Handling**: 502 responses with preserved structure
- **Parallel Calls**: Promise.all orchestration
- **Edge Cases**: Empty data, zero values, malformed responses

**Run backend tests:**
```bash
npm run test:backend
```

## Branch-Specific Changes Tested

### JavaScript Changes (script.js)
1. ✅ Removed `refreshChartThemes()` function - no longer called
2. ✅ Simplified sidebar initialization - direct class addition
3. ✅ Removed `#apiPayload` element updates
4. ✅ Simplified Auth0 initialization - early return pattern
5. ✅ Removed redundant `initTerminal()` call on data page

### CSS Changes (style.css)
1. ✅ New `.logo-sigil` class with animated pseudo-elements
2. ✅ Removed `.logo-placeholder` and `.logo-inline` classes
3. ✅ `logoSweep` animation keyframes
4. ✅ Responsive sizing with CSS custom properties
5. ✅ Light/dark theme variants
6. ✅ Hover interactions with transform and scale

### HTML Changes (all docs/*.html files)
1. ✅ Updated class names from `logo-placeholder` to `logo-sigil--sidebar`
2. ✅ Updated class names from `logo-inline` to `logo-sigil--header`
3. ✅ Consistent ARIA labels across all pages

## Running All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (useful during development)
npm run test:watch
```

## Test Configuration

- **Vitest**: Unit and backend tests with Happy DOM for browser API simulation
- **Playwright**: E2E tests across Chromium, Firefox, WebKit, and mobile Chrome
- **Coverage**: V8 provider with HTML, JSON, and text reports

## CI/CD Integration

Tests are designed to run in CI environments:
- Playwright retries failing tests automatically in CI
- Tests use a single worker in CI for stability
- Coverage reports are generated in CI for analysis

## Writing New Tests

When adding new features:

1. **Unit tests** for JavaScript logic and pure functions
2. **E2E tests** for visual changes and user interactions
3. **Backend tests** for API endpoints and data processing

Follow existing patterns for consistency and maintainability.

## Troubleshooting

### E2E Tests Failing
- Ensure local server is running: `npx http-server docs -p 8080`
- Install Playwright browsers: `npx playwright install`
- Check viewport sizes match test expectations

### Unit Tests Failing
- Clear localStorage mock: `localStorage.clear()`
- Verify mock implementations match actual browser APIs
- Check for async/await issues with timers

### Backend Tests Failing
- Verify `btoa` polyfill for Node.js environment
- Check mock fetch responses match actual Censys API format
- Ensure error cases preserve response structure