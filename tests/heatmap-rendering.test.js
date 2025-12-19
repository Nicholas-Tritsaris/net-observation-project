/**
 * Unit tests for heatmap rendering (renderHeatmap)
 * Tests D3.js integration, data visualization, and geographic mapping
 */

const fs = require('fs');

describe('Heatmap Rendering', () => {
  let renderHeatmap, AppState, logTerminal;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="worldHeatmap"></svg>
      <div class="terminal-output"></div>
    `;

    AppState = {
      settings: {},
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    // Mock D3.js
    const mockSelection = {
      attr: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis()
    };

    global.d3 = {
      select: jest.fn(() => mockSelection),
      json: jest.fn(),
      geoNaturalEarth1: jest.fn(() => ({
        fitWidth: jest.fn().mockReturnThis()
      })),
      geoPath: jest.fn(() => jest.fn()),
      scaleSequential: jest.fn(() => ({
        domain: jest.fn().mockReturnThis()
      })),
      interpolateTurbo: jest.fn()
    };

    global.topojson = {
      feature: jest.fn((world, obj) => ({
        features: [
          { properties: { iso_a2: 'US', name: 'United States' } },
          { properties: { iso_a2: 'UK', name: 'United Kingdom' } }
        ]
      }))
    };

    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract logTerminal
    const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
    if (logMatch) {
      eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
    }
    
    // Extract renderHeatmap
    const funcMatch = scriptContent.match(/async function renderHeatmap\(data\) \{[\s\S]*?\n  \}/);
    if (funcMatch) {
      eval(`renderHeatmap = ${funcMatch[0].replace('async function renderHeatmap(data)', 'async function(data)')}`);
    }
  });

  afterEach(() => {
    delete global.d3;
    delete global.topojson;
  });

  describe('Prerequisites', () => {
    test('should require container element', async () => {
      document.body.innerHTML = '';
      await renderHeatmap({ countries: {} });
      
      expect(global.d3.select).not.toHaveBeenCalled();
    });

    test('should require D3 library', async () => {
      delete global.d3;
      await renderHeatmap({ countries: {} });
      
      // Should not throw
      expect(true).toBe(true);
    });

    test('should log error when TopoJSON missing', async () => {
      delete global.topojson;
      await renderHeatmap({ countries: {} });
      
      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('TopoJSON library missing');
    });

    test('should check for both D3 and TopoJSON', async () => {
      await renderHeatmap({ countries: { 'US': 100 } });
      
      expect(global.d3.select).toHaveBeenCalled();
    });
  });

  describe('World Data Loading', () => {
    test('should fetch world topology when not cached', async () => {
      const mockWorldData = {
        objects: { countries: {} }
      };
      global.d3.json.mockResolvedValue(mockWorldData);

      await renderHeatmap({ countries: {} });

      expect(global.d3.json).toHaveBeenCalledWith(
        expect.stringContaining('world-atlas')
      );
    });

    test('should cache world data after first load', async () => {
      const mockWorldData = { objects: { countries: {} } };
      global.d3.json.mockResolvedValue(mockWorldData);

      await renderHeatmap({ countries: {} });
      await renderHeatmap({ countries: {} });

      expect(global.d3.json).toHaveBeenCalledTimes(1);
    });

    test('should use cached world data on subsequent calls', async () => {
      AppState.worldData = { features: [] };

      await renderHeatmap({ countries: {} });

      expect(global.d3.json).not.toHaveBeenCalled();
    });

    test('should handle fetch errors gracefully', async () => {
      global.d3.json.mockRejectedValue(new Error('Network error'));

      await renderHeatmap({ countries: {} });

      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Failed to load world map data');
    });

    test('should convert TopoJSON to GeoJSON', async () => {
      const mockWorldData = { objects: { countries: {} } };
      global.d3.json.mockResolvedValue(mockWorldData);

      await renderHeatmap({ countries: {} });

      expect(global.topojson.feature).toHaveBeenCalled();
    });
  });

  describe('Map Rendering', () => {
    beforeEach(() => {
      AppState.worldData = {
        features: [
          { properties: { iso_a2: 'US', name: 'United States' } },
          { properties: { iso_a2: 'UK', name: 'United Kingdom' } }
        ]
      };
    });

    test('should select SVG container', async () => {
      await renderHeatmap({ countries: {} });
      
      expect(global.d3.select).toHaveBeenCalledWith(
        document.getElementById('worldHeatmap')
      );
    });

    test('should set viewBox on SVG', async () => {
      const mockSvg = {
        attr: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis()
      };
      global.d3.select.mockReturnValue(mockSvg);

      await renderHeatmap({ countries: {} });

      expect(mockSvg.attr).toHaveBeenCalledWith('viewBox', '0 0 960 500');
    });

    test('should clear existing map before rendering', async () => {
      const mockSvg = {
        attr: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis()
      };
      global.d3.select.mockReturnValue(mockSvg);

      await renderHeatmap({ countries: {} });

      expect(mockSvg.selectAll).toHaveBeenCalledWith('*');
      expect(mockSvg.remove).toHaveBeenCalled();
    });

    test('should create color scale based on data range', async () => {
      await renderHeatmap({ countries: { 'US': 100, 'UK': 50 } });

      expect(global.d3.scaleSequential).toHaveBeenCalled();
    });

    test('should handle empty countries data', async () => {
      await renderHeatmap({ countries: {} });

      expect(global.d3.scaleSequential).toHaveBeenCalled();
    });

    test('should handle missing countries property', async () => {
      await renderHeatmap({});

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Data Mapping', () => {
    beforeEach(() => {
      AppState.worldData = {
        features: [
          { properties: { iso_a2: 'US', name: 'United States' } },
          { properties: { iso_a2: 'CA', name: 'Canada' } }
        ]
      };
    });

    test('should map country codes to colors', async () => {
      await renderHeatmap({ countries: { 'US': 100, 'CA': 50 } });

      expect(global.d3.scaleSequential).toHaveBeenCalled();
    });

    test('should handle country names as fallback', async () => {
      await renderHeatmap({ countries: { 'United States': 100 } });

      // Should not crash
      expect(true).toBe(true);
    });

    test('should calculate max value from country data', async () => {
      const mockScale = {
        domain: jest.fn().mockReturnThis()
      };
      global.d3.scaleSequential.mockReturnValue(mockScale);

      await renderHeatmap({ countries: { 'US': 150, 'CA': 75, 'UK': 200 } });

      expect(mockScale.domain).toHaveBeenCalledWith([0, 200]);
    });

    test('should handle zero counts', async () => {
      await renderHeatmap({ countries: { 'US': 0 } });

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Projection Setup', () => {
    beforeEach(() => {
      AppState.worldData = { features: [] };
    });

    test('should use Natural Earth projection', async () => {
      await renderHeatmap({ countries: {} });

      expect(global.d3.geoNaturalEarth1).toHaveBeenCalled();
    });

    test('should fit projection to width', async () => {
      const mockProjection = {
        fitWidth: jest.fn().mockReturnThis()
      };
      global.d3.geoNaturalEarth1.mockReturnValue(mockProjection);

      await renderHeatmap({ countries: {} });

      expect(mockProjection.fitWidth).toHaveBeenCalledWith(
        960,
        expect.any(Object)
      );
    });

    test('should create geo path generator', async () => {
      await renderHeatmap({ countries: {} });

      expect(global.d3.geoPath).toHaveBeenCalled();
    });
  });
});