# Testing Quick Start Guide

## Installation

```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on changes)
npm run test:watch

# Run specific file
npm test -- tests/script.test.js

# Run specific test
npm test -- --testNamePattern="logo fallback"
```

## What's Being Tested

This test suite covers changes made to the Net Observation Project in the current branch:

### JavaScript (`docs/script.js`)
✅ **105 tests** covering:
- Logo fallback functionality (NEW)
- Theme management
- Settings persistence
- Data parsing utilities
- Color generation
- Terminal commands
- Table rendering

### CSS (`docs/style.css`)
✅ **33 tests** validating:
- Logo placeholder styles (NEW)
- Header logo styles (UPDATED)
- Theme support
- Animations
- Responsive design
- Accessibility

### HTML (6 files)
✅ **118 tests** checking:
- Logo image implementation (NEW)
- Old logo element removal (UPDATED)
- Structure validity
- Accessibility attributes
- Navigation consistency
- Theme support

### Documentation (`README.md`)
✅ **60 tests** verifying:
- Branding note placement (UPDATED)
- Logo instructions (NEW)
- Code examples
- Feature descriptions
- Installation steps
- Markdown syntax

### Integration
✅ **14 tests** ensuring:
- Complete logo fallback workflow
- Multi-page consistency
- Theme integration
- Performance

## Test Output