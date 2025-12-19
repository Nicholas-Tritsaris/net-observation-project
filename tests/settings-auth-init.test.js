/**
 * Comprehensive unit tests for settings panel, Auth0, and initialization functions
 * Tests initSettingsPanel, initAuth0, updateAuthControls, init, initPageSpecificFeatures
 */

describe('Settings, Auth0, and Initialization', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.createAuth0Client;
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('initSettingsPanel', () => {
    test('should populate form fields with current settings', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" />
            <input name="auth0Domain" />
            <input name="auth0ClientId" />
            <select name="themeMode"></select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;
      
      const AppState = {
        settings: {
          backendUrl: '/api/test',
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'client123',
          theme: 'dark'
        }
      };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      const initAuth0 = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const initSettingsPanelFunc = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initSettingsPanelFunc);
      
      initSettingsPanel();
      
      expect(document.querySelector('[name="backendUrl"]').value).toBe('/api/test');
      expect(document.querySelector('[name="auth0Domain"]').value).toBe('test.auth0.com');
      expect(document.querySelector('[name="auth0ClientId"]').value).toBe('client123');
      expect(document.querySelector('[name="themeMode"]').value).toBe('dark');
    });

    test('should save settings on form submit', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/new-api" />
            <input name="auth0Domain" value="new.auth0.com" />
            <input name="auth0ClientId" value="new-client" />
            <select name="themeMode"><option value="light" selected>Light</option></select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;
      
      const AppState = {
        settings: {
          backendUrl: '',
          auth0Domain: '',
          auth0ClientId: '',
          theme: 'auto'
        }
      };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      const initAuth0 = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const initSettingsPanelFunc = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initSettingsPanelFunc);
      
      initSettingsPanel();
      
      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      
      expect(AppState.settings.backendUrl).toBe('/new-api');
      expect(AppState.settings.auth0Domain).toBe('new.auth0.com');
      expect(AppState.settings.auth0ClientId).toBe('new-client');
      expect(AppState.settings.theme).toBe('light');
      expect(saveSettings).toHaveBeenCalled();
      expect(applyTheme).toHaveBeenCalled();
      expect(initAuth0).toHaveBeenCalled();
    });

    test('should use default backendUrl when field is empty', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="  " />
            <input name="auth0Domain" />
            <input name="auth0ClientId" />
            <select name="themeMode"></select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;
      
      const AppState = { settings: { backendUrl: '' } };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      const initAuth0 = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const initSettingsPanelFunc = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initSettingsPanelFunc);
      
      initSettingsPanel();
      document.querySelector('form').dispatchEvent(new Event('submit'));
      
      expect(AppState.settings.backendUrl).toBe('/api/censys-summary');
    });

    test('should toggle panel visibility on toggle button click', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden"></div>
        <button class="settings-toggle">&#9881;</button>
      `;
      
      const AppState = { settings: {} };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      const initAuth0 = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const initSettingsPanelFunc = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initSettingsPanelFunc);
      
      initSettingsPanel();
      
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      
      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(false);
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.innerHTML).toBe('&#10006;');
      
      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(true);
      expect(toggle.classList.contains('active')).toBe(false);
      expect(toggle.innerHTML).toBe('&#9881;');
    });

    test('should handle missing panel or toggle gracefully', () => {
      const AppState = { settings: {} };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      const initAuth0 = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const initSettingsPanelFunc = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initSettingsPanelFunc);
      
      expect(() => initSettingsPanel()).not.toThrow();
    });
  });

  describe('initAuth0', () => {
    test('should initialize Auth0 client with valid configuration', async () => {
      const mockAuth0Client = {
        isAuthenticated: jest.fn(() => Promise.resolve(false))
      };
      
      window.createAuth0Client = jest.fn(() => Promise.resolve(mockAuth0Client));
      
      const AppState = {
        settings: {
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'test-client-id'
        },
        auth0Client: null
      };
      
      const outputs = [];
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const updateAuthControls = jest.fn();
      
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initAuth0Func);
      
      await initAuth0();
      
      expect(window.createAuth0Client).toHaveBeenCalledWith({
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      });
      expect(AppState.auth0Client).toBe(mockAuth0Client);
      expect(outputs.some(o => o.includes('Auth0 client initialised'))).toBe(true);
      expect(updateAuthControls).toHaveBeenCalled();
    });

    test('should not initialize when Auth0 library is missing', async () => {
      const AppState = {
        settings: {
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'test-client-id'
        }
      };
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const updateAuthControls = jest.fn();
      
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initAuth0Func);
      
      await expect(initAuth0()).resolves.not.toThrow();
    });

    test('should not initialize when domain is missing', async () => {
      window.createAuth0Client = jest.fn();
      
      const AppState = {
        settings: {
          auth0Domain: '',
          auth0ClientId: 'test-client-id'
        }
      };
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const updateAuthControls = jest.fn();
      
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initAuth0Func);
      
      await initAuth0();
      
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    test('should not initialize when clientId is missing', async () => {
      window.createAuth0Client = jest.fn();
      
      const AppState = {
        settings: {
          auth0Domain: 'test.auth0.com',
          auth0ClientId: ''
        }
      };
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const updateAuthControls = jest.fn();
      
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initAuth0Func);
      
      await initAuth0();
      
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    test('should handle Auth0 initialization errors', async () => {
      window.createAuth0Client = jest.fn(() => Promise.reject(new Error('Auth0 setup failed')));
      
      const AppState = {
        settings: {
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'test-client-id'
        }
      };
      
      const outputs = [];
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const updateAuthControls = jest.fn();
      
      const initAuth0Func = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initAuth0Func);
      
      await initAuth0();
      
      expect(outputs.some(o => o.includes('Auth0 init failed'))).toBe(true);
    });
  });

  describe('updateAuthControls', () => {
    test('should hide buttons when no Auth0 client', async () => {
      document.body.innerHTML = `
        <button data-action="login"></button>
        <button data-action="logout"></button>
        <span data-auth-status></span>
      `;
      
      const AppState = { auth0Client: null };
      
      const updateAuthControlsFunc = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/)[0];
      eval(updateAuthControlsFunc);
      
      await updateAuthControls();
      
      expect(document.querySelector('[data-action="login"]').classList.contains('hidden')).toBe(true);
      expect(document.querySelector('[data-action="logout"]').classList.contains('hidden')).toBe(true);
      expect(document.querySelector('[data-auth-status]').textContent).toBe('Anonymous');
    });

    test('should show login button when not authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login"></button>
        <button data-action="logout"></button>
        <span data-auth-status></span>
      `;
      
      const mockClient = {
        isAuthenticated: jest.fn(() => Promise.resolve(false))
      };
      
      const AppState = { auth0Client: mockClient };
      
      const updateAuthControlsFunc = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/)[0];
      eval(updateAuthControlsFunc);
      
      await updateAuthControls();
      
      expect(document.querySelector('[data-action="login"]').classList.contains('hidden')).toBe(false);
      expect(document.querySelector('[data-action="logout"]').classList.contains('hidden')).toBe(true);
      expect(document.querySelector('[data-auth-status]').textContent).toBe('Anonymous');
    });

    test('should show logout button when authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login"></button>
        <button data-action="logout"></button>
        <span data-auth-status></span>
      `;
      
      const mockClient = {
        isAuthenticated: jest.fn(() => Promise.resolve(true))
      };
      
      const AppState = { auth0Client: mockClient };
      
      const updateAuthControlsFunc = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/)[0];
      eval(updateAuthControlsFunc);
      
      await updateAuthControls();
      
      expect(document.querySelector('[data-action="login"]').classList.contains('hidden')).toBe(true);
      expect(document.querySelector('[data-action="logout"]').classList.contains('hidden')).toBe(false);
      expect(document.querySelector('[data-auth-status]').textContent).toBe('Authenticated');
    });

    test('should bind login button click handler only once', async () => {
      document.body.innerHTML = `
        <button data-action="login"></button>
        <span data-auth-status></span>
      `;
      
      const mockClient = {
        isAuthenticated: jest.fn(() => Promise.resolve(false)),
        loginWithPopup: jest.fn(() => Promise.resolve())
      };
      
      const AppState = { auth0Client: mockClient };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const updateAuthControlsFunc = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      eval(updateAuthControlsFunc);
      
      await updateAuthControls();
      await updateAuthControls(); // Call twice
      
      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');
    });
  });

  describe('initPageSpecificFeatures', () => {
    test('should initialize dashboard features', () => {
      document.body.dataset.page = 'dashboard';
      
      const initCharts = jest.fn();
      const initAutoRefresh = jest.fn();
      const initTerminal = jest.fn();
      const initDataVisualizer = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initCharts).toHaveBeenCalled();
      expect(initAutoRefresh).toHaveBeenCalled();
      expect(initTerminal).toHaveBeenCalled();
      expect(initDataVisualizer).toHaveBeenCalled();
    });

    test('should initialize docs features', () => {
      document.body.dataset.page = 'docs';
      
      const initDocsSidebar = jest.fn();
      const initVersionList = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initDocsSidebar).toHaveBeenCalled();
      expect(initVersionList).toHaveBeenCalled();
    });

    test('should initialize versions features', () => {
      document.body.dataset.page = 'versions';
      
      const initVersionList = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initVersionList).toHaveBeenCalled();
    });

    test('should initialize API page features', () => {
      document.body.dataset.page = 'api';
      
      const initTerminal = jest.fn();
      const initAutoRefresh = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initTerminal).toHaveBeenCalled();
      expect(initAutoRefresh).toHaveBeenCalled();
    });

    test('should initialize data page features', () => {
      document.body.dataset.page = 'data';
      
      const initDataVisualizer = jest.fn();
      const initAutoRefresh = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initDataVisualizer).toHaveBeenCalled();
      expect(initAutoRefresh).toHaveBeenCalled();
    });

    test('should initialize default features for unknown page', () => {
      document.body.dataset.page = 'unknown';
      
      const initAutoRefresh = jest.fn();
      const initTerminal = jest.fn();
      
      const initPageSpecificFeaturesFunc = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initPageSpecificFeaturesFunc);
      
      initPageSpecificFeatures();
      
      expect(initAutoRefresh).toHaveBeenCalled();
      expect(initTerminal).toHaveBeenCalled();
    });
  });

  describe('initDocsSidebar', () => {
    test('should enable smooth scrolling for anchor links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
      `;
      
      const initDocsSidebarFunc = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initDocsSidebarFunc);
      
      const mockScrollIntoView = jest.fn();
      document.getElementById('section1').scrollIntoView = mockScrollIntoView;
      
      initDocsSidebar();
      
      const link = document.querySelector('.docs-sidebar a[href="#section1"]');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    test('should not affect external links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="https://example.com">External</a>
        </div>
      `;
      
      const initDocsSidebarFunc = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initDocsSidebarFunc);
      
      expect(() => initDocsSidebar()).not.toThrow();
    });
  });

  describe('initVersionList', () => {
    test('should populate version list container', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      
      const initVersionListFunc = scriptContent.match(/function initVersionList\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initVersionListFunc);
      
      initVersionList();
      
      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('v2.3');
      expect(container.innerHTML).toContain('current');
      expect(container.innerHTML).toContain('v2.2');
      expect(container.innerHTML).toContain('lts');
    });

    test('should handle missing container gracefully', () => {
      const initVersionListFunc = scriptContent.match(/function initVersionList\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initVersionListFunc);
      
      expect(() => initVersionList()).not.toThrow();
    });
  });
});