/**
 * Comprehensive tests for settings, Auth0, and navigation functions
 * Tests initSettingsPanel, initAuth0, updateAuthControls, markActiveNav, initPageSpecificFeatures
 */

const fs = require('fs');

describe('Settings, Auth0, and Navigation Functions', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('initSettingsPanel', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should return early if panel or toggle not found', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!panel\s*\|\|\s*!toggle\s*\)\s*return/);
    });

    test('should find settings panel and toggle elements', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.settings-panel['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.settings-toggle['"]\)/);
    });

    test('should populate form fields from AppState.settings', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.settings\./);
    });

    test('should handle form submission', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/addEventListener\(['"]submit['"]/);
      expect(funcMatch[0]).toMatch(/evt\.preventDefault\(\)/);
    });

    test('should save settings on form submission', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/saveSettings\(\)/);
    });

    test('should apply theme after saving', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/applyTheme\(\)/);
    });

    test('should reinitialize Auth0 after settings change', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/initAuth0\(\)/);
    });

    test('should log save action to terminal', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Settings saved/);
    });

    test('should toggle panel visibility on click', () => {
      const funcMatch = scriptContent.match(/function initSettingsPanel[\s\S]*?(?=\n  async function)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/toggle\.addEventListener\(['"]click['"]/);
      expect(funcMatch[0]).toMatch(/panel\.classList\.toggle/);
    });
  });

  describe('initAuth0', () => {
    test('should be defined as an async function', () => {
      const funcMatch = scriptContent.match(/async function initAuth0\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should return early if createAuth0Client not available', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!window\.createAuth0Client\s*\)\s*return/);
    });

    test('should return early if Auth0 domain not configured', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!AppState\.settings\.auth0Domain/);
    });

    test('should return early if Auth0 clientId not configured', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/!AppState\.settings\.auth0ClientId/);
    });

    test('should create Auth0 client with domain and clientId', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/createAuth0Client\(\{/);
      expect(funcMatch[0]).toMatch(/domain:\s*AppState\.settings\.auth0Domain/);
      expect(funcMatch[0]).toMatch(/clientId:\s*AppState\.settings\.auth0ClientId/);
    });

    test('should use localstorage for cache location', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/cacheLocation:\s*['"]localstorage['"]/);
    });

    test('should set redirect_uri to current origin', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/redirect_uri:\s*window\.location\.origin/);
    });

    test('should store client in AppState', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppState\.auth0Client\s*=\s*await createAuth0Client/);
    });

    test('should call updateAuthControls on success', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/updateAuthControls\(\)/);
    });

    test('should log success message', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Auth0 client initialised/);
    });

    test('should handle initialization errors', () => {
      const funcMatch = scriptContent.match(/async function initAuth0[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/catch\s*\(err\)/);
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Auth0 init failed/);
    });
  });

  describe('updateAuthControls', () => {
    test('should be defined as an async function', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should find login, logout, and status elements', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-action="login"\]['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-action="logout"\]['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-auth-status\]['"]\)/);
    });

    test('should hide both buttons if no Auth0 client', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!AppState\.auth0Client\s*\)/);
      expect(funcMatch[0]).toMatch(/loginBtn\?\.classList\.add\(['"]hidden['"]\)/);
      expect(funcMatch[0]).toMatch(/logoutBtn\?\.classList\.add\(['"]hidden['"]\)/);
    });

    test('should set status to Anonymous when no client', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/status\.textContent\s*=\s*['"]Anonymous['"]/);
    });

    test('should check authentication status', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/await AppState\.auth0Client\.isAuthenticated\(\)/);
    });

    test('should update status text based on authentication', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/isAuthenticated\s*\?\s*['"]Authenticated['"]\s*:\s*['"]Anonymous['"]/);
    });

    test('should toggle login button visibility', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/loginBtn\?\.classList\.toggle\(['"]hidden['"],\s*isAuthenticated\)/);
    });

    test('should toggle logout button visibility', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logoutBtn\?\.classList\.toggle\(['"]hidden['"],\s*!isAuthenticated\)/);
    });

    test('should bind login handler only once', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*loginBtn\s*&&\s*!loginBtn\.dataset\.bound\s*\)/);
      expect(funcMatch[0]).toMatch(/loginBtn\.dataset\.bound\s*=\s*['"]true['"]/);
    });

    test('should bind logout handler only once', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*logoutBtn\s*&&\s*!logoutBtn\.dataset\.bound\s*\)/);
      expect(funcMatch[0]).toMatch(/logoutBtn\.dataset\.bound\s*=\s*['"]true['"]/);
    });

    test('should use loginWithPopup for login', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/await AppState\.auth0Client\.loginWithPopup\(\)/);
    });

    test('should use logout with returnTo parameter', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/await AppState\.auth0Client\.logout\(\{\s*returnTo:\s*window\.location\.href/);
    });

    test('should refresh auth controls after login', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/loginWithPopup[\s\S]*?updateAuthControls\(\)/);
    });

    test('should log login and logout actions', () => {
      const funcMatch = scriptContent.match(/async function updateAuthControls[\s\S]*?(?=\n  \/\*\*[\s\S]*?Render a world choropleth)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Logged in via Auth0/);
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Logged out of Auth0/);
    });
  });

  describe('initDocsSidebar', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should find all links in docs-sidebar', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelectorAll\(['"]\.docs-sidebar a['"]\)/);
    });

    test('should check if href starts with #', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\.startsWith\(['"]#['"]\)/);
    });

    test('should prevent default navigation for anchor links', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/evt\.preventDefault\(\)/);
    });

    test('should scroll target into view with smooth behavior', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/scrollIntoView\(\{\s*behavior:\s*['"]smooth['"]/);
      expect(funcMatch[0]).toMatch(/block:\s*['"]start['"]/);
    });
  });

  describe('initVersionList', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initVersionList\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should return early if container not found', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!container\s*\)\s*return/);
    });

    test('should find container by data-version-list attribute', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-version-list\]['"]\)/);
    });

    test('should define versions array with version objects', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/const versions\s*=\s*\[/);
      expect(funcMatch[0]).toMatch(/version:/);
      expect(funcMatch[0]).toMatch(/status:/);
      expect(funcMatch[0]).toMatch(/notes:/);
    });

    test('should include v2.3 as current version', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/['"]v2\.3['"]/);
      expect(funcMatch[0]).toMatch(/['"]current['"]/);
    });

    test('should create card elements for each version', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\.map\(v\s*=>/);
      expect(funcMatch[0]).toMatch(/<div class="card">/);
    });

    test('should display version with uppercase status', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/v\.status\.toUpperCase\(\)/);
    });

    test('should set container innerHTML with joined cards', () => {
      const funcMatch = scriptContent.match(/function initVersionList[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/container\.innerHTML\s*=[\s\S]*?\.join\(['"]['"]\)/);
    });
  });

  describe('markActiveNav', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function markActiveNav\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should get current page from pathname', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/window\.location\.pathname\.split\(['"]\/['"]\)\.pop\(\)/);
    });

    test('should default to index.html for root path', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\|\|\s*['"]index\.html['"]/);
    });

    test('should find all nav links', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelectorAll\(['"]nav a['"]\)/);
    });

    test('should compare href with current path', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/href\s*===\s*path/);
    });

    test('should handle root path special case', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/path\s*===\s*['"]index\.html['"]\s*&&\s*href\s*===\s*['"]\/['"]/);
    });

    test('should add active class to matching links', () => {
      const funcMatch = scriptContent.match(/function markActiveNav[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/link\.classList\.add\(['"]active['"]\)/);
    });
  });

  describe('initPageSpecificFeatures', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should read page from body data-page attribute', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/document\.body\.dataset\.page/);
    });

    test('should use switch statement for page routing', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/switch\s*\(\s*page\s*\)/);
    });

    test('should initialize charts for dashboard page', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/case\s*['"]dashboard['"]:[\s\S]*?initCharts\(\)/);
    });

    test('should initialize docs sidebar for docs page', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/case\s*['"]docs['"]:[\s\S]*?initDocsSidebar\(\)/);
    });

    test('should initialize version list for versions page', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/case\s*['"]versions['"]:[\s\S]*?initVersionList\(\)/);
    });

    test('should initialize auto-refresh for multiple pages', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      const dashboardCase = funcMatch[0].match(/case\s*['"]dashboard['"]:[\s\S]*?break/);
      expect(dashboardCase[0]).toMatch(/initAutoRefresh\(\)/);
    });

    test('should have default case with auto-refresh', () => {
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/default:[\s\S]*?initAutoRefresh\(\)/);
    });
  });
});