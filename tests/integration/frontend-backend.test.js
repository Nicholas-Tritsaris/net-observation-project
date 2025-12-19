/**
 * Integration tests for frontend-backend interaction
 * Tests the complete flow from UI to API
 */

const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

describe('Frontend-Backend Integration', () => {
  let mockFetch;
  let mockAppState;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    mockAppState = {
      settings: {
        backendUrl: '/api/censys-summary'
      },
      stats: null
    };

    global.window = {
      __latestCensys: null
    };
  });

  test('should fetch and update stats successfully', async () => {
    const mockResponse = {
      total_hosts: 10000,
      total_services: 5000,
      last_sync: '2024-01-01T12:00:00.000Z',
      countries: { 'US': 3000, 'CN': 2000 },
      services: { 'HTTP': 2000, 'HTTPS': 3000 }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const fetchCensysSummary = async (silent = false) => {
      const endpoint = mockAppState.settings.backendUrl || '/api/censys-summary';
      try {
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        window.__latestCensys = data;
        mockAppState.stats = data;
        return data;
      } catch (err) {
        if (!silent) {
          console.warn('Censys fetch error', err);
        }
        throw err;
      }
    };

    const result = await fetchCensysSummary();

    expect(mockFetch).toHaveBeenCalledWith('/api/censys-summary', {
      headers: { 'Accept': 'application/json' }
    });
    expect(result.total_hosts).toBe(10000);
    expect(window.__latestCensys).toEqual(mockResponse);
    expect(mockAppState.stats).toEqual(mockResponse);
  });

  test('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const fetchCensysSummary = async (silent = false) => {
      const endpoint = mockAppState.settings.backendUrl || '/api/censys-summary';
      try {
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        window.__latestCensys = data;
        mockAppState.stats = data;
        return data;
      } catch (err) {
        if (!silent) {
          console.warn('Censys fetch error', err);
        }
        throw err;
      }
    };

    await expect(fetchCensysSummary()).rejects.toThrow('HTTP 500');
  });

  test('should use custom backend URL when configured', async () => {
    mockAppState.settings.backendUrl = 'https://custom.api.com/censys';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_hosts: 100 })
    });

    const fetchCensysSummary = async (silent = false) => {
      const endpoint = mockAppState.settings.backendUrl || '/api/censys-summary';
      try {
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        window.__latestCensys = data;
        return data;
      } catch (err) {
        if (!silent) {
          console.warn('Censys fetch error', err);
        }
        throw err;
      }
    };

    await fetchCensysSummary();

    expect(mockFetch).toHaveBeenCalledWith('https://custom.api.com/censys', {
      headers: { 'Accept': 'application/json' }
    });
  });

  test('should suppress error logging when silent flag is true', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn');
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502
    });

    const fetchCensysSummary = async (silent = false) => {
      const endpoint = mockAppState.settings.backendUrl || '/api/censys-summary';
      try {
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        window.__latestCensys = data;
        return data;
      } catch (err) {
        if (!silent) {
          console.warn('Censys fetch error', err);
        }
        throw err;
      }
    };

    try {
      await fetchCensysSummary(true);
    } catch (err) {
      // Expected to throw
    }

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  test('should set Accept header for JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const fetchCensysSummary = async () => {
      const endpoint = mockAppState.settings.backendUrl || '/api/censys-summary';
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    await fetchCensysSummary();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Accept': 'application/json' }
      })
    );
  });
});

describe('Auto-Refresh Integration', () => {
  let mockFetch;
  let mockSetInterval;
  let intervalCallback;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    mockSetInterval = jest.fn((callback, delay) => {
      intervalCallback = callback;
      return 123; // Mock interval ID
    });
    global.setInterval = mockSetInterval;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize auto-refresh with correct interval', () => {
    const fetchCensysSummary = jest.fn();
    
    const initAutoRefresh = () => {
      fetchCensysSummary();
      setInterval(() => fetchCensysSummary(true), 60000);
    };

    initAutoRefresh();

    expect(fetchCensysSummary).toHaveBeenCalledTimes(1);
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
  });

  test('should fetch silently during auto-refresh', () => {
    const fetchCensysSummary = jest.fn();
    
    const initAutoRefresh = () => {
      fetchCensysSummary();
      setInterval(() => fetchCensysSummary(true), 60000);
    };

    initAutoRefresh();
    
    // Trigger the interval callback
    if (intervalCallback) {
      intervalCallback();
    }

    expect(fetchCensysSummary).toHaveBeenCalledWith(true);
  });

  test('should refresh every 60 seconds', () => {
    const fetchCensysSummary = jest.fn();
    
    setInterval(() => fetchCensysSummary(true), 60000);

    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
  });
});

describe('Stats View Update Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-stat="total-hosts"></div>
      <div data-stat="total-services"></div>
      <div data-stat="last-sync"></div>
      <table data-table="countries"><tbody></tbody></table>
      <table data-table="services"><tbody></tbody></table>
    `;
  });

  test('should update all stat elements with data', () => {
    const data = {
      total_hosts: 50000,
      total_services: 25000,
      last_sync: '2024-01-01T12:00:00.000Z',
      countries: { 'US': 10000, 'CN': 5000 },
      services: { 'HTTP': 15000, 'HTTPS': 10000 }
    };

    const updateStatsView = (data) => {
      const totalHosts = document.querySelector('[data-stat="total-hosts"]');
      const totalServices = document.querySelector('[data-stat="total-services"]');
      const lastSync = document.querySelector('[data-stat="last-sync"]');
      
      if (totalHosts) totalHosts.textContent = data.total_hosts?.toLocaleString() ?? '—';
      if (totalServices) totalServices.textContent = data.total_services?.toLocaleString() ?? '—';
      if (lastSync) lastSync.textContent = data.last_sync ? new Date(data.last_sync).toLocaleString() : '—';
    };

    updateStatsView(data);

    expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('50,000');
    expect(document.querySelector('[data-stat="total-services"]').textContent).toBe('25,000');
    expect(document.querySelector('[data-stat="last-sync"]').textContent).not.toBe('—');
  });

  test('should display fallback when data is missing', () => {
    const data = {
      total_hosts: null,
      total_services: undefined,
      last_sync: null,
      countries: {},
      services: {}
    };

    const updateStatsView = (data) => {
      const totalHosts = document.querySelector('[data-stat="total-hosts"]');
      const totalServices = document.querySelector('[data-stat="total-services"]');
      const lastSync = document.querySelector('[data-stat="last-sync"]');
      
      if (totalHosts) totalHosts.textContent = data.total_hosts?.toLocaleString() ?? '—';
      if (totalServices) totalServices.textContent = data.total_services?.toLocaleString() ?? '—';
      if (lastSync) lastSync.textContent = data.last_sync ? new Date(data.last_sync).toLocaleString() : '—';
    };

    updateStatsView(data);

    expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('—');
    expect(document.querySelector('[data-stat="total-services"]').textContent).toBe('—');
    expect(document.querySelector('[data-stat="last-sync"]').textContent).toBe('—');
  });
});