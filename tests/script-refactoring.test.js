/**
 * Tests for refactored functions in docs/script.js
 * Covers theme application, sidebar initialization, and removed functionality
 */

describe('Script.js Refactoring', () => {
  describe('applyTheme function', () => {
    test('should not call refreshChartThemes (removed)', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeFunc = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeFunc).not.toBeNull();
      expect(applyThemeFunc[0]).not.toMatch(/refreshChartThemes/);
    });

    test('should set data-theme attribute on documentElement', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeFunc = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeFunc).not.toBeNull();
      expect(applyThemeFunc[0]).toMatch(/document\.documentElement\.setAttribute\('data-theme'/);
    });

    test('should set data-theme on body.dataset', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const applyThemeFunc = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      
      expect(applyThemeFunc).not.toBeNull();
      expect(applyThemeFunc[0]).toMatch(/document\.body\.dataset\.theme\s*=/);
    });
  });

  describe('initSidebar function', () => {
    test('should use classList.add for initial open state on desktop', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      
      expect(initSidebarFunc).not.toBeNull();
      expect(initSidebarFunc[0]).toMatch(/sidebar\.classList\.add\('open'\)/);
    });

    test('should call setState(false) on mobile viewports', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      
      expect(initSidebarFunc).not.toBeNull();
      expect(initSidebarFunc[0]).toMatch(/if\s*\(\s*window\.innerWidth\s*<\s*880\s*\)/);
      expect(initSidebarFunc[0]).toMatch(/setState\(false\)/);
    });

    test('should not call setState(true) on desktop', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      
      expect(initSidebarFunc).not.toBeNull();
      // The else branch should only add the class, not call setState(true)
      const elseBlock = initSidebarFunc[0].match(/\} else \{[\s\S]*?\}/);
      if (elseBlock) {
        expect(elseBlock[0]).not.toMatch(/setState\(true\)/);
      }
    });
  });

  describe('updateStatsView function', () => {
    test('should not reference #apiPayload element', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const updateStatsFunc = scriptContent.match(/function updateStatsView\([^)]*\) \{[\s\S]*?\n  \}/);
      
      expect(updateStatsFunc).not.toBeNull();
      expect(updateStatsFunc[0]).not.toMatch(/qs\(['"]#apiPayload['"]\)/);
      expect(updateStatsFunc[0]).not.toMatch(/payload\.textContent/);
    });
  });

  describe('fetchCensysSummary function', () => {
    test('should not handle apiPayload element in error case', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const fetchFunc = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      
      expect(fetchFunc).not.toBeNull();
      const catchBlock = fetchFunc[0].match(/catch\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).not.toMatch(/qs\(['"]#apiPayload['"]\)/);
    });
  });

  describe('refreshChartThemes function', () => {
    test('should be completely removed from codebase', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).not.toMatch(/function refreshChartThemes/);
    });
  });

  describe('initAuth0 function', () => {
    test('should return early when Auth0 credentials missing', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/);
      
      expect(initAuth0Func).not.toBeNull();
      expect(initAuth0Func[0]).toMatch(/if\s*\([^)]*!AppState\.settings\.auth0Domain/);
      expect(initAuth0Func[0]).toMatch(/return/);
    });

    test('should not call updateAuthControls when credentials missing', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/);
      
      expect(initAuth0Func).not.toBeNull();
      const earlyReturn = initAuth0Func[0].match(/if\s*\([^)]*!AppState\.settings\.auth0Domain[^)]*\)[^{]*\{[^}]*\}/);
      expect(earlyReturn).not.toBeNull();
      expect(earlyReturn[0]).not.toMatch(/updateAuthControls/);
      expect(earlyReturn[0]).not.toMatch(/AppState\.auth0Client\s*=\s*null/);
    });
  });

  describe('initDataVisualizer function', () => {
    test('should not initialize terminal (removed from data page)', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initPageFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/);
      
      expect(initPageFunc).not.toBeNull();
      const dataCase = initPageFunc[0].match(/case 'data':\s*[\s\S]*?break;/);
      expect(dataCase).not.toBeNull();
      expect(dataCase[0]).not.toMatch(/initTerminal/);
    });
  });

  describe('init function', () => {
    test('should call initLogoPlaceholders', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initFunc = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      
      expect(initFunc).not.toBeNull();
      expect(initFunc[0]).toMatch(/initLogoPlaceholders\(\)/);
    });

    test('should call initLogoPlaceholders after initSidebar', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const initFunc = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      
      expect(initFunc).not.toBeNull();
      const initSidebarIndex = initFunc[0].indexOf('initSidebar');
      const initLogoIndex = initFunc[0].indexOf('initLogoPlaceholders');
      expect(initLogoIndex).toBeGreaterThan(initSidebarIndex);
    });
  });
});