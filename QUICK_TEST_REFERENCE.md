# Quick Test Reference Card

## 🚀 Fast Commands

```bash
# Install everything
npm install && npx playwright install

# Run all tests
npm test

# Run specific suite
npm run test:unit      # JavaScript tests
npm run test:backend   # API function tests  
npm run test:e2e       # Visual/CSS tests

# Debug mode
npx vitest run tests/unit/script.test.js --reporter=verbose
npx playwright test --headed --debug
```

## 📊 What's Tested

### JavaScript (33 tests)
- ✅ Removed `refreshChartThemes()` 
- ✅ Simplified sidebar init
- ✅ Removed `#apiPayload` updates
- ✅ Streamlined Auth0 setup
- ✅ Plugin system, terminal, charts

### CSS (23 tests)
- ✅ New `.logo-sigil` with animations
- ✅ Pseudo-elements (::before, ::after)
- ✅ Responsive sizing (120px → 48px → 40px)
- ✅ Light/dark themes
- ✅ Cross-browser compatibility

### Backend (33 tests)
- ✅ Environment validation
- ✅ Censys API integration
- ✅ Error handling
- ✅ All edge cases

## 🎯 Test Files

| Path | Tests | Purpose |
|------|-------|---------|
| `tests/unit/script.test.js` | 33 | JS logic |
| `tests/e2e/logo-styling.spec.js` | 23 | CSS/visual |
| `tests/backend/censys-summary.test.js` | 33 | API function |

## 📈 Expected Results

- **Total tests**: 89
- **Execution time**: ~35-65 seconds
- **All tests**: Should PASS ✅

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Playwright browsers missing | `npx playwright install` |
| Port 8080 in use | Edit `playwright.config.js` port |
| Unit tests fail | Check `tests/setup.js` is loaded |

## 📚 More Info

- Full docs: `tests/README.md`
- Execution guide: `TEST_EXECUTION_GUIDE.md`
- Complete summary: `TESTING_SUMMARY.md`