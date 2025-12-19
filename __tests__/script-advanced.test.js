/**
 * Advanced unit tests for docs/script.js
 * Tests advanced scenarios, edge cases, and stress conditions
 * that complement the existing comprehensive test suite
 */

const fs = require('fs');
const path = require('path');

describe('Advanced Script.js Tests - Additional Coverage', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initLogoPlaceholders - Stress testing and edge cases', () => {
    it('should handle images that load very slowly', (done) => {
      document.body.innerHTML = `<img src="logo.png" data-logo alt="Test" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Simulate slow load - image not complete yet
      Object.defineProperty(img, 'complete', { value: false });
      Object.defineProperty(img, 'naturalWidth', { value: 0 });
      Object.defineProperty(img, 'naturalHeight', { value: 0 });
      
      setTimeout(() => {
        // Now simulate successful load
        Object.defineProperty(img, 'naturalWidth', { value: 512 });
        Object.defineProperty(img, 'naturalHeight', { value: 512 });
        img.dispatchEvent(new Event('load'));
        
        setTimeout(() => {
          // Should NOT have fallback since image loaded successfully
          expect(img.nextElementSibling?.className).not.toBe('logo-placeholder');
          done();
        }, 50);
      }, 100);
    });

    it('should handle images with data URLs that fail', (done) => {
      document.body.innerHTML = `<img src="data:image/png;base64,invalid" data-logo alt="Test" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Error('error'));
      
      setTimeout(() => {
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle images that are removed from DOM during processing', (done) => {
      document.body.innerHTML = `<img src="logo.png" data-logo alt="Test" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Remove image immediately
      img.remove();
      
      // Trigger error on removed element
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Should not crash
        expect(document.querySelectorAll('.logo-placeholder').length).toBe(0);
        done();
      }, 50);
    });

    it('should handle images with very long alt text', (done) => {
      const longAlt = 'A'.repeat(1000);
      document.body.innerHTML = `<img src="logo.png" data-logo alt="${longAlt}" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe(longAlt.toUpperCase());
        expect(placeholder.textContent.length).toBe(1000);
        done();
      }, 50);
    });

    it('should handle images with special characters in alt text', (done) => {
      document.body.innerHTML = `<img src="logo.png" data-logo alt="Test™ & Co. <script>" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toContain('TEST™');
        expect(placeholder.textContent).toContain('&');
        done();
      }, 50);
    });

    it('should handle rapid error events on same image', (done) => {
      document.body.innerHTML = `<img src="logo.png" data-logo alt="Test" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Fire multiple error events rapidly
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Should only create ONE fallback
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        done();
      }, 50);
    });

    it('should handle images that load then error', (done) => {
      document.body.innerHTML = `<img src="logo.png" data-logo alt="Test" />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // First successful load
      Object.defineProperty(img, 'naturalWidth', { value: 512, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, configurable: true });
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.nextElementSibling?.className).not.toBe('logo-placeholder');
        
        // Now trigger error (maybe image got corrupted)
        Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 0, configurable: true });
        img.dispatchEvent(new Event('error'));
        
        setTimeout(() => {
          // Should create fallback
          expect(img.nextElementSibling?.className).toBe('logo-placeholder');
          done();
        }, 50);
      }, 50);
    });

    it('should handle 100+ images on same page', (done) => {
      const images = Array.from({ length: 100 }, (_, i) => 
        `<img src="logo.png" data-logo alt="Logo ${i}" />`
      ).join('');
      
      document.body.innerHTML = images;
      
      eval(scriptContent);
      
      const allImages = document.querySelectorAll('img[data-logo]');
      expect(allImages.length).toBe(100);
      
      // Trigger error on all
      allImages.forEach(img => img.dispatchEvent(new Event('error')));
      
      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(100);
        done();
      }, 100);
    });
  });

  describe('localStorage edge cases', () => {
    it('should handle localStorage being completely disabled', () => {
      // Simulate localStorage throwing on access
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('localStorage is not available');
        },
        configurable: true
      });

      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      // Should not crash
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle localStorage quota exceeded', () => {
      const mockSetItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      Storage.prototype.setItem = mockSetItem;
      
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Should not crash when trying to save
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle localStorage returning null for everything', () => {
      Storage.prototype.getItem = jest.fn(() => null);
      
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      eval(scriptContent);
      
      // Should use defaults
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });

    it('should handle localStorage with circular reference data', () => {
      const circularObj = { a: 1 };
      circularObj.self = circularObj;
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));
      
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      eval(scriptContent);
      
      // Trying to save circular reference should not crash
      window.AppState = window.AppState || {};
      window.AppState.settings = circularObj;
      
      // This would crash if not handled
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(() => toggle.click()).not.toThrow();
    });
  });

  describe('Theme system stress tests', () => {
    it('should handle rapid theme toggle clicks', () => {
      document.body.innerHTML = `<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>`;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Click 100 times rapidly
      for (let i = 0; i < 100; i++) {
        toggle.click();
      }
      
      // Should still have valid theme
      const theme = document.body.dataset.theme;
      expect(['auto', 'dark', 'light'].includes(theme)).toBe(true);
    });

    it('should handle system preference changes during user interaction', () => {
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));
      
      eval(scriptContent);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Simulate system preference change
      mediaQuery.matches = false;
      mediaQuery.dispatchEvent(new Event('change'));
      
      // Theme should update
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should handle missing matchMedia API', () => {
      delete window.matchMedia;
      
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      // Should not crash and use fallback
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('fetch and network edge cases', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should handle fetch aborting mid-request', async () => {
      global.fetch.mockImplementation(() => 
        Promise.reject(new DOMException('The user aborted a request', 'AbortError'))
      );

      document.body.innerHTML = `<div class="terminal-output"></div>`;
      localStorage.setItem('net-observation-settings', JSON.stringify({ backendUrl: '/api/test' }));
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should handle abort gracefully
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle fetch with invalid JSON response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      document.body.innerHTML = `<div class="terminal-output"></div>`;
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should handle and log error
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle response with mismatched Content-Type', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        headers: { 'content-type': 'text/html' },
        json: async () => ({ total_hosts: 100 })
      });

      document.body.innerHTML = `<div data-stat="total-hosts"></div><div class="terminal-output"></div>`;
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should still try to parse JSON
      expect(window.__latestCensys).toBeDefined();
    });
  });

  describe('DOM manipulation edge cases', () => {
    it('should handle querySelector returning unexpected results', () => {
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      // Mock querySelector to return null sometimes
      const originalQS = document.querySelector;
      let callCount = 0;
      document.querySelector = function(selector) {
        callCount++;
        if (callCount % 3 === 0) return null;
        return originalQS.call(document, selector);
      };
      
      // Should not crash
      expect(() => eval(scriptContent)).not.toThrow();
      
      document.querySelector = originalQS;
    });

    it('should handle elements being removed during event handling', () => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.sidebar');
      
      // Set up to remove sidebar on click
      toggle.addEventListener('click', () => {
        sidebar.remove();
      }, { capture: true });
      
      // Should not crash
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle deeply nested element structures', () => {
      let html = '<div>';
      for (let i = 0; i < 100; i++) {
        html += '<div>';
      }
      html += '<img src="logo.png" data-logo alt="Deep" />';
      for (let i = 0; i < 100; i++) {
        html += '</div>';
      }
      html += '</div>';
      
      document.body.innerHTML = html;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      expect(img).toBeTruthy();
      
      img.dispatchEvent(new Event('error'));
      
      // Should still work with deep nesting
      setTimeout(() => {
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
      }, 50);
    });
  });

  describe('JSDoc documentation completeness', () => {
    it('should have JSDoc for all new functions', () => {
      const newFunctions = [
        'loadSettings',
        'saveSettings',
        'applyTheme',
        'initLogoPlaceholders',
        'initThemeToggle',
        'initSidebar',
        'qs',
        'updateStatsView',
        'renderTable',
        'fetchCensysSummary',
        'initAutoRefresh',
        'initCharts',
        'updateCharts',
        'generateColorPalette',
        'initTerminal',
        'logTerminal',
        'initDataVisualizer',
        'initSettingsPanel',
        'initAuth0',
        'updateAuthControls',
        'renderHeatmap',
        'initDocsSidebar',
        'initVersionList',
        'initPageSpecificFeatures',
        'markActiveNav',
        'init'
      ];

      newFunctions.forEach(funcName => {
        // Look for JSDoc before function definition
        const funcRegex = new RegExp(`function ${funcName}\\(`);
        const match = scriptContent.search(funcRegex);
        
        if (match !== -1) {
          const before = scriptContent.substring(Math.max(0, match - 500), match);
          expect(before).toMatch(/\/\*\*/);
        }
      });
    });

    it('should document all @param tags for functions with parameters', () => {
      const functionsWithParams = [
        { name: 'renderTable', params: ['selector', 'objectData'] },
        { name: 'fetchCensysSummary', params: ['silent'] },
        { name: 'updateCharts', params: ['data'] },
        { name: 'generateColorPalette', params: ['count', 'seed'] },
        { name: 'logTerminal', params: ['message'] },
        { name: 'renderHeatmap', params: ['data'] }
      ];

      functionsWithParams.forEach(({ name, params }) => {
        const funcRegex = new RegExp(`function ${name}\\([^)]*\\)`);
        const match = scriptContent.search(funcRegex);
        
        if (match !== -1) {
          const before = scriptContent.substring(Math.max(0, match - 1000), match);
          
          params.forEach(param => {
            expect(before).toMatch(new RegExp(`@param.*${param}`));
          });
        }
      });
    });

    it('should have @returns documentation for functions that return values', () => {
      const functionsWithReturns = ['qs', 'generateColorPalette'];

      functionsWithReturns.forEach(funcName => {
        const funcRegex = new RegExp(`function ${funcName}\\(`);
        const match = scriptContent.search(funcRegex);
        
        if (match !== -1) {
          const before = scriptContent.substring(Math.max(0, match - 500), match);
          expect(before).toMatch(/@returns/);
        }
      });
    });
  });

  describe('Memory and performance considerations', () => {
    it('should not leak event listeners when elements are re-created', () => {
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      eval(scriptContent);
      
      // Get reference to toggle
      const toggle1 = document.querySelector('[data-role="theme-toggle"]');
      
      // Replace it
      document.body.innerHTML = `<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>`;
      
      // Initialize again
      eval(scriptContent);
      
      const toggle2 = document.querySelector('[data-role="theme-toggle"]');
      
      // Old toggle should not affect anything
      expect(() => toggle1.click()).not.toThrow();
      expect(() => toggle2.click()).not.toThrow();
    });

    it('should handle large data sets efficiently', async () => {
      const largeData = {
        total_hosts: 999999999,
        total_services: 888888888,
        last_sync: new Date().toISOString(),
        countries: {},
        services: {}
      };

      // Generate 1000 countries
      for (let i = 0; i < 1000; i++) {
        largeData.countries[`C${i}`] = i * 1000;
      }

      // Generate 1000 services
      for (let i = 0; i < 1000; i++) {
        largeData.services[`service-${i}`] = i * 500;
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => largeData
      });

      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Should handle large datasets
      expect(window.__latestCensys.countries).toHaveProperty('C999');
      expect(window.__latestCensys.services).toHaveProperty('service-999');
    });
  });
});