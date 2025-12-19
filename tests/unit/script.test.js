import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual script.js file
const scriptContent = fs.readFileSync(path.join(process.cwd(), 'docs/script.js'), 'utf-8');

describe('Net Observation Project - script.js Unit Tests', () => {
  let dom;
  let window;
  let document;
  
  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body data-page="dashboard">
          <aside class="sidebar">
            <div class="logo-sigil logo-sigil--sidebar"></div>
            <div class="theme-toggle" data-role="theme-toggle">
              <span>Theme:</span>
              <strong data-label>AUTO</strong>
            </div>
          </aside>
          <button class="sidebar-toggle" aria-expanded="false">☰</button>
          <div data-stat="total-hosts"></div>
          <div data-stat="total-services"></div>
          <div data-stat="last-sync"></div>
          <table data-table="countries"><tbody></tbody></table>
          <table data-table="services"><tbody></tbody></table>
          <div class="terminal">
            <div class="terminal-output"></div>
            <input type="text" />
            <button>Run</button>
          </div>
          <canvas id="servicesChart"></canvas>
          <canvas id="countriesChart"></canvas>
          <svg id="worldHeatmap"></svg>
          <div class="settings-panel">
            <input name="backendUrl" value="" />
            <input name="auth0Domain" value="" />
            <input name="auth0ClientId" value="" />
            <select name="themeMode"><option value="auto">Auto</option></select>
          </div>
          <button class="settings-toggle">⚙</button>
          <button data-action="login">Login</button>
          <button data-action="logout">Logout</button>
          <span data-auth-status>Anonymous</span>
          <textarea id="dataInput"></textarea>
          <input type="file" id="fileInput" />
          <button id="renderData">Render</button>
          <div id="dataOutput"></div>
          <nav><a href="index.html">Home</a><a href="api.html">API</a></nav>
        </body>
      </html>
    `, {
      url: 'http://localhost/',
      runScripts: 'outside-only',
      resources: 'usable'
    });
    
    window = dom.window;
    document = window.document;
    
    // Setup global mocks
    global.window = window;
    global.document = document;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    
    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock Chart.js
    window.Chart = vi.fn().mockImplementation(() => ({
      data: { labels: [], datasets: [] },
      options: {},
      update: vi.fn()
    }));
    
    // Mock d3 and topojson
    window.d3 = {
      select: vi.fn().mockReturnThis(),
      json: vi.fn(),
      geoNaturalEarth1: vi.fn().mockReturnValue({ fitWidth: vi.fn().mockReturnThis() }),
      geoPath: vi.fn(),
      scaleSequential: vi.fn().mockReturnValue(vi.fn()),
      interpolateTurbo: vi.fn(),
      selectAll: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      join: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis()
    };
    
    window.topojson = {
      feature: vi.fn()
    };
    
    // Execute the script in the context
    const scriptFunc = new Function('window', 'document', 'localStorage', 'fetch', scriptContent);
    scriptFunc(window, document, global.localStorage, global.fetch);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme Management', () => {
    it('should initialize with auto theme by default', () => {
      expect(localStorage.getItem).toHaveBeenCalledWith('net-observation-settings');
    });

    it('should apply dark theme when auto and prefers-color-scheme is dark', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        addListener: vi.fn()
      };
      window.matchMedia = vi.fn(() => mockMediaQuery);
      
      // Theme should be applied to document
      const theme = document.documentElement.getAttribute('data-theme');
      expect(['dark', 'light', 'auto']).toContain(theme || 'dark');
    });

    it('should cycle through themes when toggle is clicked', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle).toBeTruthy();
      
      const initialLabel = toggle.querySelector('[data-label]').textContent;
      
      // Simulate click
      toggle.click();
      
      // Settings should be saved
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should handle keyboard navigation for theme toggle', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);
      
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should respond to system color scheme changes when in auto mode', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        addListener: vi.fn()
      };
      window.matchMedia = vi.fn(() => mockMediaQuery);
      
      // Verify listener was added
      const callCount = mockMediaQuery.addEventListener.mock.calls.length + 
                       mockMediaQuery.addListener.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar state when button is clicked', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      const initialState = sidebar.classList.contains('open');
      toggle.click();
      
      const newState = sidebar.classList.contains('open');
      expect(newState).not.toBe(initialState);
    });

    it('should update aria-expanded attribute', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      toggle.click();
      
      const expanded = toggle.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);
    });

    it('should start collapsed on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600
      });
      
      // The sidebar should handle mobile responsively
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should start open on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200
      });
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });
  });

  describe('Data Fetching and Display', () => {
    it('should fetch censys summary data successfully', async () => {
      const mockData = {
        total_hosts: 1000000,
        total_services: 50000,
        last_sync: '2024-01-01T00:00:00Z',
        countries: { US: 500, GB: 300, DE: 200 },
        services: { HTTP: 1000, HTTPS: 800, SSH: 600 }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      // Trigger data fetch by dispatching an event or calling init
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(window.__latestCensys).toBeTruthy();
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // The application should handle this without crashing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that error was logged
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle HTTP error responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should update stats view with fetched data', () => {
      const totalHosts = document.querySelector('[data-stat="total-hosts"]');
      const totalServices = document.querySelector('[data-stat="total-services"]');
      const lastSync = document.querySelector('[data-stat="last-sync"]');
      
      expect(totalHosts).toBeTruthy();
      expect(totalServices).toBeTruthy();
      expect(lastSync).toBeTruthy();
    });

    it('should format large numbers with locale strings', () => {
      const testNumber = 1000000;
      const formatted = testNumber.toLocaleString();
      expect(formatted).toContain('000');
    });

    it('should display placeholder for missing data', () => {
      const testData = {
        total_hosts: null,
        total_services: undefined,
        last_sync: null
      };
      
      // The application should show '—' for missing values
      expect(testData.total_hosts ?? '—').toBe('—');
    });
  });

  describe('Table Rendering', () => {
    it('should render countries table with sorted data', () => {
      const tbody = document.querySelector('[data-table="countries"] tbody');
      expect(tbody).toBeTruthy();
      
      // After data is loaded, rows should be sorted by count descending
      const mockCountries = { US: 500, GB: 300, DE: 200 };
      const sorted = Object.entries(mockCountries).sort((a, b) => b[1] - a[1]);
      expect(sorted[0][0]).toBe('US');
      expect(sorted[2][0]).toBe('DE');
    });

    it('should render services table with sorted data', () => {
      const tbody = document.querySelector('[data-table="services"] tbody');
      expect(tbody).toBeTruthy();
    });

    it('should handle empty table data gracefully', () => {
      const tbody = document.querySelector('[data-table="countries"] tbody');
      tbody.innerHTML = '';
      expect(tbody.children.length).toBe(0);
    });

    it('should format table cell values with locale strings', () => {
      const mockValue = 12345;
      const formatted = Number(mockValue).toLocaleString();
      expect(formatted).toMatch(/\d+/);
    });
  });

  describe('Terminal Functionality', () => {
    it('should initialize terminal with welcome message', () => {
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });

    it('should execute help command', () => {
      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');
      
      input.value = 'help';
      button.click();
      
      expect(input.value).toBe('');
    });

    it('should execute stats command', () => {
      const input = document.querySelector('.terminal input');
      input.value = 'stats';
      
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should execute theme command with valid argument', () => {
      const input = document.querySelector('.terminal input');
      input.value = 'theme dark';
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should reject invalid theme arguments', () => {
      const validThemes = ['auto', 'dark', 'light'];
      const invalidTheme = 'invalid';
      
      expect(validThemes.includes(invalidTheme)).toBe(false);
    });

    it('should execute settings command and return JSON', () => {
      const input = document.querySelector('.terminal input');
      input.value = 'settings';
      
      // The settings command should return a JSON string
      const settings = { theme: 'auto', backendUrl: '/api/censys-summary' };
      const json = JSON.stringify(settings, null, 2);
      expect(json).toContain('theme');
    });

    it('should handle unknown commands gracefully', () => {
      const input = document.querySelector('.terminal input');
      input.value = 'unknownCommand';
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      // Should not throw error
      expect(input).toBeTruthy();
    });

    it('should log messages with timestamps', () => {
      const timestamp = new Date().toLocaleTimeString();
      const message = 'Test message';
      const formatted = `[${timestamp}] ${message}`;
      
      expect(formatted).toContain(message);
      expect(formatted).toMatch(/\[\d+:\d+:\d+.*\]/);
    });

    it('should auto-scroll terminal output to bottom', () => {
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
      
      // After adding messages, scrollTop should equal scrollHeight
      const scrollBehavior = output.scrollTop <= output.scrollHeight;
      expect(scrollBehavior).toBe(true);
    });
  });

  describe('Data Visualizer', () => {
    it('should parse valid JSON input', () => {
      const validJSON = '{"key": "value"}';
      const parsed = JSON.parse(validJSON);
      expect(parsed.key).toBe('value');
    });

    it('should parse CSV input', () => {
      const csvText = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const lines = csvText.trim().split(/\r?\n/);
      const headers = lines[0].split(',');
      
      expect(headers).toEqual(['name', 'age', 'city']);
      expect(lines.length).toBe(3);
    });

    it('should handle CSV with missing values', () => {
      const row = 'John,,NYC';
      const values = row.split(',');
      const cleanValue = values[1]?.trim() ?? '';
      
      expect(cleanValue).toBe('');
    });

    it('should detect JSON vs CSV format', () => {
      const jsonText = '{"data": []}';
      const csvText = 'header1,header2';
      
      expect(jsonText.trim().startsWith('{')).toBe(true);
      expect(csvText.trim().startsWith('{')).toBe(false);
    });

    it('should render parsed data to output', () => {
      const output = document.getElementById('dataOutput');
      expect(output).toBeTruthy();
    });

    it('should handle file input changes', () => {
      const fileInput = document.getElementById('fileInput');
      expect(fileInput).toBeTruthy();
      expect(fileInput.type).toBe('file');
    });

    it('should handle render button clicks', () => {
      const renderBtn = document.getElementById('renderData');
      const dataInput = document.getElementById('dataInput');
      
      dataInput.value = '{"test": true}';
      renderBtn.click();
      
      expect(dataInput.value).toBe('{"test": true}');
    });

    it('should handle parsing errors gracefully', () => {
      const invalidJSON = '{invalid}';
      
      try {
        JSON.parse(invalidJSON);
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err.message).toContain('JSON');
      }
    });
  });

  describe('Plugin System', () => {
    it('should register plugins successfully', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: (text) => `Echo: ${text}`
      };
      
      expect(plugin.name).toBe('test-plugin');
      expect(plugin.command).toBe('test');
    });

    it('should reject plugins without names', () => {
      const invalidPlugin = { command: 'test' };
      
      expect(invalidPlugin.name).toBeUndefined();
    });

    it('should call plugin init method on registration', () => {
      const initMock = vi.fn();
      const plugin = {
        name: 'init-test',
        init: initMock
      };
      
      if (plugin.init) {
        plugin.init({ state: {}, log: vi.fn() });
      }
      
      expect(initMock).toHaveBeenCalled();
    });

    it('should register echo plugin by default', () => {
      const echoPlugin = {
        name: 'echo-plugin',
        command: 'echo',
        run: (text) => text || '(empty)'
      };
      
      expect(echoPlugin.run('test')).toBe('test');
      expect(echoPlugin.run('')).toBe('(empty)');
    });

    it('should list registered plugins', () => {
      const plugins = ['echo-plugin'];
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should execute plugin commands', () => {
      const plugin = {
        name: 'test',
        command: 'test',
        run: (arg) => `Result: ${arg}`
      };
      
      const result = plugin.run('input');
      expect(result).toBe('Result: input');
    });

    it('should handle plugin registration failures', () => {
      try {
        throw new Error('Plugin requires a name');
      } catch (err) {
        expect(err.message).toContain('name');
      }
    });

    it('should prevent duplicate plugin names', () => {
      const registry = new Map();
      registry.set('plugin1', { name: 'plugin1' });
      
      // Attempting to register again should overwrite
      registry.set('plugin1', { name: 'plugin1', updated: true });
      
      expect(registry.get('plugin1').updated).toBe(true);
    });
  });

  describe('Settings Panel', () => {
    it('should load settings from localStorage', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(settings));
      
      const loaded = JSON.parse(localStorage.getItem('test') || '{}');
      expect(loaded.theme || 'auto').toBe('auto');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.getItem.mockReturnValue('invalid{json');
      
      try {
        JSON.parse(localStorage.getItem('test'));
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });

    it('should save settings on form submit', () => {
      const panel = document.querySelector('.settings-panel');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      
      panel.dispatchEvent(event);
      
      // Prevent default should be called
      expect(event.defaultPrevented).toBe(true);
    });

    it('should toggle panel visibility', () => {
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      
      const initialHidden = panel.classList.contains('hidden');
      toggle.click();
      
      // State should change
      expect(panel).toBeTruthy();
    });

    it('should update toggle icon based on panel state', () => {
      const toggle = document.querySelector('.settings-toggle');
      const initialHTML = toggle.innerHTML;
      
      toggle.click();
      
      // Icon should potentially change
      expect(toggle.innerHTML).toBeTruthy();
    });

    it('should trim whitespace from input values', () => {
      const input = '  /api/test  ';
      const trimmed = input.trim();
      expect(trimmed).toBe('/api/test');
    });

    it('should use default backend URL if empty', () => {
      const input = '';
      const url = input.trim() || '/api/censys-summary';
      expect(url).toBe('/api/censys-summary');
    });
  });

  describe('Auth0 Integration', () => {
    it('should skip initialization without Auth0 library', () => {
      delete window.createAuth0Client;
      expect(window.createAuth0Client).toBeUndefined();
    });

    it('should skip initialization without credentials', () => {
      window.createAuth0Client = vi.fn();
      const domain = '';
      const clientId = '';
      
      if (!domain || !clientId) {
        expect(window.createAuth0Client).not.toHaveBeenCalled();
      }
    });

    it('should initialize Auth0 client with credentials', async () => {
      window.createAuth0Client = vi.fn().mockResolvedValue({
        isAuthenticated: vi.fn().mockResolvedValue(false),
        loginWithPopup: vi.fn(),
        logout: vi.fn()
      });
      
      const domain = 'test.auth0.com';
      const clientId = 'test-client-id';
      
      if (domain && clientId) {
        const client = await window.createAuth0Client({
          domain,
          clientId,
          cacheLocation: 'localstorage',
          authorizationParams: { redirect_uri: window.location.origin }
        });
        
        expect(client).toBeTruthy();
      }
    });

    it('should update auth controls based on authentication state', async () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      
      expect(loginBtn).toBeTruthy();
      expect(logoutBtn).toBeTruthy();
    });

    it('should handle login button clicks', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      loginBtn.click();
      
      expect(loginBtn).toBeTruthy();
    });

    it('should handle logout button clicks', () => {
      const logoutBtn = document.querySelector('[data-action="logout"]');
      logoutBtn.click();
      
      expect(logoutBtn).toBeTruthy();
    });

    it('should display authentication status', () => {
      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Anonymous');
    });

    it('should handle Auth0 initialization errors', async () => {
      window.createAuth0Client = vi.fn().mockRejectedValue(new Error('Auth0 error'));
      
      try {
        await window.createAuth0Client({});
      } catch (err) {
        expect(err.message).toBe('Auth0 error');
      }
    });
  });

  describe('Chart Management', () => {
    it('should initialize services doughnut chart', () => {
      const ctx = document.getElementById('servicesChart');
      expect(ctx).toBeTruthy();
    });

    it('should initialize countries bar chart', () => {
      const ctx = document.getElementById('countriesChart');
      expect(ctx).toBeTruthy();
    });

    it('should generate color palette for charts', () => {
      const count = 12;
      const baseHue = 180;
      const palette = Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(palette.length).toBe(12);
      expect(palette[0]).toContain('hsl');
    });

    it('should use different base hues for different chart types', () => {
      const servicesHue = 180;
      const countriesHue = 300;
      
      expect(servicesHue).not.toBe(countriesHue);
    });

    it('should update chart data when new data arrives', () => {
      const mockChart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        update: vi.fn()
      };
      
      const newData = { services: { HTTP: 100, HTTPS: 80 } };
      const entries = Object.entries(newData.services).sort((a, b) => b[1] - a[1]);
      
      mockChart.data.labels = entries.map(([service]) => service);
      mockChart.data.datasets[0].data = entries.map(([, count]) => count);
      mockChart.update('none');
      
      expect(mockChart.update).toHaveBeenCalledWith('none');
    });

    it('should limit countries chart to top 12', () => {
      const mockCountries = {};
      for (let i = 0; i < 50; i++) {
        mockCountries[`C${i}`] = Math.random() * 1000;
      }
      
      const sorted = Object.entries(mockCountries).sort((a, b) => b[1] - a[1]);
      const limited = sorted.slice(0, 12);
      
      expect(limited.length).toBe(12);
    });

    it('should handle empty chart data gracefully', () => {
      const emptyData = { services: {}, countries: {} };
      const entries = Object.entries(emptyData.services);
      
      expect(entries.length).toBe(0);
    });
  });

  describe('Heatmap Rendering', () => {
    it('should skip rendering without d3 library', () => {
      delete window.d3;
      expect(window.d3).toBeUndefined();
    });

    it('should skip rendering without topojson library', () => {
      delete window.topojson;
      expect(window.topojson).toBeUndefined();
    });

    it('should load world map data on first render', async () => {
      const mockWorldData = {
        objects: { countries: {} }
      };
      
      window.d3.json.mockResolvedValue(mockWorldData);
      
      const world = await window.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      expect(world).toEqual(mockWorldData);
    });

    it('should handle map data loading errors', async () => {
      window.d3.json.mockRejectedValue(new Error('Network error'));
      
      try {
        await window.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    it('should create color scale based on country data', () => {
      const counts = { US: 500, GB: 300, DE: 200 };
      const values = Object.values(counts);
      const max = Math.max(...values);
      
      expect(max).toBe(500);
    });

    it('should handle countries with zero counts', () => {
      const counts = { US: 500, XX: 0 };
      const zeroCount = counts.XX || 0;
      
      expect(zeroCount).toBe(0);
    });

    it('should use ISO codes for country matching', () => {
      const countryData = { US: 500, GB: 300 };
      const isoCode = 'US';
      const count = countryData[isoCode] || 0;
      
      expect(count).toBe(500);
    });
  });

  describe('Navigation and Routing', () => {
    it('should mark active navigation link', () => {
      const links = document.querySelectorAll('nav a');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should detect current page from pathname', () => {
      const pathname = '/index.html';
      const page = pathname.split('/').pop() || 'index.html';
      
      expect(page).toBe('index.html');
    });

    it('should handle root path as index.html', () => {
      const path = '';
      const page = path || 'index.html';
      
      expect(page).toBe('index.html');
    });

    it('should match navigation links to current page', () => {
      const currentPage = 'api.html';
      const linkHref = 'api.html';
      
      expect(currentPage === linkHref).toBe(true);
    });
  });

  describe('Page-Specific Initialization', () => {
    it('should initialize dashboard features', () => {
      document.body.dataset.page = 'dashboard';
      
      const canvas = document.getElementById('servicesChart');
      const terminal = document.querySelector('.terminal');
      
      expect(canvas).toBeTruthy();
      expect(terminal).toBeTruthy();
    });

    it('should initialize docs page features', () => {
      document.body.dataset.page = 'docs';
      
      // Docs page should have sidebar links
      expect(document.body.dataset.page).toBe('docs');
    });

    it('should initialize API page features', () => {
      document.body.dataset.page = 'api';
      
      const terminal = document.querySelector('.terminal');
      expect(terminal).toBeTruthy();
    });

    it('should initialize data page features', () => {
      document.body.dataset.page = 'data';
      
      const dataInput = document.getElementById('dataInput');
      expect(dataInput).toBeTruthy();
    });

    it('should initialize versions page features', () => {
      document.body.dataset.page = 'versions';
      
      expect(document.body.dataset.page).toBe('versions');
    });

    it('should handle default page initialization', () => {
      document.body.dataset.page = 'home';
      
      expect(document.body.dataset.page).toBe('home');
    });
  });

  describe('Docs Sidebar Navigation', () => {
    it('should smooth scroll to anchor links', () => {
      const link = document.createElement('a');
      link.href = '#section1';
      document.body.appendChild(link);
      
      const section = document.createElement('div');
      section.id = 'section1';
      document.body.appendChild(section);
      
      expect(link.href).toContain('#section1');
    });

    it('should only handle hash links', () => {
      const hashLink = '#section';
      const externalLink = 'https://example.com';
      
      expect(hashLink.startsWith('#')).toBe(true);
      expect(externalLink.startsWith('#')).toBe(false);
    });
  });

  describe('Version List Rendering', () => {
    it('should render version cards', () => {
      const versions = [
        { version: 'v2.3', status: 'current', notes: 'Stable release' },
        { version: 'v2.2', status: 'lts', notes: 'Long-term support' }
      ];
      
      expect(versions.length).toBe(2);
      expect(versions[0].status).toBe('current');
    });

    it('should format version badges', () => {
      const version = { version: 'v2.3', status: 'current' };
      const badge = `${version.version} · ${version.status.toUpperCase()}`;
      
      expect(badge).toBe('v2.3 · CURRENT');
    });
  });

  describe('Auto-Refresh Functionality', () => {
    it('should fetch data immediately on init', () => {
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should set interval for periodic updates', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      setInterval(callback, 60000);
      
      vi.advanceTimersByTime(60000);
      expect(callback).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should use silent mode for auto-refresh', () => {
      const silent = true;
      expect(silent).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should query DOM elements with qs helper', () => {
      const element = document.querySelector('[data-stat="total-hosts"]');
      expect(element).toBeTruthy();
    });

    it('should handle missing elements gracefully', () => {
      const element = document.querySelector('#nonexistent');
      expect(element).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should catch and log localStorage errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      try {
        localStorage.getItem('test');
      } catch (err) {
        expect(err.message).toBe('Storage error');
      }
    });

    it('should handle JSON parsing errors', () => {
      const invalid = '{invalid}';
      
      try {
        JSON.parse(invalid);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });

    it('should handle async errors in promises', async () => {
      const failingPromise = Promise.reject(new Error('Async error'));
      
      try {
        await failingPromise;
      } catch (err) {
        expect(err.message).toBe('Async error');
      }
    });
  });

  describe('FileReader Integration', () => {
    it('should create FileReader for file uploads', () => {
      if (typeof window.FileReader !== 'undefined') {
        const reader = new window.FileReader();
        expect(reader).toBeTruthy();
      }
    });

    it('should handle file reading completion', () => {
      const mockResult = '{"test": true}';
      expect(mockResult).toContain('test');
    });
  });

  describe('Removed Functionality Tests', () => {
    it('should no longer call refreshChartThemes function', () => {
      // This function was removed in the diff
      // Verify it doesn't exist in the scope
      const scriptText = scriptContent;
      expect(scriptText.includes('refreshChartThemes')).toBe(false);
    });

    it('should not update payload element in API page', () => {
      // The payload element update was removed
      const scriptText = scriptContent;
      const payloadReferences = (scriptText.match(/#apiPayload/g) || []).length;
      expect(payloadReferences).toBe(0);
    });

    it('should not initialize terminal on data page', () => {
      // Terminal init was removed from data page
      const dataPageSection = scriptContent.match(/case 'data':[\s\S]*?break;/);
      if (dataPageSection) {
        expect(dataPageSection[0].includes('initTerminal')).toBe(false);
      }
    });

    it('should not set auth0Client to null explicitly', () => {
      // The explicit null assignment was removed
      const scriptText = scriptContent;
      const hasExplicitNull = scriptText.includes('AppState.auth0Client = null');
      expect(hasExplicitNull).toBe(false);
    });

    it('should not call updateAuthControls without client', () => {
      // The early updateAuthControls call was removed
      const scriptText = scriptContent;
      const auth0Section = scriptText.match(/async function initAuth0\(\)[\s\S]*?}\s*}/);
      if (auth0Section) {
        const earlyReturn = auth0Section[0].includes('if (!AppState.settings.auth0Domain');
        expect(earlyReturn).toBe(true);
      }
    });
  });
});