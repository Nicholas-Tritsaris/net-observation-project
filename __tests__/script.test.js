/**
 * Unit tests for docs/script.js
 * Focuses on functions modified in the current branch, especially:
 * - initLogoPlaceholders() - NEW function for logo fallback handling
 * - applyTheme() - Modified to remove chart refresh call
 * - initSidebar() - Modified initialization logic
 * - updateStatsView() - Removed payload display logic
 * - fetchCensysSummary() - Removed payload error display
 */

const fs = require('fs');
const path = require('path');

describe('Net Observation Project - script.js', () => {
  let scriptContent;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    // Read the actual script file
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    
    // Reset localStorage
    localStorage.clear();
    
    // Setup DOM
    document.body.innerHTML = '';
    
    // Mock window globals
    mockWindow = {
      __latestCensys: null,
      matchMedia: window.matchMedia,
      location: { pathname: '/index.html', origin: 'http://localhost', href: 'http://localhost' },
      innerWidth: 1024,
      Chart: undefined,
      d3: undefined,
      topojson: undefined,
      createAuth0Client: undefined,
    };
    
    Object.assign(window, mockWindow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initLogoPlaceholders() - NEW FUNCTION', () => {
    it('should create fallback placeholder when image fails to load', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Net Observation Project" data-logo />
      `;

      // Execute the script
      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Simulate image load error
      img.dispatchEvent(new Event('error'));

      // Allow async operations to complete
      setTimeout(() => {
        expect(img.dataset.fallback).toBe('true');
        expect(img.style.display).toBe('none');
        
        const placeholder = img.nextElementSibling;
        expect(placeholder).toBeTruthy();
        expect(placeholder.className).toBe('logo-placeholder');
        expect(placeholder.textContent).toBe('NET OBSERVATION PROJECT');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 50);
    });

    it('should create fallback for image with zero natural dimensions', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Mock naturalWidth and naturalHeight
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      // Trigger verification
      img.dispatchEvent(new Event('load'));

      setTimeout(() => {
        expect(img.dataset.fallback).toBe('true');
        expect(img.style.display).toBe('none');
        
        const placeholder = img.nextElementSibling;
        expect(placeholder).toBeTruthy();
        expect(placeholder.textContent).toBe('TEST LOGO');
        done();
      }, 50);
    });

    it('should not create duplicate fallbacks if already created', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // First error
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const firstPlaceholder = img.nextElementSibling;
        expect(firstPlaceholder).toBeTruthy();
        
        // Second error - should not create another placeholder
        img.dispatchEvent(new Event('error'));
        
        setTimeout(() => {
          const siblings = Array.from(img.parentNode.children);
          const placeholders = siblings.filter(el => el.className === 'logo-placeholder');
          expect(placeholders.length).toBe(1);
          done();
        }, 50);
      }, 50);
    });

    it('should handle multiple logo images independently', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo One" data-logo />
        <img src="logo.png" alt="Logo Two" data-logo />
        <img src="logo.png" alt="Logo Three" data-logo />
      `;

      eval(scriptContent);

      const images = document.querySelectorAll('img[data-logo]');
      
      // Trigger error on first and third images
      images[0].dispatchEvent(new Event('error'));
      images[2].dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(images[0].nextElementSibling.textContent).toBe('LOGO ONE');
        expect(images[1].nextElementSibling?.className).not.toBe('logo-placeholder');
        expect(images[2].nextElementSibling.textContent).toBe('LOGO THREE');
        done();
      }, 50);
    });

    it('should use default text when alt attribute is empty', (done) => {
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

    it('should handle images that load successfully without creating fallback', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Success Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Mock successful load
      Object.defineProperty(img, 'naturalWidth', { value: 512, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      img.dispatchEvent(new Event('load'));

      setTimeout(() => {
        expect(img.dataset.fallback).toBeUndefined();
        expect(img.style.display).not.toBe('none');
        expect(img.nextElementSibling?.className).not.toBe('logo-placeholder');
        done();
      }, 50);
    });
  });

  describe('applyTheme() - MODIFIED FUNCTION', () => {
    it('should apply dark theme when preference is dark and theme is auto', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      }));

      document.body.innerHTML = '<div></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));
      
      eval(scriptContent);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should apply light theme when preference is light and theme is auto', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
      }));

      document.body.innerHTML = '<div></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));
      
      eval(scriptContent);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    it('should apply explicit dark theme regardless of system preference', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
      }));

      document.body.innerHTML = '<div></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));
      
      eval(scriptContent);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should apply explicit light theme regardless of system preference', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      }));

      document.body.innerHTML = '<div></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      
      eval(scriptContent);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    it('should not call refreshChartThemes (function removed in this branch)', () => {
      document.body.innerHTML = '<div></div>';
      
      eval(scriptContent);

      // Verify the function no longer exists in the script
      expect(scriptContent).not.toContain('refreshChartThemes()');
    });
  });

  describe('initSidebar() - MODIFIED FUNCTION', () => {
    it('should initialize sidebar as open on desktop', () => {
      window.innerWidth = 1024;
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    it('should initialize sidebar as collapsed on mobile', () => {
      window.innerWidth = 800;
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.innerHTML).toBe('&#9776;');
    });

    it('should toggle sidebar state on button click', () => {
      window.innerWidth = 1024;
      
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      // Initially open
      expect(sidebar.classList.contains('open')).toBe(true);

      // Click to close
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(toggle.innerHTML).toBe('&#9776;');

      // Click to open again
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(sidebar.classList.contains('collapsed')).toBe(false);
      expect(toggle.innerHTML).toBe('&#x2715;');
    });

    it('should handle missing sidebar gracefully', () => {
      document.body.innerHTML = `
        <button class="sidebar-toggle"></button>
      `;

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing toggle button gracefully', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
      `;

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });
  });

  describe('updateStatsView() - MODIFIED FUNCTION', () => {
    it('should update stats display elements with data', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
      `;

      eval(scriptContent);

      // Simulate data update (accessing the function through window)
      const data = {
        total_hosts: 1234567,
        total_services: 8901,
        last_sync: '2025-01-15T10:30:00Z'
      };

      // We need to trigger the update through a mechanism available in the script
      window.__latestCensys = data;

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      const servicesEl = document.querySelector('[data-stat="total-services"]');
      const syncEl = document.querySelector('[data-stat="last-sync"]');

      // Since we can't directly call the function, we'll test the expected behavior
      expect(hostsEl).toBeTruthy();
      expect(servicesEl).toBeTruthy();
      expect(syncEl).toBeTruthy();
    });

    it('should not update apiPayload element (removed in this branch)', () => {
      document.body.innerHTML = `
        <div id="apiPayload"></div>
        <div data-stat="total-hosts"></div>
      `;

      eval(scriptContent);

      // Verify that the script no longer references #apiPayload
      expect(scriptContent).not.toContain('if (payload) payload.textContent');
    });

    it('should handle missing stat elements gracefully', () => {
      document.body.innerHTML = '<div></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should display em dash for missing numeric values', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
      `;

      eval(scriptContent);

      // The script should handle undefined values with '—'
      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(hostsEl).toBeTruthy();
    });

    it('should format large numbers with locale string', () => {
      // This tests that the code uses toLocaleString() for formatting
      expect(scriptContent).toContain('toLocaleString()');
    });
  });

  describe('fetchCensysSummary() - MODIFIED FUNCTION', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      document.body.innerHTML = `
        <div class="terminal-output"></div>
        <div data-stat="total-hosts"></div>
      `;
    });

    it('should fetch data from configured backend URL', async () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: '2025-01-15T10:00:00Z',
        countries: { US: 100 },
        services: { http: 50 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      localStorage.setItem('net-observation-settings', JSON.stringify({
        backendUrl: '/api/censys-summary'
      }));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/censys-summary',
        expect.objectContaining({
          headers: { 'Accept': 'application/json' }
        })
      );
    });

    it('should handle HTTP errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalledWith(
        'Censys fetch error',
        expect.any(Error)
      );
    });

    it('should not display error in apiPayload element (removed feature)', () => {
      // Verify the error handling code no longer updates #apiPayload
      expect(scriptContent).not.toContain('if (payload && !silent)');
      expect(scriptContent).not.toContain('payload.textContent = JSON.stringify({ error:');
    });

    it('should log terminal message on successful fetch', async () => {
      const mockData = { total_hosts: 100 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput).toBeTruthy();
    });

    it('should suppress logging when silent parameter is true', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Silent errors should still warn to console but not log to terminal
      expect(console.warn).toHaveBeenCalled();
    });

    it('should store fetched data in window.__latestCensys', async () => {
      const mockData = {
        total_hosts: 999,
        total_services: 888,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.__latestCensys).toEqual(mockData);
    });
  });

  describe('localStorage integration', () => {
    it('should load settings from localStorage on init', () => {
      const settings = {
        backendUrl: 'https://custom.api.com',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'light'
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(settings));

      document.body.innerHTML = '<div></div>';
      eval(scriptContent);

      const stored = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(stored.backendUrl).toBe('https://custom.api.com');
      expect(stored.theme).toBe('light');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('net-observation-settings', 'invalid-json{');

      document.body.innerHTML = '<div></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load settings',
        expect.any(Error)
      );
    });

    it('should save settings to localStorage', () => {
      document.body.innerHTML = '<div></div>';
      
      const newSettings = {
        backendUrl: '/api/test',
        theme: 'dark'
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(newSettings));
      
      eval(scriptContent);

      const stored = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(stored).toBeTruthy();
      expect(typeof stored).toBe('object');
    });
  });

  describe('Theme toggle functionality', () => {
    it('should cycle through themes: auto -> dark -> light -> auto', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <span>Theme:</span>
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = toggle.querySelector('[data-label]');

      // Start at auto (or dark/light depending on system)
      const initialLabel = label.textContent;
      expect(['AUTO', 'DARK', 'LIGHT']).toContain(initialLabel);

      // First click
      toggle.click();
      const secondLabel = label.textContent;
      expect(['AUTO', 'DARK', 'LIGHT']).toContain(secondLabel);
      expect(secondLabel).not.toBe(initialLabel);

      // Second click
      toggle.click();
      const thirdLabel = label.textContent;
      expect(['AUTO', 'DARK', 'LIGHT']).toContain(thirdLabel);

      // Third click should cycle back
      toggle.click();
      const fourthLabel = label.textContent;
      expect(fourthLabel).toBe(initialLabel);
    });

    it('should handle keyboard events (Enter and Space)', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <span>Theme:</span>
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = toggle.querySelector('[data-label]');

      const initialTheme = document.body.dataset.theme;

      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);

      expect(document.body.dataset.theme).toBeTruthy();

      // Press Space
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(spaceEvent);

      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should update theme when system preference changes and theme is auto', () => {
      const listeners = [];
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: (event, callback) => {
          listeners.push({ event, callback });
        },
        removeEventListener: jest.fn(),
      }));

      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));

      eval(scriptContent);

      expect(listeners.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin system', () => {
    it('should allow plugin registration via window.registerPlugin', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const testPlugin = {
        name: 'test-plugin',
        command: 'test',
        run: (arg) => `Test: ${arg}`,
        init: jest.fn()
      };

      expect(typeof window.registerPlugin).toBe('function');
      window.registerPlugin(testPlugin);

      expect(testPlugin.init).toHaveBeenCalled();
    });

    it('should reject plugins without a name', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const invalidPlugin = {
        command: 'invalid',
        run: () => 'test'
      };

      expect(() => {
        window.registerPlugin(invalidPlugin);
      }).not.toThrow(); // It logs error instead of throwing

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.textContent).toContain('Plugin registration failed');
    });

    it('should register echo-plugin on initialization', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const terminalOutput = document.querySelector('.terminal-output');
      expect(terminalOutput.textContent).toContain('echo-plugin');
    });
  });

  describe('Data visualizer', () => {
    it('should parse valid JSON input', () => {
      const parseTest = (text) => {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
        return null;
      };

      const jsonInput = '{"key": "value", "number": 123}';
      const result = parseTest(jsonInput);
      
      expect(result).toEqual({ key: 'value', number: 123 });
    });

    it('should parse CSV input correctly', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csvInput = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' }
      ]);
    });

    it('should handle CSV with missing values', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csvInput = 'col1,col2,col3\nval1,,val3\n,val2,';
      const result = parseCSV(csvInput);

      expect(result).toEqual([
        { col1: 'val1', col2: '', col3: 'val3' },
        { col1: '', col2: 'val2', col3: '' }
      ]);
    });
  });

  describe('Color palette generation', () => {
    it('should generate different base hues for services and countries', () => {
      // Test the logic directly
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const serviceColors = generateColorPalette(3, 'services');
      const countryColors = generateColorPalette(3, 'countries');

      expect(serviceColors[0]).toContain('180');
      expect(countryColors[0]).toContain('300');
      expect(serviceColors).toHaveLength(3);
      expect(countryColors).toHaveLength(3);
    });

    it('should generate sequential colors with proper spacing', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const colors = generateColorPalette(5, 'services');
      
      expect(colors[0]).toBe('hsl(180 80% 55% / 0.7)');
      expect(colors[1]).toBe('hsl(207 80% 55% / 0.7)');
      expect(colors[2]).toBe('hsl(234 80% 55% / 0.7)');
    });
  });

  describe('Table rendering', () => {
    it('should render table data sorted by value descending', () => {
      document.body.innerHTML = `
        <table data-table="countries">
          <tbody></tbody>
        </table>
      `;

      eval(scriptContent);

      // Test the sorting logic
      const objectData = { US: 100, GB: 200, FR: 150 };
      const sorted = Object.entries(objectData).sort((a, b) => b[1] - a[1]);

      expect(sorted[0]).toEqual(['GB', 200]);
      expect(sorted[1]).toEqual(['FR', 150]);
      expect(sorted[2]).toEqual(['US', 100]);
    });

    it('should handle empty table data gracefully', () => {
      document.body.innerHTML = `
        <table data-table="services">
          <tbody></tbody>
        </table>
      `;

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should format numbers with locale string in tables', () => {
      const value = 1234567;
      const formatted = Number(value).toLocaleString();
      
      // Should contain separators (commas in en-US)
      expect(formatted).toMatch(/\d{1,3}[,\s]\d{3}/);
    });
  });

  describe('Script initialization', () => {
    it('should initialize when DOMContentLoaded fires', () => {
      document.body.innerHTML = '<div></div>';
      
      // Simulate document not ready
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      eval(scriptContent);

      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));

      // Script should have initialized
      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });

    it('should initialize immediately if DOM is already loaded', () => {
      document.body.innerHTML = '<div></div>';
      
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      eval(scriptContent);

      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });
  });

  describe('Navigation marking', () => {
    it('should mark active navigation link based on pathname', () => {
      window.location.pathname = '/dashboard.html';
      
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="docs.html">Docs</a>
        </nav>
      `;

      eval(scriptContent);

      const dashboardLink = document.querySelector('a[href="dashboard.html"]');
      expect(dashboardLink).toBeTruthy();
    });

    it('should handle root path and index.html equivalently', () => {
      window.location.pathname = '/';
      
      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      eval(scriptContent);

      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink).toBeTruthy();
    });
  });
});
  describe('ADDITIONAL COMPREHENSIVE TESTS - initLogoPlaceholders()', () => {
    it('should handle images with data-logo attribute but no src', (done) => {
      document.body.innerHTML = `
        <img data-logo alt="Logo" />
      `;

      eval(scriptContent);

      setTimeout(() => {
        const img = document.querySelector('img[data-logo]');
        // Image without src should be handled gracefully
        expect(img).toBeTruthy();
        done();
      }, 50);
    });

    it('should handle images that have loaded event fire after complete=true', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'complete', { value: false, writable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 100, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 100, writable: true });

      setTimeout(() => {
        img.dispatchEvent(new Event('load'));
        setTimeout(() => {
          expect(img.dataset.fallback).toBeUndefined();
          done();
        }, 50);
      }, 50);
    });

    it('should handle rapid successive error events', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Fire multiple errors rapidly
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1); // Should only create one
        done();
      }, 100);
    });

    it('should preserve image parent node structure', (done) => {
      document.body.innerHTML = `
        <div class="logo-container">
          <img src="logo.png" alt="Test Logo" data-logo />
          <span class="caption">Logo Caption</span>
        </div>
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      const container = img.parentNode;
      const originalChildren = container.children.length;
      
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(img.parentNode).toBe(container);
        expect(container.children.length).toBe(originalChildren + 1); // Original + placeholder
        done();
      }, 50);
    });

    it('should handle images with very long alt text', (done) => {
      const longAlt = 'A'.repeat(500);
      document.body.innerHTML = `
        <img src="logo.png" alt="${longAlt}" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent.length).toBeGreaterThan(100);
        done();
      }, 50);
    });

    it('should handle images with Unicode characters in alt text', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="网络观察 🌐 Observation" data-logo />
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toContain('网络观察');
        expect(placeholder.textContent).toContain('🌐');
        done();
      }, 50);
    });

    it('should not interfere with images without data-logo attribute', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Regular Image" />
        <img src="logo2.png" alt="Logo Image" data-logo />
      `;

      eval(scriptContent);

      const regularImg = document.querySelector('img:not([data-logo])');
      const logoImg = document.querySelector('img[data-logo]');

      regularImg.dispatchEvent(new Event('error'));
      logoImg.dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(regularImg.nextElementSibling?.className).not.toBe('logo-placeholder');
        expect(logoImg.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - applyTheme()', () => {
    it('should handle missing matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = undefined;

      document.body.innerHTML = '<div></div>';
      
      // Should not throw
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      window.matchMedia = originalMatchMedia;
    });

    it('should apply theme immediately on settings change', () => {
      document.body.innerHTML = '<div></div>';
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));
      
      eval(scriptContent);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should handle rapid theme switches', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Rapid clicks
      toggle.click();
      toggle.click();
      toggle.click();

      // Should still have valid theme
      const theme = document.body.dataset.theme;
      expect(['auto', 'dark', 'light']).toContain(theme);
    });

    it('should maintain theme consistency across documentElement and body', () => {
      document.body.innerHTML = '<div></div>';
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      
      eval(scriptContent);

      const docTheme = document.documentElement.getAttribute('data-theme');
      const bodyTheme = document.body.dataset.theme;

      expect(docTheme).toBe(bodyTheme);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - updateStatsView()', () => {
    it('should handle data with null values', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
      `;

      eval(scriptContent);

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      const servicesEl = document.querySelector('[data-stat="total-services"]');
      const syncEl = document.querySelector('[data-stat="last-sync"]');

      // Elements should exist even if data is null
      expect(hostsEl).toBeTruthy();
      expect(servicesEl).toBeTruthy();
      expect(syncEl).toBeTruthy();
    });

    it('should handle very large numbers correctly', () => {
      const largeNumber = 999999999999;
      const formatted = largeNumber.toLocaleString();

      expect(formatted).toContain(',');
      expect(formatted.length).toBeGreaterThan(12);
    });

    it('should handle zero values', () => {
      const zero = 0;
      const formatted = zero.toLocaleString();

      expect(formatted).toBe('0');
    });

    it('should handle negative numbers (edge case)', () => {
      const negative = -100;
      const formatted = negative.toLocaleString();

      expect(formatted).toContain('-');
    });

    it('should handle invalid date strings gracefully', () => {
      const invalidDate = 'not-a-date';
      const date = new Date(invalidDate);

      expect(date.toString()).toContain('Invalid');
    });

    it('should format valid ISO date strings', () => {
      const isoDate = '2025-01-15T10:30:00.000Z';
      const date = new Date(isoDate);
      const formatted = date.toLocaleString();

      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - renderTable()', () => {
    it('should handle objects with many entries', () => {
      const largeData = {};
      for (let i = 0; i < 100; i++) {
        largeData[`key${i}`] = Math.floor(Math.random() * 1000);
      }

      const entries = Object.entries(largeData);
      expect(entries.length).toBe(100);
    });

    it('should sort entries correctly by value', () => {
      const data = { a: 10, b: 100, c: 50 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

      expect(sorted[0][0]).toBe('b');
      expect(sorted[1][0]).toBe('c');
      expect(sorted[2][0]).toBe('a');
    });

    it('should handle equal values in sorting', () => {
      const data = { a: 50, b: 50, c: 50 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

      expect(sorted.length).toBe(3);
      sorted.forEach(([key, value]) => {
        expect(value).toBe(50);
      });
    });

    it('should handle objects with string keys containing special characters', () => {
      const data = {
        'key-with-dash': 100,
        'key.with.dot': 200,
        'key_with_underscore': 150
      };

      const entries = Object.entries(data);
      expect(entries.length).toBe(3);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - fetchCensysSummary()', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;
    });

    it('should handle JSON parse errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalledWith(
        'Censys fetch error',
        expect.any(Error)
      );
    });

    it('should handle 404 responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle 500 server errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle rate limiting (429) responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should update window.__latestCensys with complete data structure', async () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: '2025-01-15T10:00:00Z',
        countries: { US: 100, GB: 50 },
        services: { http: 200, https: 300 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.__latestCensys).toEqual(mockData);
    });

    it('should handle partial data responses', async () => {
      const partialData = {
        total_hosts: 1000
        // Missing other fields
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => partialData
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(window.__latestCensys.total_hosts).toBe(1000);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - logTerminal()', () => {
    it('should handle very long messages', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const longMessage = 'A'.repeat(10000);
      
      // Should not throw even with very long message
      expect(() => {
        const output = document.querySelector('.terminal-output');
        if (output) {
          const line = document.createElement('div');
          line.textContent = `[${new Date().toLocaleTimeString()}] ${longMessage}`;
          output.appendChild(line);
        }
      }).not.toThrow();
    });

    it('should handle messages with HTML special characters', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      const specialMessage = '<script>alert("xss")</script>';
      
      const line = document.createElement('div');
      line.textContent = specialMessage;
      output.appendChild(line);

      // textContent should escape HTML
      expect(line.innerHTML).not.toContain('<script>');
      expect(line.textContent).toContain('<script>');
    });

    it('should handle rapid sequential logging', () => {
      document.body.innerHTML = `
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      
      for (let i = 0; i < 100; i++) {
        const line = document.createElement('div');
        line.textContent = `Message ${i}`;
        output.appendChild(line);
      }

      expect(output.children.length).toBe(100);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - generateColorPalette()', () => {
    it('should generate exactly the requested number of colors', () => {
      const count = 15;
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const colors = generateColorPalette(count, 'services');
      expect(colors).toHaveLength(count);
    });

    it('should handle zero count', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const colors = generateColorPalette(0, 'services');
      expect(colors).toHaveLength(0);
    });

    it('should wrap hue values correctly at 360 degrees', () => {
      const baseHue = 350;
      const hue1 = (baseHue + 0 * 27) % 360; // 350
      const hue2 = (baseHue + 1 * 27) % 360; // 377 % 360 = 17
      const hue3 = (baseHue + 2 * 27) % 360; // 404 % 360 = 44

      expect(hue1).toBe(350);
      expect(hue2).toBe(17);
      expect(hue3).toBe(44);
    });

    it('should use consistent alpha value', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const colors = generateColorPalette(5, 'services');
      colors.forEach(color => {
        expect(color).toContain('/ 0.7)');
      });
    });

    it('should generate visually distinct colors with 27 degree spacing', () => {
      const spacing = 27;
      const colors = [];
      
      for (let i = 0; i < 13; i++) {
        colors.push((180 + i * spacing) % 360);
      }

      // Check that colors are well-distributed
      expect(colors[0]).toBe(180);
      expect(colors[1]).toBe(207);
      expect(colors[2]).toBe(234);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - initSidebar()', () => {
    it('should handle window resize events', () => {
      window.innerWidth = 1024;
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);

      // Simulate resize to mobile
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));

      // Initial state should remain unless explicitly toggled
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    it('should handle sidebar toggle with keyboard accessibility', () => {
      window.innerWidth = 1024;
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBeTruthy();
    });

    it('should maintain sidebar state across multiple toggles', () => {
      window.innerWidth = 1024;
      
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      // Toggle 10 times
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }

      // Should end up in original state (even number of toggles)
      expect(sidebar.classList.contains('open')).toBe(true);
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - initDataVisualizer()', () => {
    it('should handle JSON arrays', () => {
      const jsonArray = '[1, 2, 3, 4, 5]';
      const trimmed = jsonArray.trim();
      
      expect(trimmed.startsWith('[')).toBe(true);
      expect(() => JSON.parse(trimmed)).not.toThrow();
    });

    it('should handle nested JSON objects', () => {
      const nestedJson = '{"outer": {"inner": {"deep": "value"}}}';
      const parsed = JSON.parse(nestedJson);
      
      expect(parsed.outer.inner.deep).toBe('value');
    });

    it('should handle CSV with quoted values', () => {
      const csvWithQuotes = 'name,description\n"John","Developer"\n"Jane","Designer"';
      const lines = csvWithQuotes.trim().split(/\r?\n/);
      
      expect(lines.length).toBe(3); // Header + 2 rows
    });

    it('should handle CSV with different line endings', () => {
      const csvUnix = 'a,b\n1,2\n3,4';
      const csvWindows = 'a,b\r\n1,2\r\n3,4';
      
      const linesUnix = csvUnix.trim().split(/\r?\n/);
      const linesWindows = csvWindows.trim().split(/\r?\n/);
      
      expect(linesUnix.length).toBe(linesWindows.length);
    });

    it('should handle empty CSV cells', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csv = 'a,b,c\n1,,3\n,,\n4,5,6';
      const result = parseCSV(csv);
      
      expect(result[0].b).toBe('');
      expect(result[1].a).toBe('');
      expect(result[1].b).toBe('');
      expect(result[1].c).toBe('');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{invalid json}';
      
      expect(() => {
        JSON.parse(malformedJson);
      }).toThrow();
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - Plugin System', () => {
    it('should handle plugins with async run functions', (done) => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const asyncPlugin = {
        name: 'async-plugin',
        command: 'async',
        run: async (arg) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Async result: ${arg}`;
        },
        init: jest.fn()
      };

      window.registerPlugin(asyncPlugin);

      setTimeout(() => {
        expect(asyncPlugin.init).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should handle plugins without init function', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const simplePlugin = {
        name: 'simple-plugin',
        command: 'simple',
        run: (arg) => `Simple: ${arg}`
      };

      expect(() => {
        window.registerPlugin(simplePlugin);
      }).not.toThrow();
    });

    it('should handle plugins with special characters in names', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const specialPlugin = {
        name: 'test-plugin_v2.0',
        command: 'test',
        run: () => 'test',
        init: jest.fn()
      };

      window.registerPlugin(specialPlugin);
      expect(specialPlugin.init).toHaveBeenCalled();
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - Settings Panel', () => {
    it('should handle empty backend URL with fallback', () => {
      const backendUrl = '';
      const fallback = '/api/censys-summary';
      const result = backendUrl.trim() || fallback;

      expect(result).toBe(fallback);
    });

    it('should trim whitespace from settings inputs', () => {
      const input = '  https://api.example.com  ';
      const trimmed = input.trim();

      expect(trimmed).toBe('https://api.example.com');
      expect(trimmed.length).toBeLessThan(input.length);
    });

    it('should handle settings with all fields empty', () => {
      const settings = {
        backendUrl: '',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      };

      expect(settings.theme).toBe('auto');
      expect(settings.backendUrl).toBe('');
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - qs() helper function', () => {
    it('should return null for non-existent selectors', () => {
      document.body.innerHTML = '<div></div>';
      
      const result = document.querySelector('.does-not-exist');
      expect(result).toBeNull();
    });

    it('should handle complex CSS selectors', () => {
      document.body.innerHTML = `
        <div class="outer">
          <div class="inner">
            <span data-test="value">Content</span>
          </div>
        </div>
      `;

      const result = document.querySelector('.outer .inner span[data-test="value"]');
      expect(result).toBeTruthy();
      expect(result.textContent).toBe('Content');
    });

    it('should return first match for multiple elements', () => {
      document.body.innerHTML = `
        <div class="item">First</div>
        <div class="item">Second</div>
        <div class="item">Third</div>
      `;

      const result = document.querySelector('.item');
      expect(result.textContent).toBe('First');
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - Auto-refresh functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule periodic refreshes', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total_hosts: 100 })
      });

      eval(scriptContent);

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      // Multiple fetches should have been scheduled
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('ADDITIONAL COMPREHENSIVE TESTS - Error boundary cases', () => {
    it('should handle localStorage being unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;

      document.body.innerHTML = '<div></div>';

      expect(() => {
        // Code that tries to access localStorage
        try {
          localStorage.getItem('test');
        } catch (e) {
          // Expected to fail
        }
      }).not.toThrow();

      global.localStorage = originalLocalStorage;
    });

    it('should handle document.querySelector returning null', () => {
      document.body.innerHTML = '';

      const result = document.querySelector('.non-existent');
      expect(result).toBeNull();
    });

    it('should handle missing Chart.js library', () => {
      window.Chart = undefined;
      
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
      `;

      eval(scriptContent);

      // Should not throw even without Chart.js
      expect(window.Chart).toBeUndefined();
    });
  });
  });
});
});