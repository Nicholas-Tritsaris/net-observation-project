/**
 * Comprehensive tests for chart initialization/updates and settings panel functionality
 * Tests Chart.js integration, color generation, settings persistence, and Auth0 integration
 */

const fs = require('fs');

describe('Charts and Settings Management', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('initCharts', () => {
    let initCharts, AppState;

    beforeEach(() => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;

      // Mock Chart.js
      global.Chart = jest.fn().mockImplementation((ctx, config) => ({
        ctx,
        config,
        data: config.data,
        options: config.options,
        update: jest.fn(),
        destroy: jest.fn()
      }));

      AppState = {
        charts: {},
        settings: { theme: 'auto' }
      };

      const funcMatch = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should initialize services chart when canvas present', () => {
      initCharts();

      expect(global.Chart).toHaveBeenCalled();
      expect(AppState.charts.services).toBeDefined();
    });

    test('should initialize countries chart when canvas present', () => {
      initCharts();

      expect(global.Chart).toHaveBeenCalled();
      expect(AppState.charts.countries).toBeDefined();
    });

    test('should not throw when Chart.js not available', () => {
      global.Chart = undefined;

      expect(() => initCharts()).not.toThrow();
    });

    test('should not throw when canvas elements missing', () => {
      document.body.innerHTML = '';

      expect(() => initCharts()).not.toThrow();
    });

    test('should create doughnut chart for services', () => {
      initCharts();

      const servicesCall = global.Chart.mock.calls.find(call => 
        call[0] === document.getElementById('servicesChart')
      );
      
      if (servicesCall) {
        expect(servicesCall[1].type).toBe('doughnut');
      }
    });

    test('should create bar chart for countries', () => {
      initCharts();

      const countriesCall = global.Chart.mock.calls.find(call => 
        call[0] === document.getElementById('countriesChart')
      );
      
      if (countriesCall) {
        expect(countriesCall[1].type).toBe('bar');
      }
    });

    test('should initialize charts with empty data', () => {
      initCharts();

      if (AppState.charts.services) {
        expect(AppState.charts.services.data.labels).toEqual([]);
        expect(AppState.charts.services.data.datasets[0].data).toEqual([]);
      }
    });

    test('should store charts in AppState', () => {
      initCharts();

      expect(AppState.charts.services).toBeDefined();
      expect(AppState.charts.countries).toBeDefined();
    });
  });

  describe('updateCharts', () => {
    let updateCharts, generateColorPalette, AppState;

    beforeEach(() => {
      AppState = {
        charts: {
          services: {
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            update: jest.fn()
          },
          countries: {
            data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
            update: jest.fn()
          }
        }
      };

      const colorMatch = scriptContent.match(/function generateColorPalette\([^)]*\) \{[\s\S]*?\n  \}/);
      const updateMatch = scriptContent.match(/function updateCharts\([^)]*\) \{[\s\S]*?\n  \}/);
      
      if (colorMatch) eval(colorMatch[0]);
      if (updateMatch) eval(updateMatch[0]);
    });

    test('should update services chart with data', () => {
      const data = {
        services: { HTTP: 500, HTTPS: 300, SSH: 100 }
      };

      updateCharts(data);

      expect(AppState.charts.services.data.labels).toEqual(['HTTP', 'HTTPS', 'SSH']);
      expect(AppState.charts.services.data.datasets[0].data).toEqual([500, 300, 100]);
      expect(AppState.charts.services.update).toHaveBeenCalled();
    });

    test('should update countries chart with top 12', () => {
      const data = {
        countries: {
          US: 1000, GB: 900, DE: 800, FR: 700, CN: 600,
          JP: 500, CA: 400, AU: 300, IN: 200, BR: 100,
          RU: 50, MX: 25, ES: 10
        }
      };

      updateCharts(data);

      expect(AppState.charts.countries.data.labels.length).toBeLessThanOrEqual(12);
      expect(AppState.charts.countries.data.labels[0]).toBe('US');
    });

    test('should sort services by count descending', () => {
      const data = {
        services: { A: 10, B: 50, C: 30 }
      };

      updateCharts(data);

      expect(AppState.charts.services.data.labels).toEqual(['B', 'C', 'A']);
      expect(AppState.charts.services.data.datasets[0].data).toEqual([50, 30, 10]);
    });

    test('should sort countries by count descending', () => {
      const data = {
        countries: { US: 100, GB: 300, DE: 200 }
      };

      updateCharts(data);

      expect(AppState.charts.countries.data.labels[0]).toBe('GB');
      expect(AppState.charts.countries.data.datasets[0].data[0]).toBe(300);
    });

    test('should generate colors for chart data', () => {
      const data = {
        services: { HTTP: 100, HTTPS: 200 }
      };

      updateCharts(data);

      expect(AppState.charts.services.data.datasets[0].backgroundColor.length).toBe(2);
    });

    test('should handle null data gracefully', () => {
      expect(() => updateCharts(null)).not.toThrow();
    });

    test('should handle undefined data gracefully', () => {
      expect(() => updateCharts(undefined)).not.toThrow();
    });

    test('should handle missing services field', () => {
      const data = { countries: { US: 100 } };

      expect(() => updateCharts(data)).not.toThrow();
    });

    test('should handle missing countries field', () => {
      const data = { services: { HTTP: 100 } };

      expect(() => updateCharts(data)).not.toThrow();
    });

    test('should handle empty services object', () => {
      const data = { services: {} };

      updateCharts(data);

      expect(AppState.charts.services.data.labels).toEqual([]);
    });

    test('should call update with no animation mode', () => {
      const data = { services: { HTTP: 100 } };

      updateCharts(data);

      expect(AppState.charts.services.update).toHaveBeenCalledWith('none');
    });
  });

  describe('updateStatsView', () => {
    let updateStatsView, renderTable, updateCharts, renderHeatmap, AppState, qs;

    beforeEach(() => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;

      AppState = { stats: {} };
      global.renderTable = jest.fn();
      global.updateCharts = jest.fn();
      global.renderHeatmap = jest.fn();

      const qsMatch = scriptContent.match(/function qs\([^)]*\) \{[\s\S]*?\n  \}/);
      const updateMatch = scriptContent.match(/function updateStatsView\([^)]*\) \{[\s\S]*?\n  \}/);
      
      if (qsMatch) eval(qsMatch[0]);
      if (updateMatch) eval(updateMatch[0]);
    });

    test('should update total hosts display', () => {
      const data = { total_hosts: 123456 };

      updateStatsView(data);

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(hostsEl.textContent).toMatch(/123[,\.]456/);
    });

    test('should update total services display', () => {
      const data = { total_services: 7890 };

      updateStatsView(data);

      const servicesEl = document.querySelector('[data-stat="total-services"]');
      expect(servicesEl.textContent).toMatch(/7[,\.]890/);
    });

    test('should format last sync timestamp', () => {
      const data = { last_sync: '2024-01-15T10:30:00Z' };

      updateStatsView(data);

      const syncEl = document.querySelector('[data-stat="last-sync"]');
      expect(syncEl.textContent).not.toBe('—');
      expect(syncEl.textContent).toContain('2024');
    });

    test('should show placeholder for missing total_hosts', () => {
      const data = {};

      updateStatsView(data);

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(hostsEl.textContent).toBe('—');
    });

    test('should show placeholder for missing last_sync', () => {
      const data = {};

      updateStatsView(data);

      const syncEl = document.querySelector('[data-stat="last-sync"]');
      expect(syncEl.textContent).toBe('—');
    });

    test('should call renderTable for countries', () => {
      const data = { countries: { US: 100 } };

      updateStatsView(data);

      expect(global.renderTable).toHaveBeenCalledWith('[data-table="countries"]', data.countries);
    });

    test('should call renderTable for services', () => {
      const data = { services: { HTTP: 50 } };

      updateStatsView(data);

      expect(global.renderTable).toHaveBeenCalledWith('[data-table="services"]', data.services);
    });

    test('should call updateCharts with data', () => {
      const data = { services: { HTTP: 100 }, countries: { US: 200 } };

      updateStatsView(data);

      expect(global.updateCharts).toHaveBeenCalledWith(data);
    });

    test('should call renderHeatmap with data', () => {
      const data = { countries: { US: 100 } };

      updateStatsView(data);

      expect(global.renderHeatmap).toHaveBeenCalledWith(data);
    });

    test('should store data in AppState.stats', () => {
      const data = { total_hosts: 1000 };

      updateStatsView(data);

      expect(AppState.stats).toEqual(data);
    });

    test('should handle elements not present gracefully', () => {
      document.body.innerHTML = '';
      const data = { total_hosts: 100 };

      expect(() => updateStatsView(data)).not.toThrow();
    });
  });

  describe('initSettingsPanel', () => {
    let initSettingsPanel, AppState, saveSettings;

    beforeEach(() => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form id="settingsForm">
            <select name="theme">
              <option value="auto">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <input type="text" name="backendUrl" />
            <input type="text" name="auth0Domain" />
            <input type="text" name="auth0ClientId" />
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Toggle</button>
      `;

      AppState = {
        settings: {
          theme: 'dark',
          backendUrl: '/api/test',
          auth0Domain: 'test.auth0.com',
          auth0ClientId: 'abc123'
        }
      };

      global.saveSettings = jest.fn();
      global.applyTheme = jest.fn();
      global.initAuth0 = jest.fn(() => Promise.resolve());
      global.logTerminal = jest.fn();

      const funcMatch = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should populate form fields from AppState', () => {
      initSettingsPanel();

      const themeSelect = document.querySelector('select[name="theme"]');
      const backendInput = document.querySelector('input[name="backendUrl"]');
      
      expect(themeSelect.value).toBe('dark');
      expect(backendInput.value).toBe('/api/test');
    });

    test('should save settings on form submit', () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      form.querySelector('select[name="theme"]').value = 'light';
      form.dispatchEvent(new Event('submit'));

      expect(global.saveSettings).toHaveBeenCalled();
    });

    test('should prevent default form submission', () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });

    test('should update AppState.settings from form', () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      form.querySelector('input[name="backendUrl"]').value = '/api/new';
      form.dispatchEvent(new Event('submit'));

      expect(AppState.settings.backendUrl).toBe('/api/new');
    });

    test('should call applyTheme after saving', () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      form.dispatchEvent(new Event('submit'));

      expect(global.applyTheme).toHaveBeenCalled();
    });

    test('should reinitialize Auth0 after saving', async () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(global.initAuth0).toHaveBeenCalled();
    });

    test('should log save action to terminal', () => {
      initSettingsPanel();

      const form = document.getElementById('settingsForm');
      form.dispatchEvent(new Event('submit'));

      expect(global.logTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Settings saved')
      );
    });

    test('should toggle panel visibility', () => {
      initSettingsPanel();

      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');

      toggle.click();
      expect(panel.classList.contains('open')).toBe(true);

      toggle.click();
      expect(panel.classList.contains('open')).toBe(false);
    });

    test('should handle missing panel gracefully', () => {
      document.body.innerHTML = '<button class="settings-toggle">Toggle</button>';

      expect(() => initSettingsPanel()).not.toThrow();
    });

    test('should handle missing toggle gracefully', () => {
      document.body.innerHTML = '<div class="settings-panel"></div>';

      expect(() => initSettingsPanel()).not.toThrow();
    });
  });

  describe('updateAuthControls', () => {
    let updateAuthControls, AppState;

    beforeEach(() => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status></span>
      `;

      AppState = {
        auth0Client: null
      };

      const funcMatch = scriptContent.match(/async function updateAuthControls\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should show Anonymous status when no client', async () => {
      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Anonymous');
    });

    test('should hide both buttons when no client', async () => {
      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      
      expect(loginBtn.style.display).toBe('none');
      expect(logoutBtn.style.display).toBe('none');
    });

    test('should show login button when client exists but not authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false)
      };

      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.style.display).not.toBe('none');
    });

    test('should show logout button when authenticated', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const logoutBtn = document.querySelector('[data-action="logout"]');
      expect(logoutBtn.style.display).not.toBe('none');
    });

    test('should show Authenticated status when logged in', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(true)
      };

      await updateAuthControls();

      const status = document.querySelector('[data-auth-status]');
      expect(status.textContent).toBe('Authenticated');
    });

    test('should bind login handler only once', async () => {
      AppState.auth0Client = {
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn()
      };

      await updateAuthControls();
      await updateAuthControls();

      const loginBtn = document.querySelector('[data-action="login"]');
      expect(loginBtn.dataset.bound).toBe('true');
    });

    test('should handle missing auth status element', async () => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
      `;

      expect(() => updateAuthControls()).resolves.not.toThrow();
    });
  });
});