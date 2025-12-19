# Net Observation Project - Test Suite

Comprehensive unit test suite for the Net Observation Project, covering all JavaScript functionality including UI components, data visualization, API integration, and application logic.

## 📊 Test Statistics

- **Total Test Files**: 14
- **Total Tests**: 343+
- **Total Lines of Test Code**: 3,000+
- **Coverage Areas**: Frontend (docs/script.js), Backend API (functions/api/censys-summary.js), HTML, CSS, Documentation

## 🧪 Test Files Overview

### Core Application Tests

#### `core-functions.test.js` (19 tests)
Tests fundamental application utilities and state management:
- ✅ `loadSettings()` - localStorage persistence loading
- ✅ `saveSettings()` - localStorage persistence saving
- ✅ `applyTheme()` - theme resolution and application
- ✅ `qs()` - querySelector helper
- ✅ `generateColorPalette()` - color generation for charts
- ✅ `markActiveNav()` - active navigation highlighting

**Key Scenarios**: Settings persistence, theme auto-detection, color palette generation, navigation state

#### `theme-toggle.test.js` (19 tests)
Tests theme switching functionality:
- ✅ Theme cycling (auto → dark → light → auto)
- ✅ Keyboard accessibility (Enter/Space keys)
- ✅ System preference detection
- ✅ Label updates
- ✅ Settings persistence

**Key Scenarios**: User theme changes, system preference changes, keyboard navigation, accessibility

#### `sidebar.test.js` (18 tests)
Tests sidebar collapse/expand behavior:
- ✅ Toggle button interaction
- ✅ Responsive behavior (mobile/desktop)
- ✅ ARIA attributes
- ✅ State management
- ✅ Icon updates

**Key Scenarios**: Mobile collapsed state, desktop open state, user toggles, accessibility

### UI Component Tests

#### `logo-placeholders.test.js` (17 tests)
Tests logo fallback system:
- ✅ Image load success handling
- ✅ Image load failure handling
- ✅ Fallback placeholder creation
- ✅ Duplicate prevention
- ✅ Alt text handling

**Key Scenarios**: Missing images, failed loads, zero-dimension images, multiple logos

#### `html-logo-integration.test.js` (13 tests)
Tests HTML structure for logo references:
- ✅ Logo image presence in all pages
- ✅ data-logo attribute usage
- ✅ Alt text requirements
- ✅ Consistency across pages

**Key Scenarios**: All 6 HTML pages verified for proper logo integration

#### `logo-styles.test.js` (26 tests)
Tests CSS styling for logos and placeholders:
- ✅ Logo image styles
- ✅ Placeholder fallback styles
- ✅ Responsive breakpoints
- ✅ Theme integration

**Key Scenarios**: Mobile styles, desktop styles, theme-aware colors

#### `e2e-logo-system.test.js` (18 tests)
End-to-end tests for complete logo system:
- ✅ HTML → CSS → JavaScript flow
- ✅ Graceful degradation
- ✅ Accessibility compliance
- ✅ Theme integration

**Key Scenarios**: Complete user journey, failure modes, progressive enhancement

### Data & Visualization Tests

#### `stats-and-data.test.js` (34 tests)
Tests statistics display and data visualization:
- ✅ `updateStatsView()` - UI updates from data
- ✅ `renderTable()` - table population and sorting
- ✅ `fetchCensysSummary()` - API data fetching
- ✅ `initDataVisualizer()` - JSON/CSV parsing and display

**Key Scenarios**: Data updates, table sorting, fetch errors, CSV parsing, JSON parsing, file uploads

#### `charts-and-viz.test.js` (35 tests)
Tests Chart.js and D3 visualizations:
- ✅ `initCharts()` - Chart.js initialization
- ✅ `updateCharts()` - Chart data updates
- ✅ `renderHeatmap()` - D3 world map rendering
- ✅ `generateColorPalette()` - color scheme generation

**Key Scenarios**: Doughnut charts, bar charts, heatmaps, color palettes, theme integration

### Terminal & Plugin Tests

#### `terminal.test.js` (31 tests)
Tests in-page terminal functionality:
- ✅ `initTerminal()` - terminal initialization
- ✅ `logTerminal()` - message logging
- ✅ Built-in commands (help, stats, theme, settings, plugins)
- ✅ Plugin system (register, list, getCommand)
- ✅ Command execution and error handling

**Key Scenarios**: Command parsing, async commands, plugin integration, error handling

### Settings & Authentication Tests

#### `settings-auth-init.test.js` (46 tests)
Tests settings management, Auth0, and initialization:
- ✅ `initSettingsPanel()` - settings UI
- ✅ `initAuth0()` - Auth0 client initialization
- ✅ `updateAuthControls()` - login/logout UI
- ✅ `initPageSpecificFeatures()` - page routing
- ✅ `init()` - application bootstrap

