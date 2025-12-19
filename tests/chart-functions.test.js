/**
 * Comprehensive tests for chart and visualization functions in docs/script.js
 * Tests initCharts, updateCharts, generateColorPalette, renderHeatmap
 */

const fs = require('fs');

describe('Chart and Visualization Functions', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('initCharts', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initCharts\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should look for servicesChart canvas element', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]servicesChart['"]\)/);
    });

    test('should look for countriesChart canvas element', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]countriesChart['"]\)/);
    });

    test('should check for Chart.js availability', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.Chart/);
    });

    test('should create doughnut chart for services', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/type:\s*['"]doughnut['"]/);
    });

    test('should create bar chart for countries', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/type:\s*['"]bar['"]/);
    });

    test('should store charts in AppState.charts', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.charts\.services/);
      expect(funcMatch[0]).toMatch(/AppState\.charts\.countries/);
    });

    test('should initialize charts with empty labels and data', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/labels:\s*\[\]/);
      expect(funcMatch[0]).toMatch(/data:\s*\[\]/);
    });

    test('should use generateColorPalette for chart colors', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/generateColorPalette/);
    });

    test('should use CSS custom property for text color', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getComputedStyle\(document\.documentElement\)\.getPropertyValue\(['"]--text['"]\)/);
    });

    test('should configure chart scales for bar chart', () => {
      const funcMatch = scriptContent.match(/function initCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/scales:\s*\{/);
      expect(funcMatch[0]).toMatch(/x:\s*\{/);
      expect(funcMatch[0]).toMatch(/y:\s*\{/);
    });
  });

  describe('updateCharts', () => {
    test('should accept data parameter', () => {
      const funcMatch = scriptContent.match(/function updateCharts\(data\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should have JSDoc describing data parameter', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?@param \{Object\} data[\s\S]*?services[\s\S]*?countries[\s\S]*?\*\/\s*function updateCharts/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should return early if data is falsy', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!data\s*\)\s*return/);
    });

    test('should check if services chart exists', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*AppState\.charts\.services\s*\)/);
    });

    test('should check if countries chart exists', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*AppState\.charts\.countries\s*\)/);
    });

    test('should sort service entries by count descending', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Object\.entries\(data\.services/);
      expect(funcMatch[0]).toMatch(/\.sort\([^)]*b\[1\]\s*-\s*a\[1\]/);
    });

    test('should sort country entries and limit to top 12', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Object\.entries\(data\.countries/);
      expect(funcMatch[0]).toMatch(/\.slice\(0,\s*12\)/);
    });

    test('should update chart labels and data', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/chart\.data\.labels\s*=/);
      expect(funcMatch[0]).toMatch(/chart\.data\.datasets\[0\]\.data\s*=/);
    });

    test('should regenerate colors when updating charts', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/generateColorPalette\(entries\.length/);
    });

    test('should call chart.update with "none" mode', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/chart\.update\(['"]none['"]\)/);
    });

    test('should handle missing services or countries data', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/data\.services\s*\|\|\s*\{\}/);
      expect(funcMatch[0]).toMatch(/data\.countries\s*\|\|\s*\{\}/);
    });

    test('should provide fallback for empty entries', () => {
      const funcMatch = scriptContent.match(/function updateCharts[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/entries\.length\s*\|\|\s*1/);
    });
  });

  describe('generateColorPalette', () => {
    test('should accept count and seed parameters', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should have JSDoc with parameter and return types', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?@param \{number\} count[\s\S]*?@param \{string\} seed[\s\S]*?@returns \{string\[\]\}[\s\S]*?\*\/\s*function generateColorPalette/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should use different base hue for services seed', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/seed\s*===\s*['"]services['"]\s*\?\s*180\s*:\s*300/);
    });

    test('should return array of HSL color strings', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Array\.from/);
      expect(funcMatch[0]).toMatch(/hsl\(/);
    });

    test('should use 27-degree hue increments for variety', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/idx\s*\*\s*27/);
    });

    test('should use modulo 360 to wrap hue values', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/%\s*360/);
    });

    test('should use 80% saturation and 55% lightness', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/80%/);
      expect(funcMatch[0]).toMatch(/55%/);
    });

    test('should include alpha channel of 0.7', () => {
      const funcMatch = scriptContent.match(/function generateColorPalette[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/0\.7/);
    });
  });

  describe('renderHeatmap', () => {
    test('should be defined as an async function', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should have comprehensive JSDoc', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?Render a world choropleth heatmap[\s\S]*?@param \{Object\} data[\s\S]*?\*\/\s*async function renderHeatmap/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should return early if container not found', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!container\s*\|\|\s*!window\.d3\s*\)\s*return/);
    });

    test('should check for d3 library availability', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.d3/);
    });

    test('should check for topojson library availability', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.topojson/);
    });

    test('should log error if TopoJSON is missing', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*TopoJSON library missing/);
    });

    test('should fetch world topology if not cached', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!AppState\.worldData\s*\)/);
      expect(funcMatch[0]).toMatch(/d3\.json\([^)]*world-atlas/);
    });

    test('should cache world topology in AppState', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.worldData\s*=\s*topojson\.feature/);
    });

    test('should handle world data fetch errors', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/catch\s*\([^)]*err/);
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Failed to load world map/);
    });

    test('should use d3 geoNaturalEarth1 projection', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/d3\.geoNaturalEarth1\(\)/);
    });

    test('should use d3 scaleSequential with interpolateTurbo', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/d3\.scaleSequential\(d3\.interpolateTurbo\)/);
    });

    test('should clear existing SVG content before rendering', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/selectAll\(['"]?\*['"]?\)\.remove\(\)/);
    });

    test('should add tooltips with country name and count', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/append\(['"]title['"]\)/);
    });

    test('should look up countries by ISO code or name', () => {
      const funcMatch = scriptContent.match(/async function renderHeatmap[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/d\.properties\.iso_a2\s*\|\|\s*d\.properties\.name/);
    });
  });
});