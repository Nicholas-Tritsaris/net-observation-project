/**
 * Unit tests for data rendering functions (updateStatsView, renderTable, updateCharts, generateColorPalette)
 * Tests data display, table population, chart updates, and color generation
 */

const fs = require('fs');

describe('Data Rendering', () => {
  describe('renderTable', () => {
    let renderTable, qs;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      const renderTableMatch = scriptContent.match(/function renderTable\(selector, objectData\) \{[\s\S]*?\n  \}/);
      const qsMatch = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/);
      
      if (qsMatch) {
        eval(`qs = ${qsMatch[0].replace('function qs(id)', 'function(id)')}`);
      }
      if (renderTableMatch) {
        eval(`renderTable = ${renderTableMatch[0].replace('function renderTable(selector, objectData)', 'function(selector, objectData)')}`);
      }
    });

    test('should populate table with sorted data', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { 'USA': 100, 'UK': 50, 'Germany': 75 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
      expect(rows[0].textContent).toContain('USA');
      expect(rows[0].textContent).toContain('100');
    });

    test('should sort entries by value descending', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { 'Low': 10, 'High': 100, 'Medium': 50 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows[0].textContent).toContain('High');
      expect(rows[1].textContent).toContain('Medium');
      expect(rows[2].textContent).toContain('Low');
    });

    test('should format numbers with locale separators', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { 'Item': 1234567 };
      renderTable('[data-table="test"]', data);

      const row = document.querySelector('tbody tr');
      expect(row.textContent).toMatch(/1[,\s]234[,\s]567|1234567/);
    });

    test('should clear existing table content', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody>
            <tr><td>Old</td><td>Data</td></tr>
          </tbody>
        </table>
      `;

      const data = { 'New': 100 };
      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('New');
    });

    test('should handle empty or null data', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody><tr><td>Should be cleared</td></tr></tbody>
        </table>
      `;

      renderTable('[data-table="test"]', null);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toBe('');
    });

    test('should handle missing table element', () => {
      document.body.innerHTML = '';
      expect(() => renderTable('[data-table="missing"]', { 'Test': 1 })).not.toThrow();
    });

    test('should handle table without tbody', () => {
      document.body.innerHTML = '<table data-table="test"></table>';
      expect(() => renderTable('[data-table="test"]', { 'Test': 1 })).not.toThrow();
    });

    test('should handle large datasets', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = {};
      for (let i = 0; i < 100; i++) {
        data[`Item${i}`] = Math.random() * 1000;
      }

      renderTable('[data-table="test"]', data);

      const rows = document.querySelectorAll('tbody tr');
      expect(rows.length).toBe(100);
    });

    test('should handle special characters in keys', () => {
      document.body.innerHTML = `
        <table data-table="test">
          <tbody></tbody>
        </table>
      `;

      const data = { '<script>alert("xss")</script>': 100, 'Normal & Key': 50 };
      renderTable('[data-table="test"]', data);

      const tbody = document.querySelector('tbody');
      expect(tbody.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('generateColorPalette', () => {
    let generateColorPalette;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`generateColorPalette = ${funcMatch[0].replace('function generateColorPalette(count, seed)', 'function(count, seed)')}`);
      }
    });

    test('should generate requested number of colors', () => {
      const colors = generateColorPalette(10, 'test');
      expect(colors.length).toBe(10);
    });

    test('should generate HSL color strings', () => {
      const colors = generateColorPalette(5, 'test');
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+\s+\d+%\s+\d+%\s+\/\s+[\d.]+\)$/);
      });
    });

    test('should use different base hue for services seed', () => {
      const servicesColors = generateColorPalette(1, 'services');
      const otherColors = generateColorPalette(1, 'other');
      
      expect(servicesColors[0]).not.toBe(otherColors[0]);
    });

    test('should generate visually distinct colors', () => {
      const colors = generateColorPalette(10, 'test');
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(10);
    });

    test('should handle single color request', () => {
      const colors = generateColorPalette(1, 'test');
      expect(colors.length).toBe(1);
      expect(colors[0]).toMatch(/^hsl\(/);
    });

    test('should handle large color count', () => {
      const colors = generateColorPalette(100, 'test');
      expect(colors.length).toBe(100);
    });

    test('should use consistent alpha value', () => {
      const colors = generateColorPalette(5, 'test');
      colors.forEach(color => {
        expect(color).toContain('/ 0.7');
      });
    });

    test('should cycle hue values correctly', () => {
      const colors = generateColorPalette(20, 'test');
      colors.forEach(color => {
        const hueMatch = color.match(/hsl\((\d+)/);
        const hue = parseInt(hueMatch[1]);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });
  });

  describe('updateStatsView', () => {
    let updateStatsView, AppState;

    beforeEach(() => {
      AppState = { stats: null, charts: {}, settings: {}, auth0Client: null, worldData: null };
      
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      // Mock dependencies
      window.renderTable = jest.fn();
      window.updateCharts = jest.fn();
      window.renderHeatmap = jest.fn();
      
      const funcMatch = scriptContent.match(/function updateStatsView\(data\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        let code = funcMatch[0];
        code = code.replace(/renderTable\(/g, 'window.renderTable(');
        code = code.replace(/updateCharts\(/g, 'window.updateCharts(');
        code = code.replace(/renderHeatmap\(/g, 'window.renderHeatmap(');
        eval(`updateStatsView = ${code.replace('function updateStatsView(data)', 'function(data)')}`);
      }
    });

    test('should update total hosts display', () => {
      const data = { total_hosts: 12345, total_services: 678, last_sync: '2023-01-01T00:00:00Z', countries: {}, services: {} };
      updateStatsView(data);

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(hostsEl.textContent).toMatch(/12[,\s]?345/);
    });

    test('should update total services display', () => {
      const data = { total_hosts: 100, total_services: 50, last_sync: '2023-01-01T00:00:00Z', countries: {}, services: {} };
      updateStatsView(data);

      const servicesEl = document.querySelector('[data-stat="total-services"]');
      expect(servicesEl.textContent).toBe('50');
    });

    test('should format last sync as locale date', () => {
      const data = { total_hosts: 100, total_services: 50, last_sync: '2023-06-15T10:30:00Z', countries: {}, services: {} };
      updateStatsView(data);

      const syncEl = document.querySelector('[data-stat="last-sync"]');
      expect(syncEl.textContent).toContain('2023');
    });

    test('should handle missing data fields with em dash', () => {
      const data = {};
      updateStatsView(data);

      const hostsEl = document.querySelector('[data-stat="total-hosts"]');
      expect(hostsEl.textContent).toBe('—');
    });

    test('should store data in AppState', () => {
      const data = { total_hosts: 100, countries: {}, services: {} };
      updateStatsView(data);

      expect(AppState.stats).toBe(data);
    });

    test('should call renderTable for countries', () => {
      const data = { countries: { 'USA': 100 }, services: {} };
      updateStatsView(data);

      expect(window.renderTable).toHaveBeenCalledWith('[data-table="countries"]', data.countries);
    });

    test('should call renderTable for services', () => {
      const data = { countries: {}, services: { 'HTTP': 80 } };
      updateStatsView(data);

      expect(window.renderTable).toHaveBeenCalledWith('[data-table="services"]', data.services);
    });

    test('should call updateCharts with data', () => {
      const data = { countries: {}, services: {} };
      updateStatsView(data);

      expect(window.updateCharts).toHaveBeenCalledWith(data);
    });

    test('should call renderHeatmap with data', () => {
      const data = { countries: {}, services: {} };
      updateStatsView(data);

      expect(window.renderHeatmap).toHaveBeenCalledWith(data);
    });
  });

  describe('updateCharts', () => {
    let updateCharts, AppState, generateColorPalette;

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

      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      const paletteMatch = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/);
      if (paletteMatch) {
        eval(`generateColorPalette = ${paletteMatch[0].replace('function generateColorPalette(count, seed)', 'function(count, seed)')}`);
      }
      
      const updateChartsMatch = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/);
      if (updateChartsMatch) {
        eval(`updateCharts = ${updateChartsMatch[0].replace('function updateCharts(data)', 'function(data)')}`);
      }
    });

    test('should update services chart with sorted data', () => {
      const data = { services: { 'HTTP': 100, 'SSH': 50, 'FTP': 75 }, countries: {} };
      updateCharts(data);

      expect(AppState.charts.services.data.labels).toEqual(['HTTP', 'FTP', 'SSH']);
      expect(AppState.charts.services.data.datasets[0].data).toEqual([100, 75, 50]);
    });

    test('should update countries chart with top 12 entries', () => {
      const countries = {};
      for (let i = 0; i < 20; i++) {
        countries[`Country${i}`] = 100 - i;
      }
      const data = { services: {}, countries };
      
      updateCharts(data);

      expect(AppState.charts.countries.data.labels.length).toBe(12);
    });

    test('should generate new color palette for services', () => {
      const data = { services: { 'HTTP': 100, 'SSH': 50 }, countries: {} };
      updateCharts(data);

      expect(AppState.charts.services.data.datasets[0].backgroundColor.length).toBe(2);
    });

    test('should call chart update with "none" mode', () => {
      const data = { services: { 'HTTP': 100 }, countries: {} };
      updateCharts(data);

      expect(AppState.charts.services.update).toHaveBeenCalledWith('none');
      expect(AppState.charts.countries.update).toHaveBeenCalledWith('none');
    });

    test('should handle empty data gracefully', () => {
      const data = { services: {}, countries: {} };
      expect(() => updateCharts(data)).not.toThrow();
    });

    test('should handle missing charts', () => {
      AppState.charts = {};
      const data = { services: { 'HTTP': 100 }, countries: {} };
      expect(() => updateCharts(data)).not.toThrow();
    });

    test('should handle null data', () => {
      expect(() => updateCharts(null)).not.toThrow();
    });

    test('should handle undefined services or countries', () => {
      const data = {};
      expect(() => updateCharts(data)).not.toThrow();
    });
  });
});