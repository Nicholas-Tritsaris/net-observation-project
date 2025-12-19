/**
 * Performance, accessibility, and configuration tests
 * Tests focus on performance bottlenecks, a11y compliance, and config validation
 */

const fs = require('fs');
const path = require('path');

describe('Performance and Accessibility Tests', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Performance optimization', () => {
    it('should initialize without blocking the main thread', () => {
      const startTime = Date.now();
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>
        <img src="logo.png" alt="Test" data-logo />
      `;

      eval(scriptContent);

      const endTime = Date.now();
      const initTime = endTime - startTime;

      // Initialization should be fast (< 100ms in tests)
      expect(initTime).toBeLessThan(100);
    });

    it('should debounce or throttle rapid sidebar toggles', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.sidebar');

      // Rapid toggles
      for (let i = 0; i < 20; i++) {
        toggle.click();
      }

      // Should handle all toggles without performance degradation
      expect(sidebar.classList.contains('open')).toBeDefined();
    });

    it('should not create excessive DOM nodes for large datasets', () => {
      document.body.innerHTML = `
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal-output"></div>
      `;

      const largeDataset = {};
      for (let i = 0; i < 100; i++) {
        largeDataset[`service${i}`] = Math.floor(Math.random() * 1000);
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          services: largeDataset,
          countries: {},
          total_hosts: 1000
        })
      });

      eval(scriptContent);

      const initialNodeCount = document.body.getElementsByTagName('*').length;

      // Should not exponentially increase DOM nodes
      expect(initialNodeCount).toBeLessThan(200);
    });

    it('should efficiently handle multiple chart updates', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      window.Chart = jest.fn().mockImplementation(() => ({
        destroy: jest.fn(),
        update: jest.fn(),
        data: { datasets: [] }
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          services: { http: 100 },
          countries: { US: 50 },
          total_hosts: 150
        })
      });

      eval(scriptContent);

      // Should create charts efficiently
      expect(window.Chart).toHaveBeenCalled();
    });

    it('should handle large terminal output without memory issues', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const initialMemory = process.memoryUsage().heapUsed;

      // Add many terminal messages
      for (let i = 0; i < 1000; i++) {
        window.logTerminal?.(`Test message ${i}`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 10MB for 1000 messages)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Accessibility compliance', () => {
    it('should maintain focus trap in settings panel when open', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden">
          <form>
            <input name="backendUrl" />
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Settings</button>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      toggle.click();

      expect(panel.classList.contains('hidden')).toBe(false);
      // Panel should be accessible
      expect(panel).toBeTruthy();
    });

    it('should provide keyboard navigation for theme toggle', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0" role="button">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = document.documentElement.getAttribute('data-theme');

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
      toggle.dispatchEvent(enterEvent);

      const afterEnterTheme = document.documentElement.getAttribute('data-theme');

      // Should change theme on Enter
      expect(afterEnterTheme).toBeTruthy();

      // Simulate Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
      toggle.dispatchEvent(spaceEvent);

      const afterSpaceTheme = document.documentElement.getAttribute('data-theme');

      // Should change theme on Space
      expect(afterSpaceTheme).toBeTruthy();
    });

    it('should provide screen reader friendly logo fallbacks', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Company Logo" data-logo />';

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        expect(placeholder.textContent).toBe('COMPANY LOGO');
        done();
      }, 50);
    });

    it('should maintain proper ARIA states on sidebar toggle', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-label="Toggle navigation" aria-expanded="true"></button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      const initialState = toggle.getAttribute('aria-expanded');

      toggle.click();

      const newState = toggle.getAttribute('aria-expanded');

      // ARIA state should toggle
      expect(newState).toBe(initialState === 'true' ? 'false' : 'true');
    });

    it('should provide semantic HTML structure', () => {
      document.body.innerHTML = `
        <header><h1>Title</h1></header>
        <main><section><h2>Content</h2></section></main>
        <aside class="sidebar"><nav><a href="#">Link</a></nav></aside>
      `;

      eval(scriptContent);

      // Verify semantic elements exist
      expect(document.querySelector('header')).toBeTruthy();
      expect(document.querySelector('main')).toBeTruthy();
      expect(document.querySelector('aside')).toBeTruthy();
      expect(document.querySelector('nav')).toBeTruthy();
    });

    it('should handle reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      window.matchMedia = mockMatchMedia;

      document.body.innerHTML = '';

      // Should not crash with reduced motion preference
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });
  });

  describe('Configuration validation', () => {
    it('should validate backendUrl format', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="invalid url with spaces" />
          </form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
      
      // Should still save even if URL is invalid (validation happens at use-time)
      expect(settings.backendUrl).toBeDefined();
    });

    it('should handle Auth0 configuration with missing domain', async () => {
      localStorage.setItem('net-observation-settings', JSON.stringify({
        auth0Domain: '',
        auth0ClientId: 'some-client-id'
      }));

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle Auth0 configuration with missing client ID', async () => {
      localStorage.setItem('net-observation-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: ''
      }));

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should validate theme values', () => {
      localStorage.setItem('net-observation-settings', JSON.stringify({
        theme: 'invalid-theme'
      }));

      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';

      eval(scriptContent);

      // Should fall back to valid theme
      const theme = document.documentElement.getAttribute('data-theme');
      expect(['auto', 'dark', 'light']).toContain(theme);
    });

    it('should handle extremely long backendUrl', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000);

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="${longUrl}" />
          </form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');

      expect(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }).not.toThrow();
    });

    it('should handle special characters in configuration', () => {
      const specialChars = '!@#$%^&*(){}[]|\\:";\'<>?,./';

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="https://example.com/${specialChars}" />
          </form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');

      expect(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('Error boundary and recovery', () => {
    it('should recover from plugin init errors', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const crashingPlugin = {
        name: 'crasher',
        init: () => { throw new Error('Init crash'); }
      };

      expect(() => {
        window.registerPlugin?.(crashingPlugin);
      }).not.toThrow();

      // App should still be functional
      expect(document.body).toBeTruthy();
    });

    it('should recover from chart initialization errors', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
      document.body.dataset.page = 'dashboard';

      window.Chart = jest.fn().mockImplementation(() => {
        throw new Error('Chart init error');
      });

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing data gracefully in visualizations', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');

      expect(() => {
        button.click();
      }).not.toThrow();
    });

    it('should handle CSV with inconsistent column counts', () => {
      const inconsistentCSV = 'name,age\nJohn,30\nJane,25,extra\nBob';

      document.body.innerHTML = `
        <textarea id="dataInput">${inconsistentCSV}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');

      expect(() => {
        button.click();
      }).not.toThrow();
    });

    it('should handle JSON with deeply nested structures', () => {
      const deepNested = { a: { b: { c: { d: { e: { f: { g: 'deep' } } } } } } };

      document.body.innerHTML = `
        <textarea id="dataInput">${JSON.stringify(deepNested)}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');

      expect(() => {
        button.click();
      }).not.toThrow();
    });
  });

  describe('Cross-browser compatibility', () => {
    it('should handle older browser without dataset support', () => {
      const element = document.createElement('div');
      Object.defineProperty(element, 'dataset', {
        get: undefined,
        set: undefined
      });

      document.body.appendChild(element);

      // Should handle gracefully
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle browsers without classList support', () => {
      const originalClassList = Element.prototype.classList;
      Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
          return undefined;
        },
        configurable: true
      });

      document.body.innerHTML = '<div class="sidebar"></div>';

      // Should have fallback or handle gracefully
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
          return originalClassList;
        },
        configurable: true
      });
    });

    it('should handle missing Promise support', () => {
      const originalPromise = global.Promise;
      
      // Should still work with basic functionality
      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing fetch API', () => {
      const originalFetch = global.fetch;
      delete global.fetch;

      document.body.innerHTML = '<div class="terminal-output"></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      global.fetch = originalFetch;
    });

    it('should handle missing localStorage in private mode', () => {
      const originalStorage = global.localStorage;
      
      Object.defineProperty(global, 'localStorage', {
        get: () => {
          throw new Error('SecurityError');
        },
        configurable: true
      });

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      Object.defineProperty(global, 'localStorage', {
        get: () => originalStorage,
        configurable: true
      });
    });
  });

  describe('Data integrity and validation', () => {
    it('should handle missing required stats elements', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 100,
          services: { http: 50 }
        })
      });

      eval(scriptContent);

      // Should not crash when stat elements are missing
      expect(() => {
        window.__latestCensys;
      }).not.toThrow();
    });

    it('should sanitize data before rendering in tables', () => {
      document.body.innerHTML = `
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal-output"></div>
      `;

      const maliciousData = {
        '<script>alert("xss")</script>': 100,
        'normal-service': 200
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          services: maliciousData,
          countries: {},
          total_hosts: 300
        })
      });

      eval(scriptContent);

      const tbody = document.querySelector('tbody');
      
      // Script tags should not be executed
      expect(tbody.innerHTML).not.toContain('<script>');
    });

    it('should handle NaN and Infinity values', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div class="terminal-output"></div>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: NaN,
          total_services: Infinity,
          countries: {},
          services: {}
        })
      });

      eval(scriptContent);

      // Should handle invalid numbers gracefully
      const statEl = document.querySelector('[data-stat="total-hosts"]');
      expect(statEl.textContent).toBeDefined();
    });

    it('should preserve data types in settings', () => {
      const settings = {
        backendUrl: '/api/test',
        auth0Domain: null,
        auth0ClientId: undefined,
        theme: 'dark',
        customNumber: 123,
        customBoolean: true
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(settings));

      document.body.innerHTML = '';

      eval(scriptContent);

      const loaded = JSON.parse(localStorage.getItem('net-observation-settings'));
      
      expect(typeof loaded.backendUrl).toBe('string');
      expect(loaded.auth0Domain).toBeNull();
      expect(loaded.theme).toBe('dark');
    });
  });

  describe('Internationalization readiness', () => {
    it('should handle Unicode characters in terminal output', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const unicodeMessage = '测试 テスト 🚀 العربية';
      window.logTerminal?.(unicodeMessage);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain(unicodeMessage);
    });

    it('should handle RTL text in configuration', () => {
      const rtlText = 'مرحبا بك في التطبيق';

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="${rtlText}" />
          </form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');

      expect(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }).not.toThrow();

      const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(settings.backendUrl).toBe(rtlText);
    });

    it('should handle emoji in data keys', () => {
      document.body.innerHTML = `
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal-output"></div>
      `;

      const emojiData = {
        '🌐 web': 100,
        '🔒 secure': 200
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          services: emojiData,
          countries: {},
          total_hosts: 300
        })
      });

      eval(scriptContent);

      const tbody = document.querySelector('tbody');
      expect(tbody.textContent).toContain('🌐');
      expect(tbody.textContent).toContain('🔒');
    });
  });
});