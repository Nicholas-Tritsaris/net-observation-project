/**
 * Unit tests for settings management functions (loadSettings, saveSettings, applyTheme)
 * Tests localStorage persistence, theme application, and error handling
 */

const fs = require('fs');

describe('Settings Management', () => {
  let loadSettings, saveSettings, applyTheme, AppState, STORAGE_KEY, prefersDark;

  beforeEach(() => {
    // Extract functions from script.js
    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Create isolated context
    const context = {
      localStorage,
      window,
      document,
      console
    };
    
    // Initialize AppState mock
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
    
    STORAGE_KEY = 'net-observation-settings';
    prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Extract and evaluate functions
    const loadSettingsMatch = scriptContent.match(/function loadSettings\(\) \{[\s\S]*?\n  \}/);
    const saveSettingsMatch = scriptContent.match(/function saveSettings\(\) \{[\s\S]*?\n  \}/);
    const applyThemeMatch = scriptContent.match(/function applyTheme\(\) \{[\s\S]*?\n  \}/);
    
    if (loadSettingsMatch) {
      eval(`loadSettings = ${loadSettingsMatch[0].replace('function loadSettings()', 'function()')}`);
    }
    if (saveSettingsMatch) {
      eval(`saveSettings = ${saveSettingsMatch[0].replace('function saveSettings()', 'function()')}`);
    }
    if (applyThemeMatch) {
      eval(`applyTheme = ${applyThemeMatch[0].replace('function applyTheme()', 'function()')}`);
    }
  });

  describe('loadSettings', () => {
    test('should load settings from localStorage when available', () => {
      const mockSettings = {
        backendUrl: 'https://api.example.com',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));
      loadSettings();
      
      expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(AppState.settings.backendUrl).toBe('https://api.example.com');
      expect(AppState.settings.auth0Domain).toBe('example.auth0.com');
      expect(AppState.settings.theme).toBe('dark');
    });

    test('should handle empty localStorage gracefully', () => {
      localStorage.getItem.mockReturnValue(null);
      const originalSettings = { ...AppState.settings };
      
      loadSettings();
      
      expect(AppState.settings).toEqual(originalSettings);
    });

    test('should handle malformed JSON in localStorage', () => {
      localStorage.getItem.mockReturnValue('{ invalid json }');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      loadSettings();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load settings', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    test('should merge partial settings without overwriting defaults', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ theme: 'light' }));
      
      loadSettings();
      
      expect(AppState.settings.theme).toBe('light');
      expect(AppState.settings.backendUrl).toBe('/api/censys-summary');
    });

    test('should handle localStorage access errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      loadSettings();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    test('should persist settings to localStorage as JSON', () => {
      AppState.settings.theme = 'dark';
      AppState.settings.backendUrl = 'https://custom.api.com';
      
      saveSettings();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(AppState.settings)
      );
    });

    test('should save all settings properties', () => {
      AppState.settings = {
        backendUrl: '/api/test',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'client-123',
        theme: 'light'
      };
      
      saveSettings();
      
      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData).toEqual(AppState.settings);
    });

    test('should overwrite previous settings', () => {
      saveSettings();
      const firstCall = localStorage.setItem.mock.calls[0];
      
      AppState.settings.theme = 'dark';
      saveSettings();
      const secondCall = localStorage.setItem.mock.calls[1];
      
      expect(secondCall[0]).toBe(firstCall[0]);
      expect(secondCall[1]).not.toBe(firstCall[1]);
    });
  });

  describe('applyTheme', () => {
    test('should apply dark theme when theme is set to dark', () => {
      AppState.settings.theme = 'dark';
      
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme when theme is set to light', () => {
      AppState.settings.theme = 'light';
      
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should resolve auto theme to dark when system prefers dark', () => {
      AppState.settings.theme = 'auto';
      window.matchMedia.mockReturnValue({ matches: true });
      
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('should resolve auto theme to light when system prefers light', () => {
      AppState.settings.theme = 'auto';
      window.matchMedia.mockReturnValue({ matches: false });
      
      applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('should set both documentElement and body attributes', () => {
      AppState.settings.theme = 'dark';
      
      applyTheme();
      
      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
      expect(document.body.dataset.theme).toBeDefined();
    });
  });

  describe('Integration: Load, Modify, Save Cycle', () => {
    test('should persist theme changes across sessions', () => {
      // Simulate first session
      AppState.settings.theme = 'light';
      saveSettings();
      
      const saved = localStorage.setItem.mock.calls[0][1];
      localStorage.getItem.mockReturnValue(saved);
      
      // Simulate new session
      AppState.settings.theme = 'auto';
      loadSettings();
      
      expect(AppState.settings.theme).toBe('light');
    });

    test('should handle rapid theme changes', () => {
      const themes = ['auto', 'dark', 'light', 'dark', 'auto'];
      
      themes.forEach(theme => {
        AppState.settings.theme = theme;
        saveSettings();
        applyTheme();
      });
      
      expect(localStorage.setItem).toHaveBeenCalledTimes(themes.length);
      expect(document.body.dataset.theme).toBe('dark'); // Last auto with prefersDark
    });
  });
});