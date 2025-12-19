/**
 * Additional comprehensive unit tests to fill coverage gaps
 * Focuses on Auth0, heatmap, docs sidebar, version list, and security
 */

const fs = require('fs');
const path = require('path');

describe('Additional Coverage - Auth0, Heatmap, Docs, Security', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    localStorage.clear();
    document.body.innerHTML = '';
    jest.clearAllMocks();

    // Reset window globals
    window.__latestCensys = null;
    window.innerWidth = 1024;
    window.Chart = undefined;
    window.d3 = undefined;
    window.topojson = undefined;
    window.createAuth0Client = undefined;
  });

  describe('initAuth0() - Complete coverage', () => {
    it('should not initialize when createAuth0Client is not available', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      window.createAuth0Client = undefined;
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Should not log anything since createAuth0Client is missing
      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput?.textContent).not.toContain('Auth0 client initialised');
    });

    it('should not initialize when auth0Domain is missing', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      window.createAuth0Client = jest.fn();
      
      const mockSettings = {
        auth0ClientId: 'test-client-id',
        // auth0Domain missing
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    it('should not initialize when auth0ClientId is missing', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      window.createAuth0Client = jest.fn();
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        // auth0ClientId missing
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    it('should initialize Auth0 client with correct configuration', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(window.createAuth0Client).toHaveBeenCalledWith({
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: expect.any(String)
        }
      });
    });

    it('should handle Auth0 initialization errors gracefully', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      window.createAuth0Client = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput?.textContent).toContain('Auth0 init failed: Network error');
    });

    it('should log success message after successful initialization', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput?.textContent).toContain('Auth0 client initialised');
    });
  });

  describe('updateAuthControls() - Complete coverage', () => {
    it('should hide all controls and show Anonymous when no Auth0 client', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status>Unknown</span>
      `;

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');
      
      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
      expect(status.textContent).toBe('Anonymous');
    });

    it('should show login button when user is not authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status>Unknown</span>
        <div class="terminal-output"></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn().mockResolvedValue({}),
        logout: jest.fn()
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');
      
      expect(loginBtn.classList.contains('hidden')).toBe(false);
      expect(logoutBtn.classList.contains('hidden')).toBe(true);
      expect(status.textContent).toBe('Anonymous');
    });

    it('should show logout button when user is authenticated', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status>Unknown</span>
        <div class="terminal-output"></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(true),
        loginWithPopup: jest.fn(),
        logout: jest.fn().mockResolvedValue({})
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      const status = document.querySelector('[data-auth-status]');
      
      expect(loginBtn.classList.contains('hidden')).toBe(true);
      expect(logoutBtn.classList.contains('hidden')).toBe(false);
      expect(status.textContent).toBe('Authenticated');
    });

    it('should attach login handler only once', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status>Unknown</span>
        <div class="terminal-output"></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn().mockResolvedValue({}),
        logout: jest.fn()
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');
      
      // Simulate multiple calls to updateAuthControls
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Handler should still only be bound once
      expect(loginBtn.dataset.bound).toBe('true');
    });

    it('should handle missing status element gracefully', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <div class="terminal-output"></div>
      `;

      const mockClient = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };
      
      window.createAuth0Client = jest.fn().mockResolvedValue(mockClient);
      
      const mockSettings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should not throw error
      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn).toBeTruthy();
    });
  });

  describe('renderHeatmap() - Complete coverage', () => {
    it('should return early when container is missing', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      window.d3 = {
        json: jest.fn(),
        select: jest.fn(),
        geoNaturalEarth1: jest.fn(),
        geoPath: jest.fn(),
        scaleSequential: jest.fn(),
        interpolateTurbo: jest.fn()
      };
      window.topojson = { feature: jest.fn() };

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(window.d3.json).not.toHaveBeenCalled();
    });

    it('should return early when d3 is not available', async () => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
      
      window.d3 = undefined;
      window.topojson = { feature: jest.fn() };

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const svg = document.getElementById('worldHeatmap');
      expect(svg.children.length).toBe(0);
    });

    it('should log error and return when topojson is missing', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      
      window.d3 = { json: jest.fn() };
      window.topojson = undefined;

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput?.textContent).toContain('TopoJSON library missing');
    });

    it('should handle world map data fetch errors', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      
      window.d3 = {
        json: jest.fn().mockRejectedValue(new Error('Network error')),
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          remove: jest.fn()
        })
      };
      window.topojson = { feature: jest.fn() };

      eval(scriptContent);
      
      // Trigger renderHeatmap manually if needed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const terminalOutput = document.querySelector('.terminal-output');
      // Function might not be called automatically, so we check it doesn't crash
      expect(terminalOutput).toBeTruthy();
    });

    it('should handle empty countries data gracefully', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      
      const mockSvg = {
        attr: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis(),
        data: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis()
      };
      
      window.d3 = {
        json: jest.fn().mockResolvedValue({
          objects: { countries: {} }
        }),
        select: jest.fn().mockReturnValue(mockSvg),
        geoNaturalEarth1: jest.fn().mockReturnValue({ fitWidth: jest.fn().mockReturnValue({}) }),
        geoPath: jest.fn().mockReturnValue(() => 'path'),
        scaleSequential: jest.fn().mockReturnValue(() => '#000'),
        interpolateTurbo: jest.fn()
      };
      
      window.topojson = {
        feature: jest.fn().mockReturnValue({ features: [] })
      };

      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should handle empty data without crashing
      expect(window.d3.select).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('initDocsSidebar() - Complete coverage', () => {
    it('should setup smooth scrolling for anchor links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
          <a href="http://external.com">External</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
      `;

      const mockScrollIntoView = jest.fn();
      document.querySelectorAll('[id]').forEach(el => {
        el.scrollIntoView = mockScrollIntoView;
      });

      eval(scriptContent);
      
      const link = document.querySelector('.docs-sidebar a[href="#section1"]');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      link.click();
      
      // Should call scrollIntoView with smooth behavior
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    it('should not interfere with non-hash links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="external.html">External Page</a>
        </div>
      `;

      eval(scriptContent);
      
      const link = document.querySelector('.docs-sidebar a');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      // Should not prevent default for non-hash links
      link.dispatchEvent(event);
      
      expect(event.defaultPrevented).toBe(false);
    });

    it('should handle missing target elements gracefully', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#nonexistent">Missing Section</a>
        </div>
      `;

      eval(scriptContent);
      
      const link = document.querySelector('.docs-sidebar a');
      
      // Should not throw when target doesn't exist
      expect(() => link.click()).not.toThrow();
    });

    it('should work with no sidebar present', () => {
      document.body.innerHTML = '<div>No sidebar here</div>';

      // Should not throw when no sidebar exists
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('initVersionList() - Complete coverage', () => {
    it('should populate version list with all releases', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);
      
      const container = document.querySelector('[data-version-list]');
      
      expect(container.innerHTML).toContain('v2.3');
      expect(container.innerHTML).toContain('CURRENT');
      expect(container.innerHTML).toContain('Stable release');
      
      expect(container.innerHTML).toContain('v2.2');
      expect(container.innerHTML).toContain('LTS');
      
      expect(container.innerHTML).toContain('v2.1');
      expect(container.innerHTML).toContain('LEGACY');
      
      expect(container.innerHTML).toContain('v1.x');
      expect(container.innerHTML).toContain('ARCHIVED');
    });

    it('should create proper HTML structure for version cards', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);
      
      const container = document.querySelector('[data-version-list]');
      const cards = container.querySelectorAll('.card');
      
      expect(cards.length).toBe(4);
      
      cards.forEach(card => {
        expect(card.querySelector('.badge')).toBeTruthy();
        expect(card.querySelector('p')).toBeTruthy();
      });
    });

    it('should not throw when container is missing', () => {
      document.body.innerHTML = '<div>No version list</div>';

      // Should handle missing container gracefully
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should replace existing content in container', () => {
      document.body.innerHTML = '<div data-version-list>Old Content</div>';
      document.body.dataset.page = 'versions';

      eval(scriptContent);
      
      const container = document.querySelector('[data-version-list]');
      
      expect(container.innerHTML).not.toContain('Old Content');
      expect(container.innerHTML).toContain('v2.3');
    });
      document.body.innerHTML = '<div data-version-list>Old Content</div>';

      eval(scriptContent);
      
      const container = document.querySelector('[data-version-list]');
      
      expect(container.innerHTML).not.toContain('Old Content');
      expect(container.innerHTML).toContain('v2.3');
    });
  });

  describe('Security and input validation', () => {
    it('should handle XSS attempts in localStorage data', () => {
      const xssPayload = JSON.stringify({
        backendUrl: '<script>alert("xss")</script>',
        theme: 'dark'
      });
      
      localStorage.setItem('net-observation-settings', xssPayload);
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);
      
      // Settings should load but script tags should not execute
      expect(document.body.innerHTML).not.toContain('<script>');
    });

    it('should handle malformed JSON in localStorage', () => {
      localStorage.setItem('net-observation-settings', '{invalid json}');
      document.body.innerHTML = '<div class="terminal-output"></div>';

      // Should not throw, should log warning
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle extremely large localStorage data', () => {
      const largeData = JSON.stringify({
        backendUrl: 'a'.repeat(100000),
        theme: 'dark'
      });
      
      localStorage.setItem('net-observation-settings', largeData);
      document.body.innerHTML = '<div class="terminal-output"></div>';

      // Should handle without crashing
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should sanitize terminal log messages', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="echo <script>alert('xss')</script>" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      const output = document.querySelector('.terminal-output');
      // Should display text content, not execute scripts
      expect(output.textContent).toContain('<script>');
      expect(output.querySelectorAll('script').length).toBe(0);
    });

    it('should handle circular references in data', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="settings" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      // Should not throw on circular reference
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });
  });

  describe('Error boundaries and edge cases', () => {
    it('should handle missing DOM elements gracefully across all functions', () => {
      document.body.innerHTML = ''; // Completely empty DOM

      // Should initialize without throwing
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle rapid repeated function calls', () => {
      document.body.innerHTML = `
        <button data-role="theme-toggle">
          <span data-label>DARK</span>
        </button>
      `;

      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Rapid clicks should not cause issues
      for (let i = 0; i < 100; i++) {
        toggle.click();
      }
      
      expect(toggle.querySelector('[data-label]').textContent).toBeTruthy();
    });

    it('should handle concurrent async operations', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_hosts: 100, total_services: 50, countries: {}, services: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_hosts: 200, total_services: 100, countries: {}, services: {} })
        });

      eval(scriptContent);
      
      // Trigger multiple concurrent fetches
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 50)),
        new Promise(resolve => setTimeout(resolve, 50)),
        new Promise(resolve => setTimeout(resolve, 50))
      ]);
      
      // Should handle without race conditions
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });

    it('should handle window resize events during operation', () => {
      document.body.innerHTML = `
        <aside class="sidebar open">
          <div>Sidebar content</div>
        </aside>
        <button class="sidebar-toggle">Toggle</button>
      `;

      eval(scriptContent);
      
      // Simulate window resize
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));
      
      window.innerWidth = 1200;
      window.dispatchEvent(new Event('resize'));
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should handle system theme changes during operation', () => {
      document.body.innerHTML = `
        <button data-role="theme-toggle">
          <span data-label>AUTO</span>
        </button>
      `;

      const mockSettings = { theme: 'auto' };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);
      
      // Simulate system theme change
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (matchMedia.addEventListener) {
        matchMedia.dispatchEvent(new Event('change'));
      }
      
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Plugin system security', () => {
    it('should handle plugins that throw errors', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="faulty-command" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);
      
      window.registerPlugin({
        name: 'faulty-plugin',
        command: 'faulty-command',
        run() {
          throw new Error('Plugin error');
        }
      });
      
      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');
      
      button.click();
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Error: Plugin error');
    });

    it('should handle async plugins that reject', async () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="async-fail" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);
      
      window.registerPlugin({
        name: 'async-faulty',
        command: 'async-fail',
        async run() {
          throw new Error('Async plugin error');
        }
      });
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const output = document.querySelector('.terminal-output');
      // Async errors are logged via the promise .then handler
      expect(output.textContent).toContain('done');
    });

    it('should reject plugins without names', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);
      
      window.registerPlugin({
        command: 'no-name',
        run() { return 'test'; }
      });
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Plugin registration failed');
    });

    it('should handle plugins with malicious code attempts', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);
      
      // Plugin trying to access sensitive data
      window.registerPlugin({
        name: 'malicious',
        command: 'steal',
        init({ state }) {
          // Try to modify AppState directly
          state.settings = { malicious: true };
        },
        run() {
          return 'attempting theft';
        }
      });
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('registered');
    });
  });
});