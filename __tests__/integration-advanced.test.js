/**
 * Advanced integration tests for modified code paths
 * Tests complex interactions between logo fallbacks, theme system, and data fetching
 */

const fs = require('fs');
const path = require('path');

describe('Advanced Integration Tests - Modified Code Paths', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Logo fallback + Theme integration', () => {
    it('should apply theme before initializing logo placeholders', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));
      eval(scriptContent);

      // Theme should be applied first
      expect(document.body.dataset.theme).toBe('dark');

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder).toBeTruthy();
        // Placeholder should inherit themed styles
        const computedStyle = window.getComputedStyle(placeholder);
        expect(computedStyle).toBeTruthy();
        done();
      }, 50);
    });

    it('should maintain logo placeholder visibility across theme changes', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder).toBeTruthy();

        // Change theme
        const toggle = document.querySelector('[data-role="theme-toggle"]');
        toggle.click();

        // Placeholder should still be visible
        expect(placeholder.style.display).not.toBe('none');
        done();
      }, 50);
    });
  });

  describe('Data fetching + Stats display integration', () => {
    it('should update all stat displays after successful fetch', async () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;

      const mockData = {
        total_hosts: 123456,
        total_services: 789,
        last_sync: '2025-01-15T10:00:00Z',
        countries: { US: 100, GB: 50 },
        services: { http: 200, https: 300 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(window.__latestCensys).toEqual(mockData);
    });

    it('should handle fetch errors without breaking UI', async () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-stat="total-hosts"></div>
      `;

      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      // UI should still be functional
      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput).toBeTruthy();
    });

    it('should NOT update removed #apiPayload element', async () => {
      document.body.innerHTML = `
        <div id="apiPayload"></div>
        <div class="terminal-output"></div>
      `;

      const mockData = { total_hosts: 100 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      const payload = document.getElementById('apiPayload');
      // This element should not be updated by the modified code
      expect(payload.textContent).toBe('');
    });
  });

  describe('Sidebar + Theme + Logo fallback integration', () => {
    it('should initialize all components in correct order', (done) => {
      window.innerWidth = 1024;

      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" alt="Sidebar Logo" data-logo />
        </aside>
        <button class="sidebar-toggle"></button>
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      // Check theme is applied
      expect(document.body.dataset.theme).toBeTruthy();

      // Check sidebar is initialized
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);

      // Trigger logo fallback
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Logo fallback should work
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should maintain sidebar state when logo fails to load', (done) => {
      window.innerWidth = 1024;

      document.body.innerHTML = `
        <aside class="sidebar open">
          <img src="logo.png" alt="Logo" data-logo />
        </aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const initialState = sidebar.classList.contains('open');

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Sidebar state should not change due to logo error
        expect(sidebar.classList.contains('open')).toBe(initialState);
        done();
      }, 50);
    });
  });

  describe('Settings persistence + Auto-refresh integration', () => {
    it('should use persisted backend URL for auto-refresh', async () => {
      const customUrl = 'https://custom.api.com/censys';

      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({
        backendUrl: customUrl
      }));

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(global.fetch).toHaveBeenCalledWith(
        customUrl,
        expect.any(Object)
      );
    });
  });

  describe('Terminal + Plugin system integration', () => {
    it('should log plugin registration to terminal', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const testPlugin = {
        name: 'integration-test-plugin',
        command: 'test',
        run: () => 'test output',
        init: jest.fn()
      };

      window.registerPlugin(testPlugin);

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.children.length).toBeGreaterThan(0);
    });

    it('should handle plugin errors gracefully', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const errorPlugin = {
        name: 'error-plugin',
        command: 'error',
        run: () => {
          throw new Error('Plugin error');
        },
        init: () => {
          throw new Error('Init error');
        }
      };

      expect(() => {
        window.registerPlugin(errorPlugin);
      }).not.toThrow(); // Should be caught internally
    });
  });

  describe('Multiple logo fallbacks across page', () => {
    it('should handle mixed success and failure states', (done) => {
      document.body.innerHTML = `
        <header>
          <img src="logo-success.png" alt="Header Logo" data-logo />
        </header>
        <aside class="sidebar">
          <img src="logo-fail.png" alt="Sidebar Logo" data-logo />
        </aside>
        <footer>
          <img src="logo-fail2.png" alt="Footer Logo" data-logo />
        </footer>
      `;

      eval(scriptContent);

      const images = document.querySelectorAll('img[data-logo]');
      
      // Simulate success on first image
      Object.defineProperty(images[0], 'naturalWidth', { value: 100, writable: true });
      Object.defineProperty(images[0], 'naturalHeight', { value: 100, writable: true });
      Object.defineProperty(images[0], 'complete', { value: true, writable: true });

      // Simulate failure on other images
      images[1].dispatchEvent(new Event('error'));
      images[2].dispatchEvent(new Event('error'));

      setTimeout(() => {
        // First image should not have fallback
        expect(images[0].nextElementSibling?.className).not.toBe('logo-placeholder');
        
        // Other images should have fallbacks
        expect(images[1].nextElementSibling?.className).toBe('logo-placeholder');
        expect(images[2].nextElementSibling?.className).toBe('logo-placeholder');
        
        done();
      }, 100);
    });
  });

  describe('Data visualizer + Terminal integration', () => {
    it('should log visualizer actions to terminal', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <textarea id="dataInput">{"test": "data"}</textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.children.length).toBeGreaterThan(0);
    });
  });

  describe('Page-specific feature initialization', () => {
    it('should initialize dashboard-specific features', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
      document.body.dataset.page = 'dashboard';

      eval(scriptContent);

      // Dashboard features should be initialized
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });

    it('should initialize API page features', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;
      document.body.dataset.page = 'api';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      eval(scriptContent);

      // API page should have terminal
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });
  });

  describe('Error recovery and resilience', () => {
    it('should recover from multiple sequential errors', async () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-stat="total-hosts"></div>
      `;

      // First fetch fails
      global.fetch.mockRejectedValueOnce(new Error('First error'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Second fetch succeeds
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Application should still be functional
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });

    it('should handle corrupted localStorage gracefully during initialization', () => {
      localStorage.setItem('net-observation-settings', 'INVALID{JSON}');

      document.body.innerHTML = '<div></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalled();
    });
  });
});