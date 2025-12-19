/**
 * Unit tests for chart initialization (initCharts)
 * Tests Chart.js setup, canvas detection, and configuration
 */

const fs = require('fs');

describe('Chart Initialization', () => {
  let initCharts, AppState, generateColorPalette;

  beforeEach(() => {
    // Mock Chart.js
    global.Chart = jest.fn((ctx, config) => ({
      data: config.data,
      options: config.options,
      update: jest.fn()
    }));

    AppState = {
      settings: {},
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    document.body.innerHTML = `
      <canvas id="servicesChart"></canvas>
      <canvas id="countriesChart"></canvas>
    `;

    // Mock getComputedStyle
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: () => '#e9f9ff'
    }));

    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract generateColorPalette
    const paletteMatch = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/);
    if (paletteMatch) {
      eval(`generateColorPalette = ${paletteMatch[0].replace('function generateColorPalette(count, seed)', 'function(count, seed)')}`);
    }
    
    // Extract initCharts
    const funcMatch = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/);
    if (funcMatch) {
      eval(`initCharts = ${funcMatch[0].replace('function initCharts()', 'function()')}`);
    }
  });

  afterEach(() => {
    delete global.Chart;
  });

  describe('Services Chart', () => {
    test('should create services chart when canvas exists', () => {
      initCharts();
      
      expect(global.Chart).toHaveBeenCalled();
      expect(AppState.charts.services).toBeDefined();
    });

    test('should configure services chart as doughnut type', () => {
      initCharts();
      
      const chartCall = global.Chart.mock.calls.find(call => 
        call[1].type === 'doughnut'
      );
      expect(chartCall).toBeDefined();
    });

    test('should initialize services chart with empty data', () => {
      initCharts();
      
      expect(AppState.charts.services.data.labels).toEqual([]);
      expect(AppState.charts.services.data.datasets[0].data).toEqual([]);
    });

    test('should use color palette for services', () => {
      initCharts();
      
      const colors = AppState.charts.services.data.datasets[0].backgroundColor;
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    test('should configure legend with text color', () => {
      initCharts();
      
      expect(AppState.charts.services.options.plugins.legend.labels.color).toBeDefined();
    });

    test('should not create chart when canvas missing', () => {
      document.body.innerHTML = '';
      initCharts();
      
      expect(AppState.charts.services).toBeUndefined();
    });

    test('should not create chart when Chart.js not available', () => {
      delete global.Chart;
      initCharts();
      
      expect(AppState.charts.services).toBeUndefined();
    });
  });

  describe('Countries Chart', () => {
    test('should create countries chart when canvas exists', () => {
      initCharts();
      
      expect(AppState.charts.countries).toBeDefined();
    });

    test('should configure countries chart as bar type', () => {
      initCharts();
      
      const chartCall = global.Chart.mock.calls.find(call => 
        call[1].type === 'bar'
      );
      expect(chartCall).toBeDefined();
    });

    test('should initialize countries chart with empty data', () => {
      initCharts();
      
      expect(AppState.charts.countries.data.labels).toEqual([]);
      expect(AppState.charts.countries.data.datasets[0].data).toEqual([]);
    });

    test('should configure x-axis ticks color', () => {
      initCharts();
      
      expect(AppState.charts.countries.options.scales.x.ticks.color).toBeDefined();
    });

    test('should configure y-axis ticks color', () => {
      initCharts();
      
      expect(AppState.charts.countries.options.scales.y.ticks.color).toBeDefined();
    });

    test('should use different color palette than services', () => {
      initCharts();
      
      const servicesColors = AppState.charts.services.data.datasets[0].backgroundColor;
      const countriesColors = AppState.charts.countries.data.datasets[0].backgroundColor;
      
      expect(servicesColors[0]).not.toBe(countriesColors[0]);
    });
  });

  describe('Chart Configuration', () => {
    test('should get CSS custom property for text color', () => {
      initCharts();
      
      expect(window.getComputedStyle).toHaveBeenCalled();
    });

    test('should create chart with 2d context', () => {
      initCharts();
      
      const canvas = document.getElementById('servicesChart');
      const getContextSpy = jest.spyOn(canvas, 'getContext');
      
      initCharts();
      
      expect(getContextSpy).toHaveBeenCalledWith('2d');
    });

    test('should set border width on datasets', () => {
      initCharts();
      
      expect(AppState.charts.services.data.datasets[0].borderWidth).toBe(1);
    });

    test('should label services dataset correctly', () => {
      initCharts();
      
      expect(AppState.charts.services.data.datasets[0].label).toBe('Services');
    });

    test('should label countries dataset as Hosts', () => {
      initCharts();
      
      expect(AppState.charts.countries.data.datasets[0].label).toBe('Hosts');
    });
  });

  describe('Partial Availability', () => {
    test('should create only services chart if countries canvas missing', () => {
      document.body.innerHTML = '<canvas id="servicesChart"></canvas>';
      initCharts();
      
      expect(AppState.charts.services).toBeDefined();
      expect(AppState.charts.countries).toBeUndefined();
    });

    test('should create only countries chart if services canvas missing', () => {
      document.body.innerHTML = '<canvas id="countriesChart"></canvas>';
      initCharts();
      
      expect(AppState.charts.services).toBeUndefined();
      expect(AppState.charts.countries).toBeDefined();
    });

    test('should handle both canvases missing', () => {
      document.body.innerHTML = '';
      expect(() => initCharts()).not.toThrow();
      
      expect(AppState.charts.services).toBeUndefined();
      expect(AppState.charts.countries).toBeUndefined();
    });
  });
});