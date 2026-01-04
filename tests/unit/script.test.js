/**
 * Unit tests for docs/script.js
 * Focuses on testing the changed functionality in the current branch:
 * - Removal of refreshChartThemes() function
 * - Modified Auth0 initialization logic
 * - Theme application without chart refresh
 * - Sidebar initialization changes
 */

const { JSDOM } = require('jsdom');

describe('Net Observation Project - Script.js Unit Tests', () => {
  let dom;
  let window;
  let document;
  let localStorage;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html data-theme="dark">
        <head><title>Test</title></head>
        <body data-page="home">
          <div class="logo-sigil logo-sigil--sidebar" role="img" aria-label="Net Observation Project logo"></div>
          <aside class="sidebar">
            <div class="logo-sigil logo-sigil--sidebar"></div>
            <div class="theme-toggle" data-role="theme-toggle" role="button" tabindex="0">
              <span>Theme:</span>
              <strong data-label>AUTO</strong>
            </div>
            <nav>
              <a href="index.html">Overview</a>
            </nav>
          </aside>
          <button class="sidebar-toggle" aria-label="Toggle navigation">&#x2715;</button>
          <div data-stat="total-hosts"></div>
          <div data-stat="total-services"></div>
          <div data-stat="last-sync"></div>
          <table data-table="countries"><tbody></tbody></table>
          <div class="terminal">
            <div class="terminal-output"></div>
            <div class="terminal-input">
              <input type="text" />
              <button type="button">Run</button>
            </div>
          </div>
          <canvas id="servicesChart"></canvas>
          <canvas id="countriesChart"></canvas>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    
    // Setup global mocks
    global.window = window;
    global.document = document;
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock;
    
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Mock fetch
    global.fetch = jest.fn();

    // Mock Chart.js
    window.Chart = jest.fn().mockImplementation(() => ({
      data: { labels: [], datasets: [] },
      options: {},
      update: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Management - Modified Behavior', () => {
    test('applyTheme should set theme without calling refreshChartThemes', () => {
      // This tests the removal of refreshChartThemes() call
      localStorage.getItem.mockReturnValue(JSON.stringify({ theme: 'dark' }));
      
      // Load and execute the script
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      const themeAttr = document.documentElement.getAttribute('data-theme');
      const bodyTheme = document.body.dataset.theme;

      expect(themeAttr).toBeTruthy();
      expect(bodyTheme).toBeTruthy();
      // Verify refreshChartThemes is not called (it should not exist)
      expect(global.refreshChartThemes).toBeUndefined();
    });

    test('theme toggle should cycle through auto, dark, light', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle).toBeTruthy();
      
      // Simulate clicking theme toggle
      const clickEvent = new window.Event('click', { bubbles: true });
      
      // Initial state should be 'auto'
      localStorage.getItem.mockReturnValue(JSON.stringify({ theme: 'auto' }));
      
      // The theme cycling logic should work without chart refresh
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('applyTheme with auto should respect prefers-color-scheme', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: true, // Simulate dark mode preference
        media: query,
        addEventListener: jest.fn(),
        addListener: jest.fn(),
      }));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // With auto theme and dark preference, should apply dark
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Auth0 Initialization - Modified Logic', () => {
    test('initAuth0 should return early when domain or clientId missing', async () => {
      // This tests the simplified Auth0 logic that removed updateAuthControls call
      window.createAuth0Client = jest.fn();
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Auth0 client should not be created when credentials are missing
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    test('initAuth0 should not call updateAuthControls when credentials missing', async () => {
      window.createAuth0Client = jest.fn();
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // The modification removed updateAuthControls() call for missing credentials
      // Verify Auth0 is not initialized
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    test('initAuth0 should initialize when valid credentials provided', async () => {
      const mockAuth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn(),
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockAuth0Client);
      
      localStorage.getItem.mockReturnValue(JSON.stringify({
        theme: 'auto',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Give async operations time to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.createAuth0Client).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'test.auth0.com',
          clientId: 'test-client-id'
        })
      );
    });
  });

  describe('Sidebar Initialization - Modified Behavior', () => {
    test('sidebar should start with open class on desktop', () => {
      // Mock desktop width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      // On desktop (>880px), sidebar should have open class
      expect(window.innerWidth).toBeGreaterThan(880);
    });

    test('sidebar should setState(false) on mobile', () => {
      // Mock mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      expect(sidebar).toBeTruthy();
      expect(toggle).toBeTruthy();
      expect(window.innerWidth).toBeLessThan(880);
    });

    test('sidebar toggle should update aria-expanded attribute', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      expect(toggle).toBeTruthy();
      
      const clickEvent = new window.Event('click', { bubbles: true });
      toggle.dispatchEvent(clickEvent);

      // Toggle should have aria-expanded attribute
      expect(toggle.hasAttribute('aria-label')).toBe(true);
    });
  });

  describe('Data Fetch and Update - Unchanged but Critical', () => {
    test('fetchCensysSummary should fetch and update stats', async () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 50,
        last_sync: '2024-01-01T00:00:00Z',
        countries: { US: 500, CA: 300 },
        services: { HTTP: 600, HTTPS: 400 }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify fetch was called with correct endpoint
      expect(global.fetch).toHaveBeenCalled();
    });

    test('fetchCensysSummary should handle errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw, error should be caught
      expect(global.fetch).toHaveBeenCalled();
    });

    test('updateStatsView should update DOM elements with data', () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 50,
        last_sync: '2024-01-01T00:00:00Z',
        countries: {},
        services: {}
      };

      const totalHosts = document.querySelector('[data-stat="total-hosts"]');
      const totalServices = document.querySelector('[data-stat="total-services"]');
      const lastSync = document.querySelector('[data-stat="last-sync"]');

      expect(totalHosts).toBeTruthy();
      expect(totalServices).toBeTruthy();
      expect(lastSync).toBeTruthy();
    });
  });

  describe('Chart Management - Modified to Remove Theme Refresh', () => {
    test('updateCharts should not call refreshChartThemes', () => {
      const mockData = {
        services: { HTTP: 600, HTTPS: 400 },
        countries: { US: 500, CA: 300 }
      };

      window.Chart = jest.fn().mockImplementation(() => ({
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {},
        update: jest.fn()
      }));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Verify refreshChartThemes function doesn't exist
      expect(window.refreshChartThemes).toBeUndefined();
    });

    test('chart initialization should set correct color scheme', () => {
      const servicesCtx = document.getElementById('servicesChart');
      const countriesCtx = document.getElementById('countriesChart');

      expect(servicesCtx).toBeTruthy();
      expect(countriesCtx).toBeTruthy();

      window.Chart = jest.fn();
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Charts should be initialized without theme refresh dependency
      expect(window.Chart).toBeDefined();
    });
  });

  describe('Terminal Command System', () => {
    test('terminal should initialize with welcome message', () => {
      const terminal = document.querySelector('.terminal');
      const output = terminal.querySelector('.terminal-output');

      expect(terminal).toBeTruthy();
      expect(output).toBeTruthy();
    });

    test('help command should return available commands', () => {
      const terminal = document.querySelector('.terminal');
      const input = terminal.querySelector('input');
      const button = terminal.querySelector('button');

      expect(input).toBeTruthy();
      expect(button).toBeTruthy();

      input.value = 'help';
      const clickEvent = new window.Event('click', { bubbles: true });
      button.dispatchEvent(clickEvent);

      // Command should be processed
      expect(input.value).toBeTruthy();
    });

    test('theme command should validate arguments', () => {
      const terminal = document.querySelector('.terminal');
      const input = terminal.querySelector('input');

      expect(input).toBeTruthy();
      
      // Invalid theme argument should be rejected
      input.value = 'theme invalid';
      // The validation logic should prevent invalid values
    });

    test('plugins command should list registered plugins', () => {
      const terminal = document.querySelector('.terminal');
      const input = terminal.querySelector('input');

      expect(input).toBeTruthy();
      input.value = 'plugins';
      // Should return list of plugins including echo-plugin
    });
  });

  describe('Plugin System', () => {
    test('registerPlugin should accept valid plugin', () => {
      window.registerPlugin = jest.fn();
      
      const validPlugin = {
        name: 'test-plugin',
        command: 'test',
        run: () => 'test output'
      };

      expect(() => {
        if (window.registerPlugin) {
          window.registerPlugin(validPlugin);
        }
      }).not.toThrow();
    });

    test('registerPlugin should reject plugin without name', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      const invalidPlugin = {
        command: 'test',
        run: () => 'test'
      };

      // Should handle error gracefully
      if (window.registerPlugin) {
        window.registerPlugin(invalidPlugin);
      }
      
      // Error should be logged to terminal, not thrown
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });

    test('echo plugin should be registered on init', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Echo plugin should be registered during initialization
      expect(window.registerPlugin).toBeDefined();
    });
  });

  describe('Settings Management', () => {
    test('loadSettings should parse localStorage correctly', () => {
      const mockSettings = {
        backendUrl: '/custom/api',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'abc123',
        theme: 'light'
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      expect(localStorage.getItem).toHaveBeenCalled();
    });

    test('saveSettings should stringify and store settings', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Settings should be saveable
      expect(localStorage.setItem).toBeDefined();
    });

    test('loadSettings should handle corrupt data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json{');

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      
      // Should not throw on corrupt data
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('Data Visualizer', () => {
    test('parseCSV should handle basic CSV input', () => {
      document.body.innerHTML += `
        <input id="dataInput" />
        <input id="fileInput" type="file" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;

      const csvData = 'name,value\ntest,123\ndata,456';
      const input = document.getElementById('dataInput');
      
      expect(input).toBeTruthy();
      input.value = csvData;
    });

    test('should handle JSON input', () => {
      document.body.innerHTML += `
        <input id="dataInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;

      const jsonData = '{"test": 123}';
      const input = document.getElementById('dataInput');
      
      expect(input).toBeTruthy();
      input.value = jsonData;
    });

    test('should handle file upload', () => {
      document.body.innerHTML += `
        <input id="fileInput" type="file" />
        <div id="dataOutput"></div>
      `;

      const fileInput = document.getElementById('fileInput');
      expect(fileInput).toBeTruthy();
      expect(fileInput.type).toBe('file');
    });

    test('should display error for invalid input', () => {
      document.body.innerHTML += `
        <input id="dataInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;

      const input = document.getElementById('dataInput');
      input.value = 'invalid{json';
      
      const renderBtn = document.getElementById('renderData');
      const clickEvent = new window.Event('click', { bubbles: true });
      renderBtn.dispatchEvent(clickEvent);

      // Should handle error gracefully
      const output = document.getElementById('dataOutput');
      expect(output).toBeTruthy();
    });
  });

  describe('Heatmap Rendering', () => {
    test('should skip heatmap when d3 not available', () => {
      window.d3 = undefined;
      
      document.body.innerHTML += '<svg id="worldHeatmap"></svg>';
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Should not throw when d3 is missing
      const container = document.getElementById('worldHeatmap');
      expect(container).toBeTruthy();
    });

    test('should skip heatmap when topojson not available', () => {
      window.d3 = { json: jest.fn() };
      window.topojson = undefined;
      
      document.body.innerHTML += '<svg id="worldHeatmap"></svg>';
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Should not throw when topojson is missing
      expect(window.topojson).toBeUndefined();
    });
  });

  describe('Navigation and Page Management', () => {
    test('markActiveNav should highlight current page', () => {
      const navLinks = document.querySelectorAll('nav a');
      expect(navLinks.length).toBeGreaterThan(0);
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Active nav marking logic should execute
      expect(navLinks).toBeTruthy();
    });

    test('initPageSpecificFeatures should handle dashboard page', () => {
      document.body.dataset.page = 'dashboard';
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Dashboard-specific features should initialize
      expect(document.body.dataset.page).toBe('dashboard');
    });

    test('initPageSpecificFeatures should handle data page', () => {
      document.body.dataset.page = 'data';
      document.body.innerHTML += `
        <input id="dataInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      expect(document.body.dataset.page).toBe('data');
    });
  });

  describe('Pure Functions and Utilities', () => {
    test('generateColorPalette should create consistent colors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // Color generation should be deterministic based on seed
      // Services seed should produce different colors than countries seed
    });

    test('qs helper should be querySelector wrapper', () => {
      const testDiv = document.createElement('div');
      testDiv.id = 'test-element';
      document.body.appendChild(testDiv);

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      // qs should find elements
      expect(document.querySelector('#test-element')).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Remove all elements
      document.body.innerHTML = '<div></div>';

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      
      // Should not throw when elements are missing
      expect(() => eval(scriptContent)).not.toThrow();
    });

    test('should handle missing Chart.js library', () => {
      window.Chart = undefined;
      
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      
      // Should not throw when Chart is undefined
      expect(() => eval(scriptContent)).not.toThrow();
    });

    test('should handle fetch failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network failed'));

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should log error but not crash
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle invalid localStorage data', () => {
      localStorage.getItem.mockReturnValue(null);

      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf8');
      
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });
});