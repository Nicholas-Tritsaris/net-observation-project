/**
 * Comprehensive tests for API-related functions in docs/script.js
 * Tests fetchCensysSummary, initAutoRefresh, updateStatsView, renderTable
 */

const fs = require('fs');

describe('API and Data Functions', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock fetch
    global.fetch = jest.fn();
    
    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchCensysSummary', () => {
    test('should be defined as an async function', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should accept optional silent parameter with default false', () => {
      const funcMatch = scriptContent.match(/fetchCensysSummary\((silent\s*=\s*false)?\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should use configured backendUrl or default endpoint', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.settings\.backendUrl\s*\|\|\s*['"]\/api\/censys-summary['"]/);
    });

    test('should fetch with Accept: application/json header', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/headers:\s*\{\s*['"]Accept['"]\s*:\s*['"]application\/json['"]/);
    });

    test('should handle HTTP errors by throwing', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!res\.ok\s*\)\s*throw/);
    });

    test('should update window.__latestCensys on success', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.__latestCensys\s*=\s*data/);
    });

    test('should call updateStatsView with fetched data', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/updateStatsView\(data\)/);
    });

    test('should log success message to terminal', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Fetched stats/);
    });

    test('should suppress error terminal logging when silent is true', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!silent\s*\)\s*\{[\s\S]*?logTerminal/);
    });

    test('should log console warning on error', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/console\.warn\(['"]Censys fetch error['"]/);
    });

    test('should not reference apiPayload element (removed)', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).not.toMatch(/#apiPayload/);
    });
  });

  describe('initAutoRefresh', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should call fetchCensysSummary immediately', () => {
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/fetchCensysSummary\(\)/);
    });

    test('should set interval for periodic fetching', () => {
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/setInterval/);
    });

    test('should use silent mode for periodic fetches', () => {
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/fetchCensysSummary\(true\)/);
    });

    test('should fetch every 60 seconds (60000ms)', () => {
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/60000/);
    });
  });

  describe('updateStatsView', () => {
    test('should accept data parameter with documented shape', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?@param \{Object\} data[\s\S]*?@param \{number\}[\s\S]*?total_hosts[\s\S]*?\*\/\s*function updateStatsView/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should update AppState.stats with provided data', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.stats\s*=\s*data/);
    });

    test('should update total hosts element', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\[data-stat="total-hosts"\]/);
      expect(funcMatch[0]).toMatch(/data\.total_hosts/);
    });

    test('should update total services element', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\[data-stat="total-services"\]/);
      expect(funcMatch[0]).toMatch(/data\.total_services/);
    });

    test('should update last sync element', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\[data-stat="last-sync"\]/);
      expect(funcMatch[0]).toMatch(/data\.last_sync/);
    });

    test('should format numbers with toLocaleString', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/toLocaleString\(\)/);
    });

    test('should use nullish coalescing for missing values', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\?\?/);
    });

    test('should call renderTable for countries', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/renderTable\([^)]*countries/);
    });

    test('should call renderTable for services', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/renderTable\([^)]*services/);
    });

    test('should call updateCharts with data', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/updateCharts\(data\)/);
    });

    test('should call renderHeatmap with data', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/renderHeatmap\(data\)/);
    });

    test('should not reference apiPayload element (removed)', () => {
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).not.toMatch(/#apiPayload/);
    });
  });

  describe('renderTable', () => {
    test('should accept selector and objectData parameters', () => {
      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should return early if container not found', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!container\s*\)\s*return/);
    });

    test('should find tbody element within container', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/container\.querySelector\(['"]tbody['"]\)/);
    });

    test('should return early if tbody not found', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!tbody\s*\)\s*return/);
    });

    test('should return early if objectData is falsy', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!objectData\s*\)\s*return/);
    });

    test('should clear existing tbody content', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/tbody\.innerHTML\s*=\s*['"]['"];/);
    });

    test('should sort entries by value descending', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Object\.entries/);
      expect(funcMatch[0]).toMatch(/\.sort\([^)]*b\[1\]\s*-\s*a\[1\]/);
    });

    test('should create table rows with two cells', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/createElement\(['"]tr['"]\)/);
      expect(funcMatch[0]).toMatch(/innerHTML\s*=\s*`<td>/);
    });

    test('should format numeric values with toLocaleString', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/toLocaleString\(\)/);
    });

    test('should append rows to tbody', () => {
      const funcMatch = scriptContent.match(/function renderTable[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/tbody\.appendChild\(row\)/);
    });
  });
});