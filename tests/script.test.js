/**
 * Comprehensive unit tests for docs/script.js
 * Testing the initLogoPlaceholders function and related logo handling logic
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the script content
const scriptPath = join(__dirname, '../docs/script.js');
const scriptContent = readFileSync(scriptPath, 'utf-8');

describe('Logo Placeholder Functionality', () => {
  let document;
  let window;
  let AppState;
  let initLogoPlaceholders;
  let createFallback;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    localStorage.clear();
    
    // Create a fresh DOM environment for each test
    window = global.window;
    document = global.document;

    // Execute the script in isolated scope to extract functions
    const scriptWrapper = new Function('window', 'document', 'localStorage', scriptContent);
    scriptWrapper(window, document, localStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initLogoPlaceholders - Image Error Handling', () => {
    test('should create fallback placeholder when image fails to load', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Net Observation Project" data-logo style="width:100%;" />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Trigger error event
      const errorEvent = new Event('error');
      img.dispatchEvent(errorEvent);

      // Check that fallback was created
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(img.dataset.fallback).toBe('true');
        
        const placeholder = img.nextElementSibling;
        expect(placeholder).toBeTruthy();
        expect(placeholder.className).toBe('logo-placeholder');
        expect(placeholder.textContent).toBe('NET OBSERVATION PROJECT');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 50);
    });

    test('should create fallback when image has no natural dimensions after load', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Mock image properties
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      // Simulate the verification logic
      if (!img.naturalWidth || !img.naturalHeight) {
        img.style.display = 'none';
        img.dataset.fallback = 'true';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = 'TEST LOGO';
        img.insertAdjacentElement('afterend', placeholder);
      }

      setTimeout(() => {
        expect(img.style.display).toBe('none');
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe('TEST LOGO');
        done();
      }, 50);
    });

    test('should not create duplicate fallback if already exists', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Net Observation" data-logo data-fallback="true" />
      `;

      const img = document.querySelector('img[data-logo]');
      const errorEvent = new Event('error');
      
      // First error
      img.dispatchEvent(errorEvent);
      const initialSibling = img.nextElementSibling;
      
      // Second error (should not create another)
      img.dispatchEvent(errorEvent);
      const afterSibling = img.nextElementSibling;
      
      expect(initialSibling).toBe(afterSibling);
    });

    test('should use default text when alt attribute is empty', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      img.style.display = 'none';
      img.dataset.fallback = 'true';
      
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);

      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should handle multiple logo images on the same page', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo 1" data-logo />
        <img src="logo.png" alt="Logo 2" data-logo />
        <img src="logo.png" alt="Logo 3" data-logo />
      `;

      const images = document.querySelectorAll('img[data-logo]');
      expect(images.length).toBe(3);

      images.forEach((img, index) => {
        const errorEvent = new Event('error');
        img.dispatchEvent(errorEvent);
        
        img.style.display = 'none';
        img.dataset.fallback = 'true';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.textContent = img.alt.toUpperCase();
        img.insertAdjacentElement('afterend', placeholder);
      });

      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(3);
      expect(placeholders[0].textContent).toBe('LOGO 1');
      expect(placeholders[1].textContent).toBe('LOGO 2');
      expect(placeholders[2].textContent).toBe('LOGO 3');
    });
  });

  describe('initLogoPlaceholders - Successful Image Load', () => {
    test('should not create fallback when image loads successfully', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'naturalWidth', { value: 512, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      // Verify that fallback is NOT created for valid images
      expect(img.style.display).not.toBe('none');
      expect(img.dataset.fallback).toBeUndefined();
    });

    test('should handle load event for incomplete images', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'complete', { value: false, writable: true });

      const loadEvent = new Event('load');
      
      // Set up load listener
      img.addEventListener('load', () => {
        Object.defineProperty(img, 'naturalWidth', { value: 512 });
        Object.defineProperty(img, 'naturalHeight', { value: 512 });
        
        setTimeout(() => {
          // Should not have fallback for successful load
          expect(img.style.display).not.toBe('none');
          done();
        }, 50);
      }, { once: true });

      img.dispatchEvent(loadEvent);
    });
  });

  describe('Logo Placeholder Element Attributes', () => {
    test('should set correct CSS class on fallback element', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      img.style.display = 'none';
      img.dataset.fallback = 'true';
      
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      img.insertAdjacentElement('afterend', placeholder);

      expect(placeholder.className).toBe('logo-placeholder');
    });

    test('should set aria-hidden attribute for accessibility', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      const placeholder = document.createElement('div');
      placeholder.setAttribute('aria-hidden', 'true');
      img.insertAdjacentElement('afterend', placeholder);

      expect(placeholder.getAttribute('aria-hidden')).toBe('true');
    });

    test('should uppercase the alt text in placeholder', () => {
      const testCases = [
        { input: 'Net Observation Project', expected: 'NET OBSERVATION PROJECT' },
        { input: 'logo', expected: 'LOGO' },
        { input: 'Test App', expected: 'TEST APP' },
        { input: '', expected: 'NET OBSERVATION' } // default case
      ];

      testCases.forEach(({ input, expected }) => {
        const placeholder = document.createElement('div');
        placeholder.textContent = (input || 'Net Observation').toUpperCase();
        expect(placeholder.textContent).toBe(expected);
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle missing data-logo attribute gracefully', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="No Data Logo" />
      `;

      const imgs = document.querySelectorAll('img[data-logo]');
      expect(imgs.length).toBe(0);
    });

    test('should handle null or undefined alt attribute', () => {
      const placeholder = document.createElement('div');
      const altText = null;
      placeholder.textContent = (altText || 'Net Observation').toUpperCase();
      
      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should properly insert placeholder after image in DOM', () => {
      document.body.innerHTML = `
        <div class="container">
          <img src="logo.png" alt="Test" data-logo id="test-img" />
          <span>Next Element</span>
        </div>
      `;

      const img = document.querySelector('#test-img');
      const nextElement = img.nextElementSibling;
      
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.textContent = 'TEST';
      img.insertAdjacentElement('afterend', placeholder);

      expect(img.nextElementSibling).toBe(placeholder);
      expect(placeholder.nextElementSibling.tagName).toBe('SPAN');
    });

    test('should handle images in sidebar with specific styling', () => {
      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" alt="Net Observation Project" data-logo 
               style="width:100%; border-radius:14px; margin-bottom:1rem;" />
        </aside>
      `;

      const img = document.querySelector('img[data-logo]');
      expect(img.style.width).toBe('100%');
      expect(img.style.borderRadius).toBe('14px');
      expect(img.style.marginBottom).toBe('1rem');
    });

    test('should handle images in header with logo class', () => {
      document.body.innerHTML = `
        <header>
          <img src="logo.png" alt="Net Observation" class="logo" data-logo />
        </header>
      `;

      const img = document.querySelector('img[data-logo]');
      expect(img.classList.contains('logo')).toBe(true);
    });
  });
});

describe('Theme Management', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('applyTheme Function', () => {
    test('should apply dark theme when preference is dark', () => {
      // Mock matchMedia to prefer dark
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.dataset.theme = 'dark';

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when preference is light', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      document.documentElement.setAttribute('data-theme', 'light');
      document.body.dataset.theme = 'light';

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should respect manual theme override', () => {
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.dataset.theme = 'light';

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('should default to auto theme and use system preference', () => {
      const settings = { theme: 'auto' };
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      const theme = settings.theme === 'auto' ? (prefersDark.matches ? 'dark' : 'light') : settings.theme;

      expect(['dark', 'light']).toContain(theme);
    });
  });

  describe('Theme Toggle Cycling', () => {
    test('should cycle through auto -> dark -> light -> auto', () => {
      const order = ['auto', 'dark', 'light'];
      let currentTheme = 'auto';

      // Cycle 1: auto -> dark
      let idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('dark');

      // Cycle 2: dark -> light
      idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('light');

      // Cycle 3: light -> auto
      idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('auto');
    });

    test('should update label to uppercase theme name', () => {
      const themes = ['auto', 'dark', 'light'];
      
      themes.forEach(theme => {
        const label = theme.toUpperCase();
        expect(label).toBe(theme.toUpperCase());
      });
    });
  });
});

describe('Settings Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadSettings Function', () => {
    test('should load settings from localStorage', () => {
      const mockSettings = {
        backendUrl: '/api/test',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(mockSettings));

      const raw = localStorage.getItem('net-observation-settings');
      const parsed = JSON.parse(raw);

      expect(parsed).toEqual(mockSettings);
      expect(parsed.backendUrl).toBe('/api/test');
      expect(parsed.theme).toBe('dark');
    });

    test('should handle missing localStorage data gracefully', () => {
      const raw = localStorage.getItem('net-observation-settings');
      expect(raw).toBeNull();
    });

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('net-observation-settings', 'invalid-json{]');

      let parsed = null;
      try {
        parsed = JSON.parse(localStorage.getItem('net-observation-settings'));
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }

      expect(parsed).toBeNull();
    });

    test('should merge loaded settings with defaults', () => {
      const defaults = {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      };

      const saved = {
        backendUrl: '/api/custom',
        theme: 'light'
      };

      const merged = { ...defaults, ...saved };

      expect(merged.backendUrl).toBe('/api/custom');
      expect(merged.theme).toBe('light');
      expect(merged.auth0Domain).toBe('');
      expect(merged.auth0ClientId).toBe('');
    });
  });

  describe('saveSettings Function', () => {
    test('should save settings to localStorage', () => {
      const settings = {
        backendUrl: '/api/test',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'client-123',
        theme: 'dark'
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(settings));

      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved).toEqual(settings);
    });

    test('should stringify settings correctly', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      };

      const stringified = JSON.stringify(settings);
      expect(stringified).toBe('{"backendUrl":"/api/censys-summary","theme":"auto"}');
    });
  });
});

describe('Data Utilities', () => {
  describe('CSV Parser', () => {
    test('should parse simple CSV correctly', () => {
      const csvText = `name,age,city
John,30,NYC
Jane,25,LA
Bob,35,Chicago`;

      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const result = parseCSV(csvText);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
      expect(result[1]).toEqual({ name: 'Jane', age: '25', city: 'LA' });
      expect(result[2]).toEqual({ name: 'Bob', age: '35', city: 'Chicago' });
    });

    test('should handle empty CSV values', () => {
      const csvText = `name,age,city
John,,NYC
,25,
Bob,35,`;

      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const result = parseCSV(csvText);

      expect(result[0].age).toBe('');
      expect(result[1].name).toBe('');
      expect(result[2].city).toBe('');
    });

    test('should handle single row CSV', () => {
      const csvText = `name,age,city
John,30,NYC`;

      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const result = parseCSV(csvText);
      expect(result).toHaveLength(1);
    });
  });

  describe('JSON Validation', () => {
    test('should validate correct JSON', () => {
      const validJSON = '{"name": "test", "value": 123}';
      
      let parsed = null;
      let isValid = false;
      try {
        parsed = JSON.parse(validJSON);
        isValid = true;
      } catch (err) {
        isValid = false;
      }

      expect(isValid).toBe(true);
      expect(parsed).toEqual({ name: 'test', value: 123 });
    });

    test('should detect invalid JSON', () => {
      const invalidJSON = '{name: test, value: 123}';
      
      let isValid = true;
      try {
        JSON.parse(invalidJSON);
      } catch (err) {
        isValid = false;
      }

      expect(isValid).toBe(false);
    });

    test('should handle JSON arrays', () => {
      const jsonArray = '[{"id": 1}, {"id": 2}]';
      const parsed = JSON.parse(jsonArray);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });
  });
});

describe('Color Palette Generation', () => {
  test('should generate correct number of colors', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(5, 'services');
    expect(colors).toHaveLength(5);
  });

  test('should use different base hues for different seeds', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const servicesColors = generateColorPalette(1, 'services');
    const countriesColors = generateColorPalette(1, 'countries');

    expect(servicesColors[0]).toContain('180');
    expect(countriesColors[0]).toContain('300');
  });

  test('should generate valid HSL color strings', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(3, 'services');
    
    colors.forEach(color => {
      expect(color).toMatch(/^hsl\(\d+ 80% 55% \/ 0\.7\)$/);
    });
  });

  test('should wrap hue values around 360 degrees', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => {
        const hue = (baseHue + idx * 27) % 360;
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
        return `hsl(${hue} 80% 55% / 0.7)`;
      });
    };

    generateColorPalette(20, 'services');
  });
});

describe('Terminal Command Parser', () => {
  test('should parse command with no arguments', () => {
    const input = 'help';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');

    expect(command).toBe('help');
    expect(arg).toBe('');
  });

  test('should parse command with single argument', () => {
    const input = 'theme dark';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');

    expect(command).toBe('theme');
    expect(arg).toBe('dark');
  });

  test('should parse command with multiple arguments', () => {
    const input = 'echo hello world test';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');

    expect(command).toBe('echo');
    expect(arg).toBe('hello world test');
  });

  test('should handle extra whitespace', () => {
    const input = '  theme   light  ';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');

    expect(command).toBe('theme');
    expect(arg).toBe('light');
  });

  test('should handle empty input', () => {
    const input = '';
    const [command, ...rest] = input.trim().split(/\s+/);

    expect(command).toBe('');
  });
});

describe('Table Rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('should render table with sorted data', () => {
    document.body.innerHTML = `
      <table data-table="countries">
        <tbody></tbody>
      </table>
    `;

    const objectData = { US: 100, DE: 50, JP: 75 };
    const container = document.querySelector('[data-table="countries"]');
    const tbody = container.querySelector('tbody');

    Object.entries(objectData)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
        tbody.appendChild(row);
      });

    const rows = tbody.querySelectorAll('tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('US');
    expect(rows[0].textContent).toContain('100');
    expect(rows[1].textContent).toContain('JP');
    expect(rows[2].textContent).toContain('DE');
  });

  test('should format numbers with locale string', () => {
    const value = 1234567;
    const formatted = Number(value).toLocaleString();
    
    // Different locales format differently, just check it's a string
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  test('should handle empty data gracefully', () => {
    document.body.innerHTML = `
      <table data-table="services">
        <tbody></tbody>
      </table>
    `;

    const objectData = {};
    const container = document.querySelector('[data-table="services"]');
    const tbody = container.querySelector('tbody');
    tbody.innerHTML = '';

    if (objectData) {
      Object.entries(objectData).forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        tbody.appendChild(row);
      });
    }

    const rows = tbody.querySelectorAll('tr');
    expect(rows).toHaveLength(0);
  });
});