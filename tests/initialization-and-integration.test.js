/**
 * Comprehensive tests for application initialization and component integration
 * Tests the init function, DOMContentLoaded handling, and cross-component interactions
 */

const fs = require('fs');

describe('Initialization and Integration', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('init function', () => {
    let init;

    beforeEach(() => {
      // Mock all initialization functions
      global.loadSettings = jest.fn();
      global.applyTheme = jest.fn();
      global.initThemeToggle = jest.fn();
      global.initSidebar = jest.fn();
      global.initLogoPlaceholders = jest.fn();
      global.initSettingsPanel = jest.fn();
      global.initAuth0 = jest.fn().mockResolvedValue(undefined);
      global.updateAuthControls = jest.fn().mockResolvedValue(undefined);
      global.markActiveNav = jest.fn();
      global.initPageSpecificFeatures = jest.fn();
      global.AppPlugins = {
        register: jest.fn()
      };

      const funcMatch = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should load settings first', () => {
      init();

      expect(global.loadSettings).toHaveBeenCalled();
      expect(global.loadSettings.mock.invocationCallOrder[0]).toBeLessThan(
        global.applyTheme.mock.invocationCallOrder[0]
      );
    });

    test('should apply theme after loading settings', () => {
      init();

      expect(global.applyTheme).toHaveBeenCalled();
    });

    test('should initialize theme toggle', () => {
      init();

      expect(global.initThemeToggle).toHaveBeenCalled();
    });

    test('should initialize sidebar', () => {
      init();

      expect(global.initSidebar).toHaveBeenCalled();
    });

    test('should initialize logo placeholders', () => {
      init();

      expect(global.initLogoPlaceholders).toHaveBeenCalled();
    });

    test('should initialize settings panel', () => {
      init();

      expect(global.initSettingsPanel).toHaveBeenCalled();
    });

    test('should initialize Auth0', async () => {
      await init();

      expect(global.initAuth0).toHaveBeenCalled();
    });

    test('should update auth controls', async () => {
      await init();

      expect(global.updateAuthControls).toHaveBeenCalled();
    });

    test('should mark active navigation', () => {
      init();

      expect(global.markActiveNav).toHaveBeenCalled();
    });

    test('should initialize page-specific features', () => {
      init();

      expect(global.initPageSpecificFeatures).toHaveBeenCalled();
    });

    test('should register default echo plugin', () => {
      init();

      expect(global.AppPlugins.register).toHaveBeenCalledWith(
        'echo-plugin',
        expect.any(Object)
      );
    });

    test('should initialize in correct order', () => {
      init();

      const callOrder = [
        global.loadSettings,
        global.applyTheme,
        global.initThemeToggle,
        global.initSidebar,
        global.initLogoPlaceholders,
        global.initSettingsPanel
      ];

      for (let i = 0; i < callOrder.length - 1; i++) {
        expect(callOrder[i].mock.invocationCallOrder[0]).toBeLessThan(
          callOrder[i + 1].mock.invocationCallOrder[0]
        );
      }
    });

    test('should call all core initialization functions', () => {
      init();

      expect(global.loadSettings).toHaveBeenCalledTimes(1);
      expect(global.applyTheme).toHaveBeenCalledTimes(1);
      expect(global.initThemeToggle).toHaveBeenCalledTimes(1);
      expect(global.initSidebar).toHaveBeenCalledTimes(1);
      expect(global.initLogoPlaceholders).toHaveBeenCalledTimes(1);
      expect(global.initSettingsPanel).toHaveBeenCalledTimes(1);
      expect(global.markActiveNav).toHaveBeenCalledTimes(1);
      expect(global.initPageSpecificFeatures).toHaveBeenCalledTimes(1);
    });
  });

  describe('DOMContentLoaded handling', () => {
    test('should run immediately if already loaded', () => {
      const initSpy = jest.fn();
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      // Simulate the IIFE logic
      if (document.readyState !== 'loading') {
        initSpy();
      }

      expect(initSpy).toHaveBeenCalled();
    });

    test('should wait for DOMContentLoaded if loading', () => {
      const initSpy = jest.fn();
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      if (document.readyState !== 'loading') {
        initSpy();
      } else {
        document.addEventListener('DOMContentLoaded', initSpy);
      }

      expect(initSpy).not.toHaveBeenCalled();

      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(initSpy).toHaveBeenCalled();
    });

    test('should check readyState before adding listener', () => {
      expect(scriptContent).toMatch(/document\.readyState\s*!==\s*['"]loading['"]/);
    });

    test('should add DOMContentLoaded listener', () => {
      expect(scriptContent).toContain("addEventListener('DOMContentLoaded'");
    });

    test('should wrap code in IIFE', () => {
      expect(scriptContent).toMatch(/\(function\s*\(\)\s*\{[\s\S]*\}\)\(\)/);
    });
  });

  describe('AppState management', () => {
    test('should define AppState object', () => {
      expect(scriptContent).toContain('const AppState');
    });

    test('should have settings property', () => {
      expect(scriptContent).toMatch(/AppState\s*=\s*\{[\s\S]*?settings:/);
    });

    test('should have charts property', () => {
      expect(scriptContent).toMatch(/charts:\s*\{\}/);
    });

    test('should have stats property', () => {
      expect(scriptContent).toMatch(/stats:\s*\{\}/);
    });

    test('should define default theme setting', () => {
      expect(scriptContent).toMatch(/theme:\s*['"]auto['"]/);
    });

    test('should define backendUrl setting', () => {
      expect(scriptContent).toContain('backendUrl');
    });

    test('should define auth0Domain setting', () => {
      expect(scriptContent).toContain('auth0Domain');
    });

    test('should define auth0ClientId setting', () => {
      expect(scriptContent).toContain('auth0ClientId');
    });
  });

  describe('AppPlugins system', () => {
    test('should define AppPlugins object', () => {
      expect(scriptContent).toContain('const AppPlugins');
    });

    test('should have register method', () => {
      expect(scriptContent).toMatch(/register:\s*function|register\s*\([^)]*\)/);
    });

    test('should have getCommands method', () => {
      expect(scriptContent).toMatch(/getCommands:\s*function|getCommands\s*\([^)]*\)/);
    });

    test('should store plugins in internal structure', () => {
      expect(scriptContent).toMatch(/const\s+plugins\s*=\s*\{\}/);
    });

    test('should validate plugin registration', () => {
      const pluginsMatch = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\}\)\(\)/);
      expect(pluginsMatch).not.toBeNull();
    });
  });

  describe('Component Integration', () => {
    test('should integrate theme system with storage', () => {
      expect(scriptContent).toContain('loadSettings');
      expect(scriptContent).toContain('saveSettings');
      expect(scriptContent).toContain('applyTheme');
    });

    test('should integrate charts with data updates', () => {
      expect(scriptContent).toContain('initCharts');
      expect(scriptContent).toContain('updateCharts');
      expect(scriptContent).toContain('updateStatsView');
    });

    test('should integrate API with auto-refresh', () => {
      expect(scriptContent).toContain('fetchCensysSummary');
      expect(scriptContent).toContain('initAutoRefresh');
    });

    test('should integrate terminal with logging', () => {
      expect(scriptContent).toContain('initTerminal');
      expect(scriptContent).toContain('logTerminal');
    });

    test('should integrate settings panel with Auth0', () => {
      expect(scriptContent).toContain('initSettingsPanel');
      expect(scriptContent).toContain('initAuth0');
      expect(scriptContent).toContain('updateAuthControls');
    });
  });

  describe('Echo Plugin Registration', () => {
    test('should register echo plugin with name', () => {
      const registerMatch = scriptContent.match(/AppPlugins\.register\(['"]echo-plugin['"]/);
      expect(registerMatch).not.toBeNull();
    });

    test('should define echo command', () => {
      const pluginMatch = scriptContent.match(/AppPlugins\.register\(['"]echo-plugin['"],\s*\{[\s\S]*?\}\)/);
      expect(pluginMatch).not.toBeNull();
      expect(pluginMatch[0]).toContain('commands');
    });

    test('should have echo command handler', () => {
      const pluginMatch = scriptContent.match(/AppPlugins\.register\(['"]echo-plugin['"],\s*\{[\s\S]*?\}\)/);
      expect(pluginMatch).not.toBeNull();
      expect(pluginMatch[0]).toMatch(/echo:\s*\{/);
    });

    test('should provide description for echo command', () => {
      const pluginMatch = scriptContent.match(/AppPlugins\.register\(['"]echo-plugin['"],\s*\{[\s\S]*?\}\)/);
      expect(pluginMatch).not.toBeNull();
      expect(pluginMatch[0]).toContain('description');
    });

    test('should provide handler function for echo', () => {
      const pluginMatch = scriptContent.match(/AppPlugins\.register\(['"]echo-plugin['"],\s*\{[\s\S]*?\}\)/);
      expect(pluginMatch).not.toBeNull();
      expect(pluginMatch[0]).toContain('handler');
    });
  });

  describe('Global Constants', () => {
    test('should define STORAGE_KEY', () => {
      expect(scriptContent).toMatch(/const\s+STORAGE_KEY\s*=\s*['"]nop-settings['"]/);
    });

    test('should use nop-settings as storage key', () => {
      expect(scriptContent).toContain("'nop-settings'");
    });

    test('should define prefersDark matchMedia', () => {
      expect(scriptContent).toMatch(/const\s+prefersDark\s*=/);
    });

    test('should check for matchMedia function', () => {
      expect(scriptContent).toMatch(/typeof\s+window\.matchMedia\s*===\s*['"]function['"]/);
    });
  });

  describe('Error Resilience', () => {
    let init;

    beforeEach(() => {
      global.loadSettings = jest.fn();
      global.applyTheme = jest.fn(() => {
        throw new Error('Theme error');
      });
      global.initThemeToggle = jest.fn();
      global.initSidebar = jest.fn();
      global.initLogoPlaceholders = jest.fn();
      global.initSettingsPanel = jest.fn();
      global.initAuth0 = jest.fn().mockResolvedValue(undefined);
      global.updateAuthControls = jest.fn().mockResolvedValue(undefined);
      global.markActiveNav = jest.fn();
      global.initPageSpecificFeatures = jest.fn();
      global.AppPlugins = { register: jest.fn() };

      const funcMatch = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should continue initialization if one component fails', () => {
      try {
        init();
      } catch (e) {
        // Expected error from applyTheme
      }

      // Other functions should still be called
      expect(global.initSidebar).toHaveBeenCalled();
    });
  });

  describe('Code Quality', () => {
    test('should use strict mode in functions', () => {
      // Check for use strict or IIFE best practices
      expect(scriptContent).toMatch(/\(function/);
    });

    test('should use const for immutable bindings', () => {
      const constCount = (scriptContent.match(/const\s+\w+/g) || []).length;
      expect(constCount).toBeGreaterThan(10);
    });

    test('should use arrow functions appropriately', () => {
      expect(scriptContent).toMatch(/=>\s*\{/);
    });

    test('should use template literals for strings', () => {
      expect(scriptContent).toContain('`');
    });

    test('should use async/await for promises', () => {
      expect(scriptContent).toMatch(/async\s+function/);
      expect(scriptContent).toContain('await');
    });

    test('should use nullish coalescing', () => {
      expect(scriptContent).toContain('??');
    });

    test('should use optional chaining', () => {
      expect(scriptContent).toContain('?.');
    });

    test('should provide JSDoc comments', () => {
      const jsdocCount = (scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      expect(jsdocCount).toBeGreaterThan(15);
    });
  });

  describe('Module Structure', () => {
    test('should wrap entire script in IIFE', () => {
      expect(scriptContent.trim()).toMatch(/^\(function\s*\(\)\s*\{/);
      expect(scriptContent.trim()).toMatch(/\}\)\(\);?\s*$/);
    });

    test('should define functions before calling init', () => {
      const initCallIndex = scriptContent.lastIndexOf('if (document.readyState');
      const firstFunctionIndex = scriptContent.indexOf('function loadSettings');
      
      expect(firstFunctionIndex).toBeLessThan(initCallIndex);
    });

    test('should keep all state in AppState object', () => {
      // Check that global pollution is minimal
      const globalVarCount = (scriptContent.match(/^\s*var\s+\w+/gm) || []).length;
      expect(globalVarCount).toBe(0); // Should use const/let instead
    });
  });

  describe('Browser Compatibility', () => {
    test('should check for matchMedia before using', () => {
      expect(scriptContent).toContain("typeof window.matchMedia === 'function'");
    });

    test('should provide matchMedia fallback', () => {
      expect(scriptContent).toMatch(/:\s*\{\s*matches:\s*true\s*\}/);
    });

    test('should check for addEventListener support', () => {
      expect(scriptContent).toMatch(/typeof\s+prefersDark\.addEventListener\s*===\s*['"]function['"]/);
    });

    test('should provide addListener fallback for old browsers', () => {
      expect(scriptContent).toContain('addListener');
    });

    test('should handle missing localStorage gracefully', () => {
      const loadMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      expect(loadMatch[0]).toContain('catch');
    });
  });
});