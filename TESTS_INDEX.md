# Test Files Index

## Quick Navigation

- [Test Files](#test-files)
- [Configuration Files](#configuration-files)
- [Documentation Files](#documentation-files)
- [Utility Scripts](#utility-scripts)

## Test Files

### 1. tests/setup.js
**Purpose:** Test environment configuration and global mocks

**Contents:**
- Console method mocking
- localStorage mock implementation
- matchMedia mock for theme testing
- Global test setup

**Usage:** Automatically loaded by Jest before each test

---

### 2. tests/script.test.js
**Purpose:** Comprehensive tests for `docs/script.js`

**Test Suites:**
- Logo Placeholder Functionality (72 tests)
- Theme Management (6 tests)
- Settings Management (7 tests)
- Data Utilities (8 tests)
- Color Palette Generation (4 tests)
- Terminal Command Parser (5 tests)
- Table Rendering (3 tests)

**Total Tests:** 105

**Key Features Tested:**
- `initLogoPlaceholders()` function
- `createFallback()` helper
- Theme application logic
- localStorage integration
- CSV parsing
- JSON validation
- HSL color generation
- Command parsing

---

### 3. tests/style.test.js
**Purpose:** CSS validation for `docs/style.css`

**Test Suites:**
- CSS Logo Styles (12 tests)
- CSS Structure Validation (5 tests)
- CSS Theme Support (3 tests)
- CSS Animation and Effects (4 tests)
- CSS Responsive Design (2 tests)
- CSS Accessibility (2 tests)
- Logo-specific Style Removals (2 tests)
- CSS Property Values (3 tests)

**Total Tests:** 33

**Validation Areas:**
- `.logo-placeholder` class
- `header img.logo` styles
- Gradient backgrounds
- Border radius and shadows
- Theme variables
- Keyframe animations

---

### 4. tests/html.test.js
**Purpose:** HTML structure and accessibility validation

**Test Suites:**
- HTML Logo Implementation (48 tests)
- HTML Structure Validation (60 tests)
- HTML Accessibility Features (24 tests)
- HTML Navigation Consistency (2 tests)
- HTML Theme Support (12 tests)
- HTML Script and Style Loading (18 tests)
- HTML Page-Specific Content (6 tests)
- HTML Sidebar Content (18 tests)
- HTML Header Content (18 tests)
- HTML Semantic Structure (12 tests)

**Total Tests:** 118

**Files Tested:**
- api.html
- dashboard.html
- data.html
- docs.html
- index.html
- versions.html

---

### 5. tests/readme.test.js
**Purpose:** Documentation validation for `README.md`

**Test Suites:**
- README.md Structure (9 tests)
- README.md Logo Documentation (9 tests)
- README.md Code Examples (6 tests)
- README.md Technical Details (8 tests)
- README.md Features List (7 tests)
- README.md Directory Structure (5 tests)
- README.md Instructions Clarity (3 tests)
- README.md Links and References (3 tests)
- README.md Completeness (3 tests)
- README.md Markdown Syntax (4 tests)
- README.md Content Updates from Diff (6 tests)

**Total Tests:** 60

**Validation Areas:**
- Section presence
- Branding note placement
- Code example accuracy
- Link validity
- Markdown syntax

---

### 6. tests/integration.test.js
**Purpose:** End-to-end integration testing

**Test Suites:**
- Complete Logo Loading Flow (3 tests)
- Multiple Page Scenario (1 test)
- Performance and Edge Cases (4 tests)
- CSS Integration (3 tests)
- Backward Compatibility (1 test)
- Theme Integration with Logo (2 tests)

**Total Tests:** 14

**Scenarios Tested:**
- Full logo fallback workflow
- Multi-page consistency
- Rapid error events
- Theme changes
- Legacy element coexistence

---

## Configuration Files

### 1. package.json
**Purpose:** NPM package configuration

**Contents:**
- Dependencies (Jest, jsdom, validators)
- Test scripts (test, test:watch, test:coverage)
- Project metadata

**Key Scripts:**
```json
{
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:watch": "... --watch",
  "test:coverage": "... --coverage"
}
```

---

### 2. jest.config.js
**Purpose:** Jest test framework configuration

**Settings:**
- Test environment: jsdom
- Test match patterns
- Coverage configuration
- Setup files
- Module extensions

**Coverage Goals:**
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

---

## Documentation Files

### 1. TEST_DOCUMENTATION.md
**Purpose:** Comprehensive testing guide

**Sections:**
- Overview
- Test Structure
- Running Tests
- Test Coverage (detailed per file)
- Key Testing Principles
- Continuous Integration
- Debugging Guide
- Maintenance Guidelines
- Best Practices
- Resources

**Length:** ~500 lines

---

### 2. TESTING_QUICK_START.md
**Purpose:** Quick reference guide

**Sections:**
- Installation
- Running Tests
- What's Being Tested
- Test Output
- Coverage Report
- Troubleshooting
- Quick Examples

**Length:** ~150 lines

---

### 3. TEST_SUMMARY.md
**Purpose:** Executive summary and metrics

**Sections:**
- Executive Summary
- Files Tested
- Test Coverage by File
- Key Features Tested
- Test Methodology
- Test Quality Metrics
- Running the Tests
- Benefits
- Future Enhancements

**Length:** ~300 lines

---

### 4. TESTS_INDEX.md
**Purpose:** This file - navigation and reference

---

## Utility Scripts

### 1. run-tests.sh
**Purpose:** Convenient test execution script

**Features:**
- Dependency installation check
- Test execution with coverage
- Formatted output
- Summary reporting

**Usage:**
```bash
chmod +x run-tests.sh
./run-tests.sh
```

---

## File Tree