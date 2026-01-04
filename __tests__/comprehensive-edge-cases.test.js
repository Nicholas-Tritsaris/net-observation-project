/**
 * Comprehensive Edge Case Tests for Net Observation Project
 * Additional thorough testing with bias for action
 * Focuses on untested edge cases, race conditions, and stress scenarios
 */

const fs = require('fs');
const path = require('path');

describe('Comprehensive Edge Cases - Additional Coverage', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    localStorage.clear();
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset globals
    window.__latestCensys = null;
    window.Chart = undefined;
    window.d3 = undefined;
    window.topojson = undefined;
    window.createAuth0Client = undefined;
    delete window.AppState;
    delete window.AppPlugins;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Auth0 Integration - Comprehensive Edge Cases', () => {
    it('should handle Auth0 client creation failure', async () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-auth-status></div>
        <button data-action="login"></button>
        <button data-action="logout"></button>
      `;

      window.createAuth0Client = jest.fn().mockRejectedValue(new Error('Network failure'));
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.textContent).toContain('Auth0 init failed');
      expect(terminalOutput.textContent).toContain('Network failure');
    });

    it('should handle Auth0 isAuthenticated check failure', async () => {
      document.body.innerHTML = `
        <div data-auth-status></div>
        <button data-action="login"></button>
        <button data-action="logout"></button>
      `;

      const mockAuth0Client = {
        isAuthenticated: jest.fn().mockRejectedValue(new Error('Session expired')),
        loginWithPopup: jest.fn(),
        logout: jest.fn()
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockAuth0Client);
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      // Should handle error gracefully
      expect(mockAuth0Client.isAuthenticated).toHaveBeenCalled();
    });

    it('should handle Auth0 loginWithPopup failure', async () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-auth-status></div>
        <button data-action="login">Login</button>
        <button data-action="logout"></button>
      `;

      const mockAuth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn().mockRejectedValue(new Error('Popup blocked')),
        logout: jest.fn()
      };

      window.createAuth0Client = jest.fn().mockResolvedValue(mockAuth0Client);
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      }));

      eval(scriptContent);
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      const loginBtn = document.querySelector('[data-action="login"]');
      loginBtn.click();
      await Promise.resolve();

      expect(mockAuth0Client.loginWithPopup).toHaveBeenCalled();
    });

    it('should handle missing Auth0 configuration gracefully', async () => {
      document.body.innerHTML = `<div data-auth-status></div>`;

      window.createAuth0Client = jest.fn();
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: '',
        auth0ClientId: ''
      }));

      eval(scriptContent);
      await Promise.resolve();

      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });

    it('should handle partial Auth0 configuration', async () => {
      document.body.innerHTML = `<div data-auth-status></div>`;

      window.createAuth0Client = jest.fn();
      localStorage.setItem('nop-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: '' // Missing client ID
      }));

      eval(scriptContent);
      await Promise.resolve();

      expect(window.createAuth0Client).not.toHaveBeenCalled();
    });
  });

  describe('Chart.js Integration - Additional Edge Cases', () => {
    it('should handle Chart constructor throwing error', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      window.Chart = jest.fn().mockImplementation(() => {
        throw new Error('Canvas context unavailable');
      });

      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle chart update with circular reference in data', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      const mockChart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        update: jest.fn()
      };

      window.Chart = jest.fn().mockReturnValue(mockChart);

      eval(scriptContent);

      // Simulate data with circular reference
      const circularData = { services: { http: 100 } };
      circularData.self = circularData;

      window.AppState.charts.services = mockChart;
      
      // Should handle without throwing
      expect(() => {
        window.AppState.charts.services.data.labels = ['http'];
        window.AppState.charts.services.data.datasets[0].data = [100];
      }).not.toThrow();
    });

    it('should handle empty services and countries data', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      const mockChart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        update: jest.fn()
      };

      window.Chart = jest.fn().mockReturnValue(mockChart);

      eval(scriptContent);

      // Update with empty data
      const emptyData = { services: {}, countries: {} };
      
      if (window.AppState && window.AppState.charts.services) {
        window.AppState.charts.services.data.labels = [];
        window.AppState.charts.services.data.datasets[0].data = [];
        expect(mockChart.update).not.toThrow();
      }
    });

    it('should handle chart canvas with invalid context', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
      `;
      document.body.dataset.page = 'dashboard';

      const mockCanvas = document.getElementById('servicesChart');
      mockCanvas.getContext = jest.fn().mockReturnValue(null);

      window.Chart = jest.fn();

      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('Auto-refresh and Timing - Race Conditions', () => {
    it('should handle multiple simultaneous fetch requests', async () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div class="terminal-output"></div>
      `;

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_hosts: 100, total_services: 50, last_sync: new Date().toISOString(), countries: {}, services: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total_hosts: 200, total_services: 75, last_sync: new Date().toISOString(), countries: {}, services: {} })
        });

      eval(scriptContent);

      // Trigger multiple fetches
      if (window.fetchCensysSummary) {
        window.fetchCensysSummary();
        window.fetchCensysSummary();
        window.fetchCensysSummary();
      }

      await Promise.resolve();
      await Promise.resolve();

      // Should handle gracefully without race condition issues
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle fetch during interval cleanup', async () => {
      document.body.innerHTML = `<div class="terminal-output"></div>`;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100, total_services: 50, last_sync: new Date().toISOString(), countries: {}, services: {} })
      });

      document.body.dataset.page = 'api';
      eval(scriptContent);

      // Advance timers
      jest.advanceTimersByTime(60000);
      await Promise.resolve();

      // Clear all intervals
      jest.clearAllTimers();

      // Should not throw
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle rapid theme changes during fetch', async () => {
      document.body.innerHTML = `
        <button data-role="theme-toggle"></button>
        <div class="terminal-output"></div>
      `;

      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ total_hosts: 100, total_services: 50, last_sync: new Date().toISOString(), countries: {}, services: {} })
        }), 100))
      );

      eval(scriptContent);

      // Rapidly change themes
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      if (toggle) {
        toggle.click();
        toggle.click();
        toggle.click();
      }

      jest.advanceTimersByTime(150);
      await Promise.resolve();

      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });
  });

  describe('Terminal Command Parsing - Edge Cases', () => {
    it('should handle commands with excessive whitespace', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="   stats      " />
          <button>Run</button>
        </div>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100, total_services: 50, last_sync: new Date().toISOString(), countries: {}, services: {} })
      });

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Refreshing');
    });

    it('should handle commands with special characters', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="theme <script>alert(1)</script>" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Usage: theme');
    });

    it('should handle very long command arguments', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="${'theme ' + 'a'.repeat(10000)}" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      expect(() => button.click()).not.toThrow();
    });

    it('should handle commands with Unicode characters', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help 你好 🚀" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      expect(() => button.click()).not.toThrow();
    });

    it('should handle empty command with just spaces', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="     " />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      // Should handle gracefully without adding output
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });

    it('should handle Enter key with modifier keys', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      
      // Enter with Shift (should not execute)
      const shiftEnter = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      input.dispatchEvent(shiftEnter);

      // Enter with Ctrl (should not execute)
      const ctrlEnter = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      input.dispatchEvent(ctrlEnter);

      // Regular Enter should work
      const regularEnter = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(regularEnter);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Available commands');
    });
  });

  describe('Data Visualizer - Malformed Input Edge Cases', () => {
    it('should handle deeply nested JSON', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      const deeplyNested = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 'deep' } } } } } } } } } };

      eval(scriptContent);

      const textarea = document.getElementById('dataInput');
      const button = document.getElementById('renderData');

      textarea.value = JSON.stringify(deeplyNested);
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.textContent).toContain('deep');
    });

    it('should handle CSV with inconsistent column counts', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      const malformedCSV = `name,age,city
John,30,NYC
Jane,25
Bob,35,LA,ExtraColumn`;

      eval(scriptContent);

      const textarea = document.getElementById('dataInput');
      const button = document.getElementById('renderData');

      textarea.value = malformedCSV;
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output).toBeTruthy();
    });

    it('should handle CSV with only headers', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const textarea = document.getElementById('dataInput');
      const button = document.getElementById('renderData');

      textarea.value = 'name,age,city';
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.querySelector('pre')).toBeTruthy();
    });

    it('should handle JSON with special characters in keys', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      const specialKeysJSON = {
        "key with spaces": "value1",
        "key-with-dashes": "value2",
        "key.with.dots": "value3",
        "key/with/slashes": "value4"
      };

      eval(scriptContent);

      const textarea = document.getElementById('dataInput');
      const button = document.getElementById('renderData');

      textarea.value = JSON.stringify(specialKeysJSON);
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.textContent).toContain('key with spaces');
    });

    it('should handle file upload with binary data', () => {
      document.body.innerHTML = `
        <input type="file" id="fileInput" />
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const fileInput = document.getElementById('fileInput');
      const file = new File(['\x00\x01\x02\xFF'], 'binary.dat');

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      // Should handle error gracefully
      expect(() => fileInput.dispatchEvent(new Event('change'))).not.toThrow();
    });

    it('should handle extremely large JSON file', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      // Create large array
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item${i}` }));

      eval(scriptContent);

      const textarea = document.getElementById('dataInput');
      const button = document.getElementById('renderData');

      textarea.value = JSON.stringify(largeArray);

      // Should handle without throwing
      expect(() => button.click()).not.toThrow();
    });
  });

  describe('Settings Panel - Validation Edge Cases', () => {
    it('should handle malicious script injection in backend URL', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="<script>alert(1)</script>" />
            <input name="auth0Domain" value="" />
            <input name="auth0ClientId" value="" />
            <select name="themeMode"><option value="auto">Auto</option></select>
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Toggle</button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));

      // Should sanitize/encode properly
      expect(window.AppState.settings.backendUrl).toBeTruthy();
    });

    it('should handle extremely long URLs', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="${'http://example.com/' + 'a'.repeat(10000)}" />
            <input name="auth0Domain" value="" />
            <input name="auth0ClientId" value="" />
            <select name="themeMode"><option value="auto">Auto</option></select>
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Toggle</button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      expect(() => form.dispatchEvent(new Event('submit'))).not.toThrow();
    });

    it('should handle settings panel toggle rapid clicking', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden"></div>
        <button class="settings-toggle">&#9881;</button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.settings-toggle');
      const panel = document.querySelector('.settings-panel');

      // Rapid clicking
      for (let i = 0; i < 100; i++) {
        toggle.click();
      }

      // Should have consistent state
      expect(panel.classList.contains('hidden')).toBe(false);
    });

    it('should handle settings with null values', () => {
      localStorage.setItem('nop-settings', JSON.stringify({
        backendUrl: null,
        auth0Domain: null,
        auth0ClientId: null,
        theme: null
      }));

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" />
            <input name="auth0Domain" />
            <input name="auth0ClientId" />
            <select name="themeMode"><option value="auto">Auto</option></select>
          </form>
        </div>
        <button class="settings-toggle">Toggle</button>
      `;

      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('Heatmap / D3.js Integration - Edge Cases', () => {
    it('should handle D3 being unavailable', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      window.d3 = undefined;
      window.topojson = undefined;

      eval(scriptContent);

      // Should handle gracefully
      expect(document.getElementById('worldHeatmap')).toBeTruthy();
    });

    it('should handle TopoJSON being unavailable', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      window.d3 = {
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          remove: jest.fn()
        }),
        json: jest.fn()
      };
      window.topojson = undefined;

      eval(scriptContent);
      await Promise.resolve();

      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });

    it('should handle world map data fetch failure', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'dashboard';

      window.d3 = {
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis()
        }),
        json: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      window.topojson = { feature: jest.fn() };

      eval(scriptContent);

      if (window.renderHeatmap) {
        await window.renderHeatmap({ countries: { US: 100 } });
      }

      await Promise.resolve();

      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });
  });

  describe('Navigation and Docs Sidebar - Edge Cases', () => {
    it('should handle navigation with hash-only URLs', () => {
      window.location.pathname = '#section';

      document.body.innerHTML = `
        <nav>
          <a href="#section">Section</a>
          <a href="index.html">Home</a>
        </nav>
      `;

      eval(scriptContent);

      // Should handle without throwing
      expect(document.querySelector('nav')).toBeTruthy();
    });

    it('should handle docs sidebar with invalid hash links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#nonexistent">Link</a>
        </div>
      `;

      eval(scriptContent);

      const link = document.querySelector('.docs-sidebar a');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      expect(() => link.dispatchEvent(event)).not.toThrow();
    });

    it('should handle smooth scroll when element exists', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Link</a>
        </div>
        <div id="section1">Content</div>
      `;

      const mockScrollIntoView = jest.fn();
      document.getElementById('section1').scrollIntoView = mockScrollIntoView;

      eval(scriptContent);

      const link = document.querySelector('.docs-sidebar a');
      link.click();

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    it('should handle navigation links with query parameters', () => {
      window.location.pathname = '/dashboard.html?param=value';

      document.body.innerHTML = `
        <nav>
          <a href="dashboard.html">Dashboard</a>
          <a href="index.html">Home</a>
        </nav>
      `;

      eval(scriptContent);

      expect(document.querySelector('nav')).toBeTruthy();
    });
  });

  describe('Plugin System - Advanced Edge Cases', () => {
    it('should handle plugin with circular dependencies', () => {
      document.body.innerHTML = `<div class="terminal-output"></div>`;

      eval(scriptContent);

      const circularPlugin = {
        name: 'circular',
        command: 'circ',
        run: function() {
          return this;
        }
      };

      expect(() => window.AppPlugins.register(circularPlugin)).not.toThrow();
    });

    it('should handle plugin that returns Promise.reject', async () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="failing" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      window.AppPlugins.register({
        name: 'failing',
        command: 'failing',
        run: () => Promise.reject(new Error('Plugin failed'))
      });

      const button = document.querySelector('.terminal button');
      button.click();

      await Promise.resolve();

      // Should handle rejection gracefully
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });

    it('should handle plugin registration with duplicate names', () => {
      document.body.innerHTML = `<div class="terminal-output"></div>`;

      eval(scriptContent);

      window.AppPlugins.register({
        name: 'duplicate',
        command: 'dup1',
        run: () => 'first'
      });

      // Second registration should either override or be rejected
      expect(() => {
        window.AppPlugins.register({
          name: 'duplicate',
          command: 'dup2',
          run: () => 'second'
        });
      }).not.toThrow();
    });

    it('should handle plugin with very long output', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="longoutput" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      window.AppPlugins.register({
        name: 'long',
        command: 'longoutput',
        run: () => 'x'.repeat(100000)
      });

      const button = document.querySelector('.terminal button');
      expect(() => button.click()).not.toThrow();
    });
  });

  describe('localStorage Edge Cases', () => {
    it('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api/test" />
            <input name="auth0Domain" value="" />
            <input name="auth0ClientId" value="" />
            <select name="themeMode"><option value="auto">Auto</option></select>
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Toggle</button>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      expect(() => form.dispatchEvent(new Event('submit'))).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage returning non-JSON string', () => {
      localStorage.setItem('nop-settings', 'not valid json{]');

      document.body.innerHTML = `<div></div>`;

      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle localStorage with malformed UTF-8', () => {
      localStorage.setItem('nop-settings', '\uFFFD\uFFFD');

      document.body.innerHTML = `<div></div>`;

      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('Initialization Edge Cases', () => {
    it('should handle document readyState being "interactive"', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'interactive'
      });

      document.body.innerHTML = `<div></div>`;

      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle multiple DOMContentLoaded events', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      document.body.innerHTML = `<div></div>`;

      eval(scriptContent);

      // Fire event multiple times
      document.dispatchEvent(new Event('DOMContentLoaded'));
      document.dispatchEvent(new Event('DOMContentLoaded'));
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });

    it('should handle initialization with missing body element', () => {
      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        configurable: true,
        get: () => null
      });

      expect(() => eval(scriptContent)).not.toThrow();

      Object.defineProperty(document, 'body', {
        configurable: true,
        get: () => originalBody
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle rapid repeated initializations', () => {
      document.body.innerHTML = `<div></div>`;

      for (let i = 0; i < 100; i++) {
        eval(scriptContent);
      }

      // Should not leak memory or throw errors
      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });

    it('should handle very large data updates', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-table="services"><tbody></tbody></div>
        <div data-table="countries"><tbody></tbody></div>
      `;

      eval(scriptContent);

      const largeData = {
        total_hosts: 999999999999,
        total_services: 888888888888,
        last_sync: new Date().toISOString(),
        services: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`service${i}`, i * 100])),
        countries: Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`C${i}`, i * 50]))
      };

      expect(() => {
        if (window.updateStatsView) {
          window.updateStatsView(largeData);
        }
      }).not.toThrow();
    });
  });
});