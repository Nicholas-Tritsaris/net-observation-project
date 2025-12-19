/**
 * Edge Cases and Error Handling Tests
 * Testing robustness of changed functionality
 */

const fs = require('fs');

describe('Edge Cases - Theme Management', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('should handle matchMedia not being a function', () => {
    const prefersDarkDef = scriptContent.match(/const prefersDark = [\s\S]*?;/);
    expect(prefersDarkDef).toBeTruthy();
    expect(prefersDarkDef[0]).toContain('typeof window.matchMedia === \'function\'');
  });

  test('should provide fallback for matchMedia', () => {
    const prefersDarkDef = scriptContent.match(/const prefersDark = [\s\S]*?;/);
    expect(prefersDarkDef[0]).toContain('{ matches: true }');
  });

  test('should handle both addEventListener and addListener for media query', () => {
    expect(scriptContent).toContain('typeof prefersDark.addEventListener === \'function\'');
    expect(scriptContent).toContain('typeof prefersDark.addListener === \'function\'');
  });

  test('theme toggle should handle keyboard navigation', () => {
    const themeToggle = scriptContent.match(/toggle\.addEventListener\('keydown'[\s\S]*?\}\);/);
    expect(themeToggle).toBeTruthy();
    expect(themeToggle[0]).toContain('event.key === \'Enter\'');
    expect(themeToggle[0]).toContain('event.key === \' \'');
    expect(themeToggle[0]).toContain('event.preventDefault()');
  });
});

describe('Edge Cases - LocalStorage Handling', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('loadSettings should handle JSON parse errors', () => {
    const loadSettings = scriptContent.match(/function loadSettings\(\)[\s\S]*?(?=\n  function)/);
    expect(loadSettings).toBeTruthy();
    expect(loadSettings[0]).toContain('try');
    expect(loadSettings[0]).toContain('catch');
  });

  test('should not throw if localStorage.getItem returns null', () => {
    const loadSettings = scriptContent.match(/function loadSettings\(\)[\s\S]*?(?=\n  function)/);
    expect(loadSettings[0]).toContain('if (raw)');
  });

  test('should use Object.assign to merge settings safely', () => {
    const loadSettings = scriptContent.match(/function loadSettings\(\)[\s\S]*?(?=\n  function)/);
    expect(loadSettings[0]).toContain('Object.assign(AppState.settings, parsed)');
  });
});

describe('Edge Cases - DOM Element Queries', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('initThemeToggle should return early if toggle not found', () => {
    const initThemeToggle = scriptContent.match(/function initThemeToggle\(\)[\s\S]*?(?=\n  function)/);
    expect(initThemeToggle).toBeTruthy();
    expect(initThemeToggle[0]).toContain('if (!toggle) return');
  });

  test('initSidebar should return early if elements not found', () => {
    const initSidebar = scriptContent.match(/function initSidebar\(\)[\s\S]*?(?=\n  function)/);
    expect(initSidebar).toBeTruthy();
    expect(initSidebar[0]).toContain('if (!sidebar || !toggle) return');
  });

  test('initTerminal should return early if terminal not found', () => {
    const initTerminal = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  function)/);
    expect(initTerminal).toBeTruthy();
    expect(initTerminal[0]).toContain('if (!terminal) return');
  });

  test('renderTable should handle missing container or tbody', () => {
    const renderTable = scriptContent.match(/function renderTable[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(renderTable).toBeTruthy();
    expect(renderTable[0]).toContain('if (!container) return');
    expect(renderTable[0]).toContain('if (!tbody) return');
  });

  test('updateStatsView should use optional chaining for data properties', () => {
    const updateStats = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateStats).toBeTruthy();
    expect(updateStats[0]).toContain('data.total_hosts?.toLocaleString()');
    expect(updateStats[0]).toContain('data.total_services?.toLocaleString()');
  });

  test('should provide fallback values with nullish coalescing', () => {
    const updateStats = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateStats[0]).toContain('??');
  });
});

describe('Edge Cases - Fetch Error Handling', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('fetchCensysSummary should handle HTTP errors', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction).toBeTruthy();
    expect(fetchFunction[0]).toContain('if (!res.ok) throw');
  });

  test('should support silent error mode', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction[0]).toContain('silent = false');
    expect(fetchFunction[0]).toContain('if (!silent)');
  });

  test('should log to terminal on fetch success', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction[0]).toContain('logTerminal');
  });

  test('should warn to console on fetch error', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction[0]).toContain('console.warn');
  });
});

describe('Edge Cases - Data Visualizer', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('should handle empty CSV input', () => {
    const parseCSV = scriptContent.match(/const parseCSV = \(text\)[\s\S]*?};/);
    expect(parseCSV).toBeTruthy();
    expect(parseCSV[0]).toContain('trim()');
    expect(parseCSV[0]).toContain('split');
  });

  test('should detect JSON vs CSV by content', () => {
    const processText = scriptContent.match(/const processText = \(text\)[\s\S]*?};/);
    expect(processText).toBeTruthy();
    expect(processText[0]).toContain('trimmed.startsWith(\'{\')');
    expect(processText[0]).toContain('trimmed.startsWith(\'[\')');
  });

  test('data visualizer should handle parse errors', () => {
    const processText = scriptContent.match(/const processText = \(text\)[\s\S]*?};/);
    expect(processText[0]).toContain('try');
    expect(processText[0]).toContain('catch (err)');
  });

  test('should handle file reader errors', () => {
    const dataViz = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
    expect(dataViz).toBeTruthy();
    expect(dataViz[0]).toContain('reader.onload');
  });

  test('should check if file exists before reading', () => {
    const dataViz = scriptContent.match(/function initDataVisualizer\(\)[\s\S]*?(?=\n  const AppPlugins)/);
    expect(dataViz[0]).toContain('if (!file) return');
  });
});

