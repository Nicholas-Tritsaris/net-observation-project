# Test Suite Quick Reference

## 🚀 Quick Start

```bash
npm install          # Install test dependencies
npm test            # Run all unit tests
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run E2E tests (requires server)
```

## 📊 Test Coverage by File

### Changed Files → Test Files

| Source File | Test Files | Test Count |
|------------|------------|------------|
| `docs/script.js` | `tests/unit/script.test.js`<br>`tests/e2e/logo-placeholder.spec.js`<br>`tests/e2e/sidebar.spec.js`<br>`tests/e2e/integration-logo-flow.spec.js` | 330+ |
| `docs/style.css` | `tests/unit/css-validation.test.js`<br>`tests/e2e/logo-placeholder.spec.js` | 65+ |
| `docs/*.html` (6 files) | `tests/unit/html-validation.test.js`<br>`tests/e2e/logo-placeholder.spec.js` | 180+ |
| `README.md` | `tests/unit/readme-validation.test.js` | 18+ |
| `functions/api/censys-summary.js` | `tests/unit/censys-summary.test.js` | 85+ |

## 🎯 Key Test Scenarios

### Logo Placeholder Functionality
```javascript
// Unit test - creates fallback on error
const img = document.querySelector('img[data-logo]');
img.dispatchEvent(new Event('error'));
expect(document.querySelector('.logo-placeholder')).toBeTruthy();
```

### Theme Management
```javascript
// Unit test - cycles through themes
const themes = ['auto', 'dark', 'light'];
// Test verifies correct cycling order
```

### Sidebar Initialization
```javascript
// E2E test - viewport-specific behavior
await page.setViewportSize({ width: 700, height: 600 });
// Sidebar should be collapsed on mobile
```

## 🔍 Test Structure