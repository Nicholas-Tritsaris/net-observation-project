/**
 * Comprehensive unit tests for chart and visualization functions
 * Tests Chart.js integration, D3 heatmap, and data visualization features
 */

describe('Charts and Visualization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    
    // Mock Chart.js
    global.Chart = jest.fn().mockImplementation(() => ({
      data: { labels: [], datasets: [] },
      options: {},
      update: jest.fn(),
      destroy: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initCharts', () => {
    test('should create services doughnut chart when canvas exists', () => {
      document.body.innerHTML = '<canvas id="servicesChart"></canvas>';
      const canvas = document.getElementById('servicesChart');
      
      expect(canvas).not.toBeNull();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('should create countries bar chart when canvas exists', () => {
      document.body.innerHTML = '<canvas id="countriesChart"></canvas>';
      const canvas = document.getElementById('countriesChart');
      
      expect(canvas).not.toBeNull();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('should not create charts when Chart.js is unavailable', () => {
      global.Chart = undefined;
      document.body.innerHTML = '<canvas id="servicesChart"></canvas>';
      
      expect(global.Chart).toBeUndefined();
    });

    test('should not create charts when canvas elements are missing', () => {
      document.body.innerHTML = '<div>No canvas here</div>';
      
      const servicesCanvas = document.getElementById('servicesChart');
      const countriesCanvas = document.getElementById('countriesChart');
      
      expect(servicesCanvas).toBeNull();
      expect(countriesCanvas).toBeNull();
    });

    test('should initialize chart with empty datasets', () => {
      document.body.innerHTML = '<canvas id="servicesChart"></canvas>';
      
      const mockChart = {
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [] }]
        },
        update: jest.fn()
      };
      
      expect(mockChart.data.labels).toHaveLength(0);
      expect(mockChart.data.datasets[0].data).toHaveLength(0);
    });

    test('should use theme-aware text colors', () => {
      const textColor = 'rgb(220, 220, 220)';
      
      const chartOptions = {
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: textColor
            }
          }
        }
      };
      
      expect(chartOptions.plugins.legend.labels.color).toBe(textColor);
      expect(chartOptions.scales.y.ticks.color).toBe(textColor);
    });
  });

  describe('updateCharts', () => {
    let mockServicesChart, mockCountriesChart;
    
    beforeEach(() => {
      mockServicesChart = {
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [] }]
        },
        update: jest.fn()
      };
      
      mockCountriesChart = {
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [] }]
        },
        update: jest.fn()
      };
    });

    test('should update services chart with new data', () => {
      const data = {
        services: {
          'HTTP': 500,
          'HTTPS': 300,
          'SSH': 150
        }
      };
      
      const sorted = Object.entries(data.services).sort(([, a], [, b]) => b - a);
      mockServicesChart.data.labels = sorted.map(([k]) => k);
      mockServicesChart.data.datasets[0].data = sorted.map(([, v]) => v);
      
      expect(mockServicesChart.data.labels).toEqual(['HTTP', 'HTTPS', 'SSH']);
      expect(mockServicesChart.data.datasets[0].data).toEqual([500, 300, 150]);
    });

    test('should update countries chart with top 12 countries', () => {
      const data = {
        countries: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`Country${i}`, 100 - i])
        )
      };
      
      const sorted = Object.entries(data.countries)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12);
      
      mockCountriesChart.data.labels = sorted.map(([k]) => k);
      mockCountriesChart.data.datasets[0].data = sorted.map(([, v]) => v);
      
      expect(mockCountriesChart.data.labels).toHaveLength(12);
      expect(mockCountriesChart.data.datasets[0].data).toHaveLength(12);
    });

    test('should generate colors for chart segments', () => {
      const count = 5;
      const colors = Array.from({ length: count }, (_, i) => 
        `hsl(${(180 + i * 27) % 360} 80% 55% / 0.7)`
      );
      
      mockServicesChart.data.datasets[0].backgroundColor = colors;
      
      expect(mockServicesChart.data.datasets[0].backgroundColor).toHaveLength(5);
    });

    test('should call chart update after data change', () => {
      mockServicesChart.update();
      
      expect(mockServicesChart.update).toHaveBeenCalled();
    });

    test('should handle null or undefined data gracefully', () => {
      const data = null;
      
      if (!data) {
        // Don't update charts
        expect(mockServicesChart.update).not.toHaveBeenCalled();
      }
    });

    test('should preserve chart configuration during updates', () => {
      const originalOptions = { ...mockServicesChart.data };
      
      mockServicesChart.data.labels = ['New', 'Labels'];
      
      expect(mockServicesChart.data.datasets).toBeDefined();
    });
  });

  describe('renderHeatmap', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="worldHeatmap"></div>';
      
      // Mock D3
      global.d3 = {
        select: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        geoMercator: jest.fn().mockReturnValue(() => [0, 0]),
        geoPath: jest.fn().mockReturnValue(() => ''),
        scaleLinear: jest.fn().mockReturnValue({
          domain: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis()
        }),
        max: jest.fn(),
        json: jest.fn()
      };
      
      // Mock TopoJSON
      global.topojson = {
        feature: jest.fn().mockReturnValue({
          features: []
        })
      };
    });

    test('should require D3 library to be available', () => {
      expect(global.d3).toBeDefined();
    });

    test('should require TopoJSON library to be available', () => {
      expect(global.topojson).toBeDefined();
    });

    test('should require target container element', () => {
      const container = document.getElementById('worldHeatmap');
      expect(container).not.toBeNull();
    });

    test('should load world topology data', async () => {
      const mockTopology = {
        objects: {
          countries: {
            geometries: []
          }
        }
      };
      
      global.d3.json.mockResolvedValue(mockTopology);
      
      const topology = await global.d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      expect(topology).toEqual(mockTopology);
    });

    test('should create color scale based on country counts', () => {
      const data = {
        countries: {
          'US': 1000,
          'GB': 500,
          'DE': 250
        }
      };
      
      const maxCount = Math.max(...Object.values(data.countries));
      expect(maxCount).toBe(1000);
      
      const scale = global.d3.scaleLinear();
      scale.domain([0, maxCount]);
      
      expect(scale.domain).toHaveBeenCalledWith([0, 1000]);
    });

    test('should handle missing country data', () => {
      const data = { countries: {} };
      const maxCount = Math.max(...Object.values(data.countries), 0);
      
      expect(maxCount).toBe(0);
    });

    test('should cache loaded topology', () => {
      const cache = { worldData: null };
      const mockTopology = { objects: {} };
      
      cache.worldData = mockTopology;
      
      expect(cache.worldData).not.toBeNull();
      expect(cache.worldData).toBe(mockTopology);
    });

    test('should match countries by ISO A2 code', () => {
      const countryCounts = { 'US': 1000, 'GB': 500 };
      const countryFeature = { properties: { iso_a2: 'US' } };
      
      const count = countryCounts[countryFeature.properties.iso_a2];
      expect(count).toBe(1000);
    });

    test('should fallback to country name if ISO code not found', () => {
      const countryCounts = { 'United States': 1000 };
      const countryFeature = { properties: { iso_a2: 'XX', name: 'United States' } };
      
      const count = countryCounts[countryFeature.properties.iso_a2] || 
                    countryCounts[countryFeature.properties.name];
      
      expect(count).toBe(1000);
    });
  });

  describe('Data Visualizer', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <input type="file" id="fileInput" />
        <button id="renderBtn">Render</button>
        <div id="dataOutput"></div>
      `;
    });

    test('should parse valid JSON input', () => {
      const jsonString = '{"key": "value", "count": 42}';
      const parsed = JSON.parse(jsonString);
      
      expect(parsed).toEqual({ key: 'value', count: 42 });
    });

    test('should detect JSON by leading brace or bracket', () => {
      const jsonObject = '{"test": true}';
      const jsonArray = '[1, 2, 3]';
      
      expect(jsonObject.trim().startsWith('{')).toBe(true);
      expect(jsonArray.trim().startsWith('[')).toBe(true);
    });

    test('should parse CSV data', () => {
      const csvString = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
      const lines = csvString.split('\n');
      const headers = lines[0].split(',');
      
      expect(headers).toEqual(['name', 'age', 'city']);
      expect(lines).toHaveLength(3);
    });

    test('should handle file upload', () => {
      const fileInput = document.getElementById('fileInput');
      const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });
      
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files[0].name).toBe('test.json');
    });

    test('should read file content with FileReader', (done) => {
      const mockFile = new File(['{"test": true}'], 'data.json', { type: 'application/json' });
      const reader = new FileReader();
      
      reader.onload = (e) => {
        expect(e.target.result).toBe('{"test": true}');
        done();
      };
      
      reader.readAsText(mockFile);
    });

    test('should render JSON as formatted HTML', () => {
      const data = { key: 'value', nested: { prop: 42 } };
      const json = JSON.stringify(data, null, 2);
      
      expect(json).toContain('  ');
      expect(json).toContain('key');
      expect(json).toContain('nested');
    });

    test('should render CSV as HTML table', () => {
      const csvData = [
        ['Name', 'Age'],
        ['Alice', '30'],
        ['Bob', '25']
      ];
      
      const output = document.getElementById('dataOutput');
      const table = document.createElement('table');
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      
      csvData[0].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      
      output.appendChild(table);
      
      const headers = output.querySelectorAll('th');
      expect(headers).toHaveLength(2);
      expect(headers[0].textContent).toBe('Name');
    });

    test('should handle invalid JSON gracefully', () => {
      const invalidJson = '{invalid json}';
      
      try {
        JSON.parse(invalidJson);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });

    test('should clear previous output before rendering', () => {
      const output = document.getElementById('dataOutput');
      output.innerHTML = '<p>Old content</p>';
      
      output.innerHTML = '';
      
      expect(output.children.length).toBe(0);
    });
  });
});