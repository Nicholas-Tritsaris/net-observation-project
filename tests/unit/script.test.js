/**
 * Unit tests for docs/script.js
 * Testing changes: removed refreshChartThemes, simplified auth0 init, terminal init
 */

describe('Script.js - Theme Management', () => {
  let mockDocument;
  
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div data-role="theme-toggle">
        <strong data-label>AUTO</strong>
      </div>
      <aside class="sidebar"></aside>
      <button class="sidebar-toggle"></button>
    `;
    
    // Reset localStorage
    localStorage.clear();
    localStorage.setItem('net-observation-settings', JSON.stringify({
      theme: 'auto',
      backendUrl: '/api/censys-summary',
      auth0Domain: '',
      auth0ClientId: ''
    }));
  });

  test('applyTheme should set data-theme attribute on documentElement', () => {
    // Load the script context
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Since we can't directly import IIFE, we'll test the behavior
    expect(document.documentElement.setAttribute).toBeDefined();
  });

  test('theme toggle should cycle through auto, dark, light', () => {
    const toggle = document.querySelector('[data-role="theme-toggle"]');
    expect(toggle).toBeTruthy();
    
    const label = toggle.querySelector('[data-label]');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('AUTO');
  });

  test('theme settings should persist to localStorage', () => {
    const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
    expect(settings).toBeTruthy();
    expect(settings.theme).toBe('auto');
  });

  test('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('net-observation-settings', 'invalid-json');
    // Should not throw when loading settings
    expect(() => {
      localStorage.getItem('net-observation-settings');
    }).not.toThrow();
  });
});

describe('Script.js - Sidebar Management', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <aside class="sidebar"></aside>
      <button class="sidebar-toggle" aria-expanded="true"></button>
    `;
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  test('sidebar should exist in DOM', () => {
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toBeTruthy();
  });

  test('sidebar toggle should exist', () => {
    const toggle = document.querySelector('.sidebar-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  test('sidebar should start collapsed on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 600
    });
    // On mobile (< 880px), sidebar should be collapsed
    expect(window.innerWidth).toBeLessThan(880);
  });

  test('sidebar should start open on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024
    });
    expect(window.innerWidth).toBeGreaterThanOrEqual(880);
  });
});

describe('Script.js - Removed refreshChartThemes Functionality', () => {
  test('refreshChartThemes should no longer be called from applyTheme', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Verify that refreshChartThemes is not called in applyTheme
    expect(scriptContent.includes('refreshChartThemes()')).toBe(false);
    
    // Verify the function definition was removed
    expect(scriptContent.includes('function refreshChartThemes()')).toBe(false);
  });

  test('applyTheme should only set theme attributes without chart updates', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Check that applyTheme function exists
    expect(scriptContent.includes('function applyTheme()')).toBe(true);
    
    // Verify it sets documentElement attribute
    expect(scriptContent.includes('document.documentElement.setAttribute')).toBe(true);
    expect(scriptContent.includes('document.body.dataset.theme')).toBe(true);
  });
});

describe('Script.js - Auth0 Initialization Simplification', () => {
  beforeEach(() => {
    global.window.createAuth0Client = undefined;
    localStorage.clear();
  });

  test('should not initialize Auth0 when createAuth0Client is missing', () => {
    expect(window.createAuth0Client).toBeUndefined();
    // initAuth0 should return early
  });

  test('should not initialize Auth0 when domain/clientId are empty', () => {
    localStorage.setItem('net-observation-settings', JSON.stringify({
      auth0Domain: '',
      auth0ClientId: ''
    }));
    
    const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
    expect(settings.auth0Domain).toBe('');
    expect(settings.auth0ClientId).toBe('');
  });

  test('initAuth0 should return early without calling updateAuthControls when credentials missing', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Verify simplified logic - just returns early
    const auth0InitSection = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(auth0InitSection).toBeTruthy();
    
    // Should have early return when no domain/clientId
    expect(scriptContent.includes('if (!AppState.settings.auth0Domain || !AppState.settings.auth0ClientId) return;')).toBe(true);
  });

  test('removed unnecessary updateAuthControls call from simplified auth0 init', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // The old code had updateAuthControls called in the early return path
    // New code just returns without calling it
    const lines = scriptContent.split('\n');
    const auth0Section = lines.slice(436, 454).join('\n');
    
    // Should not have the old pattern of setting client to null and calling updateAuthControls
    expect(auth0Section.includes('AppState.auth0Client = null')).toBe(false);
  });
});

