# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Net Observation Project.

## Test Coverage

### 1. JavaScript Functionality Tests (`script.test.js`)
- **Theme Management**: Dark/light/auto theme cycling, localStorage persistence
- **Sidebar Functionality**: Toggle behavior, responsive state management
- **Settings Management**: Configuration persistence and validation
- **Data Processing**: Number formatting, date parsing, CSV/JSON handling
- **API Integration**: Fetch operations, error handling, response parsing
- **Terminal Commands**: Command execution, argument parsing, plugin system
- **Plugin System**: Registration, execution, error handling
- **Chart Generation**: Color palette creation, data sorting and limiting
- **Event Handling**: Keyboard and mouse events
- **DOM Manipulation**: Element querying, dynamic content updates
- **Navigation**: Active link highlighting, smooth scrolling
- **FileReader API**: File uploads and parsing
- **Auto-refresh**: Interval-based data fetching

### 2. Cloudflare Function Tests (`censys-function.test.js`)
- **Environment Variables**: Credential validation
- **Authorization**: Basic Auth header construction
- **API Endpoints**: URL construction and request payloads
- **Success Scenarios**: Data aggregation and transformation
- **Error Handling**: Fallback responses, HTTP errors
- **Response Headers**: Content-Type, Cache-Control
- **Parallel Requests**: Promise.all coordination
- **Data Validation**: Null/undefined handling

### 3. CSS Validation Tests (`style.test.js`)
- **Logo Sigil Classes**: Base class and modifiers
- **CSS Variables**: Custom properties usage
- **Dimensions**: Responsive sizing across breakpoints
- **Visual Effects**: Gradients, shadows, animations
- **Animations**: Keyframe definitions and application
- **Content**: Pseudo-element text rendering
- **Hover Effects**: Transform and shadow enhancements
- **Theme Support**: Light/dark mode adaptations
- **Layout**: Flexbox positioning
- **Pseudo-elements**: ::before and ::after styling
- **Transitions**: Smooth property changes
- **Responsive Design**: Mobile breakpoints
- **Color Schemes**: Neon color palette
- **Border Styling**: Width, style, color
- **Removed Classes**: Verification of deprecated styles
- **Syntax Validation**: Balanced braces, proper semicolons
- **Accessibility**: Color contrast, semantic properties

### 4. HTML Validation Tests (`html.test.js`)
- **Logo Markup**: Correct class usage across all pages
- **ARIA Labels**: Accessibility attributes
- **Semantic HTML**: Proper element usage
- **Cross-file Consistency**: Uniform structure
- **Accessibility Compliance**: A11y best practices
- **Logo Element Structure**: Empty divs with CSS content
- **Tag Balance**: Proper opening/closing tags

### 5. README Documentation Tests (`readme.test.js`)
- **Branding Section**: Updated documentation
- **Document Structure**: Complete sections
- **Code Examples**: Proper formatting
- **Feature List**: Comprehensive coverage
- **Installation Instructions**: Clear steps
- **API Documentation**: Endpoint details
- **Links**: Internal/external reference validation
- **Formatting**: Markdown best practices
- **Completeness**: All features documented

### 6. Integration Tests (`integration.test.js`)
- **Theme + Settings**: Cross-component persistence
- **API + UI**: Data flow from backend to display
- **Sidebar + Navigation**: Coordinated state updates
- **Terminal + Plugins**: Command execution with state
- **Data Visualizer**: Format detection and rendering
- **Chart + Data**: Dynamic visualization updates
- **Auth0 Flow**: Authentication state management
- **Responsive Behavior**: Viewport-dependent layouts
- **Auto-refresh**: Periodic data updates
- **File Upload**: File reading and processing

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Philosophy

These tests follow a comprehensive approach:

1. **Pure Function Testing**: Focus on testable logic
2. **Edge Case Coverage**: Handle nulls, undefined, empty data
3. **Error Scenarios**: Graceful degradation
4. **Integration Points**: Cross-component interactions
5. **Accessibility**: A11y compliance verification
6. **Performance**: Efficient data processing
7. **Maintainability**: Clear, descriptive test names

## Test Structure

Each test file follows this pattern:
- `describe()` blocks for logical grouping
- `beforeEach()`/`afterEach()` for setup/teardown
- Descriptive test names explaining expected behavior
- Assertions using Jest matchers

## Mocking Strategy

- **localStorage**: In-memory mock for settings persistence
- **fetch**: Jest mock for API calls
- **window.matchMedia**: Mock for theme detection
- **FileReader**: Native browser API (works in jsdom)

## Coverage Goals

Target coverage: >80% for all metrics
- Statements: Track code execution
- Branches: Test all conditional paths
- Functions: Exercise all exported functions
- Lines: Comprehensive line coverage

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (no external dependencies)
- Deterministic results
- Clear error messages
- Exit codes for pass/fail

## Adding New Tests

When adding features:
1. Write tests for pure functions first
2. Add integration tests for component interactions
3. Include edge cases and error scenarios
4. Update this README with new test coverage

## Known Limitations

- Browser APIs (Chart.js, D3, Auth0) are mocked
- Network calls are stubbed
- Visual regression not included (CSS rules tested via regex)
- End-to-end tests not included (these are unit/integration tests)