**Key Scenarios**: Settings persistence, Auth0 login/logout, page-specific features, initialization order

### API Integration Tests

#### `censys-api.test.js` (37 tests)
Tests Censys API summary function:
- ✅ `onRequest()` - request handler
- ✅ Authentication (Basic auth headers)
- ✅ Parallel API requests
- ✅ Data aggregation (hosts, services, countries)
- ✅ Error handling and fallbacks

**Key Scenarios**: Missing credentials, API failures, data transformation, response structure

### Documentation Tests

#### `readme-validation.test.js` (16 tests)
Tests README documentation:
- ✅ Project structure documentation
- ✅ Branding note presence
- ✅ Feature descriptions
- ✅ Link integrity

**Key Scenarios**: Documentation completeness, accurate file references

#### `script-refactoring.test.js` (14 tests)
Tests code quality and structure:
- ✅ JSDoc comments
- ✅ Function organization
- ✅ Consistent patterns

**Key Scenarios**: Documentation quality, code organization

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies (if not already installed)
npm install
```

### Run All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## 📋 Test Configuration

Tests are configured via `package.json`:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "collectCoverageFrom": [
      "docs/**/*.js",
      "!docs/**/*.test.js",
      "!**/node_modules/**"
    ],
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

### Test Setup (`setup.js`)

Provides:
- ✅ JSDOM environment for DOM testing
- ✅ `@testing-library/jest-dom` matchers
- ✅ localStorage mock
- ✅ matchMedia mock
- ✅ Automatic cleanup between tests

## 🎯 Testing Approach

### 1. Static Analysis Tests
Many tests validate the structure and logic of functions by analyzing source code:
- Ensures functions exist and have correct signatures
- Verifies key logic patterns (error handling, conditionals)
- Checks for required function calls and integrations

### 2. DOM Interaction Tests
Tests that set up DOM structures and validate behavior:
- Simulates user interactions (clicks, key presses)
- Validates DOM updates and state changes
- Ensures proper event handling

### 3. Integration Tests
Tests that verify multiple functions working together:
- End-to-end logo system flow
- HTML + CSS + JavaScript integration
- Theme system across components

### 4. Edge Case Tests
Comprehensive testing of failure modes:
- Missing DOM elements
- Failed API requests
- Invalid data formats
- Empty inputs
- Malformed JSON/CSV

## 🔍 Coverage Areas

### Frontend (docs/script.js)
- ✅ Application state management
- ✅ Theme system (auto/dark/light)
- ✅ Logo placeholder fallback
- ✅ Sidebar navigation
- ✅ Settings panel
- ✅ Statistics display
- ✅ Data visualization (tables, charts, heatmaps)
- ✅ Terminal with plugin system
- ✅ Auth0 integration
- ✅ CSV/JSON parsing
- ✅ Page-specific initialization

### Backend API (functions/api/censys-summary.js)
- ✅ Censys API integration
- ✅ Authentication headers
- ✅ Parallel request handling
- ✅ Data aggregation
- ✅ Error responses
- ✅ Response headers

### HTML/CSS/Documentation
- ✅ Logo integration across 6 pages
- ✅ CSS styling and responsive design
- ✅ README documentation
- ✅ Code organization and comments

## 🛡️ Test Quality Standards

### All tests follow these principles:

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Clarity**: Descriptive test names that explain what is being tested
3. **Completeness**: Happy paths, edge cases, and error conditions covered
4. **Maintainability**: Structured for easy updates as code evolves
5. **Real-world Scenarios**: Tests reflect actual usage patterns

### Test Naming Convention
```javascript
describe('Function or Component Name', () => {
  test('should do something specific in a given scenario', () => {
    // Arrange, Act, Assert
  });
});
```

## 📈 Continuous Improvement

### Future Enhancements
- [ ] Add mutation testing with Stryker
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add accessibility testing with axe-core
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Increase integration test coverage

## 🐛 Debugging Tests

### Run a specific test file
```bash
npm test -- censys-api.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="theme"
```

### Run with verbose output
```bash
npm test -- --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## ✅ Pre-commit Checklist

Before committing code changes:
- [ ] All tests pass: `npm test`
- [ ] No console errors or warnings
- [ ] Coverage remains high: `npm run test:coverage`
- [ ] New features have corresponding tests
- [ ] Tests are documented and clear

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [JSDOM](https://github.com/jsdom/jsdom)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all existing tests still pass
3. Add tests for happy paths, edge cases, and error conditions
4. Document test scenarios in comments
5. Update this README if adding new test files

---

**Generated**: December 2024  
**Maintainer**: Net Observation Project Team  
**Test Framework**: Jest 29.7.0 with JSDOM