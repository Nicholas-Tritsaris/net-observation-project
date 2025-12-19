/**
 * Integration tests for the Net Observation Project
 * Tests interactions between different components and full user workflows
 */

const fs = require('fs');
const path = require('path');

describe('Integration Tests - Full User Workflows', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Logo fallback integration', () => {
    it('should handle logo fallback across multiple pages consistently', (done) => {
      // Simulate a complete page with both sidebar and header logos
      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" alt="Net Observation Project" data-logo style="width:100%; border-radius:14px; margin-bottom:1rem;" />
          <nav><a href="index.html">Home</a></nav>
        </aside>
        <header>
          <img src="logo.png" alt="Net Observation" class="logo" data-logo />
        </header>
      `;

      eval(scriptContent);

      const sidebarLogo = document.querySelector('.sidebar img[data-logo]');
      const headerLogo = document.querySelector('header img[data-logo]');

      // Trigger errors on both
      sidebarLogo.dispatchEvent(new Event('error'));
      headerLogo.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Both should have fallbacks
        expect(sidebarLogo.nextElementSibling?.className).toBe('logo-placeholder');
        expect(headerLogo.nextElementSibling?.className).toBe('logo-placeholder');
        
        // Sidebar should show full name
        expect(sidebarLogo.nextElementSibling.textContent).toBe('NET OBSERVATION PROJECT');
        
        // Header should show shorter name
        expect(headerLogo.nextElementSibling.textContent).toBe('NET OBSERVATION');
        
        done();
      }, 100);
    });

    it('should initialize theme and logo fallbacks in correct order', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      // Theme should be applied
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Logo fallback should work after theme is applied
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });
  });

  describe('Theme and UI integration', () => {
    it('should persist theme changes across page reloads', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Click to change theme
      toggle.click();
      
      const savedSettings = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(savedSettings.theme).toBeTruthy();
      expect(['auto', 'dark', 'light']).toContain(savedSettings.theme);
    });

    it('should update UI when theme changes', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));

      eval(scriptContent);

      expect(document.body.dataset.theme).toBe('dark');
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();
      
      // Theme should have changed
      const newTheme = document.body.dataset.theme;
      expect(['auto', 'dark', 'light'].includes(newTheme)).toBe(true);
    });
  });

  describe('Settings panel integration', () => {
    it('should save settings and apply them immediately', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api/test" />
            <input name="auth0Domain" value="test.auth0.com" />
            <input name="auth0ClientId" value="test-client-123" />
            <select name="themeMode">
              <option value="dark" selected>Dark</option>
            </select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const form = panel.querySelector('form');
      
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.backendUrl).toBe('/api/test');
      expect(saved.auth0Domain).toBe('test.auth0.com');
      expect(saved.auth0ClientId).toBe('test-client-123');
      expect(saved.theme).toBe('dark');
    });

    it('should toggle settings panel visibility', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden"></div>
        <button class="settings-toggle">⚙</button>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      expect(panel.classList.contains('hidden')).toBe(true);

      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(false);

      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Sidebar and navigation integration', () => {
    it('should handle responsive sidebar behavior', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      // Test mobile size
      window.innerWidth = 800;
      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    it('should toggle sidebar and update ARIA attributes', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;

      window.innerWidth = 1024;
      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Data fetching and display integration', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should fetch data and update multiple UI components', async () => {
      const mockData = {
        total_hosts: 1234,
        total_services: 567,
        last_sync: '2025-01-15T10:00:00Z',
        countries: { US: 100, GB: 50 },
        services: { http: 30, https: 40 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal-output"></div>
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({
        backendUrl: '/api/censys-summary'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(window.__latestCensys).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully without breaking UI', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      document.body.innerHTML = `
        <div data-stat="total-hosts">Initial</div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 200));

      // UI should still be functional
      const statsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(statsEl).toBeTruthy();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Plugin system integration', () => {
    it('should register plugin and execute commands', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      let pluginExecuted = false;
      const testPlugin = {
        name: 'integration-test',
        command: 'itest',
        init: jest.fn(),
        run: (arg) => {
          pluginExecuted = true;
          return `Plugin executed with: ${arg}`;
        }
      };

      window.registerPlugin(testPlugin);

      expect(testPlugin.init).toHaveBeenCalled();
      expect(testPlugin.init).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.any(Object),
          log: expect.any(Function)
        })
      );

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.textContent).toContain('integration-test');
    });

    it('should provide plugins access to app state', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      localStorage.setItem('net-observation-settings', JSON.stringify({
        backendUrl: '/test/api'
      }));

      eval(scriptContent);

      let capturedState = null;
      const statePlugin = {
        name: 'state-checker',
        init: ({ state }) => {
          capturedState = state;
        }
      };

      window.registerPlugin(statePlugin);

      expect(capturedState).toBeTruthy();
      expect(capturedState.settings).toBeDefined();
      expect(capturedState.settings.backendUrl).toBe('/test/api');
    });
  });

  describe('Terminal command execution integration', () => {
    it('should execute built-in commands', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="help" />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      const input = document.querySelector('.terminal input');

      input.value = 'help';
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toBeTruthy();
    });

    it('should execute plugin commands through terminal', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const customPlugin = {
        name: 'custom-cmd',
        command: 'custom',
        run: (arg) => `Custom output: ${arg}`
      };

      window.registerPlugin(customPlugin);

      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');

      input.value = 'custom test-arg';
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Custom output');
    });
  });

  describe('Data visualizer integration', () => {
    it('should parse and display JSON data', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{"key": "value", "num": 123}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).toContain('<pre>');
    });

    it('should handle CSV file upload', (done) => {
      document.body.innerHTML = `
        <input type="file" id="fileInput" />
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const fileInput = document.getElementById('fileInput');
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Mock FileReader
      const originalFileReader = window.FileReader;
      window.FileReader = jest.fn(() => ({
        readAsText: jest.fn(function() {
          this.result = csvContent;
          this.onload();
        }),
        result: csvContent
      }));

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      fileInput.dispatchEvent(new Event('change'));

      setTimeout(() => {
        const output = document.getElementById('dataOutput');
        expect(output.innerHTML).toContain('<pre>');
        
        window.FileReader = originalFileReader;
        done();
      }, 100);
    });
  });

  describe('Page-specific initialization', () => {
    it('should initialize dashboard-specific features', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
        <textarea id="dataInput"></textarea>
        <button id="renderData"></button>
        <div id="dataOutput"></div>
      `;
      document.body.dataset.page = 'dashboard';

      // Mock Chart.js
      window.Chart = jest.fn();

      eval(scriptContent);

      // Should initialize charts
      expect(window.Chart).toHaveBeenCalled();
    });

    it('should initialize API page features', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" />
            <button>Run</button>
          </div>
        </div>
      `;
      document.body.dataset.page = 'api';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      eval(scriptContent);

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput).toBeTruthy();
    });

    it('should initialize docs page features', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
        <div data-version-list></div>
      `;
      document.body.dataset.page = 'docs';

      eval(scriptContent);

      const versionList = document.querySelector('[data-version-list]');
      expect(versionList.innerHTML).toBeTruthy();
      expect(versionList.innerHTML).toContain('v2.3');
    });
  });

  describe('Full user journey - Theme customization', () => {
    it('should allow user to change theme, persist it, and reload', () => {
      // Step 1: User loads page
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const initialTheme = document.body.dataset.theme;
      expect(initialTheme).toBeTruthy();

      // Step 2: User clicks theme toggle
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();

      const changedTheme = document.body.dataset.theme;
      expect(changedTheme).toBeTruthy();

      // Step 3: Settings saved to localStorage
      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.theme).toBeTruthy();

      // Step 4: Simulate page reload
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      // Step 5: Theme should be restored
      const restoredTheme = document.body.dataset.theme;
      expect(restoredTheme).toBe(changedTheme);
    });
  });

  describe('Error recovery integration', () => {
    it('should recover from localStorage errors', () => {
      // Corrupt localStorage
      localStorage.setItem('net-observation-settings', 'invalid{json');

      document.body.innerHTML = '<div></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load settings',
        expect.any(Error)
      );

      // Should still apply default theme
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '<div>Minimal page</div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      // Script should still initialize
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Accessibility integration', () => {
    it('should maintain focus management on interactive elements', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle.getAttribute('tabindex')).toBe('0');
      expect(toggle.getAttribute('role')).toBe('button');

      const sidebarToggle = document.querySelector('.sidebar-toggle');
      expect(sidebarToggle.getAttribute('aria-expanded')).toBeTruthy();
    });

    it('should update ARIA states dynamically', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;

      window.innerWidth = 1024;
      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.sidebar');

      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(sidebar.classList.contains('open')).toBe(false);
    });
  });
});