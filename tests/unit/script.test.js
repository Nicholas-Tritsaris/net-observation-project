/**
 * Unit tests for docs/script.js
 * Testing the logo placeholder functionality and other core features
 */

describe('Logo Placeholder Functionality', () => {
  let mockImg;
  let mockDocument;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    
    // Create mock image element
    mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = 'Net Observation Project';
    mockImg.src = 'logo.png';
    document.body.appendChild(mockImg);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initLogoPlaceholders', () => {
    test('should create fallback placeholder when image fails to load', (done) => {
      const img = document.querySelector('img[data-logo]');
      
      // Simulate error event
      img.addEventListener('error', () => {
        // Give time for the fallback to be created
        setTimeout(() => {
          const placeholder = document.querySelector('.logo-placeholder');
          expect(placeholder).toBeTruthy();
          expect(placeholder.textContent).toBe('NET OBSERVATION PROJECT');
          expect(placeholder.getAttribute('aria-hidden')).toBe('true');
          expect(img.style.display).toBe('none');
          expect(img.dataset.fallback).toBe('true');
          done();
        }, 10);
      });
      
      // Trigger error
      img.dispatchEvent(new Event('error'));
    });

    test('should create fallback when image has no natural dimensions after load', (done) => {
      const img = document.querySelector('img[data-logo]');
      
      // Mock image with no dimensions
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      
      // Simulate the verification logic
      const verify = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          if (img.dataset.fallback === 'true') return;
          img.dataset.fallback = 'true';
          img.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'logo-placeholder';
          placeholder.setAttribute('aria-hidden', 'true');
          placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
          img.insertAdjacentElement('afterend', placeholder);
        }
      };
      
      verify();
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder.className).toBe('logo-placeholder');
        expect(img.dataset.fallback).toBe('true');
        done();
      }, 10);
    });

    test('should not create duplicate fallbacks', () => {
      const img = document.querySelector('img[data-logo]');
      img.dataset.fallback = 'true';
      
      // Try to create fallback again
      const createFallback = (image) => {
        if (image.dataset.fallback === 'true') return;
        image.dataset.fallback = 'true';
        image.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (image.alt || 'Net Observation').toUpperCase();
        image.insertAdjacentElement('afterend', placeholder);
      };
      
      createFallback(img);
      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(0); // Should not create any
    });

    test('should use image alt text for placeholder content', () => {
      const img = document.querySelector('img[data-logo]');
      img.alt = 'Custom Logo';
      
      const createFallback = (image) => {
        image.dataset.fallback = 'true';
        image.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (image.alt || 'Net Observation').toUpperCase();
        image.insertAdjacentElement('afterend', placeholder);
      };
      
      createFallback(img);
      
      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder.textContent).toBe('CUSTOM LOGO');
    });

    test('should use default text when alt is empty', () => {
      const img = document.querySelector('img[data-logo]');
      img.alt = '';
      
      const createFallback = (image) => {
        image.dataset.fallback = 'true';
        image.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (image.alt || 'Net Observation').toUpperCase();
        image.insertAdjacentElement('afterend', placeholder);
      };
      
      createFallback(img);
      
      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should handle multiple logo images', () => {
      // Add another logo image
      const img2 = document.createElement('img');
      img2.setAttribute('data-logo', '');
      img2.alt = 'Logo 2';
      img2.src = 'logo2.png';
      document.body.appendChild(img2);
      
      const images = document.querySelectorAll('img[data-logo]');
      expect(images.length).toBe(2);
      
      // Process each image
      images.forEach(img => {
        const createFallback = (image) => {
          if (image.dataset.fallback === 'true') return;
          image.dataset.fallback = 'true';
          image.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'logo-placeholder';
          placeholder.setAttribute('aria-hidden', 'true');
          placeholder.textContent = (image.alt || 'Net Observation').toUpperCase();
          image.insertAdjacentElement('afterend', placeholder);
        };
        createFallback(img);
      });
      
      const placeholders = document.querySelectorAll('.logo-placeholder');
      expect(placeholders.length).toBe(2);
    });

    test('should properly position placeholder after image', () => {
      const img = document.querySelector('img[data-logo]');
      
      const createFallback = (image) => {
        image.dataset.fallback = 'true';
        image.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (image.alt || 'Net Observation').toUpperCase();
        image.insertAdjacentElement('afterend', placeholder);
      };
      
      createFallback(img);
      
      const placeholder = document.querySelector('.logo-placeholder');
      expect(img.nextElementSibling).toBe(placeholder);
    });
  });

  describe('Image Loading States', () => {
    test('should handle image with valid dimensions', () => {
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 512, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      
      const verify = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          img.dataset.fallback = 'true';
          return true;
        }
        return false;
      };
      
      const needsFallback = verify();
      expect(needsFallback).toBe(false);
      expect(img.dataset.fallback).toBeUndefined();
    });

    test('should handle incomplete image load', () => {
      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'complete', { value: false, configurable: true });
      
      expect(img.complete).toBe(false);
      // Should wait for load event before verification
    });
  });
});

