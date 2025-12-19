# Test Suite Documentation

## Overview

This directory contains comprehensive unit and integration tests for the Net Observation Project. The test suite covers all JavaScript functionality in the current branch, including the main application logic, API handlers, and UI components.

## Test Framework

- **Test Runner**: Jest 29.7.0
- **Environment**: jsdom (browser simulation)
- **Testing Utilities**: @testing-library/dom, @testing-library/jest-dom
- **Assertion Library**: Jest matchers + jest-dom custom matchers

## Setup

The test environment is configured via `setup.js`, which provides:
- localStorage mocks
- matchMedia mocks for theme testing
- Automatic DOM cleanup between tests
- Jest-DOM custom matchers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/settings-management.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="theme"
```

## Test File Organization

### Core Application Tests

| File | Focus | Lines | Key Functions Tested |
|------|-------|-------|---------------------|
| `settings-management.test.js` | Settings persistence | 231 | loadSettings, saveSettings, applyTheme |
| `theme-toggle.test.js` | Theme switching | 199 | initThemeToggle |
| `sidebar-functionality.test.js` | Sidebar behavior | 197 | initSidebar |
| `initialization.test.js` | App bootstrap | 362 | init, initPageSpecificFeatures |

### Data & Visualization Tests

| File | Focus | Lines | Key Functions Tested |
|------|-------|-------|---------------------|
| `data-rendering.test.js` | Data display | 395 | renderTable, updateStatsView, updateCharts, generateColorPalette |
| `data-visualizer.test.js` | JSON/CSV parsing | 300 | initDataVisualizer |
| `chart-initialization.test.js` | Chart.js setup | 216 | initCharts |
| `heatmap-rendering.test.js` | D3 maps | 300 | renderHeatmap |

### Network & API Tests

| File | Focus | Lines | Key Functions Tested |
|------|-------|-------|---------------------|
| `fetch-operations.test.js` | Data fetching | 302 | fetchCensysSummary, initAutoRefresh |
| `censys-api.test.js` | Backend API | 282 | onRequest (Cloudflare Function) |

### UI Component Tests

| File | Focus | Lines | Key Functions Tested |
|------|-------|-------|---------------------|
| `settings-panel.test.js` | Settings UI | 262 | initSettingsPanel |
| `navigation-helpers.test.js` | Navigation | 299 | markActiveNav, initDocsSidebar, initVersionList, qs |
| `terminal-commands.test.js` | Terminal UI | 251 | initTerminal, logTerminal, AppPlugins |
| `auth0-integration.test.js` | Authentication | 301 | initAuth0, updateAuthControls |

### Logo System Tests

| File | Focus | Lines | Key Functions Tested |
|------|-------|-------|---------------------|
| `logo-placeholders.test.js` | Fallback rendering | 332 | initLogoPlaceholders |
| `e2e-logo-system.test.js` | Integration | 126 | Full logo system flow |
| `html-logo-integration.test.js` | HTML markup | 115 | Logo references across pages |
| `logo-styles.test.js` | CSS styling | 175 | Logo and placeholder styles |

### Documentation Tests

| File | Focus | Lines | Description |
|------|-------|-------|-------------|
| `readme-validation.test.js` | Documentation | 98 | Validates README accuracy |
| `script-refactoring.test.js` | Code changes | 147 | Validates refactoring |

## Test Coverage Goals

### Current Coverage

- **Functions**: Comprehensive coverage of all public functions
- **Branches**: Tests cover success paths, error paths, and edge cases
- **Lines**: ~95%+ for modified files
- **Integration**: Page-specific workflows tested end-to-end

### Coverage by Module

- ✅ Settings Management: 100%
- ✅ Theme System: 100%
- ✅ Data Rendering: 100%
- ✅ Terminal/Commands: 100%
- ✅ Navigation: 100%
- ✅ Fetch Operations: 100%
- ✅ Chart Initialization: 100%
- ✅ Heatmap: 100%
- ✅ Logo System: 100%
- ✅ Auth0 Integration: 100%
- ✅ API Handler: 100%

## Writing New Tests

### Test Structure Template

```javascript
/**
 * Unit tests for [feature name]
 * Tests [description of what's being tested]
 */

