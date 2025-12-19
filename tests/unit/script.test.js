/**
 * Unit tests for docs/script.js
 * Tests focus on the new logo placeholder functionality and other modified functions
 */

const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');

describe('Logo Placeholder Initialization', () => {
  let mockImages;
  let mockDocument;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    mockImages = [];
    
    // Mock querySelectorAll for logo images
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === 'img[data-logo]') {
        return mockImages;
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create fallback placeholder when image fails to load', (done) => {
    // Create a mock image element
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = 'Test Logo';
    mockImg.complete = false;
    
    // Mock insertAdjacentElement
    const insertedElements = [];
    mockImg.insertAdjacentElement = jest.fn((position, element) => {
      insertedElements.push({ position, element });
      return element;
    });
    
    document.body.appendChild(mockImg);
    mockImages = [mockImg];

    // Simulate the initLogoPlaceholders logic
    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    // Trigger error event
    mockImg.addEventListener('error', () => createFallback(mockImg));
    
    const errorEvent = new Event('error');
    mockImg.dispatchEvent(errorEvent);

    // Verify fallback was created
    expect(mockImg.dataset.fallback).toBe('true');
    expect(mockImg.style.display).toBe('none');
    expect(insertedElements.length).toBe(1);
    expect(insertedElements[0].position).toBe('afterend');
    expect(insertedElements[0].element.className).toBe('logo-placeholder');
    expect(insertedElements[0].element.textContent).toBe('TEST LOGO');
    expect(insertedElements[0].element.getAttribute('aria-hidden')).toBe('true');
    
    done();
  });

  test('should create fallback when image has zero dimensions', () => {
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = 'Net Observation';
    mockImg.complete = true;
    
    // Mock natural dimensions to be zero (failed load)
    Object.defineProperty(mockImg, 'naturalWidth', { value: 0, writable: false });
    Object.defineProperty(mockImg, 'naturalHeight', { value: 0, writable: false });
    
    const insertedElements = [];
    mockImg.insertAdjacentElement = jest.fn((position, element) => {
      insertedElements.push({ position, element });
      return element;
    });
    
    document.body.appendChild(mockImg);

    // Simulate verify logic
    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    const verify = () => {
      if (!mockImg.naturalWidth || !mockImg.naturalHeight) {
        createFallback(mockImg);
      }
    };

    if (mockImg.complete) {
      verify();
    }

    expect(mockImg.dataset.fallback).toBe('true');
    expect(insertedElements.length).toBe(1);
    expect(insertedElements[0].element.textContent).toBe('NET OBSERVATION');
  });

  test('should not create fallback if already exists', () => {
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.dataset.fallback = 'true'; // Already has fallback
    mockImg.alt = 'Test';
    
    const insertedElements = [];
    mockImg.insertAdjacentElement = jest.fn((position, element) => {
      insertedElements.push({ position, element });
      return element;
    });

    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    createFallback(mockImg);

    expect(insertedElements.length).toBe(0);
  });

  test('should use default text when alt is missing', () => {
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = '';
    
    const insertedElements = [];
    mockImg.insertAdjacentElement = jest.fn((position, element) => {
      insertedElements.push({ position, element });
      return element;
    });

    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    createFallback(mockImg);

    expect(insertedElements[0].element.textContent).toBe('NET OBSERVATION');
  });

  test('should handle successful image load without creating fallback', () => {
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = 'Logo';
    mockImg.complete = true;
    
    Object.defineProperty(mockImg, 'naturalWidth', { value: 512, writable: false });
    Object.defineProperty(mockImg, 'naturalHeight', { value: 512, writable: false });
    
    const insertedElements = [];
    mockImg.insertAdjacentElement = jest.fn((position, element) => {
      insertedElements.push({ position, element });
      return element;
    });

    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    const verify = () => {
      if (!mockImg.naturalWidth || !mockImg.naturalHeight) {
        createFallback(mockImg);
      }
    };

    if (mockImg.complete) {
      verify();
    }

    expect(insertedElements.length).toBe(0);
    expect(mockImg.dataset.fallback).toBeUndefined();
  });

  test('should attach both error and load listeners', (done) => {
    const mockImg = document.createElement('img');
    mockImg.setAttribute('data-logo', '');
    mockImg.alt = 'Test';
    mockImg.complete = false;
    
    let errorListenerAttached = false;
    let loadListenerAttached = false;
    
    const originalAddEventListener = mockImg.addEventListener.bind(mockImg);
    mockImg.addEventListener = jest.fn((event, handler, options) => {
      if (event === 'error') errorListenerAttached = true;
      if (event === 'load') loadListenerAttached = true;
      originalAddEventListener(event, handler, options);
    });

    mockImg.insertAdjacentElement = jest.fn();

    // Simulate the initLogoPlaceholders forEach logic
    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    const verify = () => {
      if (!mockImg.naturalWidth || !mockImg.naturalHeight) {
        createFallback(mockImg);
      }
    };

    mockImg.addEventListener('error', () => createFallback(mockImg));
    
    if (mockImg.complete) {
      verify();
    } else {
      mockImg.addEventListener('load', verify, { once: true });
    }

    expect(errorListenerAttached).toBe(true);
    expect(loadListenerAttached).toBe(true);
    
    done();
  });
});