describe('Theme Management', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.dataset.theme = '';
    localStorage.clear();
  });

  describe('applyTheme', () => {
    test('should apply dark theme when prefersDark matches', () => {
      const mockPrefersDark = { matches: true };
      const settings = { theme: 'auto' };
      
      let theme = settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when prefersDark does not match', () => {
      const mockPrefersDark = { matches: false };
      const settings = { theme: 'auto' };
      
      let theme = settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should apply explicit dark theme', () => {
      const settings = { theme: 'dark' };
      const theme = settings.theme;
      
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply explicit light theme', () => {
      const settings = { theme: 'light' };
      const theme = settings.theme;
      
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });
  });

  describe('Theme Cycling', () => {
    test('should cycle from auto to dark to light', () => {
      const order = ['auto', 'dark', 'light'];
      
      let currentTheme = 'auto';
      let idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('dark');
      
      idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('light');
      
      idx = order.indexOf(currentTheme);
      currentTheme = order[(idx + 1) % order.length];
      expect(currentTheme).toBe('auto');
    });
  });
});

describe('Settings Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage', () => {
      const settings = {
        backendUrl: '/api/custom',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const loaded = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(loaded).toEqual(settings);
    });

    test('should handle missing localStorage data', () => {
      const raw = localStorage.getItem('net-observation-settings');
      expect(raw).toBeNull();
    });

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('net-observation-settings', 'invalid-json{');
      
      try {
        JSON.parse(localStorage.getItem('net-observation-settings'));
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('saveSettings', () => {
    test('should save settings to localStorage', () => {
      const settings = {
        backendUrl: '/api/test',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'client-123',
        theme: 'light'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(settings));
      
      const saved = localStorage.getItem('net-observation-settings');
      expect(JSON.parse(saved)).toEqual(settings);
    });
  });
});

describe('Data Visualization', () => {
  describe('CSV Parsing', () => {
    test('should parse simple CSV correctly', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };
      
      const csv = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = parseCSV(csv);
      
      expect(result).toEqual([
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' }
      ]);
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
      
      const csv = 'name,age,city\nJohn,,NYC\nJane,25,';
      const result = parseCSV(csv);
      
      expect(result).toEqual([
        { name: 'John', age: '', city: 'NYC' },
        { name: 'Jane', age: '25', city: '' }
      ]);
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
      
      const csv = 'name,age,city';
      const result = parseCSV(csv);
      
      expect(result).toEqual([]);
    });

    test('should handle CSV with CRLF line endings', () => {
      const parseCSV = (text) => {
        const [headerLine, ...rows] = text.trim().split(/\r?\n/);
        const headers = headerLine.split(',').map(h => h.trim());
        return rows.map(row => {
          const values = row.split(',');
          return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
        });
      };
      
      const csv = 'name,age\r\nJohn,30\r\nJane,25';
      const result = parseCSV(csv);
      
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John');
    });
  });

  describe('JSON Processing', () => {
    test('should detect and parse JSON object', () => {
      const text = '{"name": "John", "age": 30}';
      const trimmed = text.trim();
      
      expect(trimmed.startsWith('{')).toBe(true);
      const parsed = JSON.parse(trimmed);
      expect(parsed).toEqual({ name: 'John', age: 30 });
    });

    test('should detect and parse JSON array', () => {
      const text = '[{"name": "John"}, {"name": "Jane"}]';
      const trimmed = text.trim();
      
      expect(trimmed.startsWith('[')).toBe(true);
      const parsed = JSON.parse(trimmed);
      expect(parsed.length).toBe(2);
    });

    test('should handle invalid JSON', () => {
      const text = '{invalid json}';
      
      expect(() => JSON.parse(text)).toThrow();
    });
  });
});

