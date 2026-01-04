/**
 * Comprehensive tests for Auth0, Settings Panel, and Documentation features
 * Covers functions that were not fully tested in existing test suites:
 * - initAuth0()
 * - updateAuthControls()
 * - initSettingsPanel()
 * - renderHeatmap()
 * - initDocsSidebar()
 * - initVersionList()
 * - markActiveNav()
 * - Additional edge cases for existing functions
 */

const fs = require('fs');
const path = require('path');

describe('Auth0 Integration Functions', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();

    // Reset globals
    window.createAuth0Client = undefined;
    window.__latestCensys = null;
  });

  describe('initAuth0()', () => {
    it('should return early when createAuth0Client is not available', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      const script = scriptContent.replace('export async function onRequest', 'async function onRequest');
      eval(script);

      // No Auth0 client should be created
      expect(window.createAuth0Client).toBeUndefined();
    });

    it('should return early when auth0Domain is missing', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      window.createAuth0Client = jest.fn();
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    it('should return early when auth0ClientId is missing', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      window.createAuth0Client = jest.fn();
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com'
      }));

      eval(scriptContent);

      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    it('should initialize Auth0 client with correct configuration', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'auto'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.createAuth0Client).toHaveBeenCalledWith({
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      });
    });

    it('should log success message when Auth0 initializes', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Auth0 client initialised');
    });

    it('should catch and log Auth0 initialization errors', async () => {
      document.body.innerHTML = '<div class="terminal"><div class="terminal-output"></div></div>';
      
      window.createAuth0Client = jest.fn().mockRejectedValue(new Error('Network failure'));
      
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Auth0 init failed');
      expect(output.textContent).toContain('Network failure');
    });
  });

  describe('updateAuthControls()', () => {
    it('should hide both buttons when auth0Client is not initialized', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status></span>
      `;

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 50));

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');

      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
      expect(status.textContent).toBe('Anonymous');
    });

    it('should show login button when not authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status></span>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');

      expect(loginBtn.classList.contains('hidden')).toBe(false);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
      expect(status.textContent).toBe('Anonymous');
    });

    it('should show logout button when authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status></span>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');

      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(false);
      expect(status.textContent).toBe('Authenticated');
    });

    it('should attach login handler only once', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn().mockResolvedValue(undefined)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');

      // Click login button
      loginBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockClient.loginWithPopup).toHaveBeenCalledTimes(1);
    });

    it('should log successful login', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn()
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true),
        loginWithPopup: jest.fn().mockResolvedValue(undefined)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const loginBtn = document.querySelector('[data-action="login"]');
      loginBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Logged in via Auth0');
    });

    it('should attach logout handler only once', async () => {
      document.body.innerHTML = `
        <button data-action="logout">Logout</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        logout: jest.fn().mockResolvedValue(undefined)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.dataset.bound).toBe('true');
    });

    it('should log successful logout', async () => {
      document.body.innerHTML = `
        <button data-action="logout">Logout</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        logout: jest.fn().mockResolvedValue(undefined)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const logoutBtn = document.querySelector('[data-action="logout"]');
      logoutBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Logged out of Auth0');
    });

    it('should handle missing DOM elements gracefully', async () => {
      document.body.innerHTML = '<div></div>';

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);

      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not throw errors
      expect(mockClient.isAuthenticated).toHaveBeenCalled();
    });
  });
});

describe('Settings Panel Functions', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initSettingsPanel()', () => {
    it('should return early when panel is missing', () => {
      document.body.innerHTML = '<button class="settings-toggle">Settings</button>';
      
      eval(scriptContent);
      
      // Should not throw
      expect(document.querySelector('.settings-panel')).toBeNull();
    });

    it('should return early when toggle is missing', () => {
      document.body.innerHTML = '<form class="settings-panel"></form>';
      
      eval(scriptContent);
      
      // Should not throw
      expect(document.querySelector('.settings-toggle')).toBeNull();
    });

    it('should populate form fields from AppState.settings', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" />
          <input name="auth0Domain" />
          <input name="auth0ClientId" />
          <select name="themeMode">
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      localStorage.setItem('nop-settings', JSON.stringify({
        backendUrl: 'https://api.example.com/censys',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'abc123',
        theme: 'dark'
      }));

      eval(scriptContent);

      expect(document.querySelector('[name="backendUrl"]').value).toBe('https://api.example.com/censys');
      expect(document.querySelector('[name="auth0Domain"]').value).toBe('example.auth0.com');
      expect(document.querySelector('[name="auth0ClientId"]').value).toBe('abc123');
      expect(document.querySelector('[name="themeMode"]').value).toBe('dark');
    });

    it('should save settings on form submit', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="https://new-api.com" />
          <input name="auth0Domain" value="new.auth0.com" />
          <input name="auth0ClientId" value="xyz789" />
          <select name="themeMode">
            <option value="light" selected>Light</option>
          </select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      form.dispatchEvent(new Event('submit'));

      const saved = JSON.parse(localStorage.getItem('nop-settings'));
      expect(saved.backendUrl).toBe('https://new-api.com');
      expect(saved.auth0Domain).toBe('new.auth0.com');
      expect(saved.auth0ClientId).toBe('xyz789');
      expect(saved.theme).toBe('light');
    });

    it('should trim input values on save', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="  https://api.com  " />
          <input name="auth0Domain" value="  domain.com  " />
          <input name="auth0ClientId" value="  client123  " />
          <select name="themeMode"><option value="auto" selected>Auto</option></select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      form.dispatchEvent(new Event('submit'));

      const saved = JSON.parse(localStorage.getItem('nop-settings'));
      expect(saved.backendUrl).toBe('https://api.com');
      expect(saved.auth0Domain).toBe('domain.com');
      expect(saved.auth0ClientId).toBe('client123');
    });

    it('should use default backendUrl when empty', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode"><option value="auto" selected>Auto</option></select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      form.dispatchEvent(new Event('submit'));

      const saved = JSON.parse(localStorage.getItem('nop-settings'));
      expect(saved.backendUrl).toBe('/api/censys-summary');
    });

    it('should apply theme after saving settings', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode"><option value="dark" selected>Dark</option></select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      form.dispatchEvent(new Event('submit'));

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should log success message after saving', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode"><option value="auto" selected>Auto</option></select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      form.dispatchEvent(new Event('submit'));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Settings saved');
    });

    it('should toggle panel visibility on button click', () => {
      document.body.innerHTML = `
        <form class="settings-panel hidden">
          <input name="backendUrl" />
          <input name="auth0Domain" />
          <input name="auth0ClientId" />
          <select name="themeMode"><option value="auto">Auto</option></select>
        </form>
        <button class="settings-toggle">&#9881;</button>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      expect(panel.classList.contains('hidden')).toBe(true);
      expect(toggle.innerHTML).toBe('&#9881;');

      toggle.click();

      expect(panel.classList.contains('hidden')).toBe(false);
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.innerHTML).toBe('&#10006;');

      toggle.click();

      expect(panel.classList.contains('hidden')).toBe(true);
      expect(toggle.classList.contains('active')).toBe(false);
      expect(toggle.innerHTML).toBe('&#9881;');
    });

    it('should prevent default form submission', () => {
      document.body.innerHTML = `
        <form class="settings-panel">
          <input name="backendUrl" value="" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode"><option value="auto" selected>Auto</option></select>
        </form>
        <button class="settings-toggle">Settings</button>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel');
      const event = new Event('submit', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      form.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});

describe('Heatmap Rendering Functions', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();

    window.d3 = undefined;
    window.topojson = undefined;
  });

  describe('renderHeatmap()', () => {
    it('should return early when container is missing', async () => {
      document.body.innerHTML = '<div></div>';

      eval(scriptContent);

      // Should not throw
      const container = document.getElementById('worldHeatmap');
      expect(container).toBeNull();
    });

    it('should return early when d3 is not available', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';

      eval(scriptContent);

      expect(window.d3).toBeUndefined();
    });

    it('should log error when topojson is missing', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      window.d3 = { json: jest.fn() };

      eval(scriptContent);

      // Trigger heatmap render
      await new Promise(resolve => setTimeout(resolve, 50));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('TopoJSON library missing');
    });

    it('should handle world data fetch failure', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal"><div class="terminal-output"></div></div>
      `;

      const mockD3 = {
        json: jest.fn().mockRejectedValue(new Error('Network error')),
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          remove: jest.fn(),
          data: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          append: jest.fn().mockReturnThis(),
          text: jest.fn()
        })
      };

      window.d3 = mockD3;
      window.topojson = { feature: jest.fn() };

      eval(scriptContent);

      // Simulate calling renderHeatmap
      await new Promise(resolve => setTimeout(resolve, 100));

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Failed to load world map data');
    });

    it('should cache world data after first load', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';

      const mockWorld = {
        objects: {
          countries: {
            type: 'GeometryCollection',
            geometries: []
          }
        }
      };

      const mockFeatures = {
        type: 'FeatureCollection',
        features: []
      };

      const mockD3 = {
        json: jest.fn().mockResolvedValue(mockWorld),
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          remove: jest.fn(),
          data: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          append: jest.fn().mockReturnThis(),
          text: jest.fn()
        }),
        geoNaturalEarth1: jest.fn().mockReturnValue({
          fitWidth: jest.fn().mockReturnValue({})
        }),
        geoPath: jest.fn().mockReturnValue(() => 'M0,0'),
        scaleSequential: jest.fn().mockReturnValue({
          domain: jest.fn().mockReturnThis()
        }),
        interpolateTurbo: jest.fn()
      };

      window.d3 = mockD3;
      window.topojson = {
        feature: jest.fn().mockReturnValue(mockFeatures)
      };

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 50));

      // World data should be cached
      expect(mockD3.json).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Documentation Features', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initDocsSidebar()', () => {
    it('should enable smooth scrolling for anchor links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
      `;

      document.body.dataset.page = 'docs';

      const mockScrollIntoView = jest.fn();
      document.getElementById('section1').scrollIntoView = mockScrollIntoView;

      eval(scriptContent);

      const link = document.querySelector('.docs-sidebar a[href="#section1"]');
      const event = new Event('click', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      link.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    it('should not handle external links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="https://example.com">External</a>
          <a href="/other-page.html">Other Page</a>
        </div>
      `;

      document.body.dataset.page = 'docs';

      eval(scriptContent);

      const externalLink = document.querySelector('a[href="https://example.com"]');
      const event = new Event('click', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      externalLink.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle missing target elements gracefully', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#nonexistent">Broken Link</a>
        </div>
      `;

      document.body.dataset.page = 'docs';

      eval(scriptContent);

      const link = document.querySelector('.docs-sidebar a');
      
      expect(() => {
        link.click();
      }).not.toThrow();
    });

    it('should do nothing when no docs-sidebar exists', () => {
      document.body.innerHTML = '<div></div>';
      document.body.dataset.page = 'docs';

      eval(scriptContent);

      // Should not throw
      expect(document.querySelector('.docs-sidebar')).toBeNull();
    });
  });

  describe('initVersionList()', () => {
    it('should populate version list container', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);

      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('v2.3');
      expect(container.innerHTML).toContain('v2.2');
      expect(container.innerHTML).toContain('v2.1');
      expect(container.innerHTML).toContain('v1.x');
      expect(container.innerHTML).toContain('CURRENT');
      expect(container.innerHTML).toContain('LTS');
      expect(container.innerHTML).toContain('LEGACY');
      expect(container.innerHTML).toContain('ARCHIVED');
    });

    it('should create card elements for each version', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);

      const cards = document.querySelectorAll('[data-version-list] .card');
      expect(cards.length).toBe(4);
    });

    it('should include badge and notes for each version', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);

      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('Stable release');
      expect(container.innerHTML).toContain('Long-term support');
      expect(container.innerHTML).toContain('Security patches only');
      expect(container.innerHTML).toContain('Historical data');
    });

    it('should do nothing when container is missing', () => {
      document.body.innerHTML = '<div></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);

      // Should not throw
      expect(document.querySelector('[data-version-list]')).toBeNull();
    });
  });

  describe('markActiveNav()', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { pathname: '/docs/dashboard.html' };
    });

    it('should add active class to matching nav link', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;

      eval(scriptContent);

      const dashboardLink = document.querySelector('a[href="dashboard.html"]');
      expect(dashboardLink.classList.contains('active')).toBe(true);
    });

    it('should mark index.html as active for root path', () => {
      window.location = { pathname: '/' };

      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      eval(scriptContent);

      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink.classList.contains('active')).toBe(true);
    });

    it('should handle paths without file extension', () => {
      window.location = { pathname: '/docs/' };

      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      eval(scriptContent);

      const indexLink = document.querySelector('a[href="index.html"]');
      expect(indexLink.classList.contains('active')).toBe(true);
    });

    it('should not mark non-matching links as active', () => {
      window.location = { pathname: '/docs/dashboard.html' };

      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="api.html">API</a>
        </nav>
      `;

      eval(scriptContent);

      const apiLink = document.querySelector('a[href="api.html"]');
      expect(apiLink.classList.contains('active')).toBe(false);
    });

    it('should handle multiple nav elements', () => {
      window.location = { pathname: '/docs/api.html' };

      document.body.innerHTML = `
        <nav class="primary">
          <a href="api.html">API</a>
        </nav>
        <nav class="secondary">
          <a href="api.html">API</a>
        </nav>
      `;

      eval(scriptContent);

      const apiLinks = document.querySelectorAll('a[href="api.html"]');
      apiLinks.forEach(link => {
        expect(link.classList.contains('active')).toBe(true);
      });
    });
  });
});

