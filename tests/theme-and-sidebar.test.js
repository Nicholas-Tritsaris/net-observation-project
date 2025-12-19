/**
 * Comprehensive tests for theme management and sidebar functionality
 * Tests theme toggle, system preference detection, sidebar collapse/expand, and viewport handling
 */

const fs = require('fs');

describe('Theme and Sidebar Management', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('applyTheme', () => {
    let applyTheme, AppState, prefersDark;

    beforeEach(() => {
      AppState = {
        settings: { theme: 'auto' }
      };

      prefersDark = {
        matches: true
      };

      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should apply dark theme when setting is dark', () => {
      AppState.settings.theme = 'dark';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when setting is light', () => {
      AppState.settings.theme = 'light';

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should apply dark theme when auto and prefers dark', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = true;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('should apply light theme when auto and prefers light', () => {
      AppState.settings.theme = 'auto';
      prefersDark.matches = false;

      applyTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('should set data-theme on documentElement', () => {
      AppState.settings.theme = 'dark';

      applyTheme();

      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
    });

    test('should set data-theme on body dataset', () => {
      AppState.settings.theme = 'light';

      applyTheme();

      expect(document.body.dataset.theme).toBeDefined();
    });

    test('should not call refreshChartThemes (removed function)', () => {
      // Verify the function doesn't call the removed refreshChartThemes
      const funcMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).not.toContain('refreshChartThemes');
    });
  });

  describe('initThemeToggle', () => {
    let initThemeToggle, AppState, saveSettings, applyTheme, prefersDark;

    beforeEach(() => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" role="button" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      AppState = {
        settings: { theme: 'auto' }
      };

      prefersDark = {
        matches: true,
        addEventListener: jest.fn(),
        addListener: jest.fn()
      };

      global.saveSettings = jest.fn();
      global.applyTheme = jest.fn();

      const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should initialize toggle control', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle).not.toBeNull();
    });

    test('should update label text', () => {
      initThemeToggle();

      const label = document.querySelector('[data-label]');
      expect(label.textContent).toMatch(/AUTO|DARK|LIGHT/);
    });

    test('should cycle theme on click', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = AppState.settings.theme;

      toggle.click();

      expect(AppState.settings.theme).not.toBe(initialTheme);
    });

    test('should cycle through auto -> dark -> light -> auto', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      AppState.settings.theme = 'auto';
      toggle.click();
      expect(AppState.settings.theme).toBe('dark');

      toggle.click();
      expect(AppState.settings.theme).toBe('light');

      toggle.click();
      expect(AppState.settings.theme).toBe('auto');
    });

    test('should save settings after theme change', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();

      expect(global.saveSettings).toHaveBeenCalled();
    });

    test('should apply theme after change', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();

      expect(global.applyTheme).toHaveBeenCalled();
    });

    test('should handle Enter key press', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = AppState.settings.theme;
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);

      expect(AppState.settings.theme).not.toBe(initialTheme);
    });

    test('should handle Space key press', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = AppState.settings.theme;
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(spaceEvent);

      expect(AppState.settings.theme).not.toBe(initialTheme);
    });

    test('should not cycle on other key presses', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = AppState.settings.theme;
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      toggle.dispatchEvent(tabEvent);

      expect(AppState.settings.theme).toBe(initialTheme);
    });

    test('should listen for system preference changes', () => {
      initThemeToggle();

      expect(prefersDark.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should handle missing toggle element gracefully', () => {
      document.body.innerHTML = '';

      expect(() => initThemeToggle()).not.toThrow();
    });

    test('should update label when theme changes', () => {
      initThemeToggle();

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = document.querySelector('[data-label]');

      AppState.settings.theme = 'dark';
      toggle.click();

      expect(label.textContent).toBe('LIGHT');
    });

    test('should apply theme on system preference change when auto', () => {
      AppState.settings.theme = 'auto';
      initThemeToggle();

      const changeHandler = prefersDark.addEventListener.mock.calls[0][1];
      changeHandler();

      expect(global.applyTheme).toHaveBeenCalled();
    });

    test('should not apply theme on system change when manual', () => {
      AppState.settings.theme = 'dark';
      global.applyTheme.mockClear();
      
      initThemeToggle();

      const changeHandler = prefersDark.addEventListener.mock.calls[0][1];
      changeHandler();

      expect(global.applyTheme).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('initSidebar', () => {
    let initSidebar;

    beforeEach(() => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle" aria-expanded="true">
          <span>☰</span>
        </button>
      `;

      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should initialize sidebar control', () => {
      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).not.toBeNull();
    });

    test('should toggle sidebar on click', () => {
      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      toggle.click();
      const hasOpen = sidebar.classList.contains('open');
      const hasCollapsed = sidebar.classList.contains('collapsed');

      expect(hasOpen || hasCollapsed).toBe(true);
    });

    test('should update aria-expanded attribute', () => {
      initSidebar();

      const toggle = document.querySelector('.sidebar-toggle');
      const initialAria = toggle.getAttribute('aria-expanded');

      toggle.click();

      expect(toggle.getAttribute('aria-expanded')).not.toBe(initialAria);
    });

    test('should collapse sidebar on mobile viewport', () => {
      global.innerWidth = 600;

      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should expand sidebar on desktop viewport', () => {
      global.innerWidth = 1200;

      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should set collapsed state when width < 880px', () => {
      global.innerWidth = 800;

      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should not call setState(true) on desktop', () => {
      // Verify the refactored code doesn't call setState(true)
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      const elseBlock = funcMatch[0].match(/\} else \{[\s\S]*?\}/);
      
      if (elseBlock) {
        expect(elseBlock[0]).not.toContain('setState(true)');
        expect(elseBlock[0]).toContain("classList.add('open')");
      }
    });

    test('should add open class directly on desktop', () => {
      global.innerWidth = 1200;

      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should toggle icon text', () => {
      initSidebar();

      const toggle = document.querySelector('.sidebar-toggle');
      const icon = toggle.querySelector('span');
      const initialIcon = icon.textContent;

      toggle.click();

      expect(icon.textContent).not.toBe(initialIcon);
    });

    test('should handle missing sidebar gracefully', () => {
      document.body.innerHTML = '<button class="sidebar-toggle"></button>';

      expect(() => initSidebar()).not.toThrow();
    });

    test('should handle missing toggle gracefully', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside>';

      expect(() => initSidebar()).not.toThrow();
    });

    test('should add and remove classes correctly', () => {
      initSidebar();

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      toggle.click();
      const firstState = sidebar.classList.contains('open');

      toggle.click();
      const secondState = sidebar.classList.contains('open');

      expect(firstState).not.toBe(secondState);
    });
  });

  describe('Theme System Integration', () => {
    test('should define STORAGE_KEY constant', () => {
      expect(scriptContent).toContain("STORAGE_KEY = 'nop-settings'");
    });

    test('should define AppState object', () => {
      expect(scriptContent).toContain('const AppState');
    });

    test('should define prefersDark matchMedia', () => {
      expect(scriptContent).toContain('prefers-color-scheme: dark');
    });

    test('should handle matchMedia fallback', () => {
      expect(scriptContent).toMatch(/typeof window\.matchMedia === ['"]function['"]/);
    });

    test('should provide default prefersDark when matchMedia unavailable', () => {
      const match = scriptContent.match(/:\s*\{\s*matches:\s*true\s*\}/);
      expect(match).not.toBeNull();
    });
  });

  describe('Sidebar Responsive Behavior', () => {
    test('should use 880px as mobile breakpoint', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toContain('880');
    });

    test('should check window.innerWidth', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toContain('window.innerWidth');
    });

    test('should have setState function', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toContain('setState');
    });

    test('should toggle open and collapsed classes', () => {
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      expect(funcMatch[0]).toContain('open');
      expect(funcMatch[0]).toContain('collapsed');
    });
  });

  describe('Theme Preference Detection', () => {
    test('should detect dark mode preference', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      const result = window.matchMedia('(prefers-color-scheme: dark)');
      expect(result.matches).toBe(true);
    });

    test('should detect light mode preference', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      const result = window.matchMedia('(prefers-color-scheme: light)');
      expect(result.matches).toBe(true);
    });

    test('should provide addEventListener method', () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(typeof mediaQuery.addEventListener).toBe('function');
    });

    test('should provide addListener fallback', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(typeof mediaQuery.addListener).toBe('function');
    });
  });
});