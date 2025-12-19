/**
 * Integration and edge case tests for script.js
 * Tests complex interactions, error handling, and boundary conditions
 */

describe('Integration and Edge Cases', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Settings Persistence Flow', () => {
    test('should persist and reload settings across page loads', () => {
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const saveScript = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/)[0];
      
      const AppState = {
        settings: {
          theme: 'auto',
          backendUrl: '/api/censys-summary',
          auth0Domain: '',
          auth0ClientId: ''
        }
      };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      eval(saveScript);
      
      // Modify and save
      AppState.settings.theme = 'dark';
      AppState.settings.backendUrl = 'https://custom.api.com';
      saveSettings();
      
      // Reset and load
      AppState.settings = {
        theme: 'auto',
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: ''
      };
      loadSettings();
      
      expect(AppState.settings.theme).toBe('dark');
      expect(AppState.settings.backendUrl).toBe('https://custom.api.com');
    });

    test('should handle corrupted localStorage gracefully', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      localStorage.setItem('net-observation-settings', 'corrupted{data');
      
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto' } };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      loadSettings();
      
      expect(AppState.settings.theme).toBe('auto');
      expect(console.warn).toHaveBeenCalled();
      
      console.warn.mockRestore();
    });
  });

  describe('Theme System Integration', () => {
    test('should apply theme based on system preference when auto', () => {
      const applyThemeScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true };
      
      eval(applyThemeScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should override system preference with explicit theme', () => {
      const applyThemeScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      
      const AppState = { settings: { theme: 'light' } };
      const prefersDark = { matches: true }; // System prefers dark
      
      eval(applyThemeScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Data Flow Integration', () => {
    test('should update all UI components when stats data arrives', () => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
        <span data-stat="total-services"></span>
        <span data-stat="last-sync"></span>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;
      
      const mockData = {
        total_hosts: 2500000,
        total_services: 1500000,
        last_sync: '2024-01-20T15:30:00Z',
        countries: { US: 1000, CN: 800, DE: 600 },
        services: { HTTP: 700, HTTPS: 500, SSH: 300 }
      };
      
      const AppState = { stats: null, charts: {} };
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = 'function updateCharts(data) {}';
      const renderHeatmapFunc = 'function renderHeatmap(data) {}';
      const updateStatsFunc = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      eval(updateChartsFunc);
      eval(renderHeatmapFunc);
      eval(updateStatsFunc);
      
      updateStatsView(mockData);
      
      expect(AppState.stats).toEqual(mockData);
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toMatch(/2[,.]500[,.]000/);
      expect(document.querySelector('[data-stat="total-services"]').textContent).toMatch(/1[,.]500[,.]000/);
      
      const countryRows = document.querySelectorAll('[data-table="countries"] tbody tr');
      expect(countryRows).toHaveLength(3);
      
      const serviceRows = document.querySelectorAll('[data-table="services"] tbody tr');
      expect(serviceRows).toHaveLength(3);
    });
  });

  describe('Error Boundary Cases', () => {
    test('should handle missing DOM elements without crashing', () => {
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      expect(() => renderTable('[data-table="nonexistent"]', { test: 1 })).not.toThrow();
    });

    test('should handle null/undefined data gracefully across functions', () => {
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      const generateColorFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      eval(generateColorFunc);
      
      expect(() => renderTable('[data-table="test"]', null)).not.toThrow();
      expect(() => renderTable('[data-table="test"]', undefined)).not.toThrow();
      expect(() => generateColorPalette(0, 'test')).not.toThrow();
    });

    test('should handle malformed data objects', () => {
      document.body.innerHTML = `
        <table data-table="test"><tbody></tbody></table>
      `;
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      // Test with various malformed data
      expect(() => renderTable('[data-table="test"]', { null: 123 })).not.toThrow();
      expect(() => renderTable('[data-table="test"]', { undefined: 456 })).not.toThrow();
      expect(() => renderTable('[data-table="test"]', { '': 789 })).not.toThrow();
    });
  });

  describe('Number Formatting Edge Cases', () => {
    test('should format very large numbers correctly', () => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
      `;
      
      const AppState = { stats: null, charts: {} };
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = 'function renderTable() {}';
      const updateChartsFunc = 'function updateCharts() {}';
      const renderHeatmapFunc = 'function renderHeatmap() {}';
      const updateStatsFunc = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      eval(updateChartsFunc);
      eval(renderHeatmapFunc);
      eval(updateStatsFunc);
      
      updateStatsView({ total_hosts: 999999999999 });
      
      const text = document.querySelector('[data-stat="total-hosts"]').textContent;
      expect(text).toMatch(/999/);
    });

    test('should handle zero values', () => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
        <span data-stat="total-services"></span>
      `;
      
      const AppState = { stats: null, charts: {} };
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = 'function renderTable() {}';
      const updateChartsFunc = 'function updateCharts() {}';
      const renderHeatmapFunc = 'function renderHeatmap() {}';
      const updateStatsFunc = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      eval(updateChartsFunc);
      eval(renderHeatmapFunc);
      eval(updateStatsFunc);
      
      updateStatsView({ total_hosts: 0, total_services: 0 });
      
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('0');
      expect(document.querySelector('[data-stat="total-services"]').textContent).toBe('0');
    });

    test('should handle negative numbers', () => {
      document.body.innerHTML = `
        <table data-table="test"><tbody></tbody></table>
      `;
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      renderTable('[data-table="test"]', { negative: -123 });
      
      const cell = document.querySelector('tbody tr td:last-child');
      expect(cell.textContent).toContain('-');
    });
  });

  describe('Color Palette Edge Cases', () => {
    test('should handle very large color palette requests', () => {
      const generateColorFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(generateColorFunc);
      
      const colors = generateColorPalette(1000, 'test');
      
      expect(colors).toHaveLength(1000);
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should generate distinct colors even with many items', () => {
      const generateColorFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(generateColorFunc);
      
      const colors = generateColorPalette(50, 'test');
      const uniqueColors = new Set(colors);
      
      expect(uniqueColors.size).toBe(50);
    });

    test('should handle single color request', () => {
      const generateColorFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(generateColorFunc);
      
      const colors = generateColorPalette(1, 'services');
      
      expect(colors).toHaveLength(1);
      expect(colors[0]).toMatch(/^hsl\(180 80% 55% \/ 0\.7\)$/);
    });
  });

  describe('CSV Parsing Edge Cases', () => {
    test('should handle CSV with missing values', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,value\ntest,\n,456\nfoo,789</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      document.getElementById('renderData').click();
      
      const output = document.querySelector('#dataOutput pre');
      const parsed = JSON.parse(output.textContent);
      
      expect(parsed[0].value).toBe('');
      expect(parsed[1].name).toBe('');
      expect(parsed[2].name).toBe('foo');
    });

    test('should handle CSV with different line endings', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,value\r\ntest,123\rfoo,456</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      document.getElementById('renderData').click();
      
      const output = document.querySelector('#dataOutput pre');
      expect(output).not.toBeNull();
      expect(() => JSON.parse(output.textContent)).not.toThrow();
    });

    test('should handle single row CSV', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,value\ntest,123</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      document.getElementById('renderData').click();
      
      const output = document.querySelector('#dataOutput pre');
      const parsed = JSON.parse(output.textContent);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({ name: 'test', value: '123' });
    });
  });

  describe('Terminal Command Edge Cases', () => {
    test('should handle commands with multiple spaces', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="theme    dark" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: { theme: 'auto' } };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(AppState.settings.theme).toBe('dark');
    });

    test('should handle commands with trailing whitespace', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help    " />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(outputs.some(o => o.includes('Available commands'))).toBe(true);
    });

    test('should handle case-sensitive commands', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="HELP" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      // Commands are case-sensitive, so HELP should be unknown
      expect(outputs.some(o => o.includes('Unknown command'))).toBe(true);
    });
  });

  describe('Timestamp Formatting', () => {
    test('should format timestamps consistently', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      logTerminal('Test 1');
      logTerminal('Test 2');
      
      const messages = document.querySelectorAll('.terminal-output div');
      expect(messages).toHaveLength(2);
      
      messages.forEach(msg => {
        expect(msg.textContent).toMatch(/\[\d+:\d+:\d+/);
      });
    });
  });
});