/**
 * Comprehensive unit tests for core functions in docs/script.js
 * Tests settings management, theme application, and utility functions
 */

describe('Core Script.js Functions', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    delete document.body.dataset.theme;
    
    // Reset mocks
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    
    // Reset console.warn spy
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage', () => {
      const mockSettings = JSON.stringify({
        theme: 'dark',
        backendUrl: 'https://api.example.com',
        auth0Domain: 'test.auth0.com'
      });
      
      localStorage.getItem.mockReturnValue(mockSettings);
      
      // Execute script to test loadSettings
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto', backendUrl: '' } };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      loadSettings();
      
      expect(localStorage.getItem).toHaveBeenCalledWith('net-observation-settings');
      expect(AppState.settings.theme).toBe('dark');
      expect(AppState.settings.backendUrl).toBe('https://api.example.com');
    });

    test('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto' } };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      loadSettings();
      
      expect(AppState.settings.theme).toBe('auto');
    });

    test('should handle JSON parse errors', () => {
      localStorage.getItem.mockReturnValue('invalid json{');
      
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto' } };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      loadSettings();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      expect(AppState.settings.theme).toBe('auto');
    });

    test('should merge loaded settings with existing defaults', () => {
      const mockSettings = JSON.stringify({ theme: 'light' });
      localStorage.getItem.mockReturnValue(mockSettings);
      
      const testScript = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = {
        settings: {
          theme: 'auto',
          backendUrl: '/api/censys-summary',
          auth0Domain: ''
        }
      };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      loadSettings();
      
      expect(AppState.settings.theme).toBe('light');
      expect(AppState.settings.backendUrl).toBe('/api/censys-summary');
    });
  });

  describe('saveSettings', () => {
    test('should save settings to localStorage', () => {
      const testScript = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = {
        settings: {
          theme: 'dark',
          backendUrl: 'https://api.example.com',
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'client123'
        }
      };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      saveSettings();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'net-observation-settings',
        JSON.stringify(AppState.settings)
      );
    });

    test('should save empty settings object', () => {
      const testScript = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: {} };
      const STORAGE_KEY = 'net-observation-settings';
      
      eval(testScript);
      saveSettings();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'net-observation-settings',
        '{}'
      );
    });
  });

  describe('applyTheme', () => {
    test('should apply dark theme when settings.theme is dark', () => {
      const testScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'dark' } };
      const prefersDark = { matches: false };
      
      eval(testScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when settings.theme is light', () => {
      const testScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'light' } };
      const prefersDark = { matches: true };
      
      eval(testScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should resolve auto theme to dark when system prefers dark', () => {
      const testScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: true };
      
      eval(testScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should resolve auto theme to light when system prefers light', () => {
      const testScript = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/)[0];
      const AppState = { settings: { theme: 'auto' } };
      const prefersDark = { matches: false };
      
      eval(testScript);
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });
  });

  describe('qs (querySelector helper)', () => {
    test('should find element by selector', () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      
      const testScript = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const result = qs('#test');
      expect(result).not.toBeNull();
      expect(result.textContent).toBe('Content');
    });

    test('should return null for non-existent selector', () => {
      const testScript = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const result = qs('#non-existent');
      expect(result).toBeNull();
    });

    test('should work with complex selectors', () => {
      document.body.innerHTML = `
        <div class="container">
          <span data-stat="total-hosts">1000</span>
        </div>
      `;
      
      const testScript = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const result = qs('[data-stat="total-hosts"]');
      expect(result).not.toBeNull();
      expect(result.textContent).toBe('1000');
    });
  });

  describe('generateColorPalette', () => {
    test('should generate correct number of colors', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(5, 'services');
      expect(colors).toHaveLength(5);
    });

    test('should generate HSL format colors', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(3, 'services');
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });

    test('should use different base hue for services seed', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const servicesColors = generateColorPalette(1, 'services');
      const countriesColors = generateColorPalette(1, 'countries');
      
      expect(servicesColors[0]).toContain('hsl(180');
      expect(countriesColors[0]).toContain('hsl(300');
    });

    test('should generate distinct colors', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(10, 'services');
      const uniqueColors = new Set(colors);
      
      expect(uniqueColors.size).toBe(10);
    });

    test('should wrap hue values around 360 degrees', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(20, 'services');
      colors.forEach(color => {
        const hueMatch = color.match(/hsl\((\d+)/);
        const hue = parseInt(hueMatch[1]);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });

    test('should handle zero count', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(0, 'services');
      expect(colors).toHaveLength(0);
    });

    test('should handle large counts', () => {
      const testScript = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      const colors = generateColorPalette(100, 'services');
      expect(colors).toHaveLength(100);
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
      });
    });
  });

  describe('markActiveNav', () => {
    test('should mark current page nav link as active', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;
      
      // Mock window.location
      delete window.location;
      window.location = { pathname: '/dashboard.html' };
      
      const testScript = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      markActiveNav();
      
      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(false);
      expect(links[1].classList.contains('active')).toBe(true);
      expect(links[2].classList.contains('active')).toBe(false);
    });

    test('should handle root path as index.html', () => {
      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;
      
      delete window.location;
      window.location = { pathname: '/' };
      
      const testScript = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      markActiveNav();
      
      const links = document.querySelectorAll('nav a');
      expect(links[0].classList.contains('active')).toBe(true);
    });

    test('should handle nested paths', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="docs.html">Docs</a>
        </nav>
      `;
      
      delete window.location;
      window.location = { pathname: '/docs/docs.html' };
      
      const testScript = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      markActiveNav();
      
      const links = document.querySelectorAll('nav a');
      expect(links[1].classList.contains('active')).toBe(true);
    });

    test('should handle no matching links', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;
      
      delete window.location;
      window.location = { pathname: '/unknown.html' };
      
      const testScript = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/)[0];
      eval(testScript);
      
      expect(() => markActiveNav()).not.toThrow();
      
      const links = document.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.classList.contains('active')).toBe(false);
      });
    });
  });
});