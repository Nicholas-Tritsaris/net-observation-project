/**
 * Comprehensive unit tests for chart initialization and update functions
 * Tests initCharts, updateCharts with Chart.js mocking
 */

describe('Chart Functions', () => {
  let scriptContent;
  let mockChart;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    
    // Mock Chart.js
    mockChart = {
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
      },
      update: jest.fn(),
      destroy: jest.fn()
    };
    
    global.Chart = jest.fn(() => mockChart);
    
    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => '#ffffff')
    }));
  });

  afterEach(() => {
    delete global.Chart;
    delete global.getComputedStyle;
  });

  describe('initCharts', () => {
    test('should initialize services doughnut chart when canvas exists', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
      `;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      expect(Chart).toHaveBeenCalled();
      expect(AppState.charts.services).toBeDefined();
      expect(Chart.mock.calls[0][1].type).toBe('doughnut');
    });

    test('should initialize countries bar chart when canvas exists', () => {
      document.body.innerHTML = `
        <canvas id="countriesChart"></canvas>
      `;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      expect(Chart).toHaveBeenCalled();
      expect(AppState.charts.countries).toBeDefined();
      expect(Chart.mock.calls[0][1].type).toBe('bar');
    });

    test('should initialize both charts when both canvases exist', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      expect(Chart).toHaveBeenCalledTimes(2);
      expect(AppState.charts.services).toBeDefined();
      expect(AppState.charts.countries).toBeDefined();
    });

    test('should not initialize charts when Chart.js is not available', () => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
      
      delete global.Chart;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      expect(() => initCharts()).not.toThrow();
      expect(AppState.charts.services).toBeUndefined();
      expect(AppState.charts.countries).toBeUndefined();
    });

    test('should not initialize charts when canvases do not exist', () => {
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      expect(Chart).not.toHaveBeenCalled();
      expect(AppState.charts.services).toBeUndefined();
    });

    test('should configure services chart with empty initial data', () => {
      document.body.innerHTML = `<canvas id="servicesChart"></canvas>`;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      const config = Chart.mock.calls[0][1];
      expect(config.data.labels).toEqual([]);
      expect(config.data.datasets[0].data).toEqual([]);
    });

    test('should configure countries chart with axis scales', () => {
      document.body.innerHTML = `<canvas id="countriesChart"></canvas>`;
      
      const AppState = { charts: {} };
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const initChartsFunc = scriptContent.match(/function initCharts\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(initChartsFunc);
      
      initCharts();
      
      const config = Chart.mock.calls[0][1];
      expect(config.options.scales).toBeDefined();
      expect(config.options.scales.x).toBeDefined();
      expect(config.options.scales.y).toBeDefined();
    });
  });

  describe('updateCharts', () => {
    test('should update services chart with new data', () => {
      const AppState = {
        charts: {
          services: mockChart
        }
      };
      
      const mockData = {
        services: {
          HTTP: 500,
          HTTPS: 800,
          SSH: 200
        },
        countries: {}
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      updateCharts(mockData);
      
      expect(mockChart.data.labels).toEqual(['HTTPS', 'HTTP', 'SSH']);
      expect(mockChart.data.datasets[0].data).toEqual([800, 500, 200]);
      expect(mockChart.update).toHaveBeenCalledWith('none');
    });

    test('should update countries chart with top 12 countries', () => {
      const AppState = {
        charts: {
          countries: mockChart
        }
      };
      
      const mockData = {
        services: {},
        countries: {
          US: 1000, CN: 900, DE: 800, GB: 700,
          FR: 600, JP: 500, AU: 400, CA: 300,
          IN: 200, BR: 100, RU: 90, IT: 80,
          ES: 70, MX: 60, KR: 50 // 15 countries total
        }
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      updateCharts(mockData);
      
      expect(mockChart.data.labels).toHaveLength(12);
      expect(mockChart.data.labels[0]).toBe('US');
      expect(mockChart.data.datasets[0].data[0]).toBe(1000);
      expect(mockChart.update).toHaveBeenCalledWith('none');
    });

    test('should handle empty data gracefully', () => {
      const AppState = {
        charts: {
          services: mockChart,
          countries: mockChart
        }
      };
      
      const mockData = {
        services: {},
        countries: {}
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      expect(() => updateCharts(mockData)).not.toThrow();
      expect(mockChart.data.labels).toEqual([]);
    });

    test('should handle null data', () => {
      const AppState = { charts: {} };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      expect(() => updateCharts(null)).not.toThrow();
      expect(() => updateCharts(undefined)).not.toThrow();
    });

    test('should sort services by count descending', () => {
      const AppState = {
        charts: {
          services: mockChart
        }
      };
      
      const mockData = {
        services: {
          SSH: 100,
          FTP: 50,
          HTTPS: 500,
          HTTP: 300
        },
        countries: {}
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      updateCharts(mockData);
      
      expect(mockChart.data.datasets[0].data).toEqual([500, 300, 100, 50]);
      expect(mockChart.data.labels).toEqual(['HTTPS', 'HTTP', 'SSH', 'FTP']);
    });

    test('should update chart colors when data changes', () => {
      const AppState = {
        charts: {
          services: mockChart
        }
      };
      
      const mockData = {
        services: { A: 10, B: 20, C: 30 },
        countries: {}
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      updateCharts(mockData);
      
      expect(mockChart.data.datasets[0].backgroundColor).toHaveLength(3);
      expect(mockChart.data.datasets[0].backgroundColor.every(c => c.startsWith('hsl('))).toBe(true);
    });

    test('should not update charts that do not exist in AppState', () => {
      const AppState = { charts: {} };
      
      const mockData = {
        services: { HTTP: 100 },
        countries: { US: 50 }
      };
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      expect(() => updateCharts(mockData)).not.toThrow();
    });

    test('should handle missing services or countries in data', () => {
      const AppState = {
        charts: {
          services: mockChart,
          countries: mockChart
        }
      };
      
      const mockData = {}; // No services or countries
      
      const generateColorPaletteFunc = scriptContent.match(/function generateColorPalette\(count, seed\) \{[\s\S]*?\n  \}/)[0];
      const updateChartsFunc = scriptContent.match(/function updateCharts\(data\) \{[\s\S]*?\n  \}/)[0];
      
      eval(generateColorPaletteFunc);
      eval(updateChartsFunc);
      
      expect(() => updateCharts(mockData)).not.toThrow();
    });
  });

  describe('initAutoRefresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should call fetchCensysSummary immediately', () => {
      const fetchCensysSummary = jest.fn();
      const initAutoRefreshFunc = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(initAutoRefreshFunc);
      initAutoRefresh();
      
      expect(fetchCensysSummary).toHaveBeenCalledTimes(1);
      expect(fetchCensysSummary).toHaveBeenCalledWith();
    });

    test('should schedule silent fetches every 60 seconds', () => {
      const fetchCensysSummary = jest.fn();
      const initAutoRefreshFunc = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(initAutoRefreshFunc);
      initAutoRefresh();
      
      expect(fetchCensysSummary).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(60000);
      expect(fetchCensysSummary).toHaveBeenCalledTimes(2);
      expect(fetchCensysSummary).toHaveBeenLastCalledWith(true);
      
      jest.advanceTimersByTime(60000);
      expect(fetchCensysSummary).toHaveBeenCalledTimes(3);
      expect(fetchCensysSummary).toHaveBeenLastCalledWith(true);
    });

    test('should continue refreshing after multiple intervals', () => {
      const fetchCensysSummary = jest.fn();
      const initAutoRefreshFunc = scriptContent.match(/function initAutoRefresh\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(initAutoRefreshFunc);
      initAutoRefresh();
      
      jest.advanceTimersByTime(300000); // 5 minutes
      
      expect(fetchCensysSummary).toHaveBeenCalledTimes(6); // 1 initial + 5 interval calls
    });
  });
});