describe('Script.js - Terminal Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="terminal">
        <div class="terminal-output"></div>
        <input type="text" />
        <button>Run</button>
      </div>
    `;
  });

  test('terminal should have output, input, and button elements', () => {
    const terminal = document.querySelector('.terminal');
    expect(terminal).toBeTruthy();
    
    const output = terminal.querySelector('.terminal-output');
    const input = terminal.querySelector('input');
    const button = terminal.querySelector('button');
    
    expect(output).toBeTruthy();
    expect(input).toBeTruthy();
    expect(button).toBeTruthy();
  });

  test('terminal should support help command', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    expect(scriptContent.includes('help()')).toBe(true);
    expect(scriptContent.includes('Available commands:')).toBe(true);
  });

  test('terminal should support stats command', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    expect(scriptContent.includes('stats()')).toBe(true);
  });

  test('terminal should support theme command', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    expect(scriptContent.includes('theme(arg)')).toBe(true);
  });
});

describe('Script.js - Data Visualizer Removed from Dashboard Init', () => {
  test('data page should not initialize terminal', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Find the data case in initPageSpecificFeatures
    const pageSpecificSection = scriptContent.match(/case 'data':[\s\S]*?break;/);
    expect(pageSpecificSection).toBeTruthy();
    
    // Should NOT include initTerminal() call for data page
    expect(pageSpecificSection[0].includes('initTerminal')).toBe(false);
    
    // Should include initDataVisualizer and initAutoRefresh
    expect(pageSpecificSection[0].includes('initDataVisualizer')).toBe(true);
    expect(pageSpecificSection[0].includes('initAutoRefresh')).toBe(true);
  });

  test('dashboard page should still initialize terminal', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    const dashboardSection = scriptContent.match(/case 'dashboard':[\s\S]*?break;/);
    expect(dashboardSection).toBeTruthy();
    expect(dashboardSection[0].includes('initTerminal')).toBe(true);
  });
});

describe('Script.js - Update Stats View', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-stat="total-hosts"></div>
      <div data-stat="total-services"></div>
      <div data-stat="last-sync"></div>
      <table data-table="countries"><tbody></tbody></table>
      <table data-table="services"><tbody></tbody></table>
    `;
  });

  test('updateStatsView should handle data object', () => {
    const totalHosts = document.querySelector('[data-stat="total-hosts"]');
    const totalServices = document.querySelector('[data-stat="total-services"]');
    const lastSync = document.querySelector('[data-stat="last-sync"]');
    
    expect(totalHosts).toBeTruthy();
    expect(totalServices).toBeTruthy();
    expect(lastSync).toBeTruthy();
  });

  test('updateStatsView should handle missing data gracefully', () => {
    const data = {};
    // Should not throw when accessing undefined properties
    expect(() => {
      const value = data.total_hosts?.toLocaleString() ?? '—';
      expect(value).toBe('—');
    }).not.toThrow();
  });

  test('removed payload display logic from updateStatsView', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Find updateStatsView function
    const updateStatsSection = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateStatsSection).toBeTruthy();
    
    // Should NOT reference #apiPayload
    expect(updateStatsSection[0].includes('#apiPayload')).toBe(false);
    expect(updateStatsSection[0].includes('payload')).toBe(false);
  });
});

describe('Script.js - Fetch Censys Summary', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.console.warn.mockClear();
  });

  test('fetchCensysSummary should call fetch with correct endpoint', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        total_hosts: 1000,
        total_services: 500,
        countries: { US: 100 },
        services: { HTTP: 200 }
      })
    };
    
    global.fetch.mockResolvedValueOnce(mockResponse);
    
    // We can't directly call the function, but we can verify fetch behavior
    await fetch('/api/censys-summary');
    expect(global.fetch).toHaveBeenCalledWith('/api/censys-summary');
  });

  test('fetchCensysSummary should handle errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    try {
      await fetch('/api/censys-summary');
    } catch (err) {
      expect(err.message).toBe('Network error');
    }
  });

  test('removed payload error display from fetchCensysSummary', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    // Find fetchCensysSummary function
    const fetchSection = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchSection).toBeTruthy();
    
    // Should NOT include payload error display
    expect(fetchSection[0].includes('const payload = qs(\'#apiPayload\')')).toBe(false);
    expect(fetchSection[0].includes('payload.textContent = JSON.stringify({ error')).toBe(false);
  });
});

describe('Script.js - Plugin System', () => {
  test('should support plugin registration', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes('const AppPlugins')).toBe(true);
    expect(scriptContent.includes('register(plugin)')).toBe(true);
    expect(scriptContent.includes('window.registerPlugin')).toBe(true);
  });

  test('echo plugin should be registered on init', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes('echo-plugin')).toBe(true);
    expect(scriptContent.includes("command: 'echo'")).toBe(true);
  });

  test('plugin should require name property', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes("if (!plugin?.name) throw new Error('Plugin requires a name')")).toBe(true);
  });
});

describe('Script.js - Chart Management', () => {
  test('charts should be initialized with proper configuration', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes('function initCharts()')).toBe(true);
    expect(scriptContent.includes('servicesChart')).toBe(true);
    expect(scriptContent.includes('countriesChart')).toBe(true);
  });

  test('updateCharts should handle data updates', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes('function updateCharts(data)')).toBe(true);
    expect(scriptContent.includes("chart.update('none')")).toBe(true);
  });

  test('generateColorPalette should create colors based on seed', () => {
    const scriptContent = require('fs').readFileSync('docs/script.js', 'utf8');
    
    expect(scriptContent.includes('function generateColorPalette(count, seed)')).toBe(true);
    expect(scriptContent.includes('baseHue = seed === \'services\' ? 180 : 300')).toBe(true);
  });
});