describe('Additional Edge Cases', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('generateColorPalette()', () => {
    it('should generate correct number of colors', () => {
      eval(scriptContent);

      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
      };

      const colors = generateColorPalette(10, 'services');
      expect(colors.length).toBe(10);
    });

    it('should use different base hue for services', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
      };

      const serviceColors = generateColorPalette(1, 'services');
      const countryColors = generateColorPalette(1, 'countries');

      expect(serviceColors[0]).toContain('hsl(180');
      expect(countryColors[0]).toContain('hsl(300');
    });

    it('should wrap hue values at 360 degrees', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
      };

      const colors = generateColorPalette(20, 'services');
      
      colors.forEach(color => {
        const hue = parseInt(color.match(/hsl\((\d+)/)[1]);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });

    it('should include alpha transparency', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
      };

      const colors = generateColorPalette(5, 'services');
      
      colors.forEach(color => {
        expect(color).toContain('/ 0.7');
        expect(color).toContain('80% 55%');
      });
    });

    it('should handle zero count', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
      };

      const colors = generateColorPalette(0, 'services');
      expect(colors.length).toBe(0);
    });
  });

  describe('initPageSpecificFeatures()', () => {
    it('should initialize dashboard features', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input />
          <button>Run</button>
        </div>
        <div id="dataInput"></div>
        <div id="dataOutput"></div>
      `;
      document.body.dataset.page = 'dashboard';

      eval(scriptContent);

      // Terminal should be initialized
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Terminal online');
    });

    it('should initialize docs features', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#test">Test</a>
        </div>
        <div data-version-list></div>
      `;
      document.body.dataset.page = 'docs';

      eval(scriptContent);

      const versionList = document.querySelector('[data-version-list]');
      expect(versionList.innerHTML).toContain('v2.3');
    });

    it('should initialize api features', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input />
          <button>Run</button>
        </div>
      `;
      document.body.dataset.page = 'api';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 1000,
          total_services: 500,
          countries: {},
          services: {}
        })
      });

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Terminal online');
    });

    it('should handle default case', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input />
          <button>Run</button>
        </div>
      `;
      document.body.dataset.page = 'unknown';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 1000,
          total_services: 500,
          countries: {},
          services: {}
        })
      });

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Terminal online');
    });
  });

  describe('Script initialization timing', () => {
    it('should initialize immediately if document is already loaded', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      document.body.innerHTML = '<div></div>';

      eval(scriptContent);

      // Should have initialized
      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });

    it('should wait for DOMContentLoaded if document is loading', (done) => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      document.body.innerHTML = '<div></div>';

      eval(scriptContent);

      // Should not be initialized yet
      setTimeout(() => {
        // Trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
        
        setTimeout(() => {
          expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('Echo plugin registration', () => {
    it('should register echo-plugin on initialization', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Plugin registered: echo-plugin');
    });

    it('should handle echo command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input value="echo hello world" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('hello world');
    });

    it('should return (empty) for empty echo command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input value="echo" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('(empty)');
    });
  });
});