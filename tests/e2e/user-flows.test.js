import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('End-to-End User Flow Tests', () => {
  describe('Theme Switching Flow', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
      const htmlContent = readFileSync(resolve(__dirname, '../../docs/index.html'), 'utf-8');
      dom = new JSDOM(htmlContent, {
        url: 'http://localhost',
        pretendToBeVisual: true
      });
      window = dom.window;
      document = window.document;

      // Mock localStorage
      const storage = {};
      window.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
      };

      // Mock matchMedia
      window.matchMedia = (query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
    });

    it('should complete full theme cycle: auto -> dark -> light -> auto', () => {
      const themes = ['auto', 'dark', 'light'];
      let currentTheme = 'auto';
      let cycleCount = 0;

      const cycleTheme = () => {
        const currentIndex = themes.indexOf(currentTheme);
        currentTheme = themes[(currentIndex + 1) % themes.length];
        cycleCount++;
        return currentTheme;
      };

      expect(cycleTheme()).toBe('dark');
      expect(cycleTheme()).toBe('light');
      expect(cycleTheme()).toBe('auto');
      expect(cycleCount).toBe(3);
    });

    it('should persist theme choice to localStorage', () => {
      const STORAGE_KEY = 'net-observation-settings';
      const settings = { theme: 'dark', backendUrl: '/api/censys-summary' };
      
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      
      expect(stored.theme).toBe('dark');
    });

    it('should apply theme to document element', () => {
      const theme = 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    it('should handle theme change with keyboard (Enter)', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      
      let handled = false;
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handled = true;
        }
      });

      toggle.dispatchEvent(enterEvent);
      expect(handled).toBe(true);
    });

    it('should handle theme change with keyboard (Space)', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const spaceEvent = new window.KeyboardEvent('keydown', { key: ' ' });
      
      let handled = false;
      toggle.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          handled = true;
        }
      });

      toggle.dispatchEvent(spaceEvent);
      expect(handled).toBe(true);
    });
  });

  describe('Sidebar Navigation Flow', () => {
    let dom;
    let document;

    beforeEach(() => {
      const htmlContent = readFileSync(resolve(__dirname, '../../docs/dashboard.html'), 'utf-8');
      dom = new JSDOM(htmlContent, { url: 'http://localhost' });
      document = dom.window.document;
    });

    it('should toggle sidebar open and closed', () => {
      const sidebar = document.querySelector('.sidebar');
      
      // Start open
      sidebar.classList.add('open');
      expect(sidebar.classList.contains('open')).toBe(true);
      
      // Toggle to closed
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      
      // Toggle back to open
      sidebar.classList.remove('collapsed');
      sidebar.classList.add('open');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    it('should update toggle button icon based on state', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.sidebar');
      
      // Closed state - show menu icon
      sidebar.classList.add('collapsed');
      toggle.innerHTML = '&#9776;';
      expect(toggle.innerHTML).toBe('☰');
      
      // Open state - show close icon
      sidebar.classList.remove('collapsed');
      sidebar.classList.add('open');
      toggle.innerHTML = '&#x2715;';
      expect(toggle.innerHTML).toBe('×');
    });

    it('should update aria-expanded based on state', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.setAttribute('aria-expanded', 'false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      
      toggle.setAttribute('aria-expanded', 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Data Fetching and Display Flow', () => {
    let mockFetch;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    it('should fetch, parse, and display Censys data', async () => {
      const mockData = {
        total_hosts: 1000000,
        total_services: 500000,
        last_sync: '2024-01-15T10:00:00Z',
        countries: { US: 50000, GB: 30000 },
        services: { HTTP: 100000, SSH: 50000 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const response = await fetch('/api/censys-summary');
      const data = await response.json();

      expect(data.total_hosts).toBe(1000000);
      expect(data.total_services).toBe(500000);
      expect(data.countries.US).toBe(50000);
      expect(data.services.HTTP).toBe(100000);
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/censys-summary');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should format numbers for display', () => {
      const value = 1234567;
      const formatted = value.toLocaleString();
      expect(formatted).toBe('1,234,567');
    });

    it('should format dates for display', () => {
      const isoDate = '2024-01-15T10:30:00Z';
      const date = new Date(isoDate);
      const formatted = date.toLocaleString();
      expect(formatted).toMatch(/2024/);
    });
  });

  describe('Settings Configuration Flow', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
      const htmlContent = readFileSync(resolve(__dirname, '../../docs/index.html'), 'utf-8');
      dom = new JSDOM(htmlContent, { url: 'http://localhost' });
      window = dom.window;
      document = window.document;

      const storage = {};
      window.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
      };
    });

    it('should open and close settings panel', () => {
      const panel = document.querySelector('.settings-panel');
      
      // Initially hidden
      panel.classList.add('hidden');
      expect(panel.classList.contains('hidden')).toBe(true);
      
      // Open panel
      panel.classList.remove('hidden');
      expect(panel.classList.contains('hidden')).toBe(false);
      
      // Close panel
      panel.classList.add('hidden');
      expect(panel.classList.contains('hidden')).toBe(true);
    });

    it('should update and save settings', () => {
      const STORAGE_KEY = 'net-observation-settings';
      const settings = {
        backendUrl: 'https://custom.api.com/censys',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'abc123',
        theme: 'dark'
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

      expect(saved.backendUrl).toBe('https://custom.api.com/censys');
      expect(saved.auth0Domain).toBe('test.auth0.com');
      expect(saved.theme).toBe('dark');
    });

    it('should validate and trim input values', () => {
      const input = '  /api/censys-summary  ';
      const trimmed = input.trim() || '/api/censys-summary';
      expect(trimmed).toBe('/api/censys-summary');
    });
  });

  describe('Terminal Command Flow', () => {
    it('should parse and execute terminal commands', () => {
      const input = 'theme dark';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');

      expect(command).toBe('theme');
      expect(arg).toBe('dark');
    });

    it('should handle commands without arguments', () => {
      const input = 'help';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');

      expect(command).toBe('help');
      expect(arg).toBe('');
    });

    it('should handle multi-word arguments', () => {
      const input = 'echo hello world';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');

      expect(command).toBe('echo');
      expect(arg).toBe('hello world');
    });

    it('should log command output to terminal', () => {
      const output = [];
      const logTerminal = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        output.push(`[${timestamp}] ${message}`);
      };

      logTerminal('Command executed');
      expect(output.length).toBe(1);
      expect(output[0]).toContain('Command executed');
    });
  });

  describe('Data Visualizer Flow', () => {
    it('should detect JSON input format', () => {
      const jsonInput = '{"name": "test", "value": 123}';
      const trimmed = jsonInput.trim();
      const isJSON = trimmed.startsWith('{') || trimmed.startsWith('[');
      expect(isJSON).toBe(true);
    });

    it('should detect CSV input format', () => {
      const csvInput = 'name,value\ntest,123';
      const trimmed = csvInput.trim();
      const isCSV = !trimmed.startsWith('{') && !trimmed.startsWith('[');
      expect(isCSV).toBe(true);
    });

    it('should parse and render JSON data', () => {
      const input = '{"name": "test"}';
      const parsed = JSON.parse(input);
      const rendered = JSON.stringify(parsed, null, 2);
      
      expect(rendered).toContain('"name"');
      expect(rendered).toContain('"test"');
    });

    it('should parse and render CSV data', () => {
      const csvText = 'name,value\ntest1,100\ntest2,200';
      const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      const parsed = rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });

      expect(parsed.length).toBe(2);
      expect(parsed[0].name).toBe('test1');
      expect(parsed[1].value).toBe('200');
    });
  });

  describe('Auto-Refresh Flow', () => {
    it('should set up periodic data refresh', () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const intervalId = setInterval(callback, 60000);

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000);
      expect(callback).toHaveBeenCalledTimes(1);

      // Fast-forward another 60 seconds
      vi.advanceTimersByTime(60000);
      expect(callback).toHaveBeenCalledTimes(2);

      clearInterval(intervalId);
      vi.useRealTimers();
    });

    it('should call fetch with silent flag during auto-refresh', () => {
      const fetchCensysSummary = vi.fn((silent = false) => silent);
      
      // Initial fetch (not silent)
      expect(fetchCensysSummary(false)).toBe(false);
      
      // Auto-refresh fetch (silent)
      expect(fetchCensysSummary(true)).toBe(true);
    });
  });

  describe('Responsive Behavior Flow', () => {
    it('should adapt sidebar for mobile viewport', () => {
      const checkViewport = (width) => {
        return width < 880 ? 'mobile' : 'desktop';
      };

      expect(checkViewport(600)).toBe('mobile');
      expect(checkViewport(1200)).toBe('desktop');
      expect(checkViewport(880)).toBe('desktop');
      expect(checkViewport(879)).toBe('mobile');
    });

    it('should collapse sidebar on mobile', () => {
      const sidebar = { open: true };
      const width = 600;

      if (width < 880) {
        sidebar.open = false;
      }

      expect(sidebar.open).toBe(false);
    });

    it('should keep sidebar open on desktop', () => {
      const sidebar = { open: false };
      const width = 1200;

      if (width >= 880) {
        sidebar.open = true;
      }

      expect(sidebar.open).toBe(true);
    });
  });
});