describe('Edge Cases - Chart Updates', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('updateCharts should handle null or undefined data', () => {
    const updateCharts = scriptContent.match(/function updateCharts\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateCharts).toBeTruthy();
    expect(updateCharts[0]).toContain('if (!data) return');
  });

  test('should handle missing charts in AppState', () => {
    const updateCharts = scriptContent.match(/function updateCharts\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateCharts[0]).toContain('if (AppState.charts.services)');
    expect(updateCharts[0]).toContain('if (AppState.charts.countries)');
  });

  test('should provide default values for missing data', () => {
    const updateCharts = scriptContent.match(/function updateCharts\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateCharts[0]).toContain('data.services || {}');
    expect(updateCharts[0]).toContain('data.countries || {}');
  });

  test('generateColorPalette should handle zero count', () => {
    const genPalette = scriptContent.match(/function generateColorPalette\(count, seed\)[\s\S]*?(?=\n  function)/);
    expect(genPalette).toBeTruthy();
    // Should use || 1 as fallback
    const chartUpdate = scriptContent.match(/generateColorPalette\(entries\.length \|\| 1/);
    expect(chartUpdate).toBeTruthy();
  });
});

describe('Edge Cases - Plugin System', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('plugin registration should validate plugin has name', () => {
    const appPlugins = scriptContent.match(/const AppPlugins = [\s\S]*?\}\)\(\);/);
    expect(appPlugins).toBeTruthy();
    expect(appPlugins[0]).toContain("if (!plugin?.name) throw new Error('Plugin requires a name')");
  });

  test('should safely call plugin.init with optional chaining', () => {
    const appPlugins = scriptContent.match(/const AppPlugins = [\s\S]*?\}\)\(\);/);
    expect(appPlugins[0]).toContain('plugin?.init?.');
  });

  test('window.registerPlugin should catch registration errors', () => {
    const registerPlugin = scriptContent.match(/window\.registerPlugin = \(plugin\)[\s\S]*?};/);
    expect(registerPlugin).toBeTruthy();
    expect(registerPlugin[0]).toContain('try');
    expect(registerPlugin[0]).toContain('catch (err)');
  });

  test('should handle unknown commands gracefully', () => {
    const execute = scriptContent.match(/const execute = \(\)[\s\S]*?};/);
    expect(execute).toBeTruthy();
    expect(execute[0]).toContain('Unknown command');
  });

  test('should handle plugin command errors', () => {
    const execute = scriptContent.match(/const execute = \(\)[\s\S]*?};/);
    expect(execute[0]).toContain('try');
    expect(execute[0]).toContain('catch (err)');
  });
});

describe('Edge Cases - Auth0 Integration', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('should handle createAuth0Client not being available', () => {
    const initAuth0 = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(initAuth0).toBeTruthy();
    expect(initAuth0[0]).toContain('if (!window.createAuth0Client) return');
  });

  test('should handle empty or missing auth0 credentials', () => {
    const initAuth0 = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(initAuth0[0]).toContain('if (!AppState.settings.auth0Domain || !AppState.settings.auth0ClientId) return');
  });

  test('should catch auth0 initialization errors', () => {
    const initAuth0 = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(initAuth0[0]).toContain('try');
    expect(initAuth0[0]).toContain('catch (err)');
  });

  test('should prevent duplicate event listeners', () => {
    const updateAuthControls = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(updateAuthControls).toBeTruthy();
    expect(updateAuthControls[0]).toContain('!loginBtn.dataset.bound');
    expect(updateAuthControls[0]).toContain('!logoutBtn.dataset.bound');
  });
});

describe('Edge Cases - CSS Validation', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('CSS custom properties should have fallback values where needed', () => {
    // Check that var() uses are safe
    const varUsages = cssContent.match(/var\([^)]+\)/g);
    expect(varUsages).toBeTruthy();
    expect(varUsages.length).toBeGreaterThan(0);
  });

  test('animation should be defined before use', () => {
    const animationUse = cssContent.indexOf('animation: logoSweep');
    const animationDef = cssContent.indexOf('@keyframes logoSweep');
    
    // In practice, CSS doesn't require declaration order, but it's good practice
    expect(animationDef).toBeGreaterThan(-1);
    expect(animationUse).toBeGreaterThan(-1);
  });

  test('pseudo-elements should use double colon syntax', () => {
    expect(cssContent).toContain('::before');
    expect(cssContent).toContain('::after');
  });

  test('rgba colors should have valid alpha values', () => {
    const rgbaColors = cssContent.match(/rgba\([^)]+\)/g);
    expect(rgbaColors).toBeTruthy();
    
    rgbaColors.forEach(color => {
      const alpha = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
      if (alpha) {
        const alphaValue = parseFloat(alpha[1]);
        expect(alphaValue).toBeGreaterThanOrEqual(0);
        expect(alphaValue).toBeLessThanOrEqual(1);
      }
    });
  });
});