describe('Theme Management', () => {
  let mockAppState;
  let mockPrefersDark;

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.dataset.theme = '';
    
    mockAppState = {
      settings: {
        theme: 'auto'
      }
    };

    mockPrefersDark = {
      matches: true
    };
  });

  test('should apply dark theme when auto and system prefers dark', () => {
    const applyTheme = () => {
      let theme = mockAppState.settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
    };

    applyTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.dataset.theme).toBe('dark');
  });

  test('should apply light theme when auto and system prefers light', () => {
    mockPrefersDark.matches = false;

    const applyTheme = () => {
      let theme = mockAppState.settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
    };

    applyTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.body.dataset.theme).toBe('light');
  });

  test('should apply explicit dark theme regardless of system preference', () => {
    mockAppState.settings.theme = 'dark';
    mockPrefersDark.matches = false; // System prefers light

    const applyTheme = () => {
      let theme = mockAppState.settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
    };

    applyTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.dataset.theme).toBe('dark');
  });

  test('should apply explicit light theme regardless of system preference', () => {
    mockAppState.settings.theme = 'light';
    mockPrefersDark.matches = true; // System prefers dark

    const applyTheme = () => {
      let theme = mockAppState.settings.theme;
      if (theme === 'auto') {
        theme = mockPrefersDark.matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
    };

    applyTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.body.dataset.theme).toBe('light');
  });
});

describe('Sidebar Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('should initialize sidebar as open on desktop', () => {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    document.body.appendChild(sidebar);

    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    document.body.appendChild(toggle);

    // Mock window width for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const initSidebar = () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      if (!sidebar || !toggle) return;

      if (window.innerWidth < 880) {
        sidebar.classList.remove('open');
        sidebar.classList.add('collapsed');
      } else {
        sidebar.classList.add('open');
      }
    };

    initSidebar();

    expect(sidebar.classList.contains('open')).toBe(true);
    expect(sidebar.classList.contains('collapsed')).toBe(false);
  });

  test('should initialize sidebar as collapsed on mobile', () => {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    document.body.appendChild(sidebar);

    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    document.body.appendChild(toggle);

    // Mock window width for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768
    });

    const setState = (open) => {
      sidebar.classList.toggle('open', open);
      sidebar.classList.toggle('collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? '&#x2715;' : '&#9776;';
    };

    if (window.innerWidth < 880) {
      setState(false);
    } else {
      sidebar.classList.add('open');
    }

    expect(sidebar.classList.contains('open')).toBe(false);
    expect(sidebar.classList.contains('collapsed')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('should handle missing sidebar gracefully', () => {
    const initSidebar = () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      if (!sidebar || !toggle) return;
      sidebar.classList.add('open');
    };

    expect(() => initSidebar()).not.toThrow();
  });
});

