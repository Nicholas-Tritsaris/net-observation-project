/**
 * Comprehensive tests for Chart.js and D3 visualization functions
 * Tests: initCharts, updateCharts, renderHeatmap, generateColorPalette
 */

describe('Charts and Visualization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.Chart = jest.fn();
    global.d3 = {
      select: jest.fn(),
      json: jest.fn(),
      geoNaturalEarth1: jest.fn(),
      geoPath: jest.fn(),
      scaleSequential: jest.fn(),
      interpolateTurbo: jest.fn()
    };
    global.topojson = {
      feature: jest.fn()
    };
  });

  describe('initCharts', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
    });

    test('should find services chart canvas', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]servicesChart['"]\)/);
    });

    test('should find countries chart canvas', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/getElementById\(['"]countriesChart['"]\)/);
    });

    test('should check for Chart.js availability', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/window\.Chart/);
    });

    test('should create doughnut chart for services', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/type: ['"]doughnut['"]/);
    });

    test('should create bar chart for countries', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/type: ['"]bar['"]/);
    });

    test('should use color palette for charts', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/generateColorPalette/);
    });

    test('should store charts in AppState', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/AppState\.charts\.services/);
      expect(funcMatch[0]).toMatch(/AppState\.charts\.countries/);
    });

    test('should use theme-aware text colors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initCharts\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update)/);
      
      expect(funcMatch[0]).toMatch(/getComputedStyle.*--text/);
    });
  });

  describe('updateCharts', () => {
    test('should check if data exists', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if \(!data\) return/);
    });

    test('should update services chart if it exists', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(AppState\.charts\.services\)/);
    });

    test('should update countries chart if it exists', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(AppState\.charts\.countries\)/);
    });

    test('should sort services by count descending', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/sort.*b\[1\] - a\[1\]/);
    });

    test('should limit countries chart to top 12', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/slice\(0, 12\)/);
    });

    test('should update chart labels', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/\.data\.labels = /);
    });

    test('should update chart dataset values', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/\.data\.datasets\[0\]\.data = /);
    });

    test('should call chart update method', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function updateCharts\(data\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/\.update\(\)/);
    });
  });

  describe('renderHeatmap', () => {
    beforeEach(() => {
      document.body.innerHTML = '<svg id="worldHeatmap"></svg>';
    });

    test('should find heatmap container', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]worldHeatmap['"]\)/);
    });

    test('should check for D3 availability', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/window\.d3/);
    });

    test('should check for TopoJSON availability', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/window\.topojson/);
    });

    test('should load world topology data if not cached', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/if \(!AppState\.worldData\)/);
      expect(funcMatch[0]).toMatch(/d3\.json/);
      expect(funcMatch[0]).toMatch(/world-atlas/);
    });

    test('should cache loaded world data', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/AppState\.worldData = /);
    });

    test('should handle topology load errors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/catch/);
      expect(funcMatch[0]).toMatch(/logTerminal.*Failed to load world map/);
    });

    test('should use Natural Earth projection', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/geoNaturalEarth1/);
    });

    test('should create color scale', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/scaleSequential/);
      expect(funcMatch[0]).toMatch(/interpolateTurbo/);
    });

    test('should clear existing SVG content', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/selectAll\(['"]\*['"]\)\.remove\(\)/);
    });

    test('should add title tooltips to countries', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function renderHeatmap\(data\)[\s\S]*?(?=\n  \/\*\*\n   \* Enable)/);
      
      expect(funcMatch[0]).toMatch(/append\(['"]title['"]\)/);
    });
  });

  describe('generateColorPalette', () => {
    test('should accept count and seed parameters', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
    });

    test('should use different base hue for services', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/seed === ['"]services['"]\s*\?\s*180/);
    });

    test('should use different base hue for countries', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/:\s*300/);
    });

    test('should generate array of specified length', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/Array\.from\(\{ length: count \}/);
    });

    test('should return HSL color format', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/hsl\(/);
    });

    test('should use 80% saturation and 55% lightness', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/80%.*55%/);
    });

    test('should use 0.7 alpha transparency', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/0\.7/);
    });

    test('should distribute hues with 27-degree spacing', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/idx \* 27/);
    });

    test('should wrap hue values using modulo 360', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/% 360/);
    });
  });
});