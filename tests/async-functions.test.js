/**
 * Comprehensive unit tests for async functions in docs/script.js
 * Tests API fetching, auth handling, and async data operations
 */

const fs = require('fs');

describe('Async Functions', () => {
  let scriptContent;
  let fetchCensysSummary, initAuth0, updateAuthControls;
  let AppState;
  let logTerminal, updateStatsView;

  beforeEach(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Initialize AppState
    AppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'auto'
      },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    // Mock functions
    logTerminal = jest.fn();
    updateStatsView = jest.fn();
    
    // Mock global fetch
    global.fetch = jest.fn();
    global.window = global;
    global.createAuth0Client = jest.fn();

    // Extract functions
    const fetchMatch = scriptContent.match(/async function fetchCensysSummary\([^)]*\) \{[\s\S]*?\n  \}/);
    if (fetchMatch) {
      eval(`fetchCensysSummary = ${fetchMatch[0]}`);
    }

    const authMatch = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/);
    if (authMatch) {
      eval(`initAuth0 = ${authMatch[0]}`);
    }

    const updateAuthMatch = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/);
    if (updateAuthMatch) {
      eval(`updateAuthControls = ${updateAuthMatch[0]}`);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCensysSummary', () => {
    test('should fetch data from default endpoint', async () => {
      const mockData = { total_hosts: 1000, total_services: 50 };
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(fetch).toHaveBeenCalledWith('/api/censys-summary', {
        headers: { 'Accept': 'application/json' }
      });
      expect(window.__latestCensys).toEqual(mockData);
    });

    test('should use custom backend URL from settings', async () => {
      AppState.settings.backendUrl = 'https://custom.api.com/stats';
      const mockData = { total_hosts: 500 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(fetch).toHaveBeenCalledWith('https://custom.api.com/stats', {
        headers: { 'Accept': 'application/json' }
      });
    });

    test('should handle HTTP errors gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fetchCensysSummary();

      expect(consoleSpy).toHaveBeenCalledWith('Censys fetch error', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fetchCensysSummary();

      expect(consoleSpy).toHaveBeenCalledWith('Censys fetch error', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should log errors when not silent', async () => {
      global.fetch.mockRejectedValue(new Error('Fetch failed'));

      await fetchCensysSummary(false);

      expect(logTerminal).toHaveBeenCalledWith(expect.stringContaining('Error fetching stats'));
    });

    test('should not log errors when silent', async () => {
      global.fetch.mockRejectedValue(new Error('Fetch failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fetchCensysSummary(true);

      expect(logTerminal).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should call updateStatsView with fetched data', async () => {
      const mockData = { total_hosts: 2000, countries: { USA: 100 } };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(updateStatsView).toHaveBeenCalledWith(mockData);
    });

    test('should store fetched data in window.__latestCensys', async () => {
      const mockData = { total_hosts: 3000 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      await fetchCensysSummary();

      expect(window.__latestCensys).toEqual(mockData);
    });
  });

  describe('initAuth0', () => {
    test('should initialize Auth0 client with correct config', async () => {
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);
      global.window.location = { origin: 'https://example.com' };

      await initAuth0();

      expect(createAuth0Client).toHaveBeenCalledWith({
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: 'https://example.com'
        }
      });
      expect(AppState.auth0Client).toBe(mockClient);
    });

    test('should not initialize if createAuth0Client not available', async () => {
      global.createAuth0Client = undefined;

      await initAuth0();

      expect(AppState.auth0Client).toBeNull();
    });

    test('should not initialize without auth0Domain', async () => {
      AppState.settings.auth0Domain = '';

      await initAuth0();

      expect(createAuth0Client).not.toHaveBeenCalled();
    });

    test('should not initialize without auth0ClientId', async () => {
      AppState.settings.auth0ClientId = '';

      await initAuth0();

      expect(createAuth0Client).not.toHaveBeenCalled();
    });

    test('should handle Auth0 initialization errors', async () => {
      global.createAuth0Client.mockRejectedValue(new Error('Auth0 failed'));

      await initAuth0();

      expect(logTerminal).toHaveBeenCalledWith(expect.stringContaining('Auth0 init failed'));
    });

    test('should log success message on successful init', async () => {
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);
      global.window.location = { origin: 'https://example.com' };
      global.updateAuthControls = jest.fn();

      await initAuth0();

      expect(logTerminal).toHaveBeenCalledWith('Auth0 client initialised.');
    });
  });

  describe('updateAuthControls', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status></span>
      `;
    });

    test('should hide buttons when no auth client', async () => {
      AppState.auth0Client = null;

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });

    test('should show anonymous status when no auth client', async () => {
      AppState.auth0Client = null;

      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Anonymous');
    });

    test('should show logout button when authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(false);
    });

    test('should show login button when not authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(loginBtn.classList.contains('hidden')).toBe(false);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });

    test('should update status to Authenticated when logged in', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Authenticated');
    });

    test('should bind login button only once', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn()
      };

      await updateAuthControls();
      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');
    });

    test('should bind logout button only once', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        logout: jest.fn()
      };

      await updateAuthControls();
      await updateAuthControls();

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.dataset.bound).toBe('true');
    });
  });
});