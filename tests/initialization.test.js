/**
 * Unit tests for application initialization and page-specific features
 * Tests init function, initPageSpecificFeatures, and overall bootstrap process
 */

const fs = require('fs');

describe('Application Initialization', () => {
  describe('initPageSpecificFeatures', () => {
    let initPageSpecificFeatures;
    let mockFunctions;

    beforeEach(() => {
      // Mock all initialization functions
      mockFunctions = {
        initCharts: jest.fn(),
        initAutoRefresh: jest.fn(),
        initTerminal: jest.fn(),
        initDataVisualizer: jest.fn(),
        initDocsSidebar: jest.fn(),
        initVersionList: jest.fn()
      };

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        let code = funcMatch[0];
        Object.keys(mockFunctions).forEach(fn => {
          code = code.replace(new RegExp(`${fn}\\(\\)`, 'g'), `mockFunctions.${fn}()`);
        });
        eval(`initPageSpecificFeatures = ${code.replace('function initPageSpecificFeatures()', 'function()')}`);
      }
    });

    describe('Dashboard Page', () => {
      test('should initialize charts on dashboard page', () => {
        document.body.dataset.page = 'dashboard';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initCharts).toHaveBeenCalled();
      });

      test('should initialize auto-refresh on dashboard', () => {
        document.body.dataset.page = 'dashboard';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initAutoRefresh).toHaveBeenCalled();
      });

      test('should initialize terminal on dashboard', () => {
        document.body.dataset.page = 'dashboard';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initTerminal).toHaveBeenCalled();
      });

      test('should initialize data visualizer on dashboard', () => {
        document.body.dataset.page = 'dashboard';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initDataVisualizer).toHaveBeenCalled();
      });
    });

    describe('Docs Page', () => {
      test('should initialize docs sidebar', () => {
        document.body.dataset.page = 'docs';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initDocsSidebar).toHaveBeenCalled();
      });

      test('should initialize version list on docs', () => {
        document.body.dataset.page = 'docs';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initVersionList).toHaveBeenCalled();
      });

      test('should not initialize charts on docs page', () => {
        document.body.dataset.page = 'docs';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initCharts).not.toHaveBeenCalled();
      });
    });

    describe('Versions Page', () => {
      test('should initialize version list', () => {
        document.body.dataset.page = 'versions';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initVersionList).toHaveBeenCalled();
      });

      test('should not initialize other features', () => {
        document.body.dataset.page = 'versions';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initCharts).not.toHaveBeenCalled();
        expect(mockFunctions.initTerminal).not.toHaveBeenCalled();
      });
    });

    describe('API Page', () => {
      test('should initialize terminal on API page', () => {
        document.body.dataset.page = 'api';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initTerminal).toHaveBeenCalled();
      });

      test('should initialize auto-refresh on API page', () => {
        document.body.dataset.page = 'api';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initAutoRefresh).toHaveBeenCalled();
      });
    });

    describe('Data Page', () => {
      test('should initialize data visualizer', () => {
        document.body.dataset.page = 'data';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initDataVisualizer).toHaveBeenCalled();
      });

      test('should initialize auto-refresh on data page', () => {
        document.body.dataset.page = 'data';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initAutoRefresh).toHaveBeenCalled();
      });
    });

    describe('Default/Unknown Page', () => {
      test('should initialize auto-refresh by default', () => {
        document.body.dataset.page = 'unknown';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initAutoRefresh).toHaveBeenCalled();
      });

      test('should initialize terminal by default', () => {
        document.body.dataset.page = 'unknown';
        initPageSpecificFeatures();
        
        expect(mockFunctions.initTerminal).toHaveBeenCalled();
      });

      test('should handle missing page attribute', () => {
        delete document.body.dataset.page;
        expect(() => initPageSpecificFeatures()).not.toThrow();
      });
    });
  });

  describe('Main init Function', () => {
    let init, AppPlugins;

    beforeEach(() => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      // Mock all dependencies
      global.loadSettings = jest.fn();
      global.applyTheme = jest.fn();
      global.initThemeToggle = jest.fn();
      global.initSidebar = jest.fn();
      global.initLogoPlaceholders = jest.fn();
      global.initSettingsPanel = jest.fn();
      global.initAuth0 = jest.fn();
      global.updateAuthControls = jest.fn();
      global.markActiveNav = jest.fn();
      global.initPageSpecificFeatures = jest.fn();

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      // Extract AppPlugins
      const pluginsMatch = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/);
      if (pluginsMatch) {
        eval(pluginsMatch[0]);
      }
      
      // Extract init function
      const initMatch = scriptContent.match(/function init\(\) \{[\s\S]*?\n  \}/);
      if (initMatch) {
        let code = initMatch[0];
        code = code.replace(/loadSettings\(\)/g, 'global.loadSettings()');
        code = code.replace(/applyTheme\(\)/g, 'global.applyTheme()');
        code = code.replace(/initThemeToggle\(\)/g, 'global.initThemeToggle()');
        code = code.replace(/initSidebar\(\)/g, 'global.initSidebar()');
        code = code.replace(/initLogoPlaceholders\(\)/g, 'global.initLogoPlaceholders()');
        code = code.replace(/initSettingsPanel\(\)/g, 'global.initSettingsPanel()');
        code = code.replace(/initAuth0\(\)/g, 'global.initAuth0()');
        code = code.replace(/updateAuthControls\(\)/g, 'global.updateAuthControls()');
        code = code.replace(/markActiveNav\(\)/g, 'global.markActiveNav()');
        code = code.replace(/initPageSpecificFeatures\(\)/g, 'global.initPageSpecificFeatures()');
        eval(`init = ${code.replace('function init()', 'function()')}`);
      }
    });

    test('should load settings first', () => {
      init();
      expect(global.loadSettings).toHaveBeenCalled();
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

    test('should initialize Auth0', () => {
      init();
      expect(global.initAuth0).toHaveBeenCalled();
    });

    test('should update auth controls', () => {
      init();
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

    test('should register echo plugin', () => {
      const registerSpy = jest.spyOn(AppPlugins, 'register');
      init();
      
      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'echo-plugin',
          command: 'echo'
        })
      );
    });

    test('should follow correct initialization order', () => {
      const callOrder = [];
      global.loadSettings = jest.fn(() => callOrder.push('loadSettings'));
      global.applyTheme = jest.fn(() => callOrder.push('applyTheme'));
      global.initThemeToggle = jest.fn(() => callOrder.push('initThemeToggle'));
      
      init();
      
      expect(callOrder.indexOf('loadSettings')).toBeLessThan(callOrder.indexOf('applyTheme'));
      expect(callOrder.indexOf('applyTheme')).toBeLessThan(callOrder.indexOf('initThemeToggle'));
    });
  });

  describe('DOMContentLoaded Integration', () => {
    test('should run init when document is already loaded', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const bootMatch = scriptContent.match(/if \(document\.readyState !== 'loading'\) \{[\s\S]*?\n  \}/);
      
      expect(bootMatch).not.toBeNull();
    });

    test('should register DOMContentLoaded listener when loading', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const listenerMatch = scriptContent.match(/document\.addEventListener\('DOMContentLoaded', init\)/);
      
      expect(listenerMatch).not.toBeNull();
    });
  });

  describe('Echo Plugin', () => {
    let AppPlugins, logTerminal;

    beforeEach(() => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      // Extract logTerminal
      const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
      if (logMatch) {
        eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
      }
      
      // Extract AppPlugins
      const pluginsMatch = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/);
      if (pluginsMatch) {
        eval(pluginsMatch[0]);
      }
    });

    test('should register echo plugin on init', () => {
      AppPlugins.register({
        name: 'echo-plugin',
        command: 'echo',
        run: (text) => text || '(empty)'
      });

      expect(AppPlugins.list()).toContain('echo-plugin');
    });

    test('should return text when provided', () => {
      AppPlugins.register({
        name: 'echo-plugin',
        command: 'echo',
        run: (text) => text || '(empty)'
      });

      const echoCommand = AppPlugins.getCommand('echo');
      const result = echoCommand('Hello World');

      expect(result).toBe('Hello World');
    });

    test('should return "(empty)" when no text provided', () => {
      AppPlugins.register({
        name: 'echo-plugin',
        command: 'echo',
        run: (text) => text || '(empty)'
      });

      const echoCommand = AppPlugins.getCommand('echo');
      const result = echoCommand('');

      expect(result).toBe('(empty)');
    });
  });
});