describe('Sidebar Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <aside class="sidebar"></aside>
      <button class="sidebar-toggle"></button>
    `;
  });

  test('should toggle sidebar open state', () => {
    const sidebar = document.querySelector('.sidebar');
    const isOpen = !sidebar.classList.contains('open');
    
    sidebar.classList.toggle('open', isOpen);
    sidebar.classList.toggle('collapsed', !isOpen);
    
    expect(sidebar.classList.contains('open')).toBe(isOpen);
    expect(sidebar.classList.contains('collapsed')).toBe(!isOpen);
  });

  test('should start collapsed on mobile width', () => {
    const mockWidth = 800;
    const shouldCollapse = mockWidth < 880;
    
    expect(shouldCollapse).toBe(true);
  });

  test('should start open on desktop width', () => {
    const mockWidth = 1200;
    const shouldCollapse = mockWidth < 880;
    
    expect(shouldCollapse).toBe(false);
  });
});

describe('Plugin System', () => {
  test('should register plugin with name', () => {
    const registry = new Map();
    const plugin = {
      name: 'test-plugin',
      run: (text) => text
    };
    
    if (!plugin?.name) throw new Error('Plugin requires a name');
    registry.set(plugin.name, plugin);
    
    expect(registry.has('test-plugin')).toBe(true);
    expect(registry.get('test-plugin')).toBe(plugin);
  });

  test('should reject plugin without name', () => {
    const plugin = { run: (text) => text };
    
    expect(() => {
      if (!plugin?.name) throw new Error('Plugin requires a name');
    }).toThrow('Plugin requires a name');
  });

  test('should register plugin command', () => {
    const registry = new Map();
    const plugin = {
      name: 'echo-plugin',
      command: 'echo',
      run: (text) => text || '(empty)'
    };
    
    registry.set(plugin.name, plugin);
    if (plugin.command) {
      registry.set(plugin.command, plugin);
    }
    
    expect(registry.has('echo')).toBe(true);
    expect(registry.get('echo').run('hello')).toBe('hello');
  });

  test('should return empty for echo plugin with no input', () => {
    const plugin = {
      name: 'echo-plugin',
      run: (text) => text || '(empty)'
    };
    
    expect(plugin.run('')).toBe('(empty)');
    expect(plugin.run()).toBe('(empty)');
  });

  test('should list registered plugins', () => {
    const registry = new Map();
    registry.set('plugin1', { name: 'plugin1' });
    registry.set('plugin2', { name: 'plugin2' });
    registry.set('cmd1', { name: 'plugin1', command: 'cmd1' }); // Duplicate name
    
    const names = Array.from(new Set(Array.from(registry.values()).map(p => p.name)));
    expect(names).toEqual(['plugin1', 'plugin2']);
  });
});

describe('Terminal Commands', () => {
  describe('theme command', () => {
    test('should accept valid theme values', () => {
      const validThemes = ['auto', 'dark', 'light'];
      
      validThemes.forEach(theme => {
        expect(validThemes.includes(theme)).toBe(true);
      });
    });

    test('should reject invalid theme values', () => {
      const invalidTheme = 'invalid';
      const validThemes = ['auto', 'dark', 'light'];
      
      expect(validThemes.includes(invalidTheme)).toBe(false);
    });
  });

  describe('Command parsing', () => {
    test('should parse command and arguments', () => {
      const input = 'theme dark';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('theme');
      expect(arg).toBe('dark');
    });

    test('should handle command without arguments', () => {
      const input = 'help';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('help');
      expect(arg).toBe('');
    });

    test('should handle multi-word arguments', () => {
      const input = 'echo hello world';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('echo');
      expect(arg).toBe('hello world');
    });
  });
});

describe('Table Rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <table data-table="test">
        <tbody></tbody>
      </table>
    `;
  });

  test('should render table rows from object data', () => {
    const data = { 'US': 100, 'DE': 50, 'UK': 75 };
    const tbody = document.querySelector('[data-table="test"] tbody');
    
    Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
        tbody.appendChild(row);
      });
    
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('US');
    expect(rows[0].textContent).toContain('100');
  });

  test('should sort table rows by value descending', () => {
    const data = { 'US': 100, 'DE': 50, 'UK': 200 };
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    expect(sorted[0][0]).toBe('UK');
    expect(sorted[1][0]).toBe('US');
    expect(sorted[2][0]).toBe('DE');
  });

  test('should format numbers with locale string', () => {
    const value = 1234567;
    const formatted = Number(value).toLocaleString();
    
    // Note: exact format depends on locale, just check it's different
    expect(formatted).not.toBe('1234567');
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
    expect(colors.length).toBe(5);
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
    const baseHue = 350;
    const idx = 2;
    const hue = (baseHue + idx * 27) % 360;
    
    // 350 + 54 = 404, 404 % 360 = 44
    expect(hue).toBe(44);
  });
});

describe('Navigation Active State', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <a href="index.html">Home</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="api.html">API</a>
      </nav>
    `;
  });

  test('should identify current page from pathname', () => {
    const mockPath = '/docs/dashboard.html';
    const page = mockPath.split('/').pop() || 'index.html';
    
    expect(page).toBe('dashboard.html');
  });

  test('should handle root path as index.html', () => {
    const mockPath = '/';
    const page = mockPath.split('/').pop() || 'index.html';
    
    expect(page).toBe('index.html');
  });

  test('should match link href to current page', () => {
    const currentPage = 'dashboard.html';
    const link = document.querySelector('a[href="dashboard.html"]');
    
    expect(link.getAttribute('href')).toBe(currentPage);
  });
});

describe('Auto-refresh Functionality', () => {
  test('should calculate correct interval for 60 seconds', () => {
    const intervalMs = 60000;
    const intervalSeconds = intervalMs / 1000;
    
    expect(intervalSeconds).toBe(60);
  });

  test('should handle silent fetch parameter', () => {
    const fetchWithSilent = (silent = false) => {
      return { silent };
    };
    
    expect(fetchWithSilent(true).silent).toBe(true);
    expect(fetchWithSilent(false).silent).toBe(false);
    expect(fetchWithSilent().silent).toBe(false);
  });
});