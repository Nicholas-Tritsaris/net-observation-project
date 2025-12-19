/**
 * Comprehensive unit tests for core functions in docs/script.js
 * Tests settings management, theme handling, data processing, and utility functions
 */

const fs = require('fs');

describe('Core Script Functions', () => {
  let scriptContent;
  let loadSettings, saveSettings, applyTheme, qs;
  let updateStatsView, renderTable, generateColorPalette;
  let markActiveNav;
  const STORAGE_KEY = 'nop-settings';
  
  // Mock AppState
  let AppState;
  let prefersDark;

  beforeEach(() => {
    // Read and evaluate script.js functions
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Initialize AppState
    AppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    // Mock prefersDark
    prefersDark = {
      matches: true,
      addEventListener: jest.fn(),
      addListener: jest.fn()
    };

    // Extract and evaluate functions
    const funcs = [
      'loadSettings',
      'saveSettings',
      'applyTheme',
      'qs',
      'updateStatsView',
      'renderTable',
      'generateColorPalette',
      'markActiveNav'
    ];

    funcs.forEach(funcName => {
      const regex = new RegExp(`function ${funcName}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`);
      const match = scriptContent.match(regex);
      if (match) {
        try {
          eval(`${funcName} = ${match[0]}`);
        } catch (e) {
          console.warn(`Failed to evaluate ${funcName}:`, e.message);
        }
      }
    });
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage', () => {
      const mockSettings = {
        backendUrl: 'https://custom.api.com',
        theme: 'dark',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'abc123'
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));

      loadSettings();

      expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(AppState.settings.backendUrl).toBe('https://custom.api.com');
      expect(AppState.settings.theme).toBe('dark');
      expect(AppState.settings.auth0Domain).toBe('test.auth0.com');
      expect(AppState.settings.auth0ClientId).toBe('abc123');
    });

    test('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      const defaultSettings = { ...AppState.settings };

      loadSettings();

      expect(AppState.settings).toEqual(defaultSettings);
    });

    test('should handle invalid JSON gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json {]');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      loadSettings();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should merge loaded settings with existing defaults', () => {
      const partialSettings = { theme: 'light' };
      localStorage.getItem.mockReturnValue(JSON.stringify(partialSettings));

      loadSettings();

      expect(AppState.settings.theme).toBe('light');
      expect(AppState.settings.backendUrl).toBe('/api/censys-summary');
    });
  });

  describe('saveSettings', () => {
    test('should save settings to localStorage', () => {
      AppState.settings = {
        backendUrl: 'https://api.example.com',
        theme: 'light',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'xyz789'
      };

      saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(AppState.settings)
      );
    });

    test('should save current AppState settings', () => {
      AppState.settings.theme = 'dark';
      AppState.settings.backendUrl = 'https://new.api.com';

      saveSettings();

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData.theme).toBe('dark');
      expect(savedData.backendUrl).toBe('https://new.api.com');
    });
  });

  describe('applyTheme', () => {
    test('should apply dark theme when setting is dark', () => {
      AppState.settings.theme = 'dark';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when setting is light', () => {
      AppState.settings.theme = 'light';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should apply dark theme when auto and prefersDark matches', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = true;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('should apply light theme when auto and prefersDark does not match', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = false;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('qs (querySelector helper)', () => {
    test('should return element by selector', () => {
      document.body.innerHTML = '<div id="test">Content</div>';

      const element = qs('#test');

      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Content');
    });

    test('should return null for non-existent selector', () => {
      const element = qs('#nonexistent');

      expect(element).toBeNull();
    });

    test('should work with class selectors', () => {
      document.body.innerHTML = '<div class="test-class">Content</div>';

      const element = qs('.test-class');

      expect(element).not.toBeNull();
      expect(element.textContent).toBe('Content');
    });

    test('should work with attribute selectors', () => {
      document.body.innerHTML = '<div data-test="value">Content</div>';

      const element = qs('[data-test="value"]');

      expect(element).not.toBeNull();
    });
  });

  describe('renderTable', () => {
    test('should render table rows from object data', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { USA: 100, UK: 50, Canada: 75 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    test('should sort entries by value in descending order', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { USA: 100, UK: 50, Canada: 75 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows[0].querySelector('td').textContent).toBe('USA');
      expect(rows[1].querySelector('td').textContent).toBe('Canada');
      expect(rows[2].querySelector('td').textContent).toBe('UK');
    });

    test('should format numbers with locale string', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { USA: 1000000 };
      renderTable('[data-table="test"]', data);

      const valueCell = document.querySelectorAll('tbody td')[1];
      expect(valueCell.textContent).toMatch(/1,000,000|1.000.000/);
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

    test('should handle missing container gracefully', () => {
      expect(() => {
        renderTable('[data-table="nonexistent"]', { test: 1 });
      }).not.toThrow();
    });

    test('should handle missing tbody gracefully', () => {
      document.body.innerHTML = '<table data-table="test"></table>';

      expect(() => {
        renderTable('[data-table="test"]', { test: 1 });
      }).not.toThrow();
    });

    test('should clear existing rows before rendering', () => {
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
      expect(rows.length).toBe(1);
      expect(rows[0].querySelector('td').textContent).toBe('New');
    });
  });

  describe('generateColorPalette', () => {
    test('should generate array of HSL colors', () => {
      const colors = generateColorPalette(5, 'services');

      expect(colors).toHaveLength(5);
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should use base hue 180 for services seed', () => {
      const colors = generateColorPalette(1, 'services');

      expect(colors[0]).toMatch(/^hsl\(180 /);
    });

    test('should use base hue 300 for non-services seed', () => {
      const colors = generateColorPalette(1, 'countries');

      expect(colors[0]).toMatch(/^hsl\(300 /);
    });

    test('should generate different hues for each color', () => {
      const colors = generateColorPalette(3, 'services');

      const hues = colors.map(c => parseInt(c.match(/hsl\((\d+)/)[1]));
      expect(hues[0]).toBe(180);
      expect(hues[1]).toBe(207);
      expect(hues[2]).toBe(234);
    });

    test('should wrap hues around 360 degrees', () => {
      const colors = generateColorPalette(15, 'services');

      const hues = colors.map(c => parseInt(c.match(/hsl\((\d+)/)[1]));
      expect(hues.every(h => h >= 0 && h < 360)).toBe(true);
    });

    test('should handle zero count', () => {
      const colors = generateColorPalette(0, 'services');

      expect(colors).toHaveLength(0);
    });

    test('should generate unique colors for large counts', () => {
      const colors = generateColorPalette(20, 'services');

      expect(colors).toHaveLength(20);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });
  });

  describe('markActiveNav', () => {
    beforeEach(() => {
      // Mock window.location
      delete window.location;
      window.location = { pathname: '/docs/dashboard.html' };
    });

    test('should mark active navigation link', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;

      markActiveNav();

      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(false);
      expect(links[1].classList.contains('active')).toBe(true);
      expect(links[2].classList.contains('active')).toBe(false);
    });

    test('should handle index.html as home', () => {
      window.location.pathname = '/docs/index.html';
      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      markActiveNav();

      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(true);
    });

    test('should handle root path', () => {
      window.location.pathname = '/';
      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      markActiveNav();

      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(true);
    });

    test('should not mark any links if no match', () => {
      window.location.pathname = '/nonexistent.html';
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      markActiveNav();

      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(false);
      expect(links[1].classList.contains('active')).toBe(false);
    });

    test('should handle multiple nav elements', () => {
      window.location.pathname = '/api.html';
      document.body.innerHTML = `
        <nav class="primary">
          <a href="api.html">API</a>
        </nav>
        <nav class="secondary">
          <a href="api.html">API Docs</a>
        </nav>
      `;

      markActiveNav();

      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(true);
      expect(links[1].classList.contains('active')).toBe(true);
    });
  });

  describe('updateStatsView', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;
      
      // Mock dependent functions
      global.renderTable = jest.fn();
      global.updateCharts = jest.fn();
      global.renderHeatmap = jest.fn();
    });

    test('should update stat displays with data', () => {
      const data = {
        total_hosts: 1500,
        total_services: 250,
        last_sync: '2023-12-01T10:00:00Z',
        countries: { USA: 100 },
        services: { HTTP: 200 }
      };

      updateStatsView(data);

      expect(AppState.stats).toBe(data);
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toMatch(/1,500|1.500/);
      expect(document.querySelector('[data-stat="total-services"]').textContent).toMatch(/250/);
    });

    test('should handle missing data with fallback', () => {
      const data = {};

      updateStatsView(data);

      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('—');
      expect(document.querySelector('[data-stat="total-services"]').textContent).toBe('—');
      expect(document.querySelector('[data-stat="last-sync"]').textContent).toBe('—');
    });

    test('should format date for last_sync', () => {
      const data = {
        last_sync: '2023-12-01T10:30:00Z'
      };

      updateStatsView(data);

      const lastSyncText = document.querySelector('[data-stat="last-sync"]').textContent;
      expect(lastSyncText).not.toBe('—');
      expect(lastSyncText).toContain('2023');
    });

    test('should handle null values gracefully', () => {
      const data = {
        total_hosts: null,
        total_services: null,
        last_sync: null
      };

      updateStatsView(data);

      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('—');
    });
  });
});