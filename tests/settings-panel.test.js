/**
 * Unit tests for settings panel functionality (initSettingsPanel)
 * Tests form population, submission, validation, and panel toggling
 */

const fs = require('fs');

describe('Settings Panel', () => {
  let initSettingsPanel, AppState, saveSettings, applyTheme, initAuth0, logTerminal;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="settings-panel">
        <form>
          <input name="backendUrl" type="text" />
          <input name="auth0Domain" type="text" />
          <input name="auth0ClientId" type="text" />
          <select name="themeMode">
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <button type="submit">Save</button>
        </form>
      </div>
      <button class="settings-toggle">⚙</button>
      <div class="terminal-output"></div>
    `;

    AppState = {
      settings: {
        backendUrl: '/api/censys-summary',
        auth0Domain: '',
        auth0ClientId: '',
        theme: 'auto'
      },
      stats: null,
      charts: {},
      auth0Client: null,
      worldData: null
    };

    saveSettings = jest.fn();
    applyTheme = jest.fn();
    initAuth0 = jest.fn();
    
    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract logTerminal
    const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
    if (logMatch) {
      eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
    }
    
    // Extract initSettingsPanel
    const funcMatch = scriptContent.match(/function initSettingsPanel\(\) \{[\s\S]*?\n  \}/);
    if (funcMatch) {
      let code = funcMatch[0];
      code = code.replace(/saveSettings\(\)/g, 'saveSettings()');
      code = code.replace(/applyTheme\(\)/g, 'applyTheme()');
      code = code.replace(/initAuth0\(\)/g, 'initAuth0()');
      eval(`initSettingsPanel = ${code.replace('function initSettingsPanel()', 'function()')}`);
    }
  });

  describe('Form Population', () => {
    test('should populate form fields from AppState', () => {
      AppState.settings.backendUrl = 'https://api.example.com';
      AppState.settings.auth0Domain = 'example.auth0.com';
      AppState.settings.auth0ClientId = 'client-123';
      AppState.settings.theme = 'dark';
      
      initSettingsPanel();
      
      expect(document.querySelector('[name="backendUrl"]').value).toBe('https://api.example.com');
      expect(document.querySelector('[name="auth0Domain"]').value).toBe('example.auth0.com');
      expect(document.querySelector('[name="auth0ClientId"]').value).toBe('client-123');
      expect(document.querySelector('[name="themeMode"]').value).toBe('dark');
    });

    test('should populate with default values', () => {
      initSettingsPanel();
      
      expect(document.querySelector('[name="backendUrl"]').value).toBe('/api/censys-summary');
      expect(document.querySelector('[name="themeMode"]').value).toBe('auto');
    });

    test('should handle empty Auth0 credentials', () => {
      initSettingsPanel();
      
      expect(document.querySelector('[name="auth0Domain"]').value).toBe('');
      expect(document.querySelector('[name="auth0ClientId"]').value).toBe('');
    });
  });

  describe('Form Submission', () => {
    test('should update AppState on submit', () => {
      initSettingsPanel();
      
      document.querySelector('[name="backendUrl"]').value = 'https://new.api.com';
      document.querySelector('[name="auth0Domain"]').value = 'new.auth0.com';
      document.querySelector('[name="auth0ClientId"]').value = 'new-client';
      document.querySelector('[name="themeMode"]').value = 'light';
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(AppState.settings.backendUrl).toBe('https://new.api.com');
      expect(AppState.settings.auth0Domain).toBe('new.auth0.com');
      expect(AppState.settings.auth0ClientId).toBe('new-client');
      expect(AppState.settings.theme).toBe('light');
    });

    test('should call saveSettings after update', () => {
      initSettingsPanel();
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(saveSettings).toHaveBeenCalled();
    });

    test('should call applyTheme after update', () => {
      initSettingsPanel();
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(applyTheme).toHaveBeenCalled();
    });

    test('should reinitialize Auth0 after update', () => {
      initSettingsPanel();
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(initAuth0).toHaveBeenCalled();
    });

    test('should log success message', () => {
      initSettingsPanel();
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('Settings saved');
    });

    test('should prevent default form submission', () => {
      initSettingsPanel();
      
      const form = document.querySelector('.settings-panel form');
      const event = new Event('submit', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      form.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should trim whitespace from inputs', () => {
      initSettingsPanel();
      
      document.querySelector('[name="backendUrl"]').value = '  https://api.com  ';
      document.querySelector('[name="auth0Domain"]').value = '  domain.com  ';
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(AppState.settings.backendUrl).toBe('https://api.com');
      expect(AppState.settings.auth0Domain).toBe('domain.com');
    });

    test('should use default backend URL when empty', () => {
      initSettingsPanel();
      
      document.querySelector('[name="backendUrl"]').value = '';
      
      const form = document.querySelector('.settings-panel form');
      form.dispatchEvent(new Event('submit'));
      
      expect(AppState.settings.backendUrl).toBe('/api/censys-summary');
    });
  });

  describe('Panel Toggle', () => {
    test('should toggle panel visibility on button click', () => {
      initSettingsPanel();
      
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      
      toggle.click();
      
      expect(panel.classList.contains('hidden')).toBe(true);
    });

    test('should toggle button active state', () => {
      initSettingsPanel();
      
      const toggle = document.querySelector('.settings-toggle');
      
      toggle.click();
      
      expect(toggle.classList.contains('active')).toBe(true);
    });

    test('should update toggle icon when closing', () => {
      initSettingsPanel();
      
      const toggle = document.querySelector('.settings-toggle');
      
      toggle.click();
      
      expect(toggle.innerHTML).toBe('✖');
    });

    test('should update toggle icon when opening', () => {
      initSettingsPanel();
      
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      
      panel.classList.add('hidden');
      toggle.click();
      
      expect(toggle.innerHTML).toBe('⚙');
    });

    test('should handle rapid toggling', () => {
      initSettingsPanel();
      
      const toggle = document.querySelector('.settings-toggle');
      
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }
      
      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing panel element', () => {
      document.body.innerHTML = '<button class="settings-toggle">⚙</button>';
      expect(() => initSettingsPanel()).not.toThrow();
    });

    test('should handle missing toggle element', () => {
      document.body.innerHTML = '<div class="settings-panel"></div>';
      expect(() => initSettingsPanel()).not.toThrow();
    });

    test('should handle both elements missing', () => {
      document.body.innerHTML = '';
      expect(() => initSettingsPanel()).not.toThrow();
    });
  });
});