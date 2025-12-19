/**
 * Integration Tests for Net Observation Project
 * Testing the integration of changed components
 */

const fs = require('fs');

describe('Integration - Logo Sigil Across Components', () => {
  let htmlFiles;
  let cssContent;
  let scriptContent;

  beforeAll(() => {
    htmlFiles = [
      'docs/index.html',
      'docs/dashboard.html',
      'docs/api.html',
      'docs/data.html',
      'docs/docs.html',
      'docs/versions.html'
    ].map(file => ({
      name: file,
      content: fs.readFileSync(file, 'utf8')
    }));

    cssContent = fs.readFileSync('docs/style.css', 'utf8');
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('all HTML files should reference logo-sigil classes used in CSS', () => {
    const cssClasses = [
      'logo-sigil',
      'logo-sigil--sidebar',
      'logo-sigil--header'
    ];

    cssClasses.forEach(className => {
      expect(cssContent).toContain(`.${className}`);
    });

    htmlFiles.forEach(({ name, content }) => {
      expect(content).toContain('logo-sigil logo-sigil--sidebar');
      expect(content).toContain('logo-sigil logo-sigil--header');
    });
  });

  test('no HTML file should reference removed logo classes', () => {
    const removedClasses = ['logo-placeholder', 'logo-inline'];

    htmlFiles.forEach(({ name, content }) => {
      removedClasses.forEach(className => {
        expect(content).not.toContain(className);
      });
    });

    removedClasses.forEach(className => {
      expect(cssContent).not.toMatch(new RegExp(`\\.${className}\\s*{`));
    });
  });

  test('CSS custom properties should be used consistently', () => {
    expect(cssContent).toContain('--sigil-size: 52px');
    expect(cssContent).toContain('width: var(--sigil-size)');
    expect(cssContent).toContain('height: var(--sigil-size)');
  });

  test('all logo sigils should have accessibility attributes', () => {
    htmlFiles.forEach(({ name, content }) => {
      const sigilElements = content.match(/<div[^>]*class="logo-sigil[^"]*"[^>]*>/g);
      expect(sigilElements).toBeTruthy();
      
      sigilElements.forEach(element => {
        expect(element).toContain('role="img"');
        expect(element).toContain('aria-label="Net Observation Project logo"');
      });
    });
  });
});

describe('Integration - Theme System Consistency', () => {
  let cssContent;
  let scriptContent;
  let htmlFiles;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
    htmlFiles = [
      'docs/index.html',
      'docs/dashboard.html',
      'docs/api.html',
      'docs/data.html',
      'docs/docs.html',
      'docs/versions.html'
    ].map(file => fs.readFileSync(file, 'utf8'));
  });

  test('HTML should initialize with data-theme attribute', () => {
    htmlFiles.forEach(content => {
      expect(content).toMatch(/<html[^>]*data-theme="dark"/);
    });
  });

  test('CSS should define light theme overrides for logo-sigil', () => {
    expect(cssContent).toContain('[data-theme="light"] .logo-sigil');
    expect(cssContent).toContain('[data-theme="light"] .logo-sigil::after');
  });

  test('script should handle theme changes without refreshing charts', () => {
    // Verify refreshChartThemes is not called
    expect(scriptContent).not.toContain('refreshChartThemes()');
    
    // Verify applyTheme still exists and sets attributes
    expect(scriptContent).toContain('function applyTheme()');
    expect(scriptContent).toContain('document.documentElement.setAttribute(\'data-theme\'');
  });

  test('theme toggle should be present in all HTML files', () => {
    htmlFiles.forEach(content => {
      expect(content).toContain('data-role="theme-toggle"');
      expect(content).toContain('data-label');
    });
  });
});

describe('Integration - Page Initialization Flow', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('init function should call all core initialization functions', () => {
    const initFunction = scriptContent.match(/function init\(\)\s*{[\s\S]*?^  }/m);
    expect(initFunction).toBeTruthy();

    const expectedCalls = [
      'loadSettings',
      'applyTheme',
      'initThemeToggle',
      'initSidebar',
      'initSettingsPanel',
      'initAuth0',
      'updateAuthControls',
      'markActiveNav',
      'initPageSpecificFeatures'
    ];

    expectedCalls.forEach(fnName => {
      expect(initFunction[0]).toContain(fnName);
    });
  });

  test('data page should not initialize terminal', () => {
    const dataPageInit = scriptContent.match(/case 'data':[\s\S]*?break;/);
    expect(dataPageInit).toBeTruthy();
    expect(dataPageInit[0]).not.toContain('initTerminal');
    expect(dataPageInit[0]).toContain('initDataVisualizer');
    expect(dataPageInit[0]).toContain('initAutoRefresh');
  });

  test('dashboard page should initialize all features', () => {
    const dashboardInit = scriptContent.match(/case 'dashboard':[\s\S]*?break;/);
    expect(dashboardInit).toBeTruthy();
    expect(dashboardInit[0]).toContain('initCharts');
    expect(dashboardInit[0]).toContain('initAutoRefresh');
    expect(dashboardInit[0]).toContain('initTerminal');
    expect(dashboardInit[0]).toContain('initDataVisualizer');
  });

  test('api page should initialize terminal and auto-refresh', () => {
    const apiInit = scriptContent.match(/case 'api':[\s\S]*?break;/);
    expect(apiInit).toBeTruthy();
    expect(apiInit[0]).toContain('initTerminal');
    expect(apiInit[0]).toContain('initAutoRefresh');
  });
});

