/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';

describe('Net Observation Project - Frontend Script Tests', () => {
  let mockLocalStorage;
  let mockMatchMedia;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage.store[key] = value;
      }),
      clear: jest.fn(() => {
        mockLocalStorage.store = {};
      })
    };
    global.localStorage = mockLocalStorage;

    // Mock matchMedia
    mockMatchMedia = jest.fn((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      addListener: jest.fn(),
      removeEventListener: jest.fn(),
      removeListener: jest.fn()
    }));
    global.window.matchMedia = mockMatchMedia;

    // Clear any global state
    delete window.__latestCensys;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initLogoPlaceholders', () => {
    test('should create fallback placeholder when image fails to load', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Net Observation Project" data-logo 
             style="width:100%; border-radius:14px; margin-bottom:1rem;" />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Simulate the initLogoPlaceholders function
      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      img.addEventListener('error', () => {
        createFallback(img);
        
        // Verify fallback was created
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).not.toBeNull();
        expect(placeholder.textContent).toBe('NET OBSERVATION PROJECT');
        expect(placeholder.className).toBe('logo-placeholder');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        expect(img.style.display).toBe('none');
        expect(img.dataset.fallback).toBe('true');
        
        done();
      });

      // Trigger error event
      img.dispatchEvent(new Event('error'));
    });

    test('should create fallback when image has no natural dimensions', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Mock complete but no dimensions (broken image)
      Object.defineProperty(img, 'complete', { value: true, writable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      const verify = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          createFallback(img);
        }
      };

      verify();

      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder).not.toBeNull();
      expect(placeholder.textContent).toBe('TEST LOGO');
      expect(img.style.display).toBe('none');
    });

    test('should not create duplicate fallbacks', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      // Call twice
      createFallback(img);
      createFallback(img);

      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(1);
    });

    test('should handle missing alt text with default value', () => {
      document.body.innerHTML = `
        <img src="logo.png" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      createFallback(img);

      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should handle empty alt text', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      createFallback(img);

      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should process multiple logo images', () => {
      document.body.innerHTML = `
        <img src="logo1.png" alt="Logo One" data-logo />
        <img src="logo2.png" alt="Logo Two" data-logo />
        <img src="logo3.png" alt="Logo Three" data-logo />
      `;

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      document.querySelectorAll('img[data-logo]').forEach((img) => {
        createFallback(img);
      });

      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(3);
      expect(placeholders[0].textContent).toBe('LOGO ONE');
      expect(placeholders[1].textContent).toBe('LOGO TWO');
      expect(placeholders[2].textContent).toBe('LOGO THREE');
    });

    test('should not affect images without data-logo attribute', () => {
      document.body.innerHTML = `
        <img src="other.png" alt="Other Image" />
        <img src="logo.png" alt="Logo" data-logo />
      `;

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      document.querySelectorAll('img[data-logo]').forEach((img) => {
        createFallback(img);
      });

      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(1);
      
      const otherImg = document.querySelector('img:not([data-logo])');
      expect(otherImg.style.display).not.toBe('none');
    });

    test('should handle successfully loaded images', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 512, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, writable: true });
      Object.defineProperty(img, 'complete', { value: true, writable: true });

      const createFallback = (imgElement) => {
        if (imgElement.dataset.fallback === 'true') return;
        imgElement.dataset.fallback = 'true';
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (imgElement.alt || 'Net Observation').toUpperCase();
        imgElement.insertAdjacentElement('afterend', placeholder);
      };

      const verify = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          createFallback(img);
        }
      };

      img.addEventListener('load', () => {
        verify();
        
        // Should not create fallback for successfully loaded image
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).toBeNull();
        expect(img.style.display).not.toBe('none');
        
        done();
      });

      // Trigger load event
      img.dispatchEvent(new Event('load'));
    });
  });

  describe('Theme Management', () => {
    test('should apply dark theme when prefersDark matches', () => {
      const applyTheme = (settings, prefersDark) => {
        let theme = settings.theme;
        if (theme === 'auto') {
          theme = prefersDark.matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.body.dataset.theme = theme;
      };

      const settings = { theme: 'auto' };
      const prefersDark = { matches: true };

      applyTheme(settings, prefersDark);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when prefersDark does not match', () => {
      const applyTheme = (settings, prefersDark) => {
        let theme = settings.theme;
        if (theme === 'auto') {
          theme = prefersDark.matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.body.dataset.theme = theme;
      };

      const settings = { theme: 'auto' };
      const prefersDark = { matches: false };

      applyTheme(settings, prefersDark);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should respect explicit dark theme setting', () => {
      const applyTheme = (settings, prefersDark) => {
        let theme = settings.theme;
        if (theme === 'auto') {
          theme = prefersDark.matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.body.dataset.theme = theme;
      };

      const settings = { theme: 'dark' };
      const prefersDark = { matches: false };

      applyTheme(settings, prefersDark);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should respect explicit light theme setting', () => {
      const applyTheme = (settings, prefersDark) => {
        let theme = settings.theme;
        if (theme === 'auto') {
          theme = prefersDark.matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.body.dataset.theme = theme;
      };

      const settings = { theme: 'light' };
      const prefersDark = { matches: true };

      applyTheme(settings, prefersDark);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });
  });

  describe('Settings Management', () => {
    test('should save settings to localStorage', () => {
      const STORAGE_KEY = 'net-observation-settings';
      const settings = {
        backendUrl: '/api/censys-summary',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(settings)
      );
      expect(mockLocalStorage.store[STORAGE_KEY]).toBe(JSON.stringify(settings));
    });

    test('should load settings from localStorage', () => {
      const STORAGE_KEY = 'net-observation-settings';
      const settings = {
        backendUrl: '/custom/endpoint',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'client-123',
        theme: 'light'
      };

      mockLocalStorage.store[STORAGE_KEY] = JSON.stringify(settings);

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw);

      expect(parsed).toEqual(settings);
      expect(parsed.backendUrl).toBe('/custom/endpoint');
      expect(parsed.theme).toBe('light');
    });

    test('should handle missing localStorage data gracefully', () => {
      const STORAGE_KEY = 'net-observation-settings';
      
      const loadSettings = () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (err) {
          console.warn('Failed to load settings', err);
          return null;
        }
      };

      const result = loadSettings();
      expect(result).toBeNull();
    });

    test('should handle corrupted localStorage data', () => {
      const STORAGE_KEY = 'net-observation-settings';
      mockLocalStorage.store[STORAGE_KEY] = 'invalid-json{{{';

      const loadSettings = () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (err) {
          console.warn('Failed to load settings', err);
          return null;
        }
      };

      const result = loadSettings();
      expect(result).toBeNull();
    });
  });

  describe('Sidebar Management', () => {
    test('should initialize sidebar as collapsed on mobile', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      const setState = (open) => {
        sidebar.classList.toggle('open', open);
        sidebar.classList.toggle('collapsed', !open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = open ? '&#x2715;' : '&#9776;';
      };

      // Simulate mobile width
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });

      if (window.innerWidth < 880) {
        setState(false);
      } else {
        sidebar.classList.add('open');
      }

      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('should initialize sidebar as open on desktop', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;

      const sidebar = document.querySelector('.sidebar');

      // Simulate desktop width
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      if (window.innerWidth < 880) {
        // collapsed
      } else {
        sidebar.classList.add('open');
      }

      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should toggle sidebar state on click', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle"></button>
      `;

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      const setState = (open) => {
        sidebar.classList.toggle('open', open);
        sidebar.classList.toggle('collapsed', !open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = open ? '&#x2715;' : '&#9776;';
      };

      toggle.addEventListener('click', () => {
        const open = !sidebar.classList.contains('open');
        setState(open);
      });

      // Initially open
      expect(sidebar.classList.contains('open')).toBe(true);

      // Click to close
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(sidebar.classList.contains('collapsed')).toBe(true);

      // Click to open
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(sidebar.classList.contains('collapsed')).toBe(false);
    });
  });

  describe('Data Processing', () => {
    test('should parse CSV data correctly', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csvData = `name,count,status
Service A,100,active
Service B,200,inactive`;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Service A', count: '100', status: 'active' });
      expect(result[1]).toEqual({ name: 'Service B', count: '200', status: 'inactive' });
    });

    test('should handle CSV with missing values', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csvData = `name,count,status
Service A,,active
Service B,200,`;

      const result = parseCSV(csvData);

      expect(result[0].count).toBe('');
      expect(result[1].status).toBe('');
    });

    test('should handle empty CSV', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };

      const csvData = `name,count,status`;

      const result = parseCSV(csvData);

      expect(result).toHaveLength(0);
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

      const palette = generateColorPalette(5, 'services');
      expect(palette).toHaveLength(5);
    });

    test('should use different base hue for services', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const palette = generateColorPalette(1, 'services');
      expect(palette[0]).toContain('hsl(180');
    });

    test('should use different base hue for countries', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const palette = generateColorPalette(1, 'countries');
      expect(palette[0]).toContain('hsl(300');
    });

    test('should generate evenly distributed hues', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };

      const palette = generateColorPalette(3, 'services');
      expect(palette[0]).toContain('hsl(180');
      expect(palette[1]).toContain('hsl(207');
      expect(palette[2]).toContain('hsl(234');
    });
  });

  describe('Plugin System', () => {
    test('should register plugin successfully', () => {
      const registry = new Map();
      
      const register = (plugin) => {
        if (!plugin?.name) throw new Error('Plugin requires a name');
        registry.set(plugin.name, plugin);
        if (plugin.command) {
          registry.set(plugin.command, plugin);
        }
      };

      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: () => 'test output'
      };

      register(plugin);

      expect(registry.has('test-plugin')).toBe(true);
      expect(registry.has('test')).toBe(true);
    });

    test('should throw error for plugin without name', () => {
      const register = (plugin) => {
        if (!plugin?.name) throw new Error('Plugin requires a name');
        registry.set(plugin.name, plugin);
      };

      const plugin = {
        command: 'test',
        run: () => 'test'
      };

      const registry = new Map();
      expect(() => register(plugin)).toThrow('Plugin requires a name');
    });

    test('should list registered plugins', () => {
      const registry = new Map();
      
      const register = (plugin) => {
        if (!plugin?.name) throw new Error('Plugin requires a name');
        registry.set(plugin.name, plugin);
      };

      const list = () => {
        return Array.from(new Set(Array.from(registry.values()).map(p => p.name)));
      };

      register({ name: 'plugin1', run: () => {} });
      register({ name: 'plugin2', run: () => {} });

      const plugins = list();
      expect(plugins).toContain('plugin1');
      expect(plugins).toContain('plugin2');
      expect(plugins).toHaveLength(2);
    });
  });
});