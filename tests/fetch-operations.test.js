/**
 * Unit tests for fetch operations (fetchCensysSummary, initAutoRefresh)
 * Tests API calls, error handling, retry logic, and auto-refresh scheduling
 */

const fs = require('fs');

describe('Fetch Operations', () => {
  let fetchCensysSummary, AppState, updateStatsView, logTerminal;

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
    
    // Mock dependencies
    AppState = {
      settings: { backendUrl: '/api/censys-summary' },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };
    
    updateStatsView = jest.fn();
    
    document.body.innerHTML = '<div class="terminal-output"></div>';
    
    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract logTerminal
    const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
    if (logMatch) {
      eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
    }
    
    // Extract fetchCensysSummary
    const fetchMatch = scriptContent.match(/async function fetchCensysSummary\(silent = false\) \{[\s\S]*?\n  \}/);
    if (fetchMatch) {
      let code = fetchMatch[0];
      code = code.replace(/updateStatsView\(/g, 'updateStatsView(');
      code = code.replace(/window\.__latestCensys/g, 'window.__latestCensys');
      eval(`fetchCensysSummary = ${code.replace('async function fetchCensysSummary(silent = false)', 'async function(silent = false)')}`);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete window.__latestCensys;
  });

  describe('Successful Fetch', () => {
    test('should fetch data from configured endpoint', async () => {
      const mockData = { total_hosts: 100, countries: {}, services: {} };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/censys-summary',
        expect.objectContaining({ headers: { 'Accept': 'application/json' } })
      );
    });

    test('should use custom backend URL from settings', async () => {
      AppState.settings.backendUrl = 'https://custom.api.com/summary';
      const mockData = { total_hosts: 100 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.api.com/summary',
        expect.any(Object)
      );
    });

    test('should store response in window.__latestCensys', async () => {
      const mockData = { total_hosts: 123, countries: {}, services: {} };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(window.__latestCensys).toEqual(mockData);
    });

    test('should call updateStatsView with fetched data', async () => {
      const mockData = { total_hosts: 100, countries: {}, services: {} };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(updateStatsView).toHaveBeenCalledWith(mockData);
    });

    test('should log success message to terminal', async () => {
      const mockData = { total_hosts: 100 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Fetched stats');
    });

    test('should include Accept header in request', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle HTTP error responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Error fetching stats');
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network failure'));

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Error fetching stats');
    });

    test('should log console warning on error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Test error'));

      await fetchCensysSummary();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Censys fetch error', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    test('should handle JSON parse errors', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Error');
    });

    test('should handle 500 internal server error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('HTTP 500');
    });

    test('should handle 401 unauthorized error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      await fetchCensysSummary();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('HTTP 401');
    });
  });

  describe('Silent Mode', () => {
    test('should not log terminal message when silent is true', async () => {
      global.fetch.mockRejectedValue(new Error('Test error'));

      await fetchCensysSummary(true);

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.children.length).toBe(0);
    });

    test('should still log console warning in silent mode', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Test error'));

      await fetchCensysSummary(true);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test('should log success message even in silent mode', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      await fetchCensysSummary(true);

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.children.length).toBeGreaterThan(0);
    });
  });

  describe('initAutoRefresh', () => {
    let initAutoRefresh;

    beforeEach(() => {
      jest.useFakeTimers();
      
      fetchCensysSummary = jest.fn();
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        let code = funcMatch[0];
        code = code.replace(/fetchCensysSummary\(/g, 'fetchCensysSummary(');
        eval(`initAutoRefresh = ${code.replace('function initAutoRefresh()', 'function()')}`);
      }
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should fetch immediately on initialization', () => {
      initAutoRefresh();
      expect(fetchCensysSummary).toHaveBeenCalledTimes(1);
      expect(fetchCensysSummary).toHaveBeenCalledWith();
    });

    test('should schedule silent fetches every 60 seconds', () => {
      initAutoRefresh();
      fetchCensysSummary.mockClear();

      jest.advanceTimersByTime(60000);
      expect(fetchCensysSummary).toHaveBeenCalledTimes(1);
      expect(fetchCensysSummary).toHaveBeenCalledWith(true);
    });

    test('should fetch multiple times at 60 second intervals', () => {
      initAutoRefresh();
      fetchCensysSummary.mockClear();

      jest.advanceTimersByTime(180000); // 3 minutes
      expect(fetchCensysSummary).toHaveBeenCalledTimes(3);
    });

    test('should use silent mode for scheduled fetches', () => {
      initAutoRefresh();
      fetchCensysSummary.mockClear();

      jest.advanceTimersByTime(60000);
      expect(fetchCensysSummary).toHaveBeenCalledWith(true);
    });

    test('should not fetch before 60 seconds', () => {
      initAutoRefresh();
      fetchCensysSummary.mockClear();

      jest.advanceTimersByTime(59999);
      expect(fetchCensysSummary).not.toHaveBeenCalled();
    });
  });
});