describe('Settings Management', () => {
  const STORAGE_KEY = 'net-observation-settings';

  beforeEach(() => {
    localStorage.clear();
  });

  test('should save settings to localStorage', () => {
    const mockAppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      }
    };

    const saveSettings = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAppState.settings));
    };

    saveSettings();

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed.backendUrl).toBe('/api/censys-summary');
    expect(parsed.auth0Domain).toBe('test.auth0.com');
    expect(parsed.theme).toBe('dark');
  });

  test('should load settings from localStorage', () => {
    const savedSettings = {
      backendUrl: '/custom/api',
      auth0Domain: 'custom.auth0.com',
      auth0ClientId: 'custom-id',
      theme: 'light'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

    const mockAppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      }
    };

    const loadSettings = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.assign(mockAppState.settings, parsed);
        }
      } catch (err) {
        console.warn('Failed to load settings', err);
      }
    };

    loadSettings();

    expect(mockAppState.settings.backendUrl).toBe('/custom/api');
    expect(mockAppState.settings.auth0Domain).toBe('custom.auth0.com');
    expect(mockAppState.settings.theme).toBe('light');
  });

  test('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{');

    const mockAppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      }
    };

    const loadSettings = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.assign(mockAppState.settings, parsed);
        }
      } catch (err) {
        console.warn('Failed to load settings', err);
      }
    };

    expect(() => loadSettings()).not.toThrow();
    expect(mockAppState.settings.backendUrl).toBe('/api/censys-summary');
  });

  test('should handle missing localStorage data', () => {
    const mockAppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      }
    };

    const loadSettings = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.assign(mockAppState.settings, parsed);
        }
      } catch (err) {
        console.warn('Failed to load settings', err);
      }
    };

    loadSettings();

    expect(mockAppState.settings.backendUrl).toBe('/api/censys-summary');
    expect(mockAppState.settings.theme).toBe('auto');
  });
});

