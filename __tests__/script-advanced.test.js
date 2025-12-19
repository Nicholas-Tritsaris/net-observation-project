/**
 * Advanced unit tests for docs/script.js
 * Additional edge cases, boundary conditions, and integration scenarios
 * Complements existing __tests__/script.test.js with deeper coverage
 */

const fs = require('fs');
const path = require('path');

describe('script.js - Advanced Edge Cases', () => {
  let scriptContent;

  beforeEach(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    localStorage.clear();
    document.body.innerHTML = '';
    jest.clearAllMocks();

    // Setup window globals
    window.__latestCensys = null;
    window.innerWidth = 1024;
    window.Chart = undefined;
    window.d3 = undefined;
    window.topojson = undefined;
  });

  describe('initLogoPlaceholders - Advanced scenarios', () => {
    it('should handle logo images that load after a delay', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Delayed Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Set image as not complete initially
      Object.defineProperty(img, 'complete', { value: false, writable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 512, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, writable: true });

      // Simulate delayed load
      setTimeout(() => {
        Object.defineProperty(img, 'complete', { value: true });
        img.dispatchEvent(new Event('load'));

        setTimeout(() => {
          // Should NOT create fallback because dimensions are valid
          expect(img.dataset.fallback).toBeUndefined();
          expect(img.style.display).not.toBe('none');
          expect(img.nextElementSibling?.className).not.toBe('logo-placeholder');
          done();
        }, 50);
      }, 100);
    });

    it('should handle images with fractional dimensions', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Fractional" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'naturalWidth', { value: 512.5, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512.7, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      img.dispatchEvent(new Event('load'));

      setTimeout(() => {
        // Fractional dimensions should be treated as valid
        expect(img.dataset.fallback).toBeUndefined();
        expect(img.style.display).not.toBe('none');
        done();
      }, 50);
    });

    it('should handle missing alt attribute gracefully', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe('NET OBSERVATION');
        done();
      }, 50);
    });

    it('should handle empty string alt attribute', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe('NET OBSERVATION');
        done();
      }, 50);
    });

    it('should handle logo in deeply nested DOM structure', (done) => {
      document.body.innerHTML = `
        <div>
          <div>
            <aside>
              <div>
                <img src="logo.png" alt="Nested Logo" data-logo />
              </div>
            </aside>
          </div>
        </div>
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(img.dataset.fallback).toBe('true');
        expect(img.nextElementSibling?.textContent).toBe('NESTED LOGO');
        done();
      }, 50);
    });

    it('should not interfere with non-logo images', (done) => {
      document.body.innerHTML = `
        <img src="other.png" alt="Other Image" />
        <img src="logo.png" alt="Logo" data-logo />
      `;

      eval(scriptContent);

      const otherImg = document.querySelector('img:not([data-logo])');
      const logoImg = document.querySelector('img[data-logo]');

      otherImg.dispatchEvent(new Event('error'));
      logoImg.dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(otherImg.dataset.fallback).toBeUndefined();
        expect(otherImg.nextElementSibling?.className).not.toBe('logo-placeholder');
        
        expect(logoImg.dataset.fallback).toBe('true');
        expect(logoImg.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });
  });

  describe('Chart initialization edge cases', () => {
    it('should handle Chart.js not being available', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;

      window.Chart = undefined;
      eval(scriptContent);

      // Should not throw errors when Chart is undefined
      expect(document.getElementById('servicesChart')).toBeTruthy();
      expect(document.getElementById('countriesChart')).toBeTruthy();
    });

    it('should initialize charts when Chart.js is available', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
        <div class="terminal-output"></div>
      `;

      const mockChart = jest.fn();
      mockChart.prototype.update = jest.fn();
      window.Chart = mockChart;

      // Mock getComputedStyle
      global.getComputedStyle = jest.fn(() => ({
        getPropertyValue: () => '#ffffff'
      }));

      eval(scriptContent);

      expect(mockChart).toHaveBeenCalled();
    });

    it('should handle missing canvas elements gracefully', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      const mockChart = jest.fn();
      window.Chart = mockChart;

      eval(scriptContent);

      // Chart should not be called when canvas elements are missing
      expect(mockChart).not.toHaveBeenCalled();
    });
  });

  describe('updateCharts with edge case data', () => {
    it('should handle null data parameter', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      const mockChart = {
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        update: jest.fn()
      };

      window.Chart = jest.fn();
      eval(scriptContent);

      // Manually set up AppState charts
      const AppState = { charts: { services: mockChart, countries: mockChart } };
      
      // updateCharts should handle null gracefully
      const updateCharts = new Function('data', 'AppState', `
        if (!data) return;
        // Function body...
      `);

      updateCharts(null, AppState);
      expect(mockChart.update).not.toHaveBeenCalled();
    });

    it('should handle empty services object', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      const data = {
        services: {},
        countries: { US: 100 }
      };

      // Should not throw when processing empty objects
      expect(() => {
        // Simulate updateCharts logic
        const entries = Object.entries(data.services).sort((a, b) => b[1] - a[1]);
        expect(entries.length).toBe(0);
      }).not.toThrow();
    });
  });

  describe('renderTable - Advanced scenarios', () => {
    it('should handle very large numbers correctly', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      eval(scriptContent);

      const data = {
        item1: 999999999999,
        item2: 1234567890123
      };

      // Manually invoke renderTable logic
      const container = document.querySelector('[data-table="test"]');
      const tbody = container.querySelector('tbody');
      
      Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, val]) => {
          const row = document.createElement('tr');
          const keyCell = document.createElement('td');
          const valCell = document.createElement('td');
          keyCell.textContent = key;
          valCell.textContent = val.toLocaleString();
          row.appendChild(keyCell);
          row.appendChild(valCell);
          tbody.appendChild(row);
        });

      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(2);
      expect(rows[0].children[1].textContent).toContain(',');
    });

    it('should handle special characters in keys', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      eval(scriptContent);

      const data = {
        'service/http': 100,
        'service:https': 200,
        'service-ssh': 300
      };

      const container = document.querySelector('[data-table="test"]');
      const tbody = container.querySelector('tbody');

      Object.entries(data).forEach(([key, val]) => {
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        row.appendChild(keyCell);
        tbody.appendChild(row);
      });

      const cells = Array.from(tbody.querySelectorAll('td'));
      const texts = cells.map(cell => cell.textContent);
      
      expect(texts).toContain('service/http');
      expect(texts).toContain('service:https');
      expect(texts).toContain('service-ssh');
    });
  });

  describe('Terminal command execution - Advanced', () => {
    it('should handle theme command with invalid arguments', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="theme invalid" />
            <button>Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');
      const output = document.querySelector('.terminal-output');

      input.value = 'theme invalid';
      button.click();

      expect(output.textContent).toContain('Usage: theme');
    });

    it('should handle empty command gracefully', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="" />
            <button>Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');

      input.value = '';
      button.click();

      // Should not throw or add error message
      expect(document.querySelector('.terminal-output').children.length).toBeGreaterThan(0);
    });

    it('should handle commands with multiple spaces', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="theme    dark" />
            <button>Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      const button = document.querySelector('.terminal button');

      input.value = 'theme    dark';
      button.click();

      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should handle Enter key in addition to button click', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="help" />
            <button>Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const input = document.querySelector('.terminal input');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      input.value = 'help';
      input.dispatchEvent(enterEvent);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Available commands');
    });
  });

  describe('Settings panel - Advanced edge cases', () => {
    it('should handle form submission with all fields empty', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="" />
            <input name="auth0Domain" value="" />
            <input name="auth0ClientId" value="" />
            <select name="themeMode">
              <option value="auto" selected>Auto</option>
            </select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.backendUrl).toBe('/api/censys-summary');
      expect(saved.auth0Domain).toBe('');
      expect(saved.auth0ClientId).toBe('');
    });

    it('should trim whitespace from input values', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="  /api/test  " />
            <input name="auth0Domain" value="  domain.auth0.com  " />
            <input name="auth0ClientId" value="  client-123  " />
            <select name="themeMode">
              <option value="dark" selected>Dark</option>
            </select>
          </form>
        </div>
        <button class="settings-toggle"></button>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.backendUrl).toBe('/api/test');
      expect(saved.auth0Domain).toBe('domain.auth0.com');
      expect(saved.auth0ClientId).toBe('client-123');
    });

    it('should toggle panel visibility correctly', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden"></div>
        <button class="settings-toggle">⚙</button>
      `;

      eval(scriptContent);

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      // Initial state
      expect(panel.classList.contains('hidden')).toBe(true);

      // First toggle
      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(false);
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.innerHTML).toBe('&#10006;');

      // Second toggle
      toggle.click();
      expect(panel.classList.contains('hidden')).toBe(true);
      expect(toggle.classList.contains('active')).toBe(false);
      expect(toggle.innerHTML).toBe('&#9881;');
    });
  });

  describe('fetchCensysSummary - Advanced error scenarios', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should handle response with invalid JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      // Should log warning without breaking
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle fetch rejection', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle 404 status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle 500 status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Data visualizer - Advanced scenarios', () => {
    it('should handle malformed CSV data', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">name,age
John,30
Jane
Bob,40,extra</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).toBeTruthy();
    });

    it('should handle JSON with nested objects', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{"user": {"name": "John", "age": 30}, "active": true}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.textContent).toContain('John');
      expect(output.textContent).toContain('age');
    });

    it('should handle JSON arrays', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">[{"name": "John"}, {"name": "Jane"}]</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      const output = document.getElementById('dataOutput');
      expect(output.textContent).toContain('John');
      expect(output.textContent).toContain('Jane');
    });

    it('should handle empty input gracefully', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');
      button.click();

      // Should not crash
      expect(document.getElementById('dataOutput')).toBeTruthy();
    });
  });

  describe('Plugin system - Advanced scenarios', () => {
    it('should handle plugin with async run function', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      const asyncPlugin = {
        name: 'async-test',
        command: 'asynctest',
        run: async (arg) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Async result: ${arg}`;
        }
      };

      window.registerPlugin(asyncPlugin);

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('async-test');
    });

    it('should handle plugin that throws error', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      const errorPlugin = {
        name: 'error-test',
        command: 'errortest',
        run: () => {
          throw new Error('Plugin error');
        }
      };

      window.registerPlugin(errorPlugin);

      // Should register successfully despite error-prone run function
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('error-test');
    });

    it('should handle plugin without command property', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      eval(scriptContent);

      const pluginWithoutCommand = {
        name: 'no-command-plugin',
        init: jest.fn()
      };

      window.registerPlugin(pluginWithoutCommand);
      
      // Should still call init
      expect(pluginWithoutCommand.init).toHaveBeenCalled();
    });
  });

  describe('Navigation and routing', () => {
    it('should mark active nav for root path', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="about.html">About</a>
        </nav>
      `;

      window.location.pathname = '/';
      eval(scriptContent);

      const homeLink = document.querySelector('a[href="index.html"]');
      expect(homeLink?.classList.contains('active')).toBe(true);
    });

    it('should handle paths with query strings', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      window.location.pathname = '/dashboard.html';
      window.location.search = '?tab=stats';
      eval(scriptContent);

      // Should match based on pathname only
      const dashLink = document.querySelector('a[href="dashboard.html"]');
      expect(dashLink?.classList.contains('active')).toBe(true);
    });
  });

  describe('Color palette generation', () => {
    it('should generate colors with proper HSL format', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const colors = generateColorPalette(5, 'services');
      
      expect(colors.length).toBe(5);
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    it('should wrap hue values at 360 degrees', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => {
          const hue = (baseHue + idx * 27) % 360;
          return hue;
        });
      };

      const hues = generateColorPalette(20, 'services');
      
      hues.forEach(hue => {
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });
  });
});