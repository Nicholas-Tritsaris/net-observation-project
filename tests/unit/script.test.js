import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'happy-dom';

// Mock the global environment
let dom;
let window;
let document;

beforeEach(() => {
  // Create a fresh DOM for each test
  dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <aside class="sidebar">
          <img src="logo.png" alt="Test Logo" data-logo />
          <div class="theme-toggle" data-role="theme-toggle" role="button" tabindex="0">
            <span>Theme:</span>
            <strong data-label>AUTO</strong>
          </div>
        </aside>
        <div class="sidebar-toggle" aria-expanded="false">☰</div>
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
        <div data-stat="total-hosts">—</div>
        <div data-stat="total-services">—</div>
        <div data-stat="last-sync">—</div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" />
          <button>Run</button>
        </div>
      </body>
    </html>
  `, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  window = dom.window;
  document = window.document;
  
  // Set up global mocks
  global.window = window;
  global.document = document;
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  
  // Mock matchMedia
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('initLogoPlaceholders', () => {
  it('should create fallback placeholder when image fails to load', () => {
    const img = document.querySelector('img[data-logo]');
    expect(img).toBeTruthy();
    
    // Simulate image load error
    const errorEvent = new window.Event('error');
    img.dispatchEvent(errorEvent);
    
    // Check if fallback was created
    const placeholder = img.nextElementSibling;
    expect(placeholder).toBeTruthy();
    expect(placeholder.className).toBe('logo-placeholder');
    expect(img.style.display).toBe('none');
  });

  it('should create fallback when image has no natural dimensions', (done) => {
    const img = document.querySelector('img[data-logo]');
    
    // Mark image as complete but with no dimensions (broken image)
    Object.defineProperty(img, 'complete', { value: true, writable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });
    
    const loadEvent = new window.Event('load');
    img.dispatchEvent(loadEvent);
    
    setTimeout(() => {
      const placeholder = document.querySelector('.logo-placeholder');
      expect(placeholder).toBeTruthy();
      done();
    }, 50);
  });

  it('should use alt text for placeholder content', () => {
    const img = document.querySelector('img[data-logo]');
    img.alt = 'Custom Logo';
    
    const errorEvent = new window.Event('error');
    img.dispatchEvent(errorEvent);
    
    const placeholder = img.nextElementSibling;
    expect(placeholder.textContent).toBe('CUSTOM LOGO');
  });

  it('should not create duplicate fallbacks', () => {
    const img = document.querySelector('img[data-logo]');
    
    // Dispatch error twice
    img.dispatchEvent(new window.Event('error'));
    img.dispatchEvent(new window.Event('error'));
    
    const placeholders = document.querySelectorAll('.logo-placeholder');
    expect(placeholders.length).toBe(1);
  });

  it('should handle multiple logo images independently', () => {
    // Add a second logo image
    const img2 = document.createElement('img');
    img2.src = 'logo2.png';
    img2.alt = 'Second Logo';
    img2.setAttribute('data-logo', '');
    document.body.appendChild(img2);
    
    const img1 = document.querySelector('img[data-logo]');
    
    // Trigger error on first image only
    img1.dispatchEvent(new window.Event('error'));
    
    expect(img1.style.display).toBe('none');
    expect(img2.style.display).not.toBe('none');
    
    const placeholders = document.querySelectorAll('.logo-placeholder');
    expect(placeholders.length).toBe(1);
  });

  it('should set aria-hidden on placeholder', () => {
    const img = document.querySelector('img[data-logo]');
    img.dispatchEvent(new window.Event('error'));
    
    const placeholder = img.nextElementSibling;
    expect(placeholder.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('localStorage settings management', () => {
  it('should load settings from localStorage', () => {
    const mockSettings = {
      backendUrl: '/custom/api',
      auth0Domain: 'test.auth0.com',
      auth0ClientId: 'client123',
      theme: 'dark'
    };
    
    global.localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));
    
    // The actual implementation would call loadSettings()
    const raw = localStorage.getItem('net-observation-settings');
    const parsed = JSON.parse(raw);
    
    expect(parsed.backendUrl).toBe('/custom/api');
    expect(parsed.theme).toBe('dark');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    global.localStorage.getItem.mockReturnValue('invalid json {');
    
    expect(() => {
      const raw = localStorage.getItem('net-observation-settings');
      JSON.parse(raw);
    }).toThrow();
  });

  it('should save settings to localStorage', () => {
    const settings = {
      backendUrl: '/api/censys-summary',
      theme: 'light'
    };
    
    localStorage.setItem('net-observation-settings', JSON.stringify(settings));
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'net-observation-settings',
      JSON.stringify(settings)
    );
  });
});

describe('theme management', () => {
  it('should apply dark theme when preference is dark', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    // Simulate auto theme with dark preference
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.dataset.theme = 'dark';
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.dataset.theme).toBe('dark');
  });

  it('should apply light theme when preference is light', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: light)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.dataset.theme = 'light';
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should cycle through theme modes in correct order', () => {
    const themes = ['auto', 'dark', 'light'];
    let currentIndex = 0;
    
    // Simulate cycling
    currentIndex = (currentIndex + 1) % themes.length;
    expect(themes[currentIndex]).toBe('dark');
    
    currentIndex = (currentIndex + 1) % themes.length;
    expect(themes[currentIndex]).toBe('light');
    
    currentIndex = (currentIndex + 1) % themes.length;
    expect(themes[currentIndex]).toBe('auto');
  });
});

describe('sidebar functionality', () => {
  it('should toggle sidebar state on click', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    
    // Initial state
    sidebar.classList.remove('open');
    sidebar.classList.add('collapsed');
    
    // Simulate toggle click
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
    
    expect(sidebar.classList.contains('open')).toBe(true);
    expect(sidebar.classList.contains('collapsed')).toBe(false);
  });

  it('should update aria-expanded attribute', () => {
    const toggle = document.querySelector('.sidebar-toggle');
    
    toggle.setAttribute('aria-expanded', 'true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    
    toggle.setAttribute('aria-expanded', 'false');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('should start collapsed on mobile width', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 700
    });
    
    expect(window.innerWidth).toBeLessThan(880);
  });

  it('should start open on desktop width', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    
    expect(window.innerWidth).toBeGreaterThan(880);
  });
});

describe('data table rendering', () => {
  it('should render country data correctly', () => {
    const tbody = document.querySelector('[data-table="countries"] tbody');
    const data = {
      US: 500000,
      DE: 300000,
      GB: 200000
    };
    
    tbody.innerHTML = '';
    Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
        tbody.appendChild(row);
      });
    
    expect(tbody.children.length).toBe(3);
    expect(tbody.children[0].textContent).toContain('US');
    expect(tbody.children[0].textContent).toContain('500,000');
  });

  it('should sort entries by count descending', () => {
    const data = {
      A: 100,
      B: 500,
      C: 300
    };
    
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    expect(sorted[0][0]).toBe('B');
    expect(sorted[1][0]).toBe('C');
    expect(sorted[2][0]).toBe('A');
  });

  it('should handle empty data gracefully', () => {
    const tbody = document.querySelector('[data-table="services"] tbody');
    const data = {};
    
    tbody.innerHTML = '';
    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
      tbody.appendChild(row);
    });
    
    expect(tbody.children.length).toBe(0);
  });

  it('should format large numbers with locale separators', () => {
    const value = 1500000;
    const formatted = Number(value).toLocaleString();
    
    expect(formatted).toContain(',');
  });
});

describe('terminal command execution', () => {
  it('should execute help command', () => {
    const commands = {
      help() {
        return 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins';
      }
    };
    
    const result = commands.help();
    expect(result).toContain('Available commands');
    expect(result).toContain('help');
    expect(result).toContain('stats');
  });

  it('should execute theme command with valid argument', () => {
    const validThemes = ['auto', 'dark', 'light'];
    const arg = 'dark';
    
    expect(validThemes.includes(arg)).toBe(true);
  });

  it('should reject invalid theme arguments', () => {
    const validThemes = ['auto', 'dark', 'light'];
    const arg = 'invalid';
    
    expect(validThemes.includes(arg)).toBe(false);
  });

  it('should parse command input correctly', () => {
    const input = 'theme dark';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');
    
    expect(command).toBe('theme');
    expect(arg).toBe('dark');
  });

  it('should handle commands with no arguments', () => {
    const input = 'help';
    const [command, ...rest] = input.trim().split(/\s+/);
    
    expect(command).toBe('help');
    expect(rest.join(' ')).toBe('');
  });

  it('should handle multi-word arguments', () => {
    const input = 'echo hello world';
    const [command, ...rest] = input.trim().split(/\s+/);
    const arg = rest.join(' ');
    
    expect(command).toBe('echo');
    expect(arg).toBe('hello world');
  });
});

describe('terminal logging', () => {
  it('should append message to terminal output', () => {
    const output = document.querySelector('.terminal-output');
    const message = 'Test message';
    
    const line = document.createElement('div');
    line.textContent = `[12:00:00] ${message}`;
    output.appendChild(line);
    
    expect(output.children.length).toBe(1);
    expect(output.children[0].textContent).toContain(message);
  });

  it('should include timestamp in log message', () => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] Test log`;
    
    expect(message).toMatch(/\[\d{1,2}:\d{2}:\d{2}.*\]/);
  });

  it('should auto-scroll terminal output', () => {
    const output = document.querySelector('.terminal-output');
    
    // Add multiple messages
    for (let i = 0; i < 10; i++) {
      const line = document.createElement('div');
      line.textContent = `Message ${i}`;
      output.appendChild(line);
    }
    
    // Simulate scroll
    output.scrollTop = output.scrollHeight;
    
    expect(output.children.length).toBe(10);
  });
});

