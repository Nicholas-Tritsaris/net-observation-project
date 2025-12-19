# Test Coverage Documentation

This document provides an overview of the comprehensive test suite for the Net Observation Project.

## Test Summary

- **Total Test Files**: 13
- **Total Test Cases**: 343+
- **Testing Framework**: Jest with jsdom
- **Coverage Target**: All changed files in current branch vs main

## Test Files Overview

### Core JavaScript Functionality

#### 1. **script-core-functions.test.js** (36 tests)
Tests core utility functions and data management:
- `loadSettings()` - localStorage persistence (5 tests)
- `saveSettings()` - settings serialization (3 tests)
- `generateColorPalette()` - color generation for charts (8 tests)
- `renderTable()` - table population and sorting (12 tests)
- `markActiveNav()` - navigation highlighting (4 tests)
- `qs()` - DOM query utility (4 tests)

**Coverage**: Pure functions, edge cases, null safety, data formatting

#### 2. **terminal-and-visualizer.test.js** (29 tests)
Tests terminal UI and data visualization:
- `logTerminal()` - terminal output and scrolling (9 tests)
- `initDataVisualizer()` - JSON/CSV parsing (6 tests)
- `initVersionList()` - version card rendering (5 tests)
- `initDocsSidebar()` - smooth scrolling (3 tests)
- `initPageSpecificFeatures()` - page-specific initialization (6 tests)

**Coverage**: UI interactions, data parsing, error handling, missing elements

#### 3. **charts-and-settings.test.js** (47 tests)
Tests Chart.js integration and settings management:
- `initCharts()` - chart initialization (8 tests)
- `updateCharts()` - chart data updates (11 tests)
- `updateStatsView()` - stats display (10 tests)
- `initSettingsPanel()` - settings form (10 tests)
- `updateAuthControls()` - Auth0 integration (8 tests)

**Coverage**: Chart lifecycle, data binding, form handling, Auth0 states

#### 4. **theme-and-sidebar.test.js** (46 tests)
Tests theme system and sidebar functionality:
- `applyTheme()` - theme application (7 tests)
- `initThemeToggle()` - theme toggle control (14 tests)
- `initSidebar()` - sidebar collapse/expand (11 tests)
- Theme system integration (4 tests)
- Responsive behavior (4 tests)
- Preference detection (6 tests)

**Coverage**: Theme modes, system preferences, keyboard navigation, viewport handling

#### 5. **api-fetch-and-refresh.test.js** (38 tests)
Tests API fetching and auto-refresh:
- `fetchCensysSummary()` - API data fetching (22 tests)
- `initAutoRefresh()` - polling mechanism (8 tests)
- API integration (5 tests)
- Error handling edge cases (3 tests)

**Coverage**: HTTP requests, error scenarios, data flow, retry logic

#### 6. **initialization-and-integration.test.js** (62 tests)
Tests application bootstrap and component integration:
- `init()` - initialization sequence (14 tests)
- DOMContentLoaded handling (5 tests)
- AppState management (8 tests)
- AppPlugins system (5 tests)
- Component integration (5 tests)
- Echo plugin registration (5 tests)
- Global constants (4 tests)
- Error resilience (1 test)
- Code quality (8 tests)
- Module structure (3 tests)
- Browser compatibility (5 tests)

**Coverage**: Startup sequence, state management, plugin system, compatibility

### API Endpoint Tests

#### 7. **censys-api.test.js** (21 tests)
Tests Cloudflare Functions API endpoint:
- `responseHeaders()` - HTTP headers (4 tests)
- `onRequest()` - missing credentials (3 tests)
- `onRequest()` - successful response (6 tests)
- `onRequest()` - error handling (5 tests)
- Authentication (3 tests)

**Coverage**: Request handling, data aggregation, error responses, auth headers

### HTML/CSS Integration Tests

#### 8. **html-logo-integration.test.js** (13 tests)
Tests logo HTML changes across all pages:
- Sidebar logo validation (6 pages × 2 tests)
- Header logo validation (6 pages × 2 tests)
- Old markup removal verification
- Cross-page consistency

**Coverage**: HTML structure, attribute presence, legacy code removal

#### 9. **logo-styles.test.js** (26 tests)
Tests CSS styling for logo system:
- Header logo styles (7 tests)
- Placeholder styles (7 tests)
- Sidebar-specific styles (3 tests)
- Responsive design (5 tests)
- Theme integration (4 tests)

**Coverage**: CSS selectors, responsive breakpoints, theme variables