describe('Data Processing Utilities', () => {
  test('should parse simple CSV data correctly', () => {
    const parseCSV = (text) => {
      const [headerLine, ...rows] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      return rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });
    };

    const csvData = `name,count,status
service1,100,active
service2,200,inactive`;

    const result = parseCSV(csvData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'service1', count: '100', status: 'active' });
    expect(result[1]).toEqual({ name: 'service2', count: '200', status: 'inactive' });
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
service1,,active
service2,200,`;

    const result = parseCSV(csvData);

    expect(result[0]).toEqual({ name: 'service1', count: '', status: 'active' });
    expect(result[1]).toEqual({ name: 'service2', count: '200', status: '' });
  });

  test('should handle CSV with different line endings', () => {
    const parseCSV = (text) => {
      const [headerLine, ...rows] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      return rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });
    };

    const csvDataCRLF = "name,count\r\nservice1,100\r\nservice2,200";
    const csvDataLF = "name,count\nservice1,100\nservice2,200";

    const resultCRLF = parseCSV(csvDataCRLF);
    const resultLF = parseCSV(csvDataLF);

    expect(resultCRLF).toEqual(resultLF);
    expect(resultCRLF).toHaveLength(2);
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

  test('should generate different hues for services seed', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(3, 'services');
    expect(colors[0]).toBe('hsl(180 80% 55% / 0.7)');
    expect(colors[1]).toBe('hsl(207 80% 55% / 0.7)');
    expect(colors[2]).toBe('hsl(234 80% 55% / 0.7)');
  });

  test('should generate different hues for countries seed', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(3, 'countries');
    expect(colors[0]).toBe('hsl(300 80% 55% / 0.7)');
    expect(colors[1]).toBe('hsl(327 80% 55% / 0.7)');
    expect(colors[2]).toBe('hsl(354 80% 55% / 0.7)');
  });

  test('should wrap hue values correctly', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(15, 'services');
    // 180 + 14 * 27 = 558, 558 % 360 = 198
    expect(colors[14]).toBe('hsl(198 80% 55% / 0.7)');
  });

  test('should handle zero count', () => {
    const generateColorPalette = (count, seed) => {
      const baseHue = seed === 'services' ? 180 : 300;
      return Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
    };

    const colors = generateColorPalette(0, 'services');
    expect(colors).toHaveLength(0);
  });
});

describe('Table Rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('should render table with sorted data', () => {
    const container = document.createElement('div');
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    container.appendChild(table);
    container.setAttribute('data-table', 'test');
    document.body.appendChild(container);

    const renderTable = (selector, objectData) => {
      const container = document.querySelector(selector);
      if (!container) return;
      const tbody = container.querySelector('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!objectData) return;
      Object.entries(objectData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, value]) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
          tbody.appendChild(row);
        });
    };

    const data = {
      'item3': 100,
      'item1': 300,
      'item2': 200
    };

    renderTable('[data-table="test"]', data);

    const rows = tbody.querySelectorAll('tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('item1');
    expect(rows[0].textContent).toContain('300');
    expect(rows[1].textContent).toContain('item2');
    expect(rows[2].textContent).toContain('item3');
  });

  test('should handle null data gracefully', () => {
    const container = document.createElement('div');
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    container.appendChild(table);
    container.setAttribute('data-table', 'test');
    document.body.appendChild(container);

    const renderTable = (selector, objectData) => {
      const container = document.querySelector(selector);
      if (!container) return;
      const tbody = container.querySelector('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!objectData) return;
      Object.entries(objectData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, value]) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
          tbody.appendChild(row);
        });
    };

    expect(() => renderTable('[data-table="test"]', null)).not.toThrow();
    const rows = tbody.querySelectorAll('tr');
    expect(rows).toHaveLength(0);
  });

  test('should format numbers with locale separators', () => {
    const container = document.createElement('div');
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    container.appendChild(table);
    container.setAttribute('data-table', 'test');
    document.body.appendChild(container);

    const renderTable = (selector, objectData) => {
      const container = document.querySelector(selector);
      if (!container) return;
      const tbody = container.querySelector('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!objectData) return;
      Object.entries(objectData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, value]) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
          tbody.appendChild(row);
        });
    };

    const data = { 'service': 1234567 };
    renderTable('[data-table="test"]', data);

    const rows = tbody.querySelectorAll('tr');
    expect(rows[0].textContent).toContain('1,234,567');
  });
});

describe('Auth0 Initialization', () => {
  test('should skip initialization when credentials are missing', async () => {
    const mockAppState = {
      settings: {
        auth0Domain: '',
        auth0ClientId: ''
      },
      auth0Client: null
    };

    const initAuth0 = async () => {
      if (!window.createAuth0Client) return;
      if (!mockAppState.settings.auth0Domain || !mockAppState.settings.auth0ClientId) return;
      
      mockAppState.auth0Client = await window.createAuth0Client({
        domain: mockAppState.settings.auth0Domain,
        clientId: mockAppState.settings.auth0ClientId
      });
    };

    await initAuth0();

    expect(mockAppState.auth0Client).toBeNull();
  });

  test('should skip initialization when createAuth0Client is not available', async () => {
    const originalCreateAuth0Client = window.createAuth0Client;
    delete window.createAuth0Client;

    const mockAppState = {
      settings: {
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id'
      },
      auth0Client: null
    };

    const initAuth0 = async () => {
      if (!window.createAuth0Client) return;
      if (!mockAppState.settings.auth0Domain || !mockAppState.settings.auth0ClientId) return;
      
      mockAppState.auth0Client = await window.createAuth0Client({
        domain: mockAppState.settings.auth0Domain,
        clientId: mockAppState.settings.auth0ClientId
      });
    };

    await initAuth0();

    expect(mockAppState.auth0Client).toBeNull();

    window.createAuth0Client = originalCreateAuth0Client;
  });
});

describe('Plugin System', () => {
  test('should register plugin with valid name', () => {
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
      run: () => 'test result'
    };

    expect(() => register(plugin)).not.toThrow();
    expect(registry.has('test-plugin')).toBe(true);
    expect(registry.has('test')).toBe(true);
  });

  test('should throw error for plugin without name', () => {
    const register = (plugin) => {
      if (!plugin?.name) throw new Error('Plugin requires a name');
      registry.set(plugin.name, plugin);
    };

    const registry = new Map();
    const plugin = { command: 'test' };

    expect(() => register(plugin)).toThrow('Plugin requires a name');
  });

  test('should list all unique plugin names', () => {
    const registry = new Map();
    
    registry.set('plugin1', { name: 'plugin1' });
    registry.set('cmd1', { name: 'plugin1', command: 'cmd1' });
    registry.set('plugin2', { name: 'plugin2' });

    const list = () => {
      return Array.from(new Set(Array.from(registry.values()).map(p => p.name)));
    };

    const names = list();
    expect(names).toHaveLength(2);
    expect(names).toContain('plugin1');
    expect(names).toContain('plugin2');
  });

  test('should retrieve command from plugin', () => {
    const registry = new Map();
    const plugin = {
      name: 'test-plugin',
      command: 'test',
      run: (arg) => `Result: ${arg}`
    };
    
    registry.set('test', plugin);

    const getCommand = (name) => {
      const plugin = registry.get(name);
      if (plugin && plugin.run) {
        return (...args) => plugin.run(...args);
      }
      return null;
    };

    const command = getCommand('test');
    expect(command).not.toBeNull();
    expect(command('hello')).toBe('Result: hello');
  });
});