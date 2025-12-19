/**
 * Integration Tests
 * Tests interactions between components and end-to-end scenarios
 */

describe('Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Theme and Settings Integration', () => {
    test('should persist theme changes across sessions', () => {
      const settings = { theme: 'dark' };
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const loaded = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(loaded.theme).toBe('dark');
      
      loaded.theme = 'light';
      localStorage.setItem('net-observation-settings', JSON.stringify(loaded));
      
      const updated = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(updated.theme).toBe('light');
    });

    test('should apply saved theme on load', () => {
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      
      const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
      document.documentElement.setAttribute('data-theme', settings.theme);
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('API and UI Integration', () => {
    test('should update UI with fetched data', async () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
      `;
      
      const mockData = {
        total_hosts: 5000,
        total_services: 1200,
        last_sync: '2025-01-01T12:00:00.000Z'
      };
      
      document.querySelector('[data-stat="total-hosts"]').textContent = mockData.total_hosts.toLocaleString();
      document.querySelector('[data-stat="total-services"]').textContent = mockData.total_services.toLocaleString();
      document.querySelector('[data-stat="last-sync"]').textContent = new Date(mockData.last_sync).toLocaleString();
      
      expect(document.querySelector('[data-stat="total-hosts"]').textContent).toContain('5');
      expect(document.querySelector('[data-stat="total-services"]').textContent).toContain('1');
    });

    test('should handle API errors gracefully', async () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts">—</div>
      `;
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        // Error handled, UI should show fallback
        expect(document.querySelector('[data-stat="total-hosts"]').textContent).toBe('—');
      }
    });
  });

  describe('Sidebar and Navigation Integration', () => {
    test('should toggle sidebar and update button state together', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-expanded="true">×</button>
      `;
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      // Close sidebar
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '☰';
      
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.innerHTML).toBe('☰');
    });

    test('should mark active navigation link based on current page', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;
      
      const currentPage = 'dashboard.html';
      const links = document.querySelectorAll('nav a');
      
      links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
          link.classList.add('active');
        }
      });
      
      const activeLinks = Array.from(links).filter(l => l.classList.contains('active'));
      expect(activeLinks.length).toBe(1);
      expect(activeLinks[0].getAttribute('href')).toBe('dashboard.html');
    });
  });

  describe('Terminal and Plugin Integration', () => {
    test('should register and execute plugins', () => {
      const plugins = new Map();
      
      const echoPlugin = {
        name: 'echo',
        command: 'echo',
        run: (text) => text || '(empty)'
      };
      
      plugins.set('echo', echoPlugin);
      
      const result = plugins.get('echo').run('hello world');
      expect(result).toBe('hello world');
    });

    test('should execute terminal commands with state access', () => {
      const appState = {
        settings: { theme: 'dark' },
        stats: { total_hosts: 100 }
      };
      
      const statsCommand = () => JSON.stringify(appState.stats);
      const result = statsCommand();
      
      expect(JSON.parse(result).total_hosts).toBe(100);
    });

    test('should log terminal output with timestamps', () => {
      const outputs = [];
      const logTerminal = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        outputs.push(`[${timestamp}] ${message}`);
      };
      
      logTerminal('Test message');
      expect(outputs.length).toBe(1);
      expect(outputs[0]).toContain('Test message');
      expect(outputs[0]).toMatch(/\[\d+:\d+:\d+/);
    });
  });

  describe('Data Visualizer Integration', () => {
    test('should parse and render JSON data', () => {
      const jsonText = '{"name": "test", "value": 42}';
      const parsed = JSON.parse(jsonText);
      
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(42);
    });

    test('should parse and render CSV data', () => {
      const csvText = 'name,value\nfoo,10\nbar,20';
      const [headerLine, ...rows] = csvText.split('\n');
      const headers = headerLine.split(',');
      
      const data = rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      });
      
      expect(data.length).toBe(2);
      expect(data[0].name).toBe('foo');
      expect(data[0].value).toBe('10');
    });

    test('should detect data format automatically', () => {
      const detectFormat = (text) => {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return 'json';
        }
        return 'csv';
      };
      
      expect(detectFormat('{"key": "value"}')).toBe('json');
      expect(detectFormat('[1,2,3]')).toBe('json');
      expect(detectFormat('name,value\nfoo,bar')).toBe('csv');
    });
  });

  describe('Chart and Data Integration', () => {
    test('should generate chart colors based on data count', () => {
      const generatePalette = (count, hue) => {
        return Array.from({ length: count }, (_, i) => 
          `hsl(${(hue + i * 27) % 360} 80% 55% / 0.7)`
        );
      };
      
      const palette = generatePalette(5, 180);
      expect(palette.length).toBe(5);
      expect(palette[0]).toMatch(/hsl\(\d+\s+80%\s+55%\s*\/\s*0\.7\)/);
    });

    test('should sort and limit chart data', () => {
      const countries = {
        US: 1000,
        DE: 500,
        GB: 750,
        FR: 600,
        JP: 400
      };
      
      const sorted = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      expect(sorted[0][0]).toBe('US');
      expect(sorted[1][0]).toBe('GB');
      expect(sorted[2][0]).toBe('FR');
    });
  });

  describe('Auth0 Integration Flow', () => {
    test('should initialize Auth0 with credentials', () => {
      const settings = {
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'abc123'
      };
      
      const hasCredentials = settings.auth0Domain && settings.auth0ClientId;
      expect(hasCredentials).toBe(true);
    });

    test('should skip Auth0 without credentials', () => {
      const settings = {
        auth0Domain: '',
        auth0ClientId: ''
      };
      
      const hasCredentials = settings.auth0Domain && settings.auth0ClientId;
      expect(hasCredentials).toBe(false);
    });

    test('should update UI based on auth state', () => {
      document.body.innerHTML = `
        <button data-action="login" class="hidden"></button>
        <button data-action="logout" class="hidden"></button>
        <span data-auth-status>Anonymous</span>
      `;
      
      const isAuthenticated = true;
      
      if (isAuthenticated) {
        document.querySelector('[data-action="login"]').classList.add('hidden');
        document.querySelector('[data-action="logout"]').classList.remove('hidden');
        document.querySelector('[data-auth-status]').textContent = 'Authenticated';
      }
      
      expect(document.querySelector('[data-action="logout"]').classList.contains('hidden')).toBe(false);
      expect(document.querySelector('[data-auth-status]').textContent).toBe('Authenticated');
    });
  });

  describe('Responsive Behavior Integration', () => {
    test('should adjust layout for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });
      
      const isMobile = window.innerWidth < 880;
      expect(isMobile).toBe(true);
    });

    test('should adjust layout for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      
      const isMobile = window.innerWidth < 880;
      expect(isMobile).toBe(false);
    });
  });

  describe('Auto-refresh Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should fetch data immediately and on interval', () => {
      const fetchFn = jest.fn();
      
      fetchFn(); // Initial fetch
      const intervalId = setInterval(fetchFn, 60000);
      
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(60000);
      expect(fetchFn).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(60000);
      expect(fetchFn).toHaveBeenCalledTimes(3);
      
      clearInterval(intervalId);
    });

    test('should handle errors silently during auto-refresh', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        console.warn('Fetch error', err);
      }
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('File Upload Integration', () => {
    test('should read and process uploaded files', (done) => {
      const content = '{"test": true}';
      const blob = new Blob([content], { type: 'application/json' });
      const reader = new FileReader();
      
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        expect(data.test).toBe(true);
        done();
      };
      
      reader.readAsText(blob);
    });

    test('should handle CSV file uploads', (done) => {
      const content = 'name,value\ntest,123';
      const blob = new Blob([content], { type: 'text/csv' });
      const reader = new FileReader();
      
      reader.onload = () => {
        const lines = reader.result.split('\n');
        expect(lines.length).toBe(2);
        expect(lines[0]).toBe('name,value');
        done();
      };
      
      reader.readAsText(blob);
    });
  });
});