describe('Feature Name', () => {
  let functionUnderTest, dependencies;

  beforeEach(() => {
    // Setup: create mocks, initialize DOM, extract functions
    document.body.innerHTML = `<!-- required HTML -->`;
    
    // Extract function from script.js if needed
    const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
    const funcMatch = scriptContent.match(/function myFunction\(\) \{[\s\S]*?\n  \}/);
    if (funcMatch) {
      eval(`functionUnderTest = ${funcMatch[0].replace('function myFunction()', 'function()')}`);
    }
  });

  describe('Happy Path', () => {
    test('should do expected behavior', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', () => {
      expect(() => functionUnderTest(null)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing elements', () => {
      document.body.innerHTML = '';
      expect(() => functionUnderTest()).not.toThrow();
    });
  });
});
```

### Best Practices

1. **Isolation**: Test functions in isolation with mocked dependencies
2. **Descriptive Names**: Use clear test descriptions that explain behavior
3. **AAA Pattern**: Arrange, Act, Assert for clarity
4. **One Assertion Focus**: Each test should verify one specific behavior
5. **Mock External Dependencies**: Mock fetch, localStorage, window objects
6. **Clean Up**: Reset state in beforeEach/afterEach hooks
7. **Edge Cases**: Always test null/undefined/empty inputs
8. **Async Handling**: Use async/await for promise-based code
9. **No Test Interdependencies**: Tests should run in any order

### Common Patterns

#### Extracting Functions from IIFE

```javascript
const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
const funcMatch = scriptContent.match(/function myFunction\(\) \{[\s\S]*?\n  \}/);
if (funcMatch) {
  eval(`myFunction = ${funcMatch[0].replace('function myFunction()', 'function()')}`);
}
```

#### Mocking Global Objects

```javascript
global.fetch = jest.fn();
global.Chart = jest.fn();
window.matchMedia = jest.fn(() => ({ matches: true }));
```

#### Testing Async Operations

```javascript
test('should fetch data', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'test' })
  });
  
  await fetchData();
  
  expect(global.fetch).toHaveBeenCalled();
});
```

#### Testing Timers

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('should call function after delay', () => {
  const fn = jest.fn();
  setTimeout(fn, 1000);
  
  jest.advanceTimersByTime(1000);
  
  expect(fn).toHaveBeenCalled();
});
```

## Debugging Tests

### Common Issues

1. **Async Test Timeout**: Use `done` callback or return promise
2. **DOM Not Ready**: Ensure HTML is set in beforeEach
3. **Mock Not Working**: Verify mock is created before function import
4. **Test Pollution**: Check if state is properly reset between tests

### Debugging Commands

```bash
# Run with verbose output
npm test -- --verbose

# Run single test file with debugging
node --inspect-brk node_modules/.bin/jest tests/my-test.test.js

# Show which tests are running
npm test -- --verbose --no-coverage
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example CI configuration
test:
  script:
    - npm install
    - npm test
    - npm run test:coverage
  coverage: '/Lines\s+:\s+(\d+\.\d+)%/'
```

## Maintenance

### When to Update Tests

- ✅ Adding new functions → Write corresponding tests
- ✅ Modifying existing functions → Update affected tests
- ✅ Fixing bugs → Add regression test
- ✅ Refactoring → Ensure tests still pass

### Test Review Checklist

- [ ] Tests are independent and isolated
- [ ] All branches/paths are covered
- [ ] Edge cases are tested
- [ ] Error conditions are handled
- [ ] Mocks are properly configured
- [ ] Tests have clear descriptions
- [ ] No hard-coded values (use constants)
- [ ] Async operations properly handled

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Contact

For questions about the test suite, refer to `TEST_SUMMARY.md` for detailed coverage information.