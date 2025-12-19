/**
 * Unit tests for Auth0 integration (initAuth0, updateAuthControls)
 * Tests authentication flow, UI updates, and error handling
 */

const fs = require('fs');

describe('Auth0 Integration', () => {
  let initAuth0, updateAuthControls, AppState, logTerminal;

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-action="login">Login</button>
      <button data-action="logout">Logout</button>
      <span data-auth-status>Anonymous</span>
      <div class="terminal-output"></div>
    `;

    AppState = {
      settings: {
        auth0Domain: '',
        auth0ClientId: '',
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    // Mock createAuth0Client
    global.createAuth0Client = jest.fn();

    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract logTerminal
    const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
    if (logMatch) {
      eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
    }
    
    // Extract initAuth0
    const initMatch = scriptContent.match(/async function initAuth0\(\) \{[\s\S]*?\n  \}/);
    if (initMatch) {
      let code = initMatch[0];
      code = code.replace(/updateAuthControls\(\)/g, 'updateAuthControls()');
      eval(`initAuth0 = ${code.replace('async function initAuth0()', 'async function()')}`);
    }
    
    // Extract updateAuthControls
    const updateMatch = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/);
    if (updateMatch) {
      eval(`updateAuthControls = ${updateMatch[0].replace('async function updateAuthControls()', 'async function()')}`);
    }
  });

  afterEach(() => {
    delete global.createAuth0Client;
  });

  describe('initAuth0', () => {
    test('should not initialize when createAuth0Client unavailable', async () => {
      delete global.createAuth0Client;
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';

      await initAuth0();

      expect(AppState.auth0Client).toBeNull();
    });

    test('should not initialize when domain is missing', async () => {
      AppState.settings.auth0Domain = '';
      AppState.settings.auth0ClientId = 'client-123';

      await initAuth0();

      expect(global.createAuth0Client).not.toHaveBeenCalled();
    });

    test('should not initialize when clientId is missing', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = '';

      await initAuth0();

      expect(global.createAuth0Client).not.toHaveBeenCalled();
    });

    test('should create Auth0 client with correct config', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);

      await initAuth0();

      expect(global.createAuth0Client).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'test.auth0.com',
          clientId: 'client-123',
          cacheLocation: 'localstorage'
        })
      );
    });

    test('should set redirect_uri to current origin', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);

      await initAuth0();

      expect(global.createAuth0Client).toHaveBeenCalledWith(
        expect.objectContaining({
          authorizationParams: expect.objectContaining({
            redirect_uri: window.location.origin
          })
        })
      );
    });

    test('should store client in AppState', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);

      await initAuth0();

      expect(AppState.auth0Client).toBe(mockClient);
    });

    test('should log success message', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      
      const mockClient = { isAuthenticated: jest.fn() };
      global.createAuth0Client.mockResolvedValue(mockClient);

      await initAuth0();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Auth0 client initialised');
    });

    test('should handle initialization errors', async () => {
      AppState.settings.auth0Domain = 'test.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      
      global.createAuth0Client.mockRejectedValue(new Error('Init failed'));

      await initAuth0();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Auth0 init failed');
    });
  });

  describe('updateAuthControls - Unauthenticated State', () => {
    test('should hide both buttons when no client', async () => {
      AppState.auth0Client = null;

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      
      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });

    test('should set status to Anonymous when no client', async () => {
      AppState.auth0Client = null;

      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Anonymous');
    });

    test('should show login button when unauthenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.classList.contains('hidden')).toBe(false);
    });

    test('should hide logout button when unauthenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      await updateAuthControls();

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
    });
  });

  describe('updateAuthControls - Authenticated State', () => {
    test('should hide login button when authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.classList.contains('hidden')).toBe(true);
    });

    test('should show logout button when authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.classList.contains('hidden')).toBe(false);
    });

    test('should set status to Authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Authenticated');
    });
  });

  describe('Login/Logout Handlers', () => {
    test('should bind login handler only once', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn()
      };

      await updateAuthControls();
      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');
    });

    test('should bind logout handler only once', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        logout: jest.fn()
      };

      await updateAuthControls();
      await updateAuthControls();

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.dataset.bound).toBe('true');
    });

    test('should handle missing login button', async () => {
      document.querySelector('[data-action="login"]').remove();
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      await expect(updateAuthControls()).resolves.not.toThrow();
    });

    test('should handle missing logout button', async () => {
      document.querySelector('[data-action="logout"]').remove();
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await expect(updateAuthControls()).resolves.not.toThrow();
    });

    test('should handle missing status element', async () => {
      document.querySelector('[data-auth-status]').remove();
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      await expect(updateAuthControls()).resolves.not.toThrow();
    });
  });
});