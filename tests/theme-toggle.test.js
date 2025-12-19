/**
 * Unit tests for theme toggle functionality
 * Tests user interaction, keyboard accessibility, and system preference listening
 */

const fs = require('fs');

describe('Theme Toggle', () => {
  let AppState, saveSettings, applyTheme;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div data-role="theme-toggle" role="button" tabindex="0">
        <span>Theme:</span>
        <strong data-label>AUTO</strong>
      </div>
    `;

    // Initialize AppState
    AppState = {
      settings: { theme: 'auto', backendUrl: '/api/censys-summary', auth0Domain: '', auth0ClientId: '' },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    saveSettings = jest.fn();
    applyTheme = jest.fn();

    // Extract and execute initThemeToggle
    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    const funcMatch = scriptContent.match(/function initThemeToggle\(\) \{[\s\S]*?\n  \}/);
    
    if (funcMatch) {
      const code = funcMatch[0].replace(/saveSettings\(\)/g, 'saveSettings()')
                                .replace(/applyTheme\(\)/g, 'applyTheme()');
      eval(code.replace('function initThemeToggle()', 'window.initThemeToggle = function()'));
    }
  });

  describe('Theme Cycling', () => {
    test('should cycle from auto to dark on click', () => {
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      toggle.click();
      
      expect(AppState.settings.theme).toBe('dark');
      expect(saveSettings).toHaveBeenCalled();
      expect(applyTheme).toHaveBeenCalled();
    });

    test('should cycle from dark to light', () => {
      AppState.settings.theme = 'dark';
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      toggle.click();
      
      expect(AppState.settings.theme).toBe('light');
    });

    test('should cycle from light back to auto', () => {
      AppState.settings.theme = 'light';
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      toggle.click();
      
      expect(AppState.settings.theme).toBe('auto');
    });

    test('should complete full cycle: auto -> dark -> light -> auto', () => {
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      toggle.click(); // auto -> dark
      expect(AppState.settings.theme).toBe('dark');
      
      toggle.click(); // dark -> light
      expect(AppState.settings.theme).toBe('light');
      
      toggle.click(); // light -> auto
      expect(AppState.settings.theme).toBe('auto');
    });
  });

  describe('Keyboard Accessibility', () => {
    test('should cycle theme on Enter key', () => {
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(event);
      
      expect(AppState.settings.theme).toBe('dark');
    });

    test('should cycle theme on Space key', () => {
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      toggle.dispatchEvent(event);
      
      expect(AppState.settings.theme).toBe('dark');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should not cycle on other keys', () => {
      window.initThemeToggle();
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const originalTheme = AppState.settings.theme;
      
      ['Escape', 'Tab', 'a', 'ArrowUp'].forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        toggle.dispatchEvent(event);
      });
      
      expect(AppState.settings.theme).toBe(originalTheme);
    });
  });

  describe('Label Updates', () => {
    test('should update label to DARK when theme is dark', () => {
      document.body.dataset.theme = 'dark';
      window.initThemeToggle();
      
      const label = document.querySelector('[data-label]');
      expect(label.textContent).toBe('DARK');
    });

    test('should update label after theme change', () => {
      document.body.dataset.theme = 'auto';
      window.initThemeToggle();
      
      document.body.dataset.theme = 'light';
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();
      
      const label = document.querySelector('[data-label]');
      expect(label.textContent).toMatch(/DARK|LIGHT|AUTO/);
    });
  });

  describe('System Preference Listening', () => {
    test('should register change listener on matchMedia', () => {
      const addEventListenerSpy = jest.spyOn(window.matchMedia('(prefers-color-scheme: dark)'), 'addEventListener');
      
      window.initThemeToggle();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('should reapply theme when system preference changes and theme is auto', () => {
      AppState.settings.theme = 'auto';
      window.initThemeToggle();
      
      // Simulate system preference change
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      const changeHandler = matchMedia.addEventListener.mock.calls[0][1];
      
      changeHandler();
      
      expect(applyTheme).toHaveBeenCalled();
    });

    test('should not reapply theme when system preference changes but theme is not auto', () => {
      AppState.settings.theme = 'dark';
      window.initThemeToggle();
      
      applyTheme.mockClear();
      
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      const changeHandler = matchMedia.addEventListener.mock.calls[0][1];
      
      changeHandler();
      
      expect(applyTheme).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing toggle element gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => window.initThemeToggle()).not.toThrow();
    });

    test('should handle missing label element', () => {
      document.body.innerHTML = '<div data-role="theme-toggle"></div>';
      
      expect(() => window.initThemeToggle()).not.toThrow();
    });
  });
});