#### 10. **e2e-logo-system.test.js** (18 tests)
End-to-end tests for complete logo system:
- Complete flow (4 tests)
- Initialization order (3 tests)
- Graceful degradation (3 tests)
- Accessibility (3 tests)
- Theme integration (3 tests)
- Responsive design (2 tests)

**Coverage**: HTML → CSS → JS integration, accessibility, fallbacks

### Logo JavaScript Tests

#### 11. **logo-placeholders.test.js** (17 tests)
Tests logo placeholder fallback system:
- Image load success (2 tests)
- Image load failure (5 tests)
- Multiple images (2 tests)
- Edge cases (8 tests)

**Coverage**: Image error handling, fallback creation, duplicate prevention

### Documentation Tests

#### 12. **readme-validation.test.js** (16 tests)
Tests README.md structure and content:
- Structure validation (6 tests)
- Content verification (6 tests)
- Branding documentation (4 tests)

**Coverage**: Documentation structure, content accuracy, completeness

### Refactoring Tests

#### 13. **script-refactoring.test.js** (14 tests)
Tests for code refactoring changes:
- `applyTheme()` refactoring (3 tests)
- `initSidebar()` refactoring (3 tests)
- `updateStatsView()` cleanup (1 test)
- `fetchCensysSummary()` cleanup (1 test)
- `refreshChartThemes()` removal (1 test)
- `initAuth0()` refactoring (5 tests)

**Coverage**: Code cleanup verification, removed functionality, optimizations

## Test Categories

### Happy Path Tests
- Valid data processing
- Successful API calls
- Normal user interactions
- Expected UI updates

### Edge Cases
- Empty data sets
- Null/undefined values
- Zero values
- Missing DOM elements
- Invalid JSON
- Large data sets

### Error Handling
- Network failures
- API errors (4xx, 5xx)
- localStorage access errors
- JSON parse errors
- Missing configuration
- CORS errors
- Timeout errors

### Browser Compatibility
- matchMedia fallbacks
- addEventListener vs addListener
- localStorage availability
- Modern JS feature usage

### Accessibility
- ARIA attributes
- Alt text presence
- Keyboard navigation
- Screen reader support

### Performance
- Debouncing/throttling
- Auto-refresh intervals
- DOM manipulation efficiency
- Large dataset handling

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- script-core-functions.test.js

# Run tests matching pattern
npm test -- --testNamePattern="loadSettings"
```

## Test Structure

Each test file follows a consistent structure:

```javascript
describe('Component/Feature', () => {
  beforeAll(() => {
    // One-time setup
  });

  beforeEach(() => {
    // Per-test setup
    // Mock functions
    // Reset DOM
  });

  afterEach(() => {
    // Per-test cleanup
  });

  describe('Function/Method', () => {
    test('should handle normal case', () => {
      // Arrange
      // Act
      // Assert
    });

    test('should handle edge case', () => {
      // Test edge case
    });

    test('should handle error case', () => {
      // Test error handling
    });
  });
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## Test Utilities

### Setup File (`tests/setup.js`)
- Jest DOM matchers
- localStorage mock
- matchMedia mock
- Global reset hooks

### Mocking Strategy
- DOM elements created per test
- External APIs mocked with jest.fn()
- localStorage mocked globally
- Chart.js mocked when needed
- fetch API mocked per test

## Known Limitations

1. **Chart.js Integration**: Full Chart.js behavior not tested; only API contracts
2. **D3 Visualizations**: Heatmap rendering mocked; visual output not validated
3. **Auth0**: Authentication flow mocked; real OAuth not tested
4. **File Uploads**: File input interactions have limited testing
5. **Timing**: Some auto-refresh tests use fake timers

## Future Enhancements

- [ ] Add visual regression tests for CSS changes
- [ ] Add integration tests with real Censys API (sandboxed)
- [ ] Add performance benchmarks
- [ ] Add accessibility automation (axe-core)
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Add mutation testing
- [ ] Increase branch coverage to > 85%

## Maintenance

- Update tests when adding new features
- Refactor tests to match code refactoring
- Keep test descriptions clear and descriptive
- Avoid test interdependencies
- Mock external dependencies consistently
- Use descriptive variable names in tests

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Group related tests in describe blocks
3. Test happy path, edge cases, and errors
4. Mock external dependencies
5. Clean up after tests (DOM, timers, mocks)
6. Add JSDoc comments for complex test logic
7. Ensure tests are deterministic