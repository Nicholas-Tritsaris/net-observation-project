/**
 * Comprehensive tests for core utility functions in docs/script.js
 * Tests loadSettings, saveSettings, applyTheme, qs, renderTable, generateColorPalette
 */

const fs = require('fs');

describe('Core Script.js Functions', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('loadSettings', () => {
    let loadSettings, AppState, STORAGE_KEY;

    beforeEach(() => {
      // Set up minimal AppState mock
      AppState = {
        settings: {
          theme: 'auto',
          backendUrl: '',
          auth0Domain: '',
          auth0ClientId: ''
        }
      };
      STORAGE_KEY = 'net-obs-settings';

      // Extract and eval the function
      const funcMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`loadSettings = function() { ${funcMatch[0].replace('function loadSettings()', '')} }`);
      }
    });

    test('should load and merge settings from localStorage', () => {
      const storedSettings = { theme: 'dark', backendUrl: 'https://api.example.com' };
      localStorage.getItem.mockReturnValue(JSON.stringify(storedSettings));

      loadSettings();

      expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(AppState.settings.theme).toBe('dark');
      expect(AppState.settings.backendUrl).toBe('https://api.example.com');
    });

    test('should preserve unmerged settings properties', () => {
      const storedSettings = { theme: 'light' };
      localStorage.getItem.mockReturnValue(JSON.stringify(storedSettings));

      loadSettings();

      expect(AppState.settings.theme).toBe('light');
      expect(AppState.settings.auth0Domain).toBe('');
    });

    test('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      const originalSettings = { ...AppState.settings };

      loadSettings();

      expect(AppState.settings).toEqual(originalSettings);
    });

    test('should handle invalid JSON gracefully', () => {
      localStorage.getItem.mockReturnValue('{ invalid json }');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSettings();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    test('should handle localStorage access errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSettings();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    test('should handle empty string from localStorage', () => {
      localStorage.getItem.mockReturnValue('');
      const originalSettings = { ...AppState.settings };

      loadSettings();

      expect(AppState.settings).toEqual(originalSettings);
    });
  });

  describe('saveSettings', () => {
    let saveSettings, AppState, STORAGE_KEY;

    beforeEach(() => {
      AppState = {
        settings: {
          theme: 'dark',
          backendUrl: 'https://api.test.com',
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'client123'
        }
      };
      STORAGE_KEY = 'net-obs-settings';

      const funcMatch = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`saveSettings = function() { ${funcMatch[0].replace('function saveSettings()', '')} }`);
      }
    });

    test('should save settings to localStorage as JSON', () => {
      saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(AppState.settings)
      );
    });

    test('should handle complex settings objects', () => {
      AppState.settings.customData = { nested: { value: 42 } };

      saveSettings();

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData.customData.nested.value).toBe(42);
    });

    test('should overwrite previous settings', () => {
      saveSettings();
      AppState.settings.theme = 'light';
      saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
      const lastCall = localStorage.setItem.mock.calls[1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData.theme).toBe('light');
    });
  });

  describe('applyTheme', () => {
    let applyTheme, AppState, prefersDark;

    beforeEach(() => {
      AppState = { settings: { theme: 'auto' } };
      prefersDark = { matches: true };

      // Mock window.matchMedia if needed
      window.matchMedia = jest.fn().mockReturnValue(prefersDark);

      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`applyTheme = function() { ${funcMatch[0].replace('function applyTheme()', '')} }`);
      }
    });

    test('should apply dark theme when auto and prefers dark', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = true;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when auto and prefers light', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = false;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should apply explicit dark theme', () => {
      AppState.settings.theme = 'dark';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply explicit light theme', () => {
      AppState.settings.theme = 'light';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should set both documentElement and body attributes', () => {
      AppState.settings.theme = 'dark';

      applyTheme();

      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
      expect(document.body.dataset.theme).toBeDefined();
    });
  });

  describe('qs utility function', () => {
    let qs;

    beforeEach(() => {
      const funcMatch = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`qs = function(id) { ${funcMatch[0].replace('function qs(id)', '')} }`);
      }
    });

    test('should return element for valid selector', () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      
      const element = qs('#test');
      
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Content');
    });

    test('should return null for non-existent selector', () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      
      const element = qs('#nonexistent');
      
      expect(element).toBeNull();
    });

    test('should work with class selectors', () => {
      document.body.innerHTML = '<div class="my-class">Test</div>';
      
      const element = qs('.my-class');
      
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Test');
    });

    test('should work with attribute selectors', () => {
      document.body.innerHTML = '<button data-action="login">Login</button>';
      
      const element = qs('[data-action="login"]');
      
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Login');
    });

    test('should return first element when multiple match', () => {
      document.body.innerHTML = '<p class="text">First</p><p class="text">Second</p>';
      
      const element = qs('.text');
      
      expect(element.textContent).toBe('First');
    });
  });

  describe('renderTable', () => {
    let renderTable, qs;

    beforeEach(() => {
      // Set up qs function
      qs = (selector) => document.querySelector(selector);

      const funcMatch = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`renderTable = function(selector, objectData) { ${funcMatch[0].replace('function renderTable(selector, objectData)', '')} }`);
      }
    });

    test('should populate table with sorted data', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { USA: 1000, UK: 500, Canada: 750 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
      expect(rows[0].textContent).toContain('USA');
      expect(rows[0].textContent).toContain('1,000');
      expect(rows[1].textContent).toContain('Canada');
      expect(rows[2].textContent).toContain('UK');
    });

    test('should format numbers with locale separators', () => {
      document.body.innerHTML = `
        <table data-table="services">
          <tbody></tbody>
        </table>
      `;

      const data = { HTTP: 1234567 };
      renderTable('[data-table="services"]', data);

      const cell = document.querySelector('tbody td:last-child');
      expect(cell.textContent).toBe('1,234,567');
    });

    test('should clear existing table content', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody>
            <tr><td>Old</td><td>Data</td></tr>
          </tbody>
        </table>
      `;

      const data = { New: 100 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('New');
    });

    test('should handle empty object', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      renderTable('[data-table="test"]', {});

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(0);
    });

    test('should handle null data gracefully', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      renderTable('[data-table="test"]', null);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toBe('');
    });

    test('should handle undefined data gracefully', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      renderTable('[data-table="test"]', undefined);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toBe('');
    });

    test('should return early if container not found', () => {
      document.body.innerHTML = '<div></div>';

      expect(() => {
        renderTable('[data-table="nonexistent"]', { test: 1 });
      }).not.toThrow();
    });

    test('should return early if tbody not found', () => {
      document.body.innerHTML = '<div data-table="test"></div>';

      expect(() => {
        renderTable('[data-table="test"]', { test: 1 });
      }).not.toThrow();
    });

    test('should handle zero values', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { None: 0, Some: 100 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
      expect(rows[1].textContent).toContain('0');
    });

    test('should handle negative values', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { Negative: -50, Positive: 100 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows[0].textContent).toContain('Positive');
      expect(rows[1].textContent).toContain('-50');
    });
  });

  describe('generateColorPalette', () => {
    let generateColorPalette;

    beforeEach(() => {
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(`generateColorPalette = function(count, seed) { ${funcMatch[0].replace('function generateColorPalette(count, seed)', '')} }`);
      }
    });

    test('should generate correct number of colors', () => {
      const colors = generateColorPalette(5, 'test');
      
      expect(colors).toHaveLength(5);
    });

    test('should generate valid HSL color strings', () => {
      const colors = generateColorPalette(3, 'test');
      
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should use different base hue for services seed', () => {
      const servicesColors = generateColorPalette(2, 'services');
      const otherColors = generateColorPalette(2, 'other');
      
      // Extract hue from first color
      const servicesHue = parseInt(servicesColors[0].match(/\d+/)[0]);
      const otherHue = parseInt(otherColors[0].match(/\d+/)[0]);
      
      expect(servicesHue).not.toBe(otherHue);
    });

    test('should generate distinct colors with 27 degree spacing', () => {
      const colors = generateColorPalette(3, 'test');
      
      const hues = colors.map(c => parseInt(c.match(/\d+/)[0]));
      
      // Check spacing (accounting for modulo 360)
      expect((hues[1] - hues[0] + 360) % 360).toBe(27);
      expect((hues[2] - hues[1] + 360) % 360).toBe(27);
    });

    test('should handle zero count', () => {
      const colors = generateColorPalette(0, 'test');
      
      expect(colors).toHaveLength(0);
    });

    test('should handle large count', () => {
      const colors = generateColorPalette(100, 'test');
      
      expect(colors).toHaveLength(100);
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should wrap hue values around 360', () => {
      const colors = generateColorPalette(20, 'test');
      
      const hues = colors.map(c => parseInt(c.match(/\d+/)[0]));
      hues.forEach(hue => {
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });

    test('should maintain consistent alpha value', () => {
      const colors = generateColorPalette(5, 'test');
      
      colors.forEach(color => {
        expect(color).toContain('/ 0.7');
      });
    });

    test('should maintain consistent saturation and lightness', () => {
      const colors = generateColorPalette(5, 'test');
      
      colors.forEach(color => {
        expect(color).toContain('80% 55%');
      });
    });
  });
});