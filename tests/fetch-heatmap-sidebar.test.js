/**
 * Comprehensive unit tests for fetch, heatmap rendering, and sidebar functions
 * Tests fetchCensysSummary, renderHeatmap, initSidebar, initThemeToggle
 */

describe('Fetch, Heatmap, and Sidebar Functions', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    global.fetch = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    delete global.fetch;
  });

  describe('fetchCensysSummary', () => {
    test('should fetch data successfully and update state', async () => {
      const mockData = {
        total_hosts: 1000000,
        total_services: 500000,
        last_sync: '2024-01-15T10:00:00Z',
        countries: { US: 500 },
        services: { HTTP: 300 }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const outputs = [];
      window.__latestCensys = null;
      const AppState = {
        settings: { backendUrl: '/api/censys-summary' },
        stats: null
      };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/censys-summary', {
        headers: { 'Accept': 'application/json' }
      });
      expect(window.__latestCensys).toEqual(mockData);
      expect(updateStatsView).toHaveBeenCalledWith(mockData);
      expect(outputs.some(o => o.includes('Fetched stats'))).toBe(true);
    });

    test('should use custom backend URL from settings', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      const AppState = {
        settings: { backendUrl: 'https://custom-api.example.com/stats' }
      };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/stats',
        expect.any(Object)
      );
    });

    test('should handle HTTP error responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const outputs = [];
      const AppState = { settings: { backendUrl: '/api/censys-summary' } };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(outputs.some(o => o.includes('Error fetching stats'))).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('Censys fetch error', expect.any(Error));
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network failure'));

      const outputs = [];
      const AppState = { settings: { backendUrl: '/api/censys-summary' } };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(outputs.some(o => o.includes('Error fetching stats'))).toBe(true);
      expect(outputs.some(o => o.includes('Network failure'))).toBe(true);
    });

    test('should suppress terminal errors when silent is true', async () => {
      global.fetch.mockRejectedValue(new Error('Test error'));

      const outputs = [];
      const AppState = { settings: { backendUrl: '/api/censys-summary' } };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary(true);
      
      expect(outputs.length).toBe(0);
      expect(console.warn).toHaveBeenCalled();
    });

    test('should handle JSON parse errors', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const outputs = [];
      const AppState = { settings: { backendUrl: '/api/censys-summary' } };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(outputs.some(o => o.includes('Error fetching stats'))).toBe(true);
    });

    test('should use fallback URL when backendUrl is not set', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      const AppState = { settings: {} };
      const updateStatsView = jest.fn();
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const fetchCensysFunc = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(fetchCensysFunc);
      
      await fetchCensysSummary();
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/censys-summary',
        expect.any(Object)
      );
    });
  });

  describe('renderHeatmap', () => {
    beforeEach(() => {
      // Mock D3 and TopoJSON
      global.d3 = {
        json: jest.fn(),
        select: jest.fn(() => ({
          attr: jest.fn(function() { return this; }),
          selectAll: jest.fn(() => ({
            remove: jest.fn()
          })),
          append: jest.fn(() => ({
            attr: jest.fn(function() { return this; })
          }))
        })),
        geoNaturalEarth1: jest.fn(() => ({
          fitWidth: jest.fn(() => ({}))
        })),
        geoPath: jest.fn(() => () => 'path-data'),
        scaleSequential: jest.fn(() => (val) => `color(${val})`),
        interpolateTurbo: 'interpolateTurbo'
      };
      
      global.topojson = {
        feature: jest.fn((world, obj) => ({
          features: [
            { properties: { iso_a2: 'US', name: 'United States' } },
            { properties: { iso_a2: 'CN', name: 'China' } }
          ]
        }))
      };
    });

    afterEach(() => {
      delete global.d3;
      delete global.topojson;
    });

    test('should render heatmap with country data', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      
      global.d3.json.mockResolvedValue({
        objects: { countries: {} }
      });

      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      const mockData = {
        countries: { US: 500, CN: 300 }
      };
      
      await renderHeatmap(mockData);
      
      expect(d3.select).toHaveBeenCalledWith(document.getElementById('worldHeatmap'));
    });

    test('should cache world topology data', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      
      const mockWorldData = {
        objects: { countries: {} }
      };
      
      global.d3.json.mockResolvedValue(mockWorldData);

      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await renderHeatmap({ countries: {} });
      await renderHeatmap({ countries: {} });
      
      expect(d3.json).toHaveBeenCalledTimes(1);
    });

    test('should handle missing container gracefully', async () => {
      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await expect(renderHeatmap({ countries: {} })).resolves.not.toThrow();
    });

    test('should handle missing D3 library', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      delete global.d3;
      
      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await expect(renderHeatmap({ countries: {} })).resolves.not.toThrow();
    });

    test('should log error when TopoJSON is missing', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      delete global.topojson;
      
      const outputs = [];
      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await renderHeatmap({ countries: {} });
      
      expect(outputs.some(o => o.includes('TopoJSON library missing'))).toBe(true);
    });

    test('should handle world map data fetch failure', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      
      global.d3.json.mockRejectedValue(new Error('Failed to load'));

      const outputs = [];
      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await renderHeatmap({ countries: {} });
      
      expect(outputs.some(o => o.includes('Failed to load world map data'))).toBe(true);
    });

    test('should handle empty countries data', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      
      global.d3.json.mockResolvedValue({
        objects: { countries: {} }
      });

      const AppState = { worldData: null };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      
      const renderHeatmapFunc = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(renderHeatmapFunc);
      
      await expect(renderHeatmap({ countries: {} })).resolves.not.toThrow();
    });
  });

  describe('initSidebar', () => {
    test('should initialize sidebar with toggle functionality', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle">Toggle</button>
      `;
      
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should collapse sidebar on narrow screens', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle">Toggle</button>
      `;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should toggle sidebar on button click', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle">Toggle</button>
      `;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(sidebar.classList.contains('open')).toBe(false);
      
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(sidebar.classList.contains('collapsed')).toBe(false);
    });

    test('should update aria-expanded attribute', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true">Toggle</button>
      `;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      
      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    test('should update toggle icon', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle">☰</button>
      `;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      const initialIcon = toggle.innerHTML;
      
      toggle.click();
      expect(toggle.innerHTML).not.toBe(initialIcon);
    });

    test('should handle missing sidebar or toggle gracefully', () => {
      const initSidebarFunc = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initSidebarFunc);
      
      expect(() => initSidebar()).not.toThrow();
    });
  });

  describe('initThemeToggle', () => {
    test('should initialize theme toggle with current theme', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label></strong>
        </div>
      `;
      
      const AppState = { settings: { theme: 'dark' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      initThemeToggle();
      
      const label = document.querySelector('[data-label]');
      expect(label.textContent).toBe('DARK');
    });

    test('should cycle through themes on click', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label></strong>
        </div>
      `;
      
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      initThemeToggle();
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = document.querySelector('[data-label]');
      
      toggle.click();
      expect(AppState.settings.theme).toBe('dark');
      expect(label.textContent).toBe('DARK');
      
      toggle.click();
      expect(AppState.settings.theme).toBe('light');
      expect(label.textContent).toBe('LIGHT');
      
      toggle.click();
      expect(AppState.settings.theme).toBe('auto');
      expect(label.textContent).toBe('AUTO');
    });

    test('should handle Enter key press', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label></strong>
        </div>
      `;
      
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      initThemeToggle();
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(event);
      
      expect(AppState.settings.theme).toBe('dark');
      expect(saveSettings).toHaveBeenCalled();
      expect(applyTheme).toHaveBeenCalled();
    });

    test('should handle Space key press', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label></strong>
        </div>
      `;
      
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      initThemeToggle();
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(event);
      
      expect(AppState.settings.theme).toBe('dark');
    });

    test('should listen for system theme changes when in auto mode', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label></strong>
        </div>
      `;
      
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      initThemeToggle();
      
      expect(prefersDark.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should handle missing toggle element gracefully', () => {
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true, addEventListener: jest.fn() };
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initThemeToggleFunc = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/)[0];
      eval(initThemeToggleFunc);
      
      expect(() => initThemeToggle()).not.toThrow();
    });
  });
});