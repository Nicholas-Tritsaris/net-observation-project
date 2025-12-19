/**
 * Comprehensive tests for statistics display and data visualization functions
 * Tests: updateStatsView, renderTable, fetchCensysSummary, initDataVisualizer
 */

describe('Statistics and Data Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateStatsView', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-stat="total-hosts">0</div>
        <div data-stat="total-services">0</div>
        <div data-stat="last-sync">Never</div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;
    });

    test('should update total hosts display', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/data\.total_hosts/);
      expect(funcMatch[0]).toMatch(/toLocaleString/);
    });

    test('should update total services display', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/data\.total_services/);
    });

    test('should update last sync timestamp', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/data\.last_sync/);
      expect(funcMatch[0]).toMatch(/new Date/);
    });

    test('should handle missing data gracefully with fallback', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      // Should use nullish coalescing or ternary for fallback
      expect(funcMatch[0]).toMatch(/\?\?|:/);
    });

    test('should call renderTable for countries and services', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/renderTable\(['"][^'"]*countries/);
      expect(funcMatch[0]).toMatch(/renderTable\(['"][^'"]*services/);
    });

    test('should call updateCharts with data', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/updateCharts\(data\)/);
    });

    test('should call renderHeatmap with data', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/renderHeatmap\(data\)/);
    });

    test('should store data in AppState.stats', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/AppState\.stats = data/);
    });
  });

  describe('renderTable', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <table data-table="test">
          <thead><tr><th>Name</th><th>Count</th></tr></thead>
          <tbody></tbody>
        </table>
      `;
    });

    test('should clear existing tbody content', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/tbody\.innerHTML = ['"]['"];/);
    });

    test('should return early if container not found', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!container\) return/);
    });

    test('should return early if tbody not found', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!tbody\) return/);
    });

    test('should handle null or undefined objectData', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!objectData\) return/);
    });

    test('should sort entries by value descending', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/\.sort\(/);
      expect(funcMatch[0]).toMatch(/b\[1\] - a\[1\]/);
    });

    test('should create table rows with key and formatted value', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/createElement\(['"]tr['"]\)/);
      expect(funcMatch[0]).toMatch(/toLocaleString/);
    });

    test('should use qs helper to find container', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/qs\(selector\)/);
    });
  });

  describe('fetchCensysSummary', () => {
    test('should use configured backend URL', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.settings\.backendUrl/);
    });

    test('should default to /api/censys-summary if no URL configured', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/\/api\/censys-summary/);
    });

    test('should accept JSON response', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/Accept.*application\/json/);
    });

    test('should check response status', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!res\.ok\)/);
    });

    test('should store data in window.__latestCensys', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/window\.__latestCensys = data/);
    });

    test('should call updateStatsView with fetched data', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/updateStatsView\(data\)/);
    });

    test('should log success message when not silent', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Fetched/);
    });

    test('should suppress error logging when silent parameter is true', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!silent\)/);
    });

    test('should handle fetch errors gracefully', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/catch/);
      expect(funcMatch[0]).toMatch(/console\.warn/);
    });
  });

  describe('initDataVisualizer', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
    });

    test('should find all required DOM elements', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]dataInput['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]fileInput['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]renderData['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]dataOutput['"]\)/);
    });

    test('should parse JSON when input starts with { or [', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/startsWith\(['"]\{['"]\)/);
      expect(funcMatch[0]).toMatch(/startsWith\(['"]\[['"]\)/);
      expect(funcMatch[0]).toMatch(/JSON\.parse/);
    });

    test('should parse CSV for non-JSON input', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/parseCSV/);
    });

    test('should handle file upload', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/fileInput.*addEventListener\(['"]change['"]/);
      expect(funcMatch[0]).toMatch(/FileReader/);
    });

    test('should render data as formatted JSON', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/JSON\.stringify.*null.*2/);
    });

    test('should log success to terminal', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*rendered/i);
    });

    test('should handle parsing errors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/catch/);
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*error/i);
    });
  });

  describe('CSV Parsing', () => {
    test('should split CSV by lines', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/split\(.*\\r\?\\n/);
    });

    test('should extract headers from first line', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/headerLine/);
      expect(funcMatch[0]).toMatch(/split\(['"],['"]\)/);
    });

    test('should map rows to objects', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
      
      expect(funcMatch[0]).toMatch(/Object\.fromEntries/);
    });
  });
});