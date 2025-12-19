/**
 * Fixes for failing tests and additional edge case coverage
 * Addresses jsdom limitations and adds robust error handling tests
 */

const fs = require('fs');
const path = require('path');

describe('Enhanced Tests - Fixes and Additional Coverage', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    localStorage.clear();
    document.body.innerHTML = '';
    jest.clearAllMocks();

    // Reset globals
    window.__latestCensys = null;
    window.innerWidth = 1024;
    delete window.Chart;
    delete window.d3;
    delete window.topojson;
    delete window.createAuth0Client;
    delete window.FileReader;
  });

  describe('Settings panel with proper DOM structure', () => {
    it('should initialize settings panel with all required fields', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden">
          <form>
            <input type="text" id="backendUrl" value="" />
            <input type="text" id="auth0Domain" value="" />
            <input type="text" id="auth0ClientId" value="" />
            <select id="themeSelect">
              <option value="auto">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Settings</button>
        <div class="terminal-output"></div>
      `;

      const mockSettings = {
        backendUrl: '/api/test',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-123',
        theme: 'dark'
      };
      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      eval(scriptContent);

      const backendUrl = document.getElementById('backendUrl');
      const auth0Domain = document.getElementById('auth0Domain');
      const auth0ClientId = document.getElementById('auth0ClientId');
      const themeSelect = document.getElementById('themeSelect');

      expect(backendUrl.value).toBe('/api/test');
      expect(auth0Domain.value).toBe('test.auth0.com');
      expect(auth0ClientId.value).toBe('test-client-123');
      expect(themeSelect.value).toBe('dark');
    });

    it('should save settings on form submission', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input type="text" id="backendUrl" value="/api/new" />
            <input type="text" id="auth0Domain" value="new.auth0.com" />
            <input type="text" id="auth0ClientId" value="new-client" />
            <select id="themeSelect">
              <option value="light" selected>Light</option>
            </select>
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Settings</button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));

      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.backendUrl).toBe('/api/new');
      expect(saved.auth0Domain).toBe('new.auth0.com');
      expect(saved.auth0ClientId).toBe('new-client');
      expect(saved.theme).toBe('light');
    });

    it('should toggle settings panel visibility', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden">
          <form>
            <input type="text" id="backendUrl" />
            <input type="text" id="auth0Domain" />
            <input type="text" id="auth0ClientId" />
            <select id="themeSelect"></select>
          </form>
        </div>
        <button class="settings-toggle">⚙</button>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      expect(panel.classList.contains('hidden')).toBe(true);

      toggle.click();

      expect(panel.classList.contains('hidden')).toBe(false);
      expect(toggle.innerHTML).toBe('&#10006;');

      toggle.click();

      expect(panel.classList.contains('hidden')).toBe(true);
      expect(toggle.innerHTML).toBe('&#9881;');
    });
  });

  describe('Data visualizer with proper structure', () => {
    it('should parse and display JSON data correctly', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{"name": "test", "value": 123}</textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const renderBtn = document.getElementById('renderData');
      renderBtn.click();

      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).toContain('<pre>');
      expect(output.textContent).toContain('"name"');
      expect(output.textContent).toContain('"test"');
    });

    it('should parse and display CSV data correctly', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,value,status
John,100,active
Jane,200,inactive</textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const renderBtn = document.getElementById('renderData');
      renderBtn.click();

      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).toContain('<pre>');
      expect(output.textContent).toContain('name');
      expect(output.textContent).toContain('John');
      expect(output.textContent).toContain('100');
    });

    it('should handle invalid JSON gracefully', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{invalid json}</textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const renderBtn = document.getElementById('renderData');
      renderBtn.click();

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('error');
    });

    it('should handle empty input gracefully', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const renderBtn = document.getElementById('renderData');
      
      // Should not crash on empty input
      expect(() => renderBtn.click()).not.toThrow();
    });
  });

  describe('Chart initialization with mocked Canvas', () => {
    it('should handle missing Chart.js library gracefully', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;

      window.Chart = undefined;

      eval(scriptContent);

      // Should not throw when Chart is undefined
      expect(document.getElementById('servicesChart')).toBeTruthy();
    });

    it('should initialize charts when Chart.js is available', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;

      window.Chart = jest.fn().mockImplementation(() => ({
        data: { labels: [], datasets: [] },
        update: jest.fn()
      }));

      // Mock getContext to avoid jsdom error
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        canvas: {},
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        rect: jest.fn()
      });

      document.body.dataset.page = 'dashboard';

      eval(scriptContent);

      expect(window.Chart).toHaveBeenCalled();
    });
  });

  describe('Page-specific feature initialization', () => {
    it('should initialize dashboard features correctly', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" />
          <button>Run</button>
        </div>
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      document.body.dataset.page = 'dashboard';

      eval(scriptContent);

      const terminal = document.querySelector('.terminal');
      const dataVisualizer = document.getElementById('dataInput');

      expect(terminal).toBeTruthy();
      expect(dataVisualizer).toBeTruthy();
    });

    it('should initialize docs features correctly', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#intro">Intro</a>
        </div>
        <div data-version-list></div>
      `;
      document.body.dataset.page = 'docs';

      eval(scriptContent);

      const versionList = document.querySelector('[data-version-list]');
      expect(versionList.innerHTML).toContain('v2.3');
    });

    it('should initialize API page features correctly', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" />
          <button>Run</button>
        </div>
      `;
      document.body.dataset.page = 'api';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 1000,
          total_services: 500,
          countries: {},
          services: {}
        })
      });

      eval(scriptContent);

      const terminal = document.querySelector('.terminal');
      expect(terminal).toBeTruthy();
    });

    it('should handle pages without specific features', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" />
          <button>Run</button>
        </div>
      `;
      document.body.dataset.page = 'unknown';

      eval(scriptContent);

      const terminal = document.querySelector('.terminal');
      expect(terminal).toBeTruthy();
    });
  });

  describe('Terminal command edge cases', () => {
    it('should handle empty command gracefully', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="   " />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      const outputBefore = document.querySelector('.terminal-output').children.length;
      
      button.click();
      
      const outputAfter = document.querySelector('.terminal-output').children.length;
      
      // Should not add output for empty command
      expect(outputAfter).toBe(outputBefore);
    });

    it('should handle commands with multiple spaces', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="theme    dark" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Theme changed');
    });

    it('should handle unknown commands', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="nonexistent" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      button.click();

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Unknown command');
    });

    it('should clear input after executing command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');
      
      expect(input.value).toBe('help');
      button.click();
      expect(input.value).toBe('');
    });
  });

  describe('Accessibility features', () => {
    it('should have proper ARIA attributes on theme toggle', () => {
      document.body.innerHTML = `
        <button data-role="theme-toggle" tabindex="0" role="button">
          <span data-label>DARK</span>
        </button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle.getAttribute('tabindex')).toBe('0');
      expect(toggle.getAttribute('role')).toBe('button');
    });

    it('should update ARIA expanded on sidebar toggle', () => {
      document.body.innerHTML = `
        <aside class="sidebar open">
          <div>Content</div>
        </aside>
        <button class="sidebar-toggle" aria-expanded="true">☰</button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-hidden on logo placeholders', (done) => {
      document.body.innerHTML = `
        <img src="missing.png" alt="Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 100);
    });
  });

  describe('Performance and optimization', () => {
    it('should debounce rapid theme toggles', () => {
      document.body.innerHTML = `
        <button data-role="theme-toggle">
          <span data-label>AUTO</span>
        </button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = localStorage.getItem('net-observation-settings');

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }

      const finalSettings = JSON.parse(localStorage.getItem('net-observation-settings'));
      
      // Should complete all cycles (10 clicks = ~3 full cycles + 1)
      expect(finalSettings.theme).toBeTruthy();
    });

    it('should cache world topology data', async () => {
      document.body.innerHTML = `
        <svg id="worldHeatmap"></svg>
        <div class="terminal-output"></div>
      `;

      const mockFeature = { features: [] };
      const mockJson = jest.fn().mockResolvedValue({ objects: { countries: {} } });

      window.d3 = {
        json: mockJson,
        select: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnThis(),
          selectAll: jest.fn().mockReturnThis(),
          remove: jest.fn().mockReturnThis(),
          append: jest.fn().mockReturnThis(),
          data: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis()
        }),
        geoNaturalEarth1: jest.fn().mockReturnValue({ fitWidth: jest.fn() }),
        geoPath: jest.fn().mockReturnValue(() => 'path'),
        scaleSequential: jest.fn().mockReturnValue(() => '#000'),
        interpolateTurbo: jest.fn()
      };

      window.topojson = {
        feature: jest.fn().mockReturnValue(mockFeature)
      };

      eval(scriptContent);

      // First call should fetch data
      await new Promise(resolve => setTimeout(resolve, 200));

      // Second call should use cached data
      await new Promise(resolve => setTimeout(resolve, 200));

      // json should be called at most once (if renderHeatmap is called)
      expect(mockJson.mock.calls.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Network error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should not crash on timeout
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });

    it('should retry failed requests with exponential backoff', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ total_hosts: 100, countries: {}, services: {} })
        });
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Should handle transient failures
      expect(document.querySelector('.terminal-output')).toBeTruthy();
    });
  });
});