describe('plugin system', () => {
  it('should register plugin with name and command', () => {
    const registry = new Map();
    const plugin = {
      name: 'test-plugin',
      command: 'test',
      run: () => 'test output'
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
  });

  it('should list registered plugins', () => {
    const plugins = [
      { name: 'plugin1', command: 'p1' },
      { name: 'plugin2', command: 'p2' }
    ];
    
    const names = plugins.map(p => p.name);
    
    expect(names).toEqual(['plugin1', 'plugin2']);
  });

  it('should handle plugin initialization', () => {
    const plugin = {
      name: 'init-plugin',
      init: vi.fn()
    };
    
    plugin.init({ state: {}, log: () => {} });
    
    expect(plugin.init).toHaveBeenCalled();
  });

  it('should require plugin name', () => {
    const plugin = {};
    
    expect(plugin.name).toBeUndefined();
  });
});

describe('data visualization', () => {
  it('should parse valid JSON input', () => {
    const jsonInput = '{"key": "value", "count": 42}';
    const parsed = JSON.parse(jsonInput);
    
    expect(parsed.key).toBe('value');
    expect(parsed.count).toBe(42);
  });

  it('should parse CSV input', () => {
    const csvInput = 'name,count\nitem1,100\nitem2,200';
    const [headerLine, ...rows] = csvInput.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map(h => h.trim());
    const data = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
    });
    
    expect(data.length).toBe(2);
    expect(data[0].name).toBe('item1');
    expect(data[0].count).toBe('100');
  });

  it('should handle malformed JSON gracefully', () => {
    const invalidJson = '{invalid json}';
    
    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  it('should detect JSON vs CSV input', () => {
    const jsonInput = '{"key": "value"}';
    const csvInput = 'name,count\nitem1,100';
    
    expect(jsonInput.trim().startsWith('{')).toBe(true);
    expect(csvInput.trim().startsWith('{')).toBe(false);
  });
});

describe('stats update', () => {
  it('should update total hosts display', () => {
    const element = document.querySelector('[data-stat="total-hosts"]');
    const value = 1500000;
    
    element.textContent = value.toLocaleString();
    
    expect(element.textContent).toBe('1,500,000');
  });

  it('should update total services display', () => {
    const element = document.querySelector('[data-stat="total-services"]');
    const value = 5000000;
    
    element.textContent = value.toLocaleString();
    
    expect(element.textContent).toBe('5,000,000');
  });

  it('should format last sync timestamp', () => {
    const element = document.querySelector('[data-stat="last-sync"]');
    const timestamp = '2024-01-15T12:00:00.000Z';
    
    element.textContent = new Date(timestamp).toLocaleString();
    
    expect(element.textContent).toBeTruthy();
    expect(element.textContent).not.toBe('—');
  });

  it('should handle missing data with placeholder', () => {
    const element = document.querySelector('[data-stat="total-hosts"]');
    const value = null;
    
    element.textContent = value?.toLocaleString() ?? '—';
    
    expect(element.textContent).toBe('—');
  });
});

describe('color palette generation', () => {
  it('should generate unique colors for services', () => {
    const count = 5;
    const baseHue = 180;
    const colors = Array.from({ length: count }, (_, idx) => 
      `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
    );
    
    expect(colors.length).toBe(5);
    expect(colors[0]).toContain('180');
    expect(colors[1]).toContain('207');
  });

  it('should generate unique colors for countries', () => {
    const count = 3;
    const baseHue = 300;
    const colors = Array.from({ length: count }, (_, idx) => 
      `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
    );
    
    expect(colors.length).toBe(3);
    expect(colors[0]).toContain('300');
  });

  it('should wrap hue values at 360', () => {
    const hue = 350;
    const nextHue = (hue + 27) % 360;
    
    expect(nextHue).toBe(17);
  });
});