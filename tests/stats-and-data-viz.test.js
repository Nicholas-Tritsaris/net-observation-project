/**
 * Comprehensive unit tests for statistics and data visualization functions
 * Tests updateStatsView, renderTable, initDataVisualizer
 */

describe('Statistics and Data Visualization Functions', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  describe('renderTable', () => {
    test('should populate table with data sorted descending', () => {
      document.body.innerHTML = `
        <table data-table="services">
          <tbody></tbody>
        </table>
      `;
      
      const mockData = {
        HTTP: 500,
        HTTPS: 800,
        SSH: 200
      };
      
      // Extract and eval necessary functions
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      renderTable('[data-table="services"]', mockData);
      
      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
      expect(rows[0].textContent).toContain('HTTPS');
      expect(rows[0].textContent).toContain('800');
      expect(rows[1].textContent).toContain('HTTP');
      expect(rows[1].textContent).toContain('500');
      expect(rows[2].textContent).toContain('SSH');
      expect(rows[2].textContent).toContain('200');
    });

    test('should format numbers with locale separators', () => {
      document.body.innerHTML = `
        <table data-table="countries">
          <tbody></tbody>
        </table>
      `;
      
      const mockData = { US: 1500000 };
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      renderTable('[data-table="countries"]', mockData);
      
      const cell = document.querySelector('tbody tr td:last-child');
      expect(cell.textContent).toMatch(/1[,.]500[,.]000/);
    });

    test('should clear existing table content', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody>
            <tr><td>Old</td><td>Data</td></tr>
          </tbody>
        </table>
      `;
      
      const mockData = { New: 100 };
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      renderTable('[data-table="test"]', mockData);
      
      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('New');
    });

    test('should handle empty data object', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      renderTable('[data-table="test"]', {});
      
      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(0);
    });

    test('should handle null/undefined data', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      expect(() => renderTable('[data-table="test"]', null)).not.toThrow();
      expect(() => renderTable('[data-table="test"]', undefined)).not.toThrow();
    });

    test('should handle non-existent table', () => {
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      expect(() => renderTable('[data-table="missing"]', { test: 1 })).not.toThrow();
    });

    test('should handle table without tbody', () => {
      document.body.innerHTML = '<table data-table="test"></table>';
      
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      
      expect(() => renderTable('[data-table="test"]', { test: 1 })).not.toThrow();
    });
  });

  describe('updateStatsView', () => {
    test('should update all stat elements with data', () => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
        <span data-stat="total-services"></span>
        <span data-stat="last-sync"></span>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;
      
      const mockData = {
        total_hosts: 1500000,
        total_services: 2000000,
        last_sync: '2024-01-15T10:30:00Z',
        countries: { US: 500 },
        services: { HTTP: 300 }
      };
      
      // Setup required functions
      const AppState = { stats: null, charts: {} };
      const qsFunc = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      const renderTableFunc = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = 'function updateCharts(data) {}'; // Mock
      const renderHeatmapFunc = 'function renderHeatmap(data) {}'; // Mock
      const updateStatsFunc = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(qsFunc);
      eval(renderTableFunc);
      eval(updateChartsFunc);
      eval(renderHeatmapFunc);
      eval(updateStatsFunc);
      
      updateStatsView(mockData);
      
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toMatch(/1[,.]500[,.]000/);
      expect(document.querySelector('[data-stat="total-services"]').textContent).toMatch(/2[,.]000[,.]000/);
      expect(document.querySelector('[data-stat="last-sync"]').textContent).toBeTruthy();
      expect(AppState.stats).toEqual(mockData);
    });

    test('should handle missing stat elements gracefully', () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 2000,
        last_sync: '2024-01-15T10:30:00Z',
        countries: {},
        services: {}
      };
      
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
      
      expect(() => updateStatsView(mockData)).not.toThrow();
    });

    test('should use fallback values for missing data', () => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
        <span data-stat="total-services"></span>
        <span data-stat="last-sync"></span>
      `;
      
      const mockData = {};
      
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
      
      updateStatsView(mockData);
      
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('—');
      expect(document.querySelector('[data-stat="total-services"]').textContent).toBe('—');
      expect(document.querySelector('[data-stat="last-sync"]').textContent).toBe('—');
    });
  });

  describe('initDataVisualizer', () => {
    test('should parse and render JSON data', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{"name": "test", "value": 123}</textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;
      
      const logTerminalFunc = 'function logTerminal(msg) { console.log(msg); }';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      
      document.getElementById('renderData').click();
      
      const output = document.querySelector('#dataOutput pre');
      expect(output).not.toBeNull();
      expect(output.textContent).toContain('"name"');
      expect(output.textContent).toContain('"test"');
    });

    test('should parse and render CSV data', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,value\ntest,123\nfoo,456</textarea>
        <input type="file" id="fileInput" />
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
      const parsed = JSON.parse(output.textContent);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({ name: 'test', value: '123' });
    });

    test('should handle empty input', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      
      expect(() => document.getElementById('renderData').click()).not.toThrow();
    });

    test('should handle invalid JSON gracefully', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{invalid json</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;
      
      const logs = [];
      const logTerminalFunc = 'function logTerminal(msg) { logs.push(msg); }';
      const initDataVisualizerFunc = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?(?=\n\n  const AppPlugins)/)[0];
      
      eval(logTerminalFunc);
      eval(initDataVisualizerFunc);
      
      initDataVisualizer();
      document.getElementById('renderData').click();
      
      expect(logs.some(log => log.includes('error'))).toBe(true);
    });

    test('should handle array JSON format', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">[{"id":1},{"id":2}]</textarea>
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
      expect(output.textContent).toContain('"id"');
      const parsed = JSON.parse(output.textContent);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('logTerminal', () => {
    test('should append message to terminal output', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      logTerminal('Test message');
      
      const output = document.querySelector('.terminal-output');
      expect(output.children).toHaveLength(1);
      expect(output.textContent).toContain('Test message');
    });

    test('should include timestamp in message', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      logTerminal('Test');
      
      const output = document.querySelector('.terminal-output div');
      expect(output.textContent).toMatch(/\[\d+:\d+:\d+.*\]/);
    });

    test('should scroll to bottom after adding message', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      const output = document.querySelector('.terminal-output');
      output.scrollHeight = 1000;
      output.scrollTop = 0;
      
      logTerminal('Test');
      
      expect(output.scrollTop).toBe(1000);
    });

    test('should handle missing terminal output element', () => {
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      expect(() => logTerminal('Test')).not.toThrow();
    });

    test('should handle multiple messages', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const logTerminalFunc = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/)[0];
      eval(logTerminalFunc);
      
      logTerminal('Message 1');
      logTerminal('Message 2');
      logTerminal('Message 3');
      
      const output = document.querySelector('.terminal-output');
      expect(output.children).toHaveLength(3);
      expect(output.textContent).toContain('Message 1');
      expect(output.textContent).toContain('Message 2');
      expect(output.textContent).toContain('Message 3');
    });
  });
});