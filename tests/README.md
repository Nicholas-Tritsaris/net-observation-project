# Test Suite Documentation

This test suite provides comprehensive coverage for the Net Observation Project.

## Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Run in watch mode
npm run test:coverage   # Generate coverage report
```

## Test Structure

- `tests/unit/` - Unit tests for individual functions
- `tests/integration/` - Integration tests
- `tests/setup.js` - Global test configuration

## Key Changes Tested

1. **Logo Placeholder System** - Image loading with fallback
2. **Sidebar Initialization** - Desktop/mobile behavior
3. **Theme Management** - Auto/dark/light themes
4. **API Integration** - Censys API data fetching
5. **CSS Changes** - Logo styles and placeholders
6. **HTML Structure** - Image tags with data-logo attributes

## Coverage Goals

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%