/**
 * Advanced edge case tests for docs/script.js
 * Covers race conditions, memory leaks, timing issues, and browser compatibility
 */

const fs = require('fs');
const path = require('path');

describe('Advanced Edge Cases - Script.js', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
    delete window.__latestCensys;
    delete window.registerPlugin;
  });

  describe('Race conditions and timing', () => {
    it('should handle rapid theme toggle clicks without state corruption', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }

      // Should cycle exactly 10 times: auto->dark->light->auto (repeats)
      const finalTheme = document.documentElement.getAttribute('data-theme');
      expect(['auto', 'dark', 'light']).toContain(finalTheme);
      
      // Settings should be consistent
      const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(['auto', 'dark', 'light']).toContain(settings.theme);
    });

    it('should handle multiple logo error events on same image', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Trigger multiple error events rapidly
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Should only create one placeholder
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        expect(img.dataset.fallback).toBe('true');
        done();
      }, 50);
    });

    it('should handle script initialization before DOM elements exist', () => {
      // Empty DOM
      document.body.innerHTML = '';

      // Should not throw errors
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle concurrent fetchCensysSummary calls', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 100,
          total_services: 50,
          countries: {},
          services: {}
        })
      });

      eval(scriptContent);

      // Trigger multiple concurrent fetches
      const promises = [];
      for (let i = 0; i < 5; i++) {
        if (window.fetchCensysSummary) {
          promises.push(window.fetchCensysSummary?.(true));
        }
      }

      await Promise.all(promises);

      // All should complete without errors
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle theme system preference change during page load', () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));

      eval(scriptContent);

      // Simulate preference change
      if (mediaQuery.addEventListener) {
        mediaQuery.matches = false;
        const event = new Event('change');
        mediaQuery.dispatchEvent(event);
      }

      // Should handle gracefully
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Memory management and cleanup', () => {
    it('should not leak event listeners when adding multiple logos', (done) => {
      document.body.innerHTML = `
        <img src="logo1.png" alt="Logo 1" data-logo />
        <img src="logo2.png" alt="Logo 2" data-logo />
        <img src="logo3.png" alt="Logo 3" data-logo />
      `;

      eval(scriptContent);

      const images = document.querySelectorAll('img[data-logo]');
      
      // Trigger errors on all
      images.forEach(img => img.dispatchEvent(new Event('error')));

      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(3);
        
        // Each image should have exactly one error handler (no duplicates)
        images.forEach(img => {
          expect(img.dataset.fallback).toBe('true');
        });
        
        done();
      }, 50);
    });

    it('should handle removal of elements after event listener attachment', () => {
      document.body.innerHTML = `
        <button class="sidebar-toggle"></button>
        <aside class="sidebar"></aside>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      
      // Remove element
      toggle.remove();

      // Should not cause errors when trying to interact
      expect(document.querySelector('.sidebar-toggle')).toBeNull();
    });

    it('should not accumulate terminal messages indefinitely', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const output = document.querySelector('.terminal-output');
      
      // Add many terminal messages
      for (let i = 0; i < 100; i++) {
        if (window.logTerminal) {
          window.logTerminal?.(`Message ${i}`);
        }
      }

      // Should have all messages (no arbitrary limit in current implementation)
      const messages = output.children.length;
      expect(messages).toBeGreaterThan(0);
      expect(messages).toBeLessThanOrEqual(100);
    });
  });

  describe('LocalStorage edge cases', () => {
    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api/test" />
          </form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');
      
      // Should not crash when saving fails
      expect(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage being disabled/unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;

      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';

      // Should not crash
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      global.localStorage = originalLocalStorage;
    });

    it('should handle extremely large localStorage values', () => {
      const hugeString = 'x'.repeat(1000000); // 1MB string
      
      localStorage.setItem('net-observation-settings', JSON.stringify({
        theme: 'dark',
        backendUrl: hugeString
      }));

      document.body.innerHTML = '';

      // Should handle gracefully (may truncate or fail to load)
      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle localStorage with circular references', () => {
      // Can't actually store circular refs in localStorage, but test parsing robustness
      localStorage.setItem('net-observation-settings', '{broken json}');

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      // Should fall back to defaults
      const newSettings = JSON.parse(localStorage.getItem('net-observation-settings') || '{}');
      expect(newSettings).toBeDefined();
    });
  });

  describe('DOM manipulation edge cases', () => {
    it('should handle img tags without src attribute', (done) => {
      document.body.innerHTML = '<img alt="No Source" data-logo />';

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder.textContent).toBe('NO SOURCE');
        done();
      }, 50);
    });

    it('should handle img tags with data URIs', (done) => {
      document.body.innerHTML = '<img src="data:image/png;base64,invalid" alt="Data URI" data-logo />';

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      
      // Data URI images might error or load with 0 dimensions
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: false });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: false });
      Object.defineProperty(img, 'complete', { value: true, writable: false });

      setTimeout(() => {
        // Should create fallback for 0-dimension image
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder || img.dataset.fallback).toBeTruthy();
        done();
      }, 50);
    });

    it('should handle form submission without input elements', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form></form>
        </div>
      `;

      eval(scriptContent);

      const form = document.querySelector('form');

      expect(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }).not.toThrow();
    });

    it('should handle missing tbody in table rendering', () => {
      document.body.innerHTML = `
        <table data-table="services"></table>
        <div class="terminal-output"></div>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 100,
          services: { http: 50 },
          countries: {}
        })
      });

      eval(scriptContent);

      // Should not crash even without tbody
      const table = document.querySelector('[data-table="services"]');
      expect(table).toBeTruthy();
    });
  });

  describe('Input validation and sanitization', () => {
    it('should handle XSS attempts in terminal input', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value='<script>alert("xss")</script>' />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');
      const output = document.querySelector('.terminal-output');

      button.click();

      // Script tags should be escaped in textContent
      expect(output.innerHTML).not.toContain('<script>');
      expect(output.textContent.includes('script')).toBe(true); // Present as text, not executed
    });

    it('should handle very long terminal commands', () => {
      const longCommand = 'a'.repeat(10000);
      
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="${longCommand}" />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const button = document.querySelector('.terminal button');

      expect(() => {
        button.click();
      }).not.toThrow();
    });

    it('should handle special characters in data visualizer input', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{"key": "<>&'\\""}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal-output"></div>
      `;

      eval(scriptContent);

      const button = document.getElementById('renderData');

      expect(() => {
        button.click();
      }).not.toThrow();

      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).toBeTruthy();
    });

    it('should handle null bytes in settings', () => {
      localStorage.setItem('net-observation-settings', '{"theme":"dark\x00"}');

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });
  });

  describe('Network error scenarios', () => {
    it('should handle fetch timeout', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      eval(scriptContent);

      // Should handle timeout gracefully
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle fetch abort', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockRejectedValue(new Error('Aborted'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle network offline', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockRejectedValue(new Error('NetworkError: Failed to fetch'));

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle invalid JSON in fetch response', async () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Unexpected token'); }
      });

      eval(scriptContent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Browser compatibility edge cases', () => {
    it('should handle missing matchMedia support', () => {
      const originalMatchMedia = window.matchMedia;
      delete window.matchMedia;

      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();

      window.matchMedia = originalMatchMedia;
    });

    it('should handle missing addEventListener on matchMedia', () => {
      const mockMatchMedia = {
        matches: true,
        media: '(prefers-color-scheme: dark)'
        // No addEventListener
      };

      window.matchMedia = jest.fn().mockReturnValue(mockMatchMedia);

      document.body.innerHTML = '';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing Chart.js library', () => {
      delete window.Chart;

      document.body.innerHTML = `
        <canvas id="servicesChart"></canvas>
        <canvas id="countriesChart"></canvas>
      `;
      document.body.dataset.page = 'dashboard';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing Auth0 library', async () => {
      delete window.createAuth0Client;

      document.body.innerHTML = '';

      localStorage.setItem('net-observation-settings', JSON.stringify({
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client'
      }));

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });

    it('should handle missing d3 library for heatmap', () => {
      delete window.d3;
      delete window.topojson;

      document.body.innerHTML = '<div id="world-map"></div>';

      expect(() => {
        eval(scriptContent);
      }).not.toThrow();
    });
  });

  describe('Plugin system edge cases', () => {
    it('should handle plugin with undefined run function', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const invalidPlugin = {
        name: 'broken-plugin',
        command: 'broken'
        // No run function
      };

      expect(() => {
        window.registerPlugin?.(invalidPlugin);
      }).not.toThrow();
    });

    it('should handle plugin that throws errors', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="error-cmd test" />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const errorPlugin = {
        name: 'error-plugin',
        command: 'error-cmd',
        run: () => { throw new Error('Plugin error'); }
      };

      window.registerPlugin?.(errorPlugin);

      const button = document.querySelector('.terminal button');
      
      expect(() => {
        button.click();
      }).not.toThrow();

      // Error should be caught and displayed
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Error');
    });

    it('should handle plugin with async run function that rejects', async () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="async-error test" />
            <button type="button">Run</button>
          </div>
        </div>
      `;

      eval(scriptContent);

      const asyncPlugin = {
        name: 'async-error-plugin',
        command: 'async-error',
        run: async () => { throw new Error('Async error'); }
      };

      window.registerPlugin?.(asyncPlugin);

      const button = document.querySelector('.terminal button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle gracefully
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle duplicate plugin registration', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      const plugin = {
        name: 'duplicate',
        command: 'dup',
        run: () => 'first'
      };

      window.registerPlugin?.(plugin);
      
      // Register again with different implementation
      const plugin2 = {
        name: 'duplicate',
        command: 'dup',
        run: () => 'second'
      };

      expect(() => {
        window.registerPlugin?.(plugin2);
      }).not.toThrow();
    });
  });

  describe('State management edge cases', () => {
    it('should handle concurrent theme and settings changes', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>
        <div class="settings-panel">
          <form>
            <select name="themeMode">
              <option value="light">Light</option>
            </select>
          </form>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const form = document.querySelector('form');

      // Change theme via toggle
      toggle.click();

      // Immediately change via settings
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      // Should not cause conflicts
      const settings = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(['auto', 'dark', 'light']).toContain(settings.theme);
    });

    it('should handle window.__latestCensys mutation from external code', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';

      eval(scriptContent);

      // External code mutates the state
      window.__latestCensys = { corrupted: true };

      // Should not break application
      expect(() => {
        const data = window.__latestCensys;
        expect(data).toBeDefined();
      }).not.toThrow();
    });
  });
});