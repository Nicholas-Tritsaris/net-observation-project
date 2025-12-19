# Quick Start Guide - Testing

## 🚀 Get Started in 30 Seconds

```bash
# 1. Install dependencies
npm install

# 2. Run all tests
npm test

# 3. See test results
# ✓ All tests should pass
# ✓ You'll see a summary of passing tests
```

## 📊 What Gets Tested?

### Every function in `docs/script.js`:
- ✅ Theme switching (auto/dark/light)
- ✅ Logo fallback system
- ✅ Sidebar navigation
- ✅ Statistics display
- ✅ Chart visualizations
- ✅ Terminal commands
- ✅ Settings management
- ✅ Auth0 authentication
- ✅ Data parsing (JSON/CSV)

### The API in `functions/api/censys-summary.js`:
- ✅ Request handling
- ✅ Censys API integration
- ✅ Data aggregation
- ✅ Error handling

### HTML/CSS/Documentation:
- ✅ Logo integration across all pages
- ✅ Responsive styling
- ✅ Documentation accuracy

## 🎯 Common Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- censys-api.test.js

# Run tests matching a name
npm test -- --testNamePattern="theme"
```

## 📁 Test File Structure