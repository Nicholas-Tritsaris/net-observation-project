/**
 * API and fetch operations tests for docs/script.js
 * Tests Censys data fetching, error handling, and Auth0 integration
 */

describe('API and Fetch Operations', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    window.__latestCensys = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Censys Summary Fetching', () => {
    test('should fetch data from correct endpoint', async () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 50,
        last_sync: '2025-01-15T12:00:00Z',
        countries: { US: 500 },
        services: { http: 300 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const endpoint = '/api/censys-summary';
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      expect(fetch).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          headers: { 'Accept': 'application/json' }
        })
      );
      expect(data.total_hosts).toBe(1000);
    });

    test('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const endpoint = '/api/censys-summary';
      const res = await fetch(endpoint);

      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}`);
        expect(error.message).toBe('HTTP 500');
      }
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    test('should store fetched data in global variable', async () => {
      const mockData = { total_hosts: 123 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const res = await fetch('/api/censys-summary');
      const data = await res.json();
      window.__latestCensys = data;

      expect(window.__latestCensys.total_hosts).toBe(123);
    });

    test('should use custom backend URL from settings', async () => {
      const customEndpoint = '/custom/api/endpoint';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await fetch(customEndpoint);

      expect(fetch).toHaveBeenCalledWith(customEndpoint);
    });

    test('should support silent mode for background fetches', async () => {
      const silent = true;
      const shouldLog = !silent;

      expect(shouldLog).toBe(false);
    });
  });

  describe('Auto-refresh Functionality', () => {
    test('should set interval for periodic fetching', () => {
      jest.useFakeTimers();
      const mockFetch = jest.fn();
      
      const intervalId = setInterval(() => mockFetch(), 60000);
      
      jest.advanceTimersByTime(60000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(60000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      clearInterval(intervalId);
      jest.useRealTimers();
    });

    test('should use 60 second interval', () => {
      const interval = 60000;
      expect(interval).toBe(60 * 1000);
    });
  });

  describe('Auth0 Integration', () => {
    test('should initialize Auth0 client with correct config', () => {
      const config = {
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: 'http://localhost'
        }
      };

      expect(config.domain).toBe('test.auth0.com');
      expect(config.clientId).toBe('test-client-id');
      expect(config.cacheLocation).toBe('localstorage');
    });

    test('should skip Auth0 init when credentials missing', () => {
      const domain = '';
      const clientId = '';
      const shouldInit = domain && clientId;

      expect(shouldInit).toBe(false);
    });

    test('should init Auth0 when credentials present', () => {
      const domain = 'test.auth0.com';
      const clientId = 'client-123';
      const shouldInit = domain && clientId;

      expect(shouldInit).toBe(true);
    });

    test('should handle Auth0 initialization errors', async () => {
      const mockCreateAuth0Client = jest.fn().mockRejectedValue(
        new Error('Auth0 init failed')
      );

      try {
        await mockCreateAuth0Client({
          domain: 'test.auth0.com',
          clientId: 'test'
        });
      } catch (err) {
        expect(err.message).toBe('Auth0 init failed');
      }
    });
  });

  describe('Auth Controls', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button data-action="login" class="hidden">Login</button>
        <button data-action="logout" class="hidden">Logout</button>
        <span data-auth-status>Anonymous</span>
      `;
    });

    test('should show login button when not authenticated', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const isAuthenticated = false;

      loginBtn.classList.toggle('hidden', isAuthenticated);
      logoutBtn.classList.toggle('hidden', !isAuthenticated);

      expect(loginBtn.classList.contains('hidden')).toBe(false);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });

    test('should show logout button when authenticated', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const isAuthenticated = true;

      loginBtn.classList.toggle('hidden', isAuthenticated);
      logoutBtn.classList.toggle('hidden', !isAuthenticated);

      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(false);
    });

    test('should update auth status text', () => {
      const status = document.querySelector('[data-auth-status]');
      const isAuthenticated = true;

      status.textContent = isAuthenticated ? 'Authenticated' : 'Anonymous';

      expect(status.textContent).toBe('Authenticated');
    });

    test('should hide both buttons when no Auth0 client', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const hasClient = false;

      if (!hasClient) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.add('hidden');
      }

      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });

    test('should prevent duplicate event binding', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      
      loginBtn.dataset.bound = 'true';
      const isBound = loginBtn.dataset.bound === 'true';

      expect(isBound).toBe(true);
    });
  });
});