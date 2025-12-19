/**
 * Comprehensive tests for fetchCensysSummary and auto-refresh functionality
 * Tests API fetching, error handling, data updates, and polling mechanisms
 */

const fs = require('fs');

describe('API Fetch and Auto-Refresh', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('fetchCensysSummary', () => {
    let fetchCensysSummary, updateStatsView, logTerminal, AppState, qs;

    beforeEach(() => {
      AppState = {
        settings: { backendUrl: '' }
      };

      global.fetch = jest.fn();
      global.updateStatsView = jest.fn();
      global.logTerminal = jest.fn();
      global.window = { __latestCensys: undefined };

      const qsMatch = scriptContent.match(/function qs\([^)]*\) \{[\s\S]*?\n  \}/);
      const fetchMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      
      if (qsMatch) eval(qsMatch[0]);
      if (fetchMatch) eval(fetchMatch[0]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should use custom backend URL when configured', async () => {
      AppState.settings.backendUrl = 'https://custom.api.com/stats';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith('https://custom.api.com/stats');
    });

    test('should use default endpoint when no backend URL', async () => {
      AppState.settings.backendUrl = '';
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith('/api/censys-summary');
    });

    test('should update stats view on successful fetch', async () => {
      const mockData = { total_hosts: 1000, total_services: 500 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(global.updateStatsView).toHaveBeenCalledWith(mockData);
    });

    test('should store data in window.__latestCensys', async () => {
      const mockData = { total_hosts: 1000 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(window.__latestCensys).toEqual(mockData);
    });

    test('should log success message to terminal', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Censys data updated')
      );
    });

    test('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fetchCensysSummary();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Censys fetch error', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    test('should log error message when not silent', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await fetchCensysSummary(false);

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching stats')
      );
    });

    test('should not log error message when silent', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      global.logTerminal.mockClear();

      await fetchCensysSummary(true);

      expect(global.logTerminal).not.toHaveBeenCalled();
    });

    test('should handle non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });

    test('should handle JSON parse errors', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });

    test('should handle missing response data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => null
      });

      await fetchCensysSummary();

      expect(global.updateStatsView).toHaveBeenCalledWith(null);
    });

    test('should handle empty response data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await fetchCensysSummary();

      expect(global.updateStatsView).toHaveBeenCalledWith({});
    });

    test('should not update apiPayload element (removed)', async () => {
      // Verify the function doesn't reference #apiPayload
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).not.toContain('#apiPayload');
    });

    test('should handle timeout errors', async () => {
      global.fetch.mockRejectedValue(new Error('Timeout'));

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Timeout')
      );
    });

    test('should handle CORS errors', async () => {
      global.fetch.mockRejectedValue(new Error('CORS policy'));

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('CORS policy')
      );
    });

    test('should call fetch with no additional options', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await fetchCensysSummary();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(global.fetch.mock.calls[0].length).toBe(1); // Only URL, no options
    });
  });

  describe('initAutoRefresh', () => {
    let initAutoRefresh, fetchCensysSummary;

    beforeEach(() => {
      jest.useFakeTimers();
      global.fetchCensysSummary = jest.fn().mockResolvedValue(undefined);

      const funcMatch = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    test('should fetch immediately on init', () => {
      initAutoRefresh();

      expect(global.fetchCensysSummary).toHaveBeenCalledWith();
    });

    test('should schedule periodic fetches', () => {
      initAutoRefresh();

      jest.advanceTimersByTime(60000);
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(2); // Initial + 1 interval
    });

    test('should fetch silently on interval', () => {
      initAutoRefresh();

      jest.advanceTimersByTime(60000);
      expect(global.fetchCensysSummary).toHaveBeenLastCalledWith(true);
    });

    test('should use 60 second interval', () => {
      initAutoRefresh();

      jest.advanceTimersByTime(59999);
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(2);
    });

    test('should continue fetching multiple times', () => {
      initAutoRefresh();

      jest.advanceTimersByTime(180000); // 3 minutes
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(4); // Initial + 3 intervals
    });

    test('should not fetch with silent flag initially', () => {
      initAutoRefresh();

      expect(global.fetchCensysSummary).toHaveBeenCalledWith();
      expect(global.fetchCensysSummary).not.toHaveBeenCalledWith(true);
    });

    test('should handle fetch errors gracefully in interval', () => {
      global.fetchCensysSummary.mockRejectedValue(new Error('Fetch failed'));

      initAutoRefresh();

      jest.advanceTimersByTime(60000);
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(2);
    });

    test('should maintain interval even after errors', () => {
      global.fetchCensysSummary
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined);

      initAutoRefresh();

      jest.advanceTimersByTime(120000); // 2 minutes
      expect(global.fetchCensysSummary).toHaveBeenCalledTimes(3);
    });
  });

  describe('API Integration', () => {
    test('should define endpoint constant or use settings', () => {
      expect(scriptContent).toMatch(/backendUrl|api\/censys-summary/);
    });

    test('should check AppState.settings for backend URL', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toContain('AppState.settings.backendUrl');
    });

    test('should use logical OR for default endpoint', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toMatch(/\|\|.*api\/censys-summary/);
    });

    test('should handle silent parameter', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toMatch(/silent\s*=\s*false/);
    });

    test('should check silent flag before logging errors', () => {
      const funcMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!silent\s*\)/);
    });
  });

  describe('Error Handling Edge Cases', () => {
    let fetchCensysSummary, AppState;

    beforeEach(() => {
      AppState = { settings: { backendUrl: '' } };
      global.fetch = jest.fn();
      global.updateStatsView = jest.fn();
      global.logTerminal = jest.fn();
      global.window = { __latestCensys: undefined };

      const fetchMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      if (fetchMatch) eval(fetchMatch[0]);
    });

    test('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
    });

    test('should handle network disconnection', async () => {
      global.fetch.mockRejectedValue(new Error('Failed to fetch'));

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalled();
    });

    test('should handle 404 responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalled();
    });

    test('should handle 401 unauthorized', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalled();
    });

    test('should handle 502 bad gateway', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway'
      });

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalled();
    });

    test('should log console warning on all errors', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Test error'));

      await fetchCensysSummary();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Censys fetch error',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    test('should include error message in logs', async () => {
      global.fetch.mockRejectedValue(new Error('Custom error message'));

      await fetchCensysSummary();

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message')
      );
    });
  });

  describe('Data Flow', () => {
    let fetchCensysSummary, AppState;

    beforeEach(() => {
      AppState = { settings: { backendUrl: '' } };
      global.fetch = jest.fn();
      global.updateStatsView = jest.fn();
      global.logTerminal = jest.fn();
      global.window = { __latestCensys: undefined };

      const fetchMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
      if (fetchMatch) eval(fetchMatch[0]);
    });

    test('should pass full data object to updateStatsView', async () => {
      const mockData = {
        total_hosts: 5000,
        total_services: 2500,
        countries: { US: 1000, GB: 500 },
        services: { HTTP: 3000, HTTPS: 1500 },
        last_sync: '2024-01-15T10:00:00Z'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(global.updateStatsView).toHaveBeenCalledWith(mockData);
      expect(window.__latestCensys).toEqual(mockData);
    });

    test('should preserve data structure through pipeline', async () => {
      const mockData = {
        total_hosts: 100,
        nested: { deep: { value: 'test' } }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(window.__latestCensys.nested.deep.value).toBe('test');
    });
  });
});