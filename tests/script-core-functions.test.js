/**
 * Comprehensive unit tests for core functions in docs/script.js
 * Tests localStorage interaction, data rendering, chart utilities, and navigation
 */

const fs = require('fs');

describe('Core Script.js Functions', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('loadSettings', () => {
    let loadSettings;
    let AppState;

    beforeEach(() => {
      // Reset AppState
      AppState = {
        settings: {
          theme: 'auto',
          backendUrl: '',
          auth0Domain: '',
          auth0ClientId: ''
        }
      };

      // Extract and eval loadSettings
      const STORAGE_KEY = 'nop-settings';
      const funcMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
      }
    });

    test('should load settings from localStorage when available', () => {
      const mockSettings = { theme: 'dark', backendUrl: 'https://api.example.com' };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));

      loadSettings();

      expect(localStorage.getItem).toHaveBeenCalledWith('nop-settings');
      expect(AppState.settings.theme).toBe('dark');
      expect(AppState.settings.backendUrl).toBe('https://api.example.com');
    });

    test('should handle null localStorage gracefully', () => {
      localStorage.getItem.mockReturnValue(null);

      loadSettings();

      expect(AppState.settings.theme).toBe('auto');
    });

    test('should handle invalid JSON gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid-json{');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSettings();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load settings',
        expect.any(Error)
      );
      expect(AppState.settings.theme).toBe('auto');
      
      consoleWarnSpy.mockRestore();
    });

    test('should merge parsed settings into existing AppState.settings', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ theme: 'light' }));
      AppState.settings.backendUrl = '/api/test';

      loadSettings();

      expect(AppState.settings.theme).toBe('light');
      expect(AppState.settings.backendUrl).toBe('/api/test');
    });

    test('should handle localStorage access errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSettings();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    let saveSettings;
    let AppState;

    beforeEach(() => {
      AppState = {
        settings: {
          theme: 'dark',
          backendUrl: 'https://api.test.com',
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'client123'
        }
      };

      const STORAGE_KEY = 'nop-settings';
      const funcMatch = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
      }
    });

    test('should save AppState.settings to localStorage', () => {
      saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'nop-settings',
        JSON.stringify(AppState.settings)
      );
    });

    test('should serialize settings correctly', () => {
      saveSettings();

      const savedData = localStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      
      expect(parsed.theme).toBe('dark');
      expect(parsed.backendUrl).toBe('https://api.test.com');
      expect(parsed.auth0Domain).toBe('test.auth0.com');
    });

    test('should overwrite existing settings', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ theme: 'light' }));
      
      saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'nop-settings',
        expect.stringContaining('"theme":"dark"')
      );
    });
  });

  describe('generateColorPalette', () => {
    let generateColorPalette;

    beforeEach(() => {
      const funcMatch = scriptContent.match(/function generateColorPalette\([^)]*\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
      }
    });

    test('should generate correct number of colors', () => {
      const colors = generateColorPalette(5, 'test');
      expect(colors).toHaveLength(5);
    });

    test('should use services base hue for services seed', () => {
      const colors = generateColorPalette(3, 'services');
      expect(colors[0]).toMatch(/hsl\(180/);
    });

    test('should use default base hue for other seeds', () => {
      const colors = generateColorPalette(3, 'countries');
      expect(colors[0]).toMatch(/hsl\(300/);
    });

    test('should generate colors with proper HSL format', () => {
      const colors = generateColorPalette(10, 'test');
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should generate distinct colors', () => {
      const colors = generateColorPalette(10, 'test');
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(10);
    });

    test('should wrap hue values around 360 degrees', () => {
      const colors = generateColorPalette(20, 'services');
      colors.forEach(color => {
        const hue = parseInt(color.match(/hsl\((\d+)/)[1]);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });

    test('should return empty array for zero count', () => {
      const colors = generateColorPalette(0, 'test');
      expect(colors).toHaveLength(0);
    });

    test('should handle large counts', () => {
      const colors = generateColorPalette(100, 'test');
      expect(colors).toHaveLength(100);
    });
  });

  describe('renderTable', () => {
    let qs, renderTable;

    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <table data-table="test">
          <thead><tr><th>Name</th><th>Count</th></tr></thead>
          <tbody></tbody>
        </table>
      `;

      // Extract functions
      const qsMatch = scriptContent.match(/function qs\([^)]*\) \{[\s\S]*?\n  \}/);
      const renderMatch = scriptContent.match(/function renderTable\([^)]*\) \{[\s\S]*?\n  \}/);
      
      if (qsMatch) eval(qsMatch[0]);
      if (renderMatch) eval(renderMatch[0]);
    });

    test('should populate table with sorted data', () => {
      const data = { 'ServiceA': 100, 'ServiceB': 300, 'ServiceC': 200 };
      
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
      expect(rows[0].textContent).toContain('ServiceB');
      expect(rows[0].textContent).toContain('300');
    });

    test('should format numbers with locale separators', () => {
      const data = { 'Country': 1234567 };
      
      renderTable('[data-table="test"]', data);

      const cell = document.querySelector('tbody td:last-child');
      expect(cell.textContent).toMatch(/1[,\.]234[,\.]567/);
    });

    test('should clear existing table contents', () => {
      document.querySelector('tbody').innerHTML = '<tr><td>Old</td><td>Data</td></tr>';
      
      renderTable('[data-table="test"]', { 'New': 42 });

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain('New');
    });

    test('should handle empty data object', () => {
      renderTable('[data-table="test"]', {});

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(0);
    });

    test('should handle null data gracefully', () => {
      renderTable('[data-table="test"]', null);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toBe('');
    });

    test('should handle undefined data gracefully', () => {
      renderTable('[data-table="test"]', undefined);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toBe('');
    });

    test('should return early if selector not found', () => {
      const result = renderTable('[data-table="nonexistent"]', { 'Test': 100 });

      expect(result).toBeUndefined();
    });

    test('should return early if tbody not found', () => {
      document.body.innerHTML = '<div data-table="test"></div>';
      
      renderTable('[data-table="test"]', { 'Test': 100 });

      expect(document.querySelector('[data-table="test"]').innerHTML).toBe('');
    });

    test('should sort by value descending', () => {
      const data = { 'A': 10, 'B': 50, 'C': 30, 'D': 40, 'E': 20 };
      
      renderTable('[data-table="test"]', data);

      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const values = rows.map(r => parseInt(r.querySelector('td:last-child').textContent.replace(/,/g, '')));
      
      expect(values).toEqual([50, 40, 30, 20, 10]);
    });

    test('should handle zero values', () => {
      const data = { 'Zero': 0, 'Positive': 100 };
      
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
      expect(rows[1].textContent).toContain('0');
    });

    test('should handle negative values', () => {
      const data = { 'Negative': -50, 'Positive': 50 };
      
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows[0].textContent).toContain('50');
      expect(rows[1].textContent).toContain('-50');
    });
  });

  describe('markActiveNav', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;
    });

    test('should add active class to matching nav link', () => {
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/dashboard.html' };

      const funcMatch = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
      
      markActiveNav();

      const dashboardLink = document.querySelector('a[href="dashboard.html"]');
      expect(dashboardLink.classList.contains('active')).toBe(true);
    });

    test('should handle root path as index.html', () => {
      delete window.location;
      window.location = { pathname: '/' };

      const funcMatch = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
      
      markActiveNav();

      const homeLink = document.querySelector('a[href="index.html"]');
      expect(homeLink.classList.contains('active')).toBe(true);
    });

    test('should handle paths with directories', () => {
      delete window.location;
      window.location = { pathname: '/docs/api.html' };

      const funcMatch = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
      
      markActiveNav();

      const apiLink = document.querySelector('a[href="api.html"]');
      expect(apiLink.classList.contains('active')).toBe(true);
    });

    test('should not add active class to non-matching links', () => {
      delete window.location;
      window.location = { pathname: '/dashboard.html' };

      const funcMatch = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
      
      markActiveNav();

      const homeLink = document.querySelector('a[href="index.html"]');
      const apiLink = document.querySelector('a[href="api.html"]');
      
      expect(homeLink.classList.contains('active')).toBe(false);
      expect(apiLink.classList.contains('active')).toBe(false);
    });
  });

  describe('qs utility function', () => {
    let qs;

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="test">Test</div>
        <div class="container"></div>
        <div data-role="widget"></div>
      `;

      const funcMatch = scriptContent.match(/function qs\([^)]*\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should select element by ID', () => {
      const el = qs('#test');
      expect(el).not.toBeNull();
      expect(el.textContent).toBe('Test');
    });

    test('should select element by class', () => {
      const el = qs('.container');
      expect(el).not.toBeNull();
    });

    test('should select element by attribute', () => {
      const el = qs('[data-role="widget"]');
      expect(el).not.toBeNull();
    });

    test('should return null for non-existent selector', () => {
      const el = qs('#nonexistent');
      expect(el).toBeNull();
    });

    test('should return first matching element when multiple exist', () => {
      document.body.innerHTML = '<div class="item">First</div><div class="item">Second</div>';
      
      const el = qs('.item');
      expect(el.textContent).toBe('First');
    });
  });
});