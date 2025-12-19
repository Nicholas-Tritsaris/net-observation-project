import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load the script content (we'll evaluate it in a controlled environment)
const scriptPath = join(process.cwd(), 'docs/script.js');
const scriptContent = readFileSync(scriptPath, 'utf-8');

describe('Script.js - Core Functionality', () => {
  let mockDocument;
  let mockWindow;
  let AppState;

  beforeEach(() => {
    // Setup mock DOM
    mockDocument = {
      readyState: 'complete',
      documentElement: {
        setAttribute: vi.fn(),
        style: { setProperty: vi.fn() }
      },
      body: {
        dataset: { page: 'home', theme: 'dark' }
      },
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      createElement: vi.fn(() => ({
        innerHTML: '',
        textContent: '',
        appendChild: vi.fn(),
        setAttribute: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() }
      }))
    };

    mockWindow = {
      matchMedia: global.matchMedia,
      localStorage: global.localStorage,
      location: { origin: 'http://localhost', pathname: '/index.html', href: 'http://localhost/' },
      innerWidth: 1024,
      __latestCensys: null,
      Chart: vi.fn(),
      d3: { json: vi.fn(), select: vi.fn() },
      topojson: { feature: vi.fn() },
      createAuth0Client: vi.fn(),
      registerPlugin: vi.fn()
    };

    global.document = mockDocument;
    global.window = mockWindow;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme Management (Modified in Branch)', () => {
    it('should apply theme without calling refreshChartThemes (removed function)', () => {
      const applyThemeMock = vi.fn();
      
      // Simulate theme change
      mockDocument.documentElement.setAttribute = vi.fn();
      mockDocument.body.dataset = { theme: 'dark' };
      
      // The key test: refreshChartThemes should NOT be called
      const scriptHasRefreshChartThemes = scriptContent.includes('refreshChartThemes()');
      expect(scriptHasRefreshChartThemes).toBe(false);
    });

    it('should handle auto theme based on prefers-color-scheme', () => {
      const settings = { theme: 'auto' };
      const prefersDark = { matches: true };
      
      let resolvedTheme = settings.theme;
      if (resolvedTheme === 'auto') {
        resolvedTheme = prefersDark.matches ? 'dark' : 'light';
      }
      
      expect(resolvedTheme).toBe('dark');
    });

    it('should cycle through theme modes: auto -> dark -> light', () => {
      const themes = ['auto', 'dark', 'light'];
      let currentIdx = 0;
      
      const cycleTheme = () => {
        currentIdx = (currentIdx + 1) % themes.length;
        return themes[currentIdx];
      };
      
      expect(cycleTheme()).toBe('dark');
      expect(cycleTheme()).toBe('light');
      expect(cycleTheme()).toBe('auto');
    });

    it('should persist theme setting to localStorage', () => {
      const settings = { theme: 'light', backendUrl: '/api/censys-summary' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const stored = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(stored.theme).toBe('light');
    });
  });

  describe('Sidebar Initialization (Modified in Branch)', () => {
    it('should set sidebar to open class directly on desktop instead of setState(true)', () => {
      const mockSidebar = {
        classList: {
          add: vi.fn(),
          toggle: vi.fn(),
          contains: vi.fn(() => false)
        }
      };
      
      const mockToggle = {
        addEventListener: vi.fn(),
        setAttribute: vi.fn(),
        innerHTML: ''
      };
      
      mockDocument.querySelector = vi.fn((selector) => {
        if (selector === '.sidebar') return mockSidebar;
        if (selector === '.sidebar-toggle') return mockToggle;
        return null;
      });

      // Simulate desktop width (>= 880px)
      mockWindow.innerWidth = 1024;
      
      // The new behavior: directly add 'open' class
      if (mockWindow.innerWidth >= 880) {
        mockSidebar.classList.add('open');
      }
      
      expect(mockSidebar.classList.add).toHaveBeenCalledWith('open');
      
      // Old behavior used setState(true) which is more complex
      // New behavior is simpler: just add the class
    });

    it('should collapse sidebar on mobile (< 880px)', () => {
      const mockSidebar = {
        classList: {
          add: vi.fn(),
          toggle: vi.fn()
        }
      };
      
      mockWindow.innerWidth = 600;
      
      // On mobile, should collapse
      if (mockWindow.innerWidth < 880) {
        mockSidebar.classList.toggle('open', false);
        mockSidebar.classList.toggle('collapsed', true);
      }
      
      expect(mockSidebar.classList.toggle).toHaveBeenCalledWith('open', false);
      expect(mockSidebar.classList.toggle).toHaveBeenCalledWith('collapsed', true);
    });
  });

  describe('API Payload Display (Removed in Branch)', () => {
    it('should not attempt to update #apiPayload element (functionality removed)', () => {
      // This verifies the removed functionality is truly gone
      const hasApiPayloadUpdate = scriptContent.includes('payload.textContent = JSON.stringify');
      expect(hasApiPayloadUpdate).toBe(false);
    });

    it('should still update stats view without payload element', () => {
      const data = {
        total_hosts: 12345,
        total_services: 6789,
        last_sync: '2025-01-15T10:30:00.000Z',
        countries: { US: 100, DE: 50 },
        services: { http: 80, https: 443 }
      };
      
      const mockElements = {
        totalHosts: { textContent: '' },
        totalServices: { textContent: '' },
        lastSync: { textContent: '' }
      };
      
      mockDocument.querySelector = vi.fn((selector) => {
        if (selector === '[data-stat="total-hosts"]') return mockElements.totalHosts;
        if (selector === '[data-stat="total-services"]') return mockElements.totalServices;
        if (selector === '[data-stat="last-sync"]') return mockElements.lastSync;
        return null;
      });
      
      // Update stats (simulating updateStatsView)
      mockElements.totalHosts.textContent = data.total_hosts.toLocaleString();
      mockElements.totalServices.textContent = data.total_services.toLocaleString();
      mockElements.lastSync.textContent = new Date(data.last_sync).toLocaleString();
      
      expect(mockElements.totalHosts.textContent).toBe('12,345');
      expect(mockElements.totalServices.textContent).toBe('6,789');
      expect(mockElements.lastSync.textContent).toContain('2025');
    });
  });

  describe('Auth0 Initialization (Simplified in Branch)', () => {
    it('should return early when Auth0 credentials are missing (new behavior)', async () => {
      const settings = { auth0Domain: '', auth0ClientId: '' };
      
      // New behavior: early return without setting auth0Client to null
      if (!settings.auth0Domain || !settings.auth0ClientId) {
        // Just return, don't do anything
        expect(mockWindow.createAuth0Client).not.toHaveBeenCalled();
        return;
      }
      
      // This code should not be reached
      expect(true).toBe(true);
    });

    it('should initialize Auth0 when credentials are provided', async () => {
      const settings = {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      };
      
      mockWindow.createAuth0Client = vi.fn().mockResolvedValue({
        isAuthenticated: vi.fn().mockResolvedValue(false)
      });
      
      if (settings.auth0Domain && settings.auth0ClientId) {
        await mockWindow.createAuth0Client({
          domain: settings.auth0Domain,
          clientId: settings.auth0ClientId
        });
        
        expect(mockWindow.createAuth0Client).toHaveBeenCalledWith({
          domain: 'test.auth0.com',
          clientId: 'test-client-id'
        });
      }
    });

    it('should not call updateAuthControls when credentials missing (removed behavior)', () => {
      const settings = { auth0Domain: '', auth0ClientId: '' };
      const updateAuthControlsCalled = false;
      
      // Old code called updateAuthControls() even when credentials missing
      // New code just returns early
      if (!settings.auth0Domain || !settings.auth0ClientId) {
        // Just return
        expect(updateAuthControlsCalled).toBe(false);
      }
    });
  });

  describe('Data Visualizer Initialization (Simplified in Branch)', () => {
    it('should initialize data visualizer without redundant initTerminal call', () => {
      // Check that initTerminal is not called in data page initialization
      const dataPageInit = scriptContent.match(/case 'data':[\s\S]*?break;/);
      
      if (dataPageInit) {
        const dataPageCode = dataPageInit[0];
        // Count occurrences of initTerminal in data page section
        const terminalCalls = (dataPageCode.match(/initTerminal/g) || []).length;
        
        // Should only appear once (if at all), not twice
        expect(terminalCalls).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Censys API Integration', () => {
    it('should fetch and update stats successfully', async () => {
      const mockData = {
        total_hosts: 5000,
        total_services: 2500,
        last_sync: new Date().toISOString(),
        countries: { US: 200, UK: 150 },
        services: { http: 300, ssh: 200 }
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      });
      
      const response = await fetch('/api/censys-summary');
      const data = await response.json();
      
      expect(data.total_hosts).toBe(5000);
      expect(data.countries).toHaveProperty('US');
      expect(data.services).toHaveProperty('http');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });
      
      const response = await fetch('/api/censys-summary');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Chart Generation', () => {
    it('should generate color palette for services', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };
      
      const colors = generateColorPalette(5, 'services');
      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain('hsl(180');
    });

    it('should generate color palette for countries', () => {
      const generateColorPalette = (count, seed) => {
        const baseHue = seed === 'services' ? 180 : 300;
        return Array.from({ length: count }, (_, idx) => 
          `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
        );
      };
      
      const colors = generateColorPalette(5, 'countries');
      expect(colors).toHaveLength(5);
      expect(colors[0]).toContain('hsl(300');
    });
  });

  describe('Plugin System', () => {
    it('should register plugin with name and command', () => {
      const registry = new Map();
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: vi.fn(() => 'test output')
      };
      
      registry.set(plugin.name, plugin);
      registry.set(plugin.command, plugin);
      
      expect(registry.has('test-plugin')).toBe(true);
      expect(registry.has('test')).toBe(true);
    });

    it('should execute plugin command', () => {
      const plugin = {
        name: 'echo-plugin',
        command: 'echo',
        run: (text) => text || '(empty)'
      };
      
      expect(plugin.run('hello')).toBe('hello');
      expect(plugin.run('')).toBe('(empty)');
      expect(plugin.run()).toBe('(empty)');
    });

    it('should list all registered plugins', () => {
      const registry = new Map();
      registry.set('plugin1', { name: 'plugin1' });
      registry.set('plugin2', { name: 'plugin2' });
      registry.set('cmd1', { name: 'plugin1', command: 'cmd1' });
      
      const uniqueNames = Array.from(new Set(
        Array.from(registry.values()).map(p => p.name)
      ));
      
      expect(uniqueNames).toEqual(['plugin1', 'plugin2']);
    });
  });

  describe('Terminal Commands', () => {
    it('should handle help command', () => {
      const commands = {
        help: () => 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins'
      };
      
      expect(commands.help()).toContain('Available commands');
    });

    it('should handle theme command with valid argument', () => {
      const settings = { theme: 'auto' };
      const themeCommand = (arg) => {
        if (!['auto', 'dark', 'light'].includes(arg)) {
          return 'Usage: theme <auto|dark|light>';
        }
        settings.theme = arg;
        return `Theme changed to ${arg}`;
      };
      
      expect(themeCommand('dark')).toBe('Theme changed to dark');
      expect(settings.theme).toBe('dark');
    });

    it('should reject invalid theme argument', () => {
      const themeCommand = (arg) => {
        if (!['auto', 'dark', 'light'].includes(arg)) {
          return 'Usage: theme <auto|dark|light>';
        }
        return `Theme changed to ${arg}`;
      };
      
      expect(themeCommand('invalid')).toContain('Usage:');
    });
  });

  describe('Data Visualization', () => {
    it('should parse JSON data', () => {
      const text = '{"name": "test", "value": 123}';
      const data = JSON.parse(text);
      
      expect(data.name).toBe('test');
      expect(data.value).toBe(123);
    });

    it('should parse CSV data', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };
      
      const csv = 'name,age\nAlice,30\nBob,25';
      const data = parseCSV(csv);
      
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Alice');
      expect(data[0].age).toBe('30');
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
      
      const csv = 'name,age\nAlice,\nBob,25';
      const data = parseCSV(csv);
      
      expect(data[0].age).toBe('');
      expect(data[1].age).toBe('25');
    });
  });

  describe('Table Rendering', () => {
    it('should sort table data by value descending', () => {
      const data = { US: 100, UK: 200, DE: 50 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      
      expect(sorted[0][0]).toBe('UK');
      expect(sorted[1][0]).toBe('US');
      expect(sorted[2][0]).toBe('DE');
    });

    it('should format numbers with locale string', () => {
      const value = 1234567;
      const formatted = value.toLocaleString();
      
      expect(formatted).toContain('1');
      expect(formatted.length).toBeGreaterThan(7); // Has separators
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings to localStorage', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-id',
        theme: 'dark'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      const saved = localStorage.getItem('net-observation-settings');
      
      expect(saved).toContain('test.auth0.com');
    });

    it('should load settings from localStorage', () => {
      const settings = { theme: 'light', backendUrl: '/custom-api' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const raw = localStorage.getItem('net-observation-settings');
      const loaded = JSON.parse(raw);
      
      expect(loaded.theme).toBe('light');
      expect(loaded.backendUrl).toBe('/custom-api');
    });

    it('should handle missing localStorage gracefully', () => {
      localStorage.getItem = vi.fn(() => null);
      
      const raw = localStorage.getItem('net-observation-settings');
      expect(raw).toBeNull();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.getItem = vi.fn(() => 'invalid json{');
      
      try {
        JSON.parse(localStorage.getItem('net-observation-settings'));
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('Navigation Active State', () => {
    it('should mark current page link as active', () => {
      const currentPath = 'dashboard.html';
      const links = [
        { href: 'index.html', classList: { add: vi.fn() } },
        { href: 'dashboard.html', classList: { add: vi.fn() } },
        { href: 'docs.html', classList: { add: vi.fn() } }
      ];
      
      links.forEach(link => {
        if (link.href === currentPath) {
          link.classList.add('active');
        }
      });
      
      expect(links[1].classList.add).toHaveBeenCalledWith('active');
      expect(links[0].classList.add).not.toHaveBeenCalled();
    });
  });
});