describe('Integration - Auth0 Simplified Flow', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('initAuth0 should have early returns for missing config', () => {
    const initAuth0 = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(initAuth0).toBeTruthy();

    // Should check for window.createAuth0Client
    expect(initAuth0[0]).toContain('if (!window.createAuth0Client) return;');

    // Should check for domain and clientId
    expect(initAuth0[0]).toContain('if (!AppState.settings.auth0Domain || !AppState.settings.auth0ClientId) return;');
  });

  test('simplified auth0 init should not set client to null', () => {
    const initAuth0 = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    
    // Old code had: AppState.auth0Client = null; updateAuthControls();
    // New code just returns
    expect(initAuth0[0]).not.toMatch(/AppState\.auth0Client\s*=\s*null/);
  });

  test('updateAuthControls should handle null client gracefully', () => {
    const updateAuthControls = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  async function|\n  function [a-z])/);
    expect(updateAuthControls).toBeTruthy();
    expect(updateAuthControls[0]).toContain('if (!AppState.auth0Client)');
  });
});

describe('Integration - Data Flow Consistency', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('fetchCensysSummary should update stats view', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction).toBeTruthy();
    expect(fetchFunction[0]).toContain('updateStatsView(data)');
  });

  test('updateStatsView should not reference payload display', () => {
    const updateStats = scriptContent.match(/function updateStatsView\(data\)[\s\S]*?(?=\n  function)/);
    expect(updateStats).toBeTruthy();
    expect(updateStats[0]).not.toContain('#apiPayload');
  });

  test('fetchCensysSummary error handling should not show payload', () => {
    const fetchFunction = scriptContent.match(/async function fetchCensysSummary[\s\S]*?(?=\n  function|\n  async function [a-z])/);
    expect(fetchFunction).toBeTruthy();
    
    const errorSection = fetchFunction[0].match(/catch\s*\([^)]*\)\s*{[\s\S]*?}/);
    expect(errorSection).toBeTruthy();
    expect(errorSection[0]).not.toContain('#apiPayload');
  });
});

describe('Integration - CSS Animation Performance', () => {
  let cssContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
  });

  test('logoSweep animation should use transform for performance', () => {
    const animation = cssContent.match(/@keyframes\s+logoSweep\s*{[\s\S]*?}/);
    expect(animation).toBeTruthy();
    expect(animation[0]).toContain('transform: rotate');
  });

  test('logo-sigil should use will-change or transform for GPU acceleration', () => {
    const sigilStyles = cssContent.match(/\.logo-sigil\s*{[\s\S]*?^}/m);
    expect(sigilStyles).toBeTruthy();
    // Should use transform in transitions
    expect(sigilStyles[0]).toContain('transition:');
    expect(sigilStyles[0]).toContain('transform');
  });

  test('hover effects should be smooth with transitions', () => {
    const hoverStyles = cssContent.match(/\.logo-sigil:hover\s*{[\s\S]*?}/);
    expect(hoverStyles).toBeTruthy();
    expect(hoverStyles[0]).toContain('transform:');
  });
});

describe('Integration - Responsive Behavior', () => {
  let cssContent;
  let scriptContent;

  beforeAll(() => {
    cssContent = fs.readFileSync('docs/style.css', 'utf8');
    scriptContent = fs.readFileSync('docs/script.js', 'utf8');
  });

  test('sidebar should respond to window width', () => {
    expect(scriptContent).toContain('window.innerWidth');
    expect(scriptContent).toContain('880'); // Breakpoint
  });

  test('CSS should have mobile-specific logo adjustments', () => {
    const mobileQuery = cssContent.match(/@media\s*\([^)]*max-width:\s*600px[^)]*\)[\s\S]*?(?=@media|$)/);
    if (mobileQuery) {
      // Should adjust logo size for mobile
      expect(mobileQuery[0]).toMatch(/\.logo-sigil|--sigil-size/);
    }
  });
});