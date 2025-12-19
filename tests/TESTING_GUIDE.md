# Testing Guide for Net Observation Project

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Organization

### File Naming Convention
- Test files end with `.test.js`
- Located in the `tests/` directory
- Named after the feature or component they test

### Test Structure

```javascript
describe('Feature Name', () => {
  describe('Specific Function', () => {
    test('should do something specific', () => {
      // Arrange: Set up test data and mocks
      const input = 'test';
      
      // Act: Execute the function
      const result = myFunction(input);
      
      // Assert: Verify the outcome
      expect(result).toBe('expected');
    });
  });
});
```

## Mocking Strategies

### localStorage
```javascript
global.localStorage = {
  store: {},
  getItem: jest.fn(key => global.localStorage.store[key] || null),
  setItem: jest.fn((key, value) => { global.localStorage.store[key] = value; })
};
```

### fetch API
```javascript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'value' })
});
```

### DOM Elements
```javascript
document.body.innerHTML = '<div id="test">Content</div>';
const element = document.getElementById('test');
```

### Chart.js
```javascript
global.Chart = jest.fn().mockImplementation(() => ({
  data: { labels: [], datasets: [] },
  update: jest.fn()
}));
```

## Common Patterns

### Testing Async Functions
```javascript
test('should fetch data', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ result: 'success' })
  });
  
  const data = await fetchData();
  expect(data.result).toBe('success');
});
```

### Testing Event Handlers
```javascript
test('should handle click', () => {
  const button = document.createElement('button');
  const handler = jest.fn();
  button.addEventListener('click', handler);
  
  button.click();
  expect(handler).toHaveBeenCalled();
});
```

### Testing Error Scenarios
```javascript
test('should handle errors gracefully', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
  try {
    await fetchData();
  } catch (err) {
    expect(err.message).toBe('Network error');
  }
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/script-core-functions.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="loadSettings"
```

### Verbose output
```bash
npm test -- --verbose
```

### Debug in Node
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Writing Good Tests

### ✅ DO
- Test one thing per test
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies
- Clean up after tests (afterEach)
- Test user-facing behavior, not implementation

### ❌ DON'T
- Test implementation details
- Share state between tests
- Make tests depend on execution order
- Use real network calls or databases
- Ignore failing tests
- Write tests without assertions

## Test Data

### Fixtures
Store reusable test data in constants:
```javascript
const MOCK_STATS = {
  total_hosts: 1500,
  total_services: 950,
  countries: { US: 800, GB: 200 },
  services: { HTTP: 500, HTTPS: 300 }
};
```

### Factories
Create test data generators:
```javascript
function createMockUser(overrides = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-push hooks (if configured)

Ensure all tests pass before merging.

## Troubleshooting

### Tests timing out
Increase timeout for async tests:
```javascript
test('slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### DOM not cleaning up
Add to beforeEach:
```javascript
beforeEach(() => {
  document.body.innerHTML = '';
});
```

### Module import errors
Check Jest configuration in package.json:
```json
{
  "jest": {
    "testEnvironment": "jsdom"
  }
}
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

Happy Testing! 🧪