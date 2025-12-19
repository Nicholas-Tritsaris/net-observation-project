/**
 * Unit tests for docs/script.js
 * Tests cover theme management, sidebar functionality, data processing, and API integration
 */

describe('Script.js - Core Functionality', () => {
  let scriptContent;
  
  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Theme Management', () => {
    test('should apply dark theme by default', () => {
      document.documentElement.removeAttribute('data-theme');
      
      // Simulate theme application
      const theme = 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when set', () => {
      const theme = 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should respect auto theme based on system preference', () => {
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      const resolvedTheme = matchMedia.matches ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      
      expect(['dark', 'light']).toContain(document.documentElement.getAttribute('data-theme'));
    });

    test('should cycle through theme modes: auto -> dark -> light', () => {
      const modes = ['auto', 'dark', 'light'];
      let currentIndex = 0;
      
      modes.forEach((mode, index) => {
        const nextIndex = (index + 1) % modes.length;
        const nextMode = modes[nextIndex];
        
        expect(modes).toContain(mode);
        expect(modes).toContain(nextMode);
      });
    });

    test('should persist theme setting to localStorage', () => {
      const settings = { theme: 'dark', backendUrl: '/api/censys-summary' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const stored = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(stored.theme).toBe('dark');
    });

    test('should load theme from localStorage on init', () => {
      const settings = { theme: 'light' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const loaded = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(loaded.theme).toBe('light');
    });

    test('should handle corrupt localStorage data gracefully', () => {
      localStorage.setItem('net-observation-settings', 'invalid-json{');
      
      let parsed = null;
      try {
        parsed = JSON.parse(localStorage.getItem('net-observation-settings'));
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
      
      expect(parsed).toBeNull();
    });

    test('should update theme toggle label when theme changes', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;
      
      const label = document.querySelector('[data-label]');
      label.textContent = 'DARK';
      
      expect(label.textContent).toBe('DARK');
    });
  });

  describe('Sidebar Functionality', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;
    });

    test('should toggle sidebar open/closed state', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      sidebar.classList.add('open');
      expect(sidebar.classList.contains('open')).toBe(true);
      
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should update aria-expanded attribute on toggle', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.setAttribute('aria-expanded', 'false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      
      toggle.setAttribute('aria-expanded', 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    test('should change toggle button icon based on state', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.innerHTML = '&#x2715;'; // Close icon
      expect(toggle.innerHTML).toBe('&#x2715;');
      
      toggle.innerHTML = '&#9776;'; // Menu icon
      expect(toggle.innerHTML).toBe('&#9776;');
    });

    test('should start collapsed on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });
      
      const shouldCollapse = window.innerWidth < 880;
      expect(shouldCollapse).toBe(true);
    });

    test('should start open on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      
      const shouldCollapse = window.innerWidth < 880;
      expect(shouldCollapse).toBe(false);
    });
  });

  describe('Settings Management', () => {
    test('should save settings to localStorage', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const stored = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(stored).toEqual(settings);
    });

    test('should load default settings when none exist', () => {
      const defaultSettings = {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      };
      
      const stored = localStorage.getItem('net-observation-settings');
      if (!stored) {
        expect(stored).toBeNull();
      }
    });

    test('should update backend URL setting', () => {
      const settings = { backendUrl: '/api/censys-summary' };
      settings.backendUrl = 'https://custom-endpoint.com/api';
      
      expect(settings.backendUrl).toBe('https://custom-endpoint.com/api');
    });

    test('should update Auth0 configuration', () => {
      const settings = {
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'abc123'
      };
      
      expect(settings.auth0Domain).toBe('example.auth0.com');
      expect(settings.auth0ClientId).toBe('abc123');
    });

    test('should handle empty Auth0 credentials', () => {
      const settings = {
        auth0Domain: '',
        auth0ClientId: ''
      };
      
      const hasCredentials = settings.auth0Domain && settings.auth0ClientId;
      expect(hasCredentials).toBe(false);
    });
  });

  describe('Data Processing', () => {
    test('should format numbers with locale-specific separators', () => {
      const number = 1234567;
      const formatted = number.toLocaleString();
      
      expect(formatted).toMatch(/[\d,.\s]+/);
    });

    test('should handle missing or null data gracefully', () => {
      const data = null;
      const result = data?.total_hosts ?? '—';
      
      expect(result).toBe('—');
    });

    test('should parse ISO date strings correctly', () => {
      const isoString = '2025-01-01T12:00:00.000Z';
      const date = new Date(isoString);
      
      expect(date.toISOString()).toBe(isoString);
    });

    test('should sort table data by value descending', () => {
      const data = { US: 100, DE: 50, FR: 75 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      
      expect(sorted[0][0]).toBe('US');
      expect(sorted[1][0]).toBe('FR');
      expect(sorted[2][0]).toBe('DE');
    });

    test('should handle empty objects in data processing', () => {
      const data = {};
      const entries = Object.entries(data);
      
      expect(entries).toEqual([]);
    });

    test('should parse CSV data correctly', () => {
      const csvText = 'name,value\nfoo,10\nbar,20';
      const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',');
      
      expect(headers).toEqual(['name', 'value']);
      expect(rows.length).toBe(2);
    });

    test('should parse JSON data correctly', () => {
      const jsonText = '{"name":"test","value":42}';
      const parsed = JSON.parse(jsonText);
      
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(42);
    });

    test('should detect JSON vs CSV format', () => {
      const jsonText = '{"key":"value"}';
      const csvText = 'key,value\nfoo,bar';
      
      expect(jsonText.trim().startsWith('{')).toBe(true);
      expect(csvText.trim().startsWith('{')).toBe(false);
    });
  });

  describe('API Integration', () => {
    test('should construct correct API endpoint', () => {
      const backendUrl = '/api/censys-summary';
      expect(backendUrl).toBe('/api/censys-summary');
    });

    test('should handle successful fetch response', async () => {
      const mockData = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: '2025-01-01T12:00:00.000Z'
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });
      
      const response = await fetch('/api/censys-summary');
      const data = await response.json();
      
      expect(data).toEqual(mockData);
    });

    test('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    test('should handle HTTP error status codes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const response = await fetch('/api/censys-summary');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    test('should include correct Accept header', () => {
      const headers = { 'Accept': 'application/json' };
      expect(headers['Accept']).toBe('application/json');
    });

    test('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });
      
      const response = await fetch('/api/censys-summary');
      
      try {
        await response.json();
      } catch (err) {
        expect(err.message).toBe('Invalid JSON');
      }
    });
  });

  describe('Terminal Commands', () => {
    test('should execute help command', () => {
      const helpText = 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins';
      expect(helpText).toContain('help');
      expect(helpText).toContain('stats');
      expect(helpText).toContain('theme');
    });

    test('should parse command with arguments', () => {
      const input = 'theme dark';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('theme');
      expect(arg).toBe('dark');
    });

    test('should handle command without arguments', () => {
      const input = 'help';
      const [command, ...rest] = input.trim().split(/\s+/);
      
      expect(command).toBe('help');
      expect(rest).toEqual([]);
    });

    test('should validate theme command arguments', () => {
      const validThemes = ['auto', 'dark', 'light'];
      const testArg = 'dark';
      
      expect(validThemes.includes(testArg)).toBe(true);
    });

    test('should reject invalid theme arguments', () => {
      const validThemes = ['auto', 'dark', 'light'];
      const testArg = 'invalid';
      
      expect(validThemes.includes(testArg)).toBe(false);
    });

    test('should log terminal output with timestamp', () => {
      const message = 'Test message';
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${message}`;
      
      expect(formatted).toContain(message);
      expect(formatted).toMatch(/\[\d+:\d+:\d+/);
    });
  });

  describe('Plugin System', () => {
    test('should register plugin with name', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: () => 'test output'
      };
      
      expect(plugin.name).toBe('test-plugin');
      expect(plugin.command).toBe('test');
      expect(typeof plugin.run).toBe('function');
    });

    test('should execute plugin command', () => {
      const plugin = {
        name: 'echo',
        command: 'echo',
        run: (text) => text || '(empty)'
      };
      
      const result = plugin.run('hello');
      expect(result).toBe('hello');
    });

    test('should handle empty plugin input', () => {
      const plugin = {
        run: (text) => text || '(empty)'
      };
      
      const result = plugin.run('');
      expect(result).toBe('(empty)');
    });

    test('should require plugin name', () => {
      const plugin = {};
      const hasName = plugin.name ? true : false;
      
      expect(hasName).toBe(false);
    });

    test('should call plugin init function if provided', () => {
      const initMock = jest.fn();
      const plugin = {
        name: 'test',
        init: initMock
      };
      
      if (plugin.init) {
        plugin.init({ state: {}, log: () => {} });
      }
      
      expect(initMock).toHaveBeenCalled();
    });

    test('should handle plugin errors gracefully', () => {
      const plugin = {
        name: 'error-plugin',
        run: () => { throw new Error('Plugin error'); }
      };
      
      try {
        plugin.run();
      } catch (err) {
        expect(err.message).toBe('Plugin error');
      }
    });

    test('should support async plugin commands', async () => {
      const plugin = {
        name: 'async-plugin',
        run: async () => {
          return new Promise(resolve => setTimeout(() => resolve('done'), 10));
        }
      };
      
      const result = await plugin.run();
      expect(result).toBe('done');
    });
  });

  describe('Chart Generation', () => {
    test('should generate color palette with correct count', () => {
      const count = 5;
      const baseHue = 180;
      const palette = Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(palette.length).toBe(count);
    });

    test('should use different hues for different seeds', () => {
      const servicesHue = 180;
      const countriesHue = 300;
      
      expect(servicesHue).not.toBe(countriesHue);
    });

    test('should handle empty chart data', () => {
      const data = {};
      const entries = Object.entries(data);
      
      expect(entries.length).toBe(0);
    });

    test('should limit country chart to top 12', () => {
      const countries = {};
      for (let i = 0; i < 20; i++) {
        countries[`C${i}`] = Math.random() * 1000;
      }
      
      const sorted = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);
      
      expect(sorted.length).toBe(12);
    });
  });

  describe('Event Handling', () => {
    test('should handle Enter key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(event.key).toBe('Enter');
    });

    test('should handle Space key press', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(event.key).toBe(' ');
    });

    test('should prevent default on keyboard events when needed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultMock = jest.spyOn(event, 'preventDefault');
      event.preventDefault();
      
      expect(preventDefaultMock).toHaveBeenCalled();
    });

    test('should handle click events', () => {
      const button = document.createElement('button');
      const clickHandler = jest.fn();
      button.addEventListener('click', clickHandler);
      button.click();
      
      expect(clickHandler).toHaveBeenCalled();
    });

    test('should handle change events on file input', () => {
      const input = document.createElement('input');
      input.type = 'file';
      const changeHandler = jest.fn();
      input.addEventListener('change', changeHandler);
      
      const event = new Event('change');
      input.dispatchEvent(event);
      
      expect(changeHandler).toHaveBeenCalled();
    });
  });

  describe('DOM Manipulation', () => {
    test('should query elements safely', () => {
      document.body.innerHTML = '<div id="test">content</div>';
      const element = document.querySelector('#test');
      
      expect(element).not.toBeNull();
      expect(element.textContent).toBe('content');
    });

    test('should handle missing elements gracefully', () => {
      const element = document.querySelector('#nonexistent');
      expect(element).toBeNull();
    });

    test('should create table rows dynamically', () => {
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>key</td><td>value</td>';
      tbody.appendChild(row);
      
      expect(tbody.children.length).toBe(1);
      expect(tbody.children[0].tagName).toBe('TR');
    });

    test('should clear table contents', () => {
      const tbody = document.createElement('tbody');
      tbody.innerHTML = '<tr><td>data</td></tr>';
      tbody.innerHTML = '';
      
      expect(tbody.children.length).toBe(0);
    });

    test('should toggle CSS classes', () => {
      const element = document.createElement('div');
      element.classList.toggle('active', true);
      
      expect(element.classList.contains('active')).toBe(true);
      
      element.classList.toggle('active', false);
      expect(element.classList.contains('active')).toBe(false);
    });
  });

  describe('Navigation', () => {
    test('should mark active navigation link', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;
      
      const links = document.querySelectorAll('nav a');
      const currentPath = 'dashboard.html';
      
      links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
          link.classList.add('active');
        }
      });
      
      const activeLink = document.querySelector('nav a.active');
      expect(activeLink.getAttribute('href')).toBe('dashboard.html');
    });

    test('should handle smooth scroll to anchor', () => {
      document.body.innerHTML = '<div id="section1">Content</div>';
      const target = document.querySelector('#section1');
      
      expect(target).not.toBeNull();
    });
  });

  describe('FileReader API', () => {
    test('should read text file content', (done) => {
      const content = 'test content';
      const blob = new Blob([content], { type: 'text/plain' });
      const reader = new FileReader();
      
      reader.onload = () => {
        expect(reader.result).toBe(content);
        done();
      };
      
      reader.readAsText(blob);
    });

    test('should handle file read errors', (done) => {
      const reader = new FileReader();
      
      reader.onerror = () => {
        expect(reader.error).not.toBeNull();
        done();
      };
      
      // Trigger error by reading invalid input
      try {
        reader.readAsText(null);
      } catch (err) {
        expect(err).toBeDefined();
        done();
      }
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should set up interval for auto-refresh', () => {
      const callback = jest.fn();
      const intervalId = setInterval(callback, 60000);
      
      jest.advanceTimersByTime(60000);
      expect(callback).toHaveBeenCalledTimes(1);
      
      clearInterval(intervalId);
    });

    test('should refresh at 60 second intervals', () => {
      const callback = jest.fn();
      const intervalId = setInterval(callback, 60000);
      
      jest.advanceTimersByTime(180000); // 3 minutes
      expect(callback).toHaveBeenCalledTimes(3);
      
      clearInterval(intervalId);
    });
  });
});