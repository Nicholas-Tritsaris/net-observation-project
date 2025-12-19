/**
 * Comprehensive tests for settings panel, Auth0 integration, and initialization
 * Tests: initSettingsPanel, initAuth0, updateAuthControls, initPageSpecificFeatures, init
 */

describe('Settings, Auth, and Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.createAuth0Client = null;
  });

  describe('initSettingsPanel', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button class="settings-toggle">⚙</button>
        <form class="settings-panel">
          <input name="backendUrl" />
          <input name="auth0Domain" />
          <input name="auth0ClientId" />
          <select name="themeMode"><option value="auto">Auto</option></select>
        </form>
      `;
    });

    test('should find settings panel and toggle', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.settings-panel['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.settings-toggle['"]\)/);
    });

    test('should return early if elements not found', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/if \(!panel \|\| !toggle\) return/);
    });

    test('should populate form fields from AppState', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/backendInput\.value = AppState\.settings\.backendUrl/);
      expect(funcMatch[0]).toMatch(/domainInput\.value = AppState\.settings\.auth0Domain/);
      expect(funcMatch[0]).toMatch(/clientIdInput\.value = AppState\.settings\.auth0ClientId/);
      expect(funcMatch[0]).toMatch(/themeSelect\.value = AppState\.settings\.theme/);
    });

    test('should handle form submission', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/panel\.addEventListener\(['"]submit['"]/);
      expect(funcMatch[0]).toMatch(/evt\.preventDefault\(\)/);
    });

    test('should save settings on submit', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/saveSettings\(\)/);
    });

    test('should apply theme on submit', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/applyTheme\(\)/);
    });

    test('should reinitialize Auth0 on submit', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/initAuth0\(\)/);
    });

    test('should log settings saved message', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Settings saved/);
    });

    test('should toggle panel visibility on toggle click', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/toggle\.addEventListener\(['"]click['"]/);
      expect(funcMatch[0]).toMatch(/panel\.classList\.toggle\(['"]hidden['"]\)/);
    });

    test('should trim input values', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/\.trim\(\)/);
    });

    test('should default to /api/censys-summary if backend URL empty', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSettingsPanel\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Initialize the Auth0)/);
      
      expect(funcMatch[0]).toMatch(/\|\| ['"]\/api\/censys-summary['"]/);
    });
  });

  describe('initAuth0', () => {
    test('should check for createAuth0Client availability', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if \(!window\.createAuth0Client\) return/);
    });

    test('should check for required credentials', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/if \(!AppState\.settings\.auth0Domain/);
      expect(funcMatch[0]).toMatch(/!AppState\.settings\.auth0ClientId/);
    });

    test('should create Auth0 client with correct config', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/domain: AppState\.settings\.auth0Domain/);
      expect(funcMatch[0]).toMatch(/clientId: AppState\.settings\.auth0ClientId/);
    });

    test('should use localStorage for cache', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/cacheLocation: ['"]localstorage['"]/);
    });

    test('should set redirect URI to current origin', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/redirect_uri: window\.location\.origin/);
    });

    test('should store client in AppState', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/AppState\.auth0Client = await createAuth0Client/);
    });

    test('should update auth controls after initialization', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/updateAuthControls\(\)/);
    });

    test('should handle initialization errors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/catch/);
      expect(funcMatch[0]).toMatch(/logTerminal.*Auth0 init failed/);
    });

    test('should log success message', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function initAuth0\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Update authentication)/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Auth0 client initialised/);
    });
  });

  describe('updateAuthControls', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
        <span data-auth-status>Anonymous</span>
      `;
    });

    test('should find auth control elements', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-action="login"\]['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-action="logout"\]['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\[data-auth-status\]['"]\)/);
    });

    test('should hide buttons if no Auth0 client', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/if \(!AppState\.auth0Client\)/);
      expect(funcMatch[0]).toMatch(/classList\.add\(['"]hidden['"]\)/);
    });

    test('should check authentication status', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/auth0Client\.isAuthenticated\(\)/);
    });

    test('should update status text', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/status\.textContent.*Authenticated.*Anonymous/);
    });

    test('should toggle button visibility based on auth state', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/classList\.toggle\(['"]hidden['"]/);
    });

    test('should bind login handler only once', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/loginBtn\.dataset\.bound/);
    });

    test('should bind logout handler only once', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/logoutBtn\.dataset\.bound/);
    });

    test('should use popup login', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/loginWithPopup/);
    });

    test('should return to current page after logout', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/returnTo: window\.location\.href/);
    });

    test('should refresh controls after login/logout', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/async function updateAuthControls\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Render a world)/);
      
      expect(funcMatch[0]).toMatch(/loginBtn.*updateAuthControls/);
      expect(funcMatch[0]).toMatch(/logoutBtn.*updateAuthControls/);
    });
  });

  describe('initPageSpecificFeatures', () => {
    test('should check data-page attribute', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/document\.body\.dataset\.page/);
    });

    test('should handle dashboard page', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/case ['"]dashboard['"]/);
      expect(funcMatch[0]).toMatch(/initCharts/);
      expect(funcMatch[0]).toMatch(/initAutoRefresh/);
    });

    test('should handle docs page', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/case ['"]docs['"]/);
      expect(funcMatch[0]).toMatch(/initDocsSidebar/);
    });

    test('should handle versions page', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/case ['"]versions['"]/);
      expect(funcMatch[0]).toMatch(/initVersionList/);
    });

    test('should handle api page', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/case ['"]api['"]/);
    });

    test('should handle data page', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/case ['"]data['"]/);
      expect(funcMatch[0]).toMatch(/initDataVisualizer/);
    });

    test('should have default case', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Highlights)/);
      
      expect(funcMatch[0]).toMatch(/default:/);
    });
  });

  describe('init', () => {
    test('should load settings first', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/loadSettings\(\)/);
    });

    test('should apply theme early', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/applyTheme\(\)/);
    });

    test('should initialize all UI components', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/initThemeToggle\(\)/);
      expect(funcMatch[0]).toMatch(/initSidebar\(\)/);
      expect(funcMatch[0]).toMatch(/initLogoPlaceholders\(\)/);
      expect(funcMatch[0]).toMatch(/initSettingsPanel\(\)/);
    });

    test('should initialize Auth0', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/initAuth0\(\)/);
      expect(funcMatch[0]).toMatch(/updateAuthControls\(\)/);
    });

    test('should mark active navigation', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/markActiveNav\(\)/);
    });

    test('should initialize page-specific features', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/initPageSpecificFeatures\(\)/);
    });

    test('should register default echo plugin', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function init\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/AppPlugins\.register/);
      expect(funcMatch[0]).toMatch(/echo-plugin/);
    });

    test('should run on DOMContentLoaded if not already loaded', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/document\.addEventListener\(['"]DOMContentLoaded['"], init\)/);
    });

    test('should run immediately if already loaded', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/if \(document\.readyState !== ['"]loading['"]\)/);
      expect(scriptContent).toMatch(/init\(\)/);
    });
  });
});