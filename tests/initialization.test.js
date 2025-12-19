/**
 * Comprehensive tests for application initialization and bootstrap
 * Tests init function, DOMContentLoaded handling, and initialization order
 */

const fs = require('fs');

describe('Application Initialization', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('init Function', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should have comprehensive JSDoc', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?Bootstraps the application[\s\S]*?\*\/\s*function init/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should load settings first', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/loadSettings\(\)/);
    });

    test('should apply theme after loading settings', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      const initBody = funcMatch[0];
      const loadSettingsIdx = initBody.indexOf('loadSettings()');
      const applyThemeIdx = initBody.indexOf('applyTheme()');
      expect(applyThemeIdx).toBeGreaterThan(loadSettingsIdx);
    });

    test('should initialize theme toggle', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initThemeToggle\(\)/);
    });

    test('should initialize sidebar', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initSidebar\(\)/);
    });

    test('should initialize logo placeholders', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initLogoPlaceholders\(\)/);
    });

    test('should initialize logo placeholders after sidebar', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      const initBody = funcMatch[0];
      const sidebarIdx = initBody.indexOf('initSidebar()');
      const logoIdx = initBody.indexOf('initLogoPlaceholders()');
      expect(logoIdx).toBeGreaterThan(sidebarIdx);
    });

    test('should initialize settings panel', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initSettingsPanel\(\)/);
    });

    test('should initialize Auth0', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initAuth0\(\)/);
    });

    test('should update auth controls after Auth0 init', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      const initBody = funcMatch[0];
      const auth0Idx = initBody.indexOf('initAuth0()');
      const authControlsIdx = initBody.indexOf('updateAuthControls()');
      expect(authControlsIdx).toBeGreaterThan(auth0Idx);
    });

    test('should mark active navigation', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/markActiveNav\(\)/);
    });

    test('should initialize page-specific features', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initPageSpecificFeatures\(\)/);
    });

    test('should register echo plugin', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppPlugins\.register\(\{/);
      expect(funcMatch[0]).toMatch(/name:\s*['"]echo-plugin['"]/);
    });

    test('should register echo plugin with command', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/command:\s*['"]echo['"]/);
    });

    test('should register echo plugin with run function', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/run\(text\)\s*\{/);
      expect(funcMatch[0]).toMatch(/return\s+text\s*\|\|\s*['"]?\(empty\)['"]?/);
    });
  });

  describe('DOMContentLoaded Handling', () => {
    test('should check document.readyState', () => {
      expect(scriptContent).toMatch(/if\s*\(\s*document\.readyState\s*!==\s*['"]loading['"]\s*\)/);
    });

    test('should call init immediately if document ready', () => {
      const conditionalMatch = scriptContent.match(/if\s*\(\s*document\.readyState\s*!==\s*['"]loading['"]\s*\)\s*\{[\s\S]*?\}/);
      expect(conditionalMatch).not.toBeNull();
      expect(conditionalMatch[0]).toMatch(/init\(\)/);
    });

    test('should add DOMContentLoaded listener if still loading', () => {
      const elseMatch = scriptContent.match(/\}\s*else\s*\{[\s\S]*?\}/);
      expect(elseMatch).not.toBeNull();
      expect(elseMatch[0]).toMatch(/document\.addEventListener\(['"]DOMContentLoaded['"]/);
    });

    test('should call init in DOMContentLoaded listener', () => {
      const elseMatch = scriptContent.match(/\}\s*else\s*\{[\s\S]*?\}/);
      expect(elseMatch).not.toBeNull();
      expect(elseMatch[0]).toMatch(/addEventListener\(['"]DOMContentLoaded['"],\s*init\)/);
    });
  });

  describe('IIFE Structure', () => {
    test('should wrap entire script in IIFE', () => {
      expect(scriptContent).toMatch(/^\(\(\)\s*=>\s*\{/);
      expect(scriptContent).toMatch(/\}\)\(\);?\s*$/);
    });

    test('should initialize window.__latestCensys', () => {
      expect(scriptContent).toMatch(/window\.__latestCensys\s*=\s*window\.__latestCensys\s*\|\|\s*null/);
    });

    test('should define AppState at top level', () => {
      const appStateMatch = scriptContent.match(/const\s+AppState\s*=\s*\{[\s\S]*?\};/);
      expect(appStateMatch).not.toBeNull();
      expect(appStateMatch[0]).toMatch(/settings:/);
      expect(appStateMatch[0]).toMatch(/stats:/);
      expect(appStateMatch[0]).toMatch(/charts:/);
      expect(appStateMatch[0]).toMatch(/auth0Client:/);
      expect(appStateMatch[0]).toMatch(/worldData:/);
    });

    test('should define default settings in AppState', () => {
      const appStateMatch = scriptContent.match(/const\s+AppState\s*=\s*\{[\s\S]*?\};/);
      expect(appStateMatch).not.toBeNull();
      expect(appStateMatch[0]).toMatch(/backendUrl:\s*['"]\/api\/censys-summary['"]/);
      expect(appStateMatch[0]).toMatch(/auth0Domain:\s*['"]['"],/);
      expect(appStateMatch[0]).toMatch(/auth0ClientId:\s*['"]['"],/);
      expect(appStateMatch[0]).toMatch(/theme:\s*['"]auto['"]/);
    });

    test('should define STORAGE_KEY constant', () => {
      expect(scriptContent).toMatch(/const\s+STORAGE_KEY\s*=\s*['"]net-observation-settings['"]/);
    });

    test('should define prefersDark media query', () => {
      expect(scriptContent).toMatch(/const\s+prefersDark\s*=/);
      expect(scriptContent).toMatch(/window\.matchMedia\(['"]?\(prefers-color-scheme:\s*dark\)/);
    });

    test('should provide fallback for matchMedia', () => {
      expect(scriptContent).toMatch(/typeof\s+window\.matchMedia\s*===\s*['"]function['"]/);
      expect(scriptContent).toMatch(/:\s*\{\s*matches:\s*true\s*\}/);
    });
  });

  describe('Initialization Order', () => {
    test('should follow correct initialization sequence', () => {
      const funcMatch = scriptContent.match(/function\s+init\(\)[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      
      const initBody = funcMatch[0];
      const positions = {
        loadSettings: initBody.indexOf('loadSettings()'),
        applyTheme: initBody.indexOf('applyTheme()'),
        initThemeToggle: initBody.indexOf('initThemeToggle()'),
        initSidebar: initBody.indexOf('initSidebar()'),
        initLogoPlaceholders: initBody.indexOf('initLogoPlaceholders()'),
        initSettingsPanel: initBody.indexOf('initSettingsPanel()'),
        initAuth0: initBody.indexOf('initAuth0()'),
        updateAuthControls: initBody.indexOf('updateAuthControls()'),
        markActiveNav: initBody.indexOf('markActiveNav()'),
        initPageSpecificFeatures: initBody.indexOf('initPageSpecificFeatures()')
      };

      // Verify critical ordering
      expect(positions.loadSettings).toBeLessThan(positions.applyTheme);
      expect(positions.initSidebar).toBeLessThan(positions.initLogoPlaceholders);
      expect(positions.initAuth0).toBeLessThan(positions.updateAuthControls);
      
      // All positions should be found (> -1)
      Object.values(positions).forEach(pos => {
        expect(pos).toBeGreaterThan(-1);
      });
    });
  });

  describe('Global Namespace', () => {
    test('should expose registerPlugin on window', () => {
      expect(scriptContent).toMatch(/window\.registerPlugin\s*=/);
    });

    test('should expose __latestCensys on window', () => {
      expect(scriptContent).toMatch(/window\.__latestCensys/);
    });

    test('should not pollute global scope unnecessarily', () => {
      // All major variables should be within IIFE
      const topLevel = scriptContent.split('(() => {')[0];
      expect(topLevel).not.toMatch(/const\s+AppState/);
      expect(topLevel).not.toMatch(/function\s+init/);
      expect(topLevel).not.toMatch(/function\s+loadSettings/);
    });
  });

  describe('Documentation Quality', () => {
    test('should have JSDoc for all major functions', () => {
      const functions = [
        'loadSettings',
        'saveSettings',
        'applyTheme',
        'initLogoPlaceholders',
        'initThemeToggle',
        'initSidebar',
        'qs',
        'updateStatsView',
        'renderTable',
        'fetchCensysSummary',
        'initAutoRefresh',
        'initCharts',
        'updateCharts',
        'generateColorPalette',
        'initTerminal',
        'logTerminal',
        'initDataVisualizer',
        'initSettingsPanel',
        'initAuth0',
        'updateAuthControls',
        'renderHeatmap',
        'initDocsSidebar',
        'initVersionList',
        'initPageSpecificFeatures',
        'markActiveNav',
        'init'
      ];

      functions.forEach(funcName => {
        const jsdocPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:async\\s+)?function\\s+${funcName}`);
        expect(scriptContent).toMatch(jsdocPattern);
      });
    });

    test('should document parameters with @param tags', () => {
      const functionsWithParams = [
        { name: 'qs', param: 'id' },
        { name: 'updateStatsView', param: 'data' },
        { name: 'renderTable', param: 'selector' },
        { name: 'fetchCensysSummary', param: 'silent' },
        { name: 'updateCharts', param: 'data' },
        { name: 'generateColorPalette', param: 'count' },
        { name: 'logTerminal', param: 'message' },
        { name: 'renderHeatmap', param: 'data' }
      ];

      functionsWithParams.forEach(({ name, param }) => {
        const jsdocPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?@param[\\s\\S]*?${param}[\\s\\S]*?\\*\\/\\s*(?:async\\s+)?function\\s+${name}`);
        expect(scriptContent).toMatch(jsdocPattern);
      });
    });

    test('should document return types with @returns tags', () => {
      const functionsWithReturns = [
        'qs',
        'generateColorPalette'
      ];

      functionsWithReturns.forEach(funcName => {
        const jsdocPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?@returns[\\s\\S]*?\\*\\/\\s*(?:async\\s+)?function\\s+${funcName}`);
        expect(scriptContent).toMatch(jsdocPattern);
      });
    });
  });

  describe('Error Resilience', () => {
    test('should have try-catch in loadSettings', () => {
      const funcMatch = scriptContent.match(/function\s+loadSettings[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch/);
    });

    test('should have try-catch in initTerminal execute', () => {
      const funcMatch = scriptContent.match(/function\s+initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should have try-catch in initDataVisualizer', () => {
      const funcMatch = scriptContent.match(/function\s+initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should have try-catch in initAuth0', () => {
      const funcMatch = scriptContent.match(/async function\s+initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should have try-catch in renderHeatmap', () => {
      const funcMatch = scriptContent.match(/async function\s+renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should have try-catch in fetchCensysSummary', () => {
      const funcMatch = scriptContent.match(/async function\s+fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should have try-catch in window.registerPlugin', () => {
      const funcMatch = scriptContent.match(/window\.registerPlugin\s*=[\s\S]*?;/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });
  });
});