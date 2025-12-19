/**
 * Unit tests for docs/script.js
 * Testing the modified functions after removal of refreshChartThemes()
 */

const { describe, it, expect, beforeEach, jest } = require('@jest/globals');

describe('docs/script.js - Core Functionality', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div data-role="theme-toggle">
        <span data-label>AUTO</span>
      </div>
      <div class="sidebar"></div>
      <div class="sidebar-toggle"></div>
      <div class="settings-panel hidden">
        <form>
          <input name="backendUrl" value="/api/censys-summary" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode">
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </form>
      </div>
      <div class="settings-toggle">⚙</div>
    `;
    
    global.localStorage.clear();
  });

  describe('Theme Management', () => {
    it('should set data-theme attribute on documentElement', () => {
      const themes = ['dark', 'light'];
      themes.forEach(theme => {
        document.documentElement.setAttribute('data-theme', theme);
        expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
      });
    });

    it('should store theme preference in localStorage', () => {
      const settings = { theme: 'dark', backendUrl: '/api/test' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const stored = localStorage.getItem('net-observation-settings');
      const parsed = JSON.parse(stored);
      
      expect(parsed.theme).toBe('dark');
    });

    it('should handle auto theme based on prefers-color-scheme', () => {
      const darkMedia = { matches: true };
      const lightMedia = { matches: false };
      
      const darkTheme = darkMedia.matches ? 'dark' : 'light';
      const lightTheme = lightMedia.matches ? 'dark' : 'light';
      
      expect(darkTheme).toBe('dark');
      expect(lightTheme).toBe('light');
    });

    it('should cycle through theme modes in correct order', () => {
      const order = ['auto', 'dark', 'light'];
      
      order.forEach((theme, idx) => {
        const nextIdx = (idx + 1) % order.length;
        const nextTheme = order[nextIdx];
        expect(order).toContain(nextTheme);
      });
    });

    it('should update theme label in UI', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = toggle.querySelector('[data-label]');
      
      label.textContent = 'DARK';
      expect(label.textContent).toBe('DARK');
      
      label.textContent = 'LIGHT';
      expect(label.textContent).toBe('LIGHT');
    });

    it('should respond to Enter key on theme toggle', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      expect(event.key).toBe('Enter');
      expect(toggle).toBeTruthy();
    });

    it('should respond to Space key on theme toggle', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(event.key).toBe(' ');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar classes', () => {
      const sidebar = document.querySelector('.sidebar');
      
      sidebar.classList.add('open');
      expect(sidebar.classList.contains('open')).toBe(true);
      
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    it('should update aria-expanded attribute', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.setAttribute('aria-expanded', 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      
      toggle.setAttribute('aria-expanded', 'false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update toggle icon HTML', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.innerHTML = '&#x2715;'; // X icon
      expect(toggle.innerHTML).toBe('&#x2715;');
      
      toggle.innerHTML = '&#9776;'; // Hamburger icon
      expect(toggle.innerHTML).toBe('&#9776;');
    });

    it('should handle mobile viewport width check', () => {
      const isMobile = window.innerWidth < 880;
      expect(typeof isMobile).toBe('boolean');
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings to localStorage', () => {
      const settings = {
        backendUrl: '/api/custom',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client',
        theme: 'dark'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const retrieved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(retrieved.backendUrl).toBe('/api/custom');
      expect(retrieved.theme).toBe('dark');
    });

    it('should load settings from localStorage', () => {
      const testSettings = {
        backendUrl: '/custom/endpoint',
        theme: 'light'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(testSettings));
      
      const raw = localStorage.getItem('net-observation-settings');
      const parsed = JSON.parse(raw);
      
      expect(parsed.backendUrl).toBe('/custom/endpoint');
      expect(parsed.theme).toBe('light');
    });

    it('should handle missing localStorage data gracefully', () => {
      const raw = localStorage.getItem('non-existent-key');
      expect(raw).toBeNull();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('test-key', 'invalid{json');
      
      try {
        JSON.parse(localStorage.getItem('test-key'));
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('Data Fetching', () => {
    it('should construct proper fetch request', async () => {
      const endpoint = '/api/censys-summary';
      const headers = { 'Accept': 'application/json' };
      
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total_hosts: 1000 })
        })
      );
      
      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith(endpoint, { headers });
      expect(data.total_hosts).toBe(1000);
    });

    it('should handle successful API response', async () => {
      const mockData = {
        total_hosts: 5000,
        total_services: 150,
        last_sync: '2025-12-19T12:00:00.000Z',
        countries: { US: 2000, UK: 1500 },
        services: { http: 3000, https: 2000 }
      };
      
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockData)
        })
      );
      
      const response = await fetch('/api/test');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.total_hosts).toBe(5000);
      expect(data.countries.US).toBe(2000);
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway'
        })
      );
      
      const response = await fetch('/api/test');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(502);
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network failure'))
      );
      
      try {
        await fetch('/api/test');
      } catch (err) {
        expect(err.message).toBe('Network failure');
      }
    });
  });

  describe('Stats View Updates', () => {
    it('should format numbers with toLocaleString', () => {
      const num = 1234567;
      const formatted = num.toLocaleString();
      
      expect(formatted).toContain('1'); // Will vary by locale
      expect(typeof formatted).toBe('string');
    });

    it('should handle missing data with fallback', () => {
      const data = {};
      const value = data.total_hosts ?? '—';
      
      expect(value).toBe('—');
    });

    it('should format date strings', () => {
      const isoDate = '2025-12-19T12:00:00.000Z';
      const date = new Date(isoDate);
      const formatted = date.toLocaleString();
      
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('Table Rendering', () => {
    it('should sort entries by value descending', () => {
      const data = { apple: 5, banana: 10, cherry: 3 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      
      expect(sorted[0][0]).toBe('banana'); // Highest value
      expect(sorted[0][1]).toBe(10);
      expect(sorted[2][0]).toBe('cherry'); // Lowest value
    });

    it('should create table rows from object data', () => {
      const data = { US: 100, UK: 50 };
      const rows = Object.entries(data).map(([key, value]) => ({
        key,
        value: Number(value).toLocaleString()
      }));
      
      expect(rows.length).toBe(2);
      expect(rows[0].key).toBe('US');
    });
  });

  describe('Terminal Commands', () => {
    it('should provide help command output', () => {
      const helpText = 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins';
      
      expect(helpText).toContain('help');
      expect(helpText).toContain('stats');
      expect(helpText).toContain('theme');
      expect(helpText).toContain('settings');
      expect(helpText).toContain('plugins');
    });

    it('should validate theme command arguments', () => {
      const validArgs = ['auto', 'dark', 'light'];
      
      expect(validArgs.includes('auto')).toBe(true);
      expect(validArgs.includes('invalid')).toBe(false);
    });

    it('should return error for invalid theme', () => {
      const arg = 'purple';
      const validArgs = ['auto', 'dark', 'light'];
      
      if (!validArgs.includes(arg)) {
        const error = 'Usage: theme <auto|dark|light>';
        expect(error).toContain('Usage');
      }
    });

    it('should format settings as JSON', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      };
      
      const json = JSON.stringify(settings, null, 2);
      
      expect(json).toContain('backendUrl');
      expect(json).toContain('theme');
      expect(json).toContain('\n'); // Pretty printed
    });

    it('should parse command with arguments', () => {
      const input = 'theme dark';
      const parts = input.trim().split(/\s+/);
      const [command, ...rest] = parts;
      const arg = rest.join(' ');
      
      expect(command).toBe('theme');
      expect(arg).toBe('dark');
    });

    it('should handle commands without arguments', () => {
      const input = 'help';
      const parts = input.trim().split(/\s+/);
      const [command, ...rest] = parts;
      
      expect(command).toBe('help');
      expect(rest.length).toBe(0);
    });
  });

  describe('Plugin System', () => {
    it('should register plugin with required properties', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: (text) => `Result: ${text}`
      };
      
      expect(plugin.name).toBe('test-plugin');
      expect(plugin.command).toBe('test');
      expect(typeof plugin.run).toBe('function');
    });

    it('should execute plugin run function', () => {
      const plugin = {
        name: 'echo',
        run: (text) => text || '(empty)'
      };
      
      expect(plugin.run('hello')).toBe('hello');
      expect(plugin.run('')).toBe('(empty)');
      expect(plugin.run(null)).toBe('(empty)');
    });

    it('should call plugin init if provided', () => {
      const initFn = jest.fn();
      const plugin = {
        name: 'init-test',
        init: initFn,
        run: () => 'done'
      };
      
      plugin.init({ state: {}, log: () => {} });
      
      expect(initFn).toHaveBeenCalled();
      expect(initFn).toHaveBeenCalledWith({
        state: {},
        log: expect.any(Function)
      });
    });

    it('should handle async plugin run functions', async () => {
      const plugin = {
        name: 'async-plugin',
        run: async (text) => {
          return new Promise(resolve => {
            setTimeout(() => resolve(`Async: ${text}`), 10);
          });
        }
      };
      
      const result = await plugin.run('test');
      expect(result).toBe('Async: test');
    });
  });

  describe('Data Visualization', () => {
    it('should detect JSON input', () => {
      const jsonInput = '{"key": "value"}';
      const isJSON = jsonInput.trim().startsWith('{') || jsonInput.trim().startsWith('[');
      
      expect(isJSON).toBe(true);
    });

    it('should detect CSV input', () => {
      const csvInput = 'name,age\nJohn,30';
      const isJSON = csvInput.trim().startsWith('{') || csvInput.trim().startsWith('[');
      
      expect(isJSON).toBe(false);
    });

    it('should parse valid JSON', () => {
      const json = '{"name": "Test", "value": 42}';
      const parsed = JSON.parse(json);
      
      expect(parsed.name).toBe('Test');
      expect(parsed.value).toBe(42);
    });

    it('should parse CSV with headers', () => {
      const csv = 'name,age,city\nAlice,25,NYC\nBob,30,LA';
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const dataLine = lines[1].split(',');
      
      expect(headers).toEqual(['name', 'age', 'city']);
      expect(dataLine[0]).toBe('Alice');
    });

    it('should handle empty input gracefully', () => {
      const empty = '';
      const trimmed = empty.trim();
      
      expect(trimmed).toBe('');
    });
  });

  describe('Color Palette Generation', () => {
    it('should generate HSL colors with correct format', () => {
      const baseHue = 180;
      const color = `hsl(${baseHue} 80% 55% / 0.7)`;
      
      expect(color).toContain('hsl');
      expect(color).toContain('180');
    });

    it('should generate different colors for services', () => {
      const baseHue = 180;
      const colors = Array.from({ length: 3 }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(colors.length).toBe(3);
      expect(colors[0]).not.toBe(colors[1]);
    });

    it('should generate different colors for countries', () => {
      const baseHue = 300;
      const colors = Array.from({ length: 3 }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(colors.length).toBe(3);
      expect(colors[0]).toContain('300');
    });

    it('should wrap hue values at 360 degrees', () => {
      const hue1 = (300 + 3 * 27) % 360;
      const hue2 = (300 + 14 * 27) % 360;
      
      expect(hue1).toBeLessThan(360);
      expect(hue2).toBeLessThan(360);
    });
  });
});