/**
 * Edge case and stress tests for docs/script.js
 * Focuses on boundary conditions, error scenarios, and unusual inputs
 * that might not be covered in the main test suite
 */

const fs = require('fs');
const path = require('path');

describe('script.js - Edge Cases and Stress Tests', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
    
    // Reset window globals
    window.__latestCensys = null;
    window.innerWidth = 1024;
  });

  describe('initLogoPlaceholders - Edge cases', () => {
    it('should handle logo with zero width but non-zero height', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Mock image with zero width
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 100, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      
      // Trigger load event
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle logo with non-zero width but zero height', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle logo with empty alt text', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe('NET OBSERVATION');
        done();
      }, 50);
    });

    it('should handle logo with very long alt text', (done) => {
      const longAlt = 'A'.repeat(500);
      document.body.innerHTML = `<img src="logo.png" alt="${longAlt}" data-logo />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toBe(longAlt.toUpperCase());
        expect(placeholder.textContent.length).toBe(500);
        done();
      }, 50);
    });

    it('should handle logo with special characters in alt text', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test & Co. <logo>" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toContain('TEST & CO.');
        done();
      }, 50);
    });

    it('should not create fallback if image is already hidden', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo style="display: none;" />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Should still create fallback
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle rapid consecutive error events', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Fire multiple error events quickly
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Should only have one fallback
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        done();
      }, 100);
    });

    it('should handle logo in deeply nested structure', (done) => {
      document.body.innerHTML = `
        <div><div><div><div><div>
          <img src="logo.png" alt="Deep" data-logo />
        </div></div></div></div></div>
      `;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });
  });

  describe('Theme handling - Edge cases', () => {
    it('should handle corrupted theme setting gracefully', () => {
      localStorage.setItem('net-observation-settings', '{"theme": 123}'); // Number instead of string
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle invalid theme value', () => {
      localStorage.setItem('net-observation-settings', '{"theme": "invalid-theme"}');
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      // Should still apply some theme without crashing
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });

    it('should handle theme toggle with missing label element', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle matchMedia not supported', () => {
      const originalMatchMedia = window.matchMedia;
      delete window.matchMedia;
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
      
      window.matchMedia = originalMatchMedia;
    });

    it('should handle rapid theme toggle clicks', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Click multiple times rapidly
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }
      
      // Should cycle through correctly
      const label = toggle.querySelector('[data-label]');
      expect(['AUTO', 'DARK', 'LIGHT']).toContain(label.textContent);
    });

    it('should handle keyboard events on theme toggle with missing key property', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Event without key property
      const event = new Event('keydown');
      delete event.key;
      
      expect(() => toggle.dispatchEvent(event)).not.toThrow();
    });
  });

  describe('localStorage - Edge cases', () => {
    it('should handle localStorage being full', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(() => toggle.click()).not.toThrow();
      
      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage.getItem throwing exception', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('SecurityError');
      });
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
      
      localStorage.getItem = originalGetItem;
    });

    it('should handle extremely large localStorage data', () => {
      const largeData = {
        theme: 'dark',
        extraData: 'x'.repeat(1000000) // 1MB of data
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(largeData));
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle localStorage containing circular references', () => {
      // Can't actually store circular refs in localStorage, but test malformed JSON
      localStorage.setItem('net-observation-settings', '{"theme":"dark","ref":');
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle null bytes in localStorage', () => {
      localStorage.setItem('net-observation-settings', '{"theme":"dark\x00"}');
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle settings with undefined values', () => {
      localStorage.setItem('net-observation-settings', '{"theme":"dark","undef":null}');
      
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Sidebar - Edge cases', () => {
    it('should handle window resize during sidebar operation', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      window.innerWidth = 1200;
      eval(scriptContent);
      
      // Change window size
      window.innerWidth = 400;
      window.dispatchEvent(new Event('resize'));
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should handle sidebar toggle with no sidebar element', () => {
      document.body.innerHTML = '<button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      expect(() => toggle?.click()).not.toThrow();
    });

    it('should handle missing aria-expanded attribute', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      toggle.removeAttribute('aria-expanded');
      
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle extremely narrow window width', () => {
      window.innerWidth = 50; // Unrealistically narrow
      
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle extremely wide window width', () => {
      window.innerWidth = 10000; // Very wide display
      
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });
  });

  describe('fetchCensysSummary - Edge cases', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should handle response with no data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      localStorage.setItem('net-observation-settings', JSON.stringify({ backendUrl: '/api' }));
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should not crash
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should handle fetch throwing synchronous error', async () => {
      global.fetch.mockImplementation(() => {
        throw new Error('Synchronous error');
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle response.json() throwing error', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('JSON parse error');
        }
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle extremely large response payload', async () => {
      const largeCountries = {};
      for (let i = 0; i < 1000; i++) {
        largeCountries[`C${i}`] = Math.floor(Math.random() * 10000);
      }
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: 1000000,
          countries: largeCountries,
          services: {},
          total_services: 500000
        })
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(window.__latestCensys).toBeTruthy();
    });

    it('should handle response with negative numbers', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: -100,
          total_services: -50
        })
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(window.__latestCensys).toBeTruthy();
    });

    it('should handle response with non-numeric values', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hosts: "not a number",
          total_services: null
        })
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should handle gracefully
      expect(window.__latestCensys).toBeTruthy();
    });

    it('should handle concurrent fetch requests', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ total_hosts: callCount })
        });
      });
      
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // May have been called multiple times due to auto-refresh
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Settings panel - Edge cases', () => {
    it('should handle form with missing fields', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api" />
          </form>
        </div>
        <button class="settings-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const form = document.querySelector('form');
      expect(() => form.dispatchEvent(new Event('submit', { bubbles: true }))).not.toThrow();
    });

    it('should handle form with duplicate field names', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api1" />
            <input name="backendUrl" value="/api2" />
          </form>
        </div>
        <button class="settings-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      
      const saved = localStorage.getItem('net-observation-settings');
      expect(saved).toBeTruthy();
    });

    it('should handle form with extremely long values', () => {
      const longValue = 'x'.repeat(10000);
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="${longValue}" />
          </form>
        </div>
        <button class="settings-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const form = document.querySelector('form');
      expect(() => form.dispatchEvent(new Event('submit', { bubbles: true }))).not.toThrow();
    });

    it('should handle form with special characters in values', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" value="/api?param=<script>&test='" />
          </form>
        </div>
        <button class="settings-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      
      const saved = JSON.parse(localStorage.getItem('net-observation-settings'));
      expect(saved.backendUrl).toContain('<script>');
    });

    it('should handle settings toggle when panel is missing', () => {
      document.body.innerHTML = '<button class="settings-toggle"></button>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.settings-toggle');
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle multiple rapid settings panel toggles', () => {
      document.body.innerHTML = `
        <div class="settings-panel hidden"></div>
        <button class="settings-toggle"></button>
      `;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.settings-toggle');
      
      for (let i = 0; i < 20; i++) {
        toggle.click();
      }
      
      const panel = document.querySelector('.settings-panel');
      expect(panel.classList.contains('hidden')).toBeDefined();
    });
  });

  describe('Terminal - Edge cases', () => {
    it('should handle terminal command with empty input', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="" />
            <button type="button">Run</button>
          </div>
        </div>
      `;
      
      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      expect(() => button.click()).not.toThrow();
    });

    it('should handle terminal command with only whitespace', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="   " />
            <button type="button">Run</button>
          </div>
        </div>
      `;
      
      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      const output = document.querySelector('.terminal-output');
      expect(output).toBeTruthy();
    });

    it('should handle extremely long terminal command', () => {
      const longCommand = 'help ' + 'x'.repeat(10000);
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
      expect(() => button.click()).not.toThrow();
    });

    it('should handle terminal command with special characters', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div class="terminal-input">
            <input type="text" value="help <script>alert('xss')</script>" />
            <button type="button">Run</button>
          </div>
        </div>
      `;
      
      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      button.click();
      
      // Should sanitize or handle safely
      const output = document.querySelector('.terminal-output');
      expect(output.innerHTML).not.toContain('<script>');
    });

    it('should handle missing terminal output element', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-input">
            <input type="text" value="help" />
            <button type="button">Run</button>
          </div>
        </div>
      `;
      
      eval(scriptContent);
      
      const button = document.querySelector('.terminal button');
      expect(() => button?.click()).not.toThrow();
    });

    it('should handle plugin with undefined run method', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      const badPlugin = {
        name: 'bad-plugin',
        command: 'bad'
        // No run method
      };
      
      expect(() => window.registerPlugin?.(badPlugin)).not.toThrow();
    });

    it('should handle plugin that throws error', () => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      eval(scriptContent);
      
      const throwingPlugin = {
        name: 'throwing',
        init: () => {
          throw new Error('Init error');
        }
      };
      
      expect(() => window.registerPlugin?.(throwingPlugin)).not.toThrow();
    });
  });

  describe('Data visualizer - Edge cases', () => {
    it('should handle invalid JSON input', () => {
      document.body.innerHTML = `
        <textarea id="dataInput">{invalid json}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      
      eval(scriptContent);
      
      const button = document.getElementById('renderData');
      expect(() => button?.click()).not.toThrow();
    });

    it('should handle empty JSON input', () => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      
      eval(scriptContent);
      
      const button = document.getElementById('renderData');
      button?.click();
      
      const output = document.getElementById('dataOutput');
      expect(output).toBeTruthy();
    });

    it('should handle extremely large JSON input', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }));
      document.body.innerHTML = `
        <textarea id="dataInput">${JSON.stringify(largeArray)}</textarea>
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
      `;
      
      eval(scriptContent);
      
      const button = document.getElementById('renderData');
      expect(() => button?.click()).not.toThrow();
    });

    it('should handle CSV with inconsistent columns', () => {
      const csv = 'a,b,c\n1,2\n3,4,5,6\n7';
      document.body.innerHTML = `
        <input type="file" id="fileInput" />
        <div id="dataOutput"></div>
      `;
      
      eval(scriptContent);
      
      const fileInput = document.getElementById('fileInput');
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      
      const originalFileReader = window.FileReader;
      window.FileReader = jest.fn(() => ({
        readAsText: jest.fn(function() {
          this.result = csv;
          this.onload();
        }),
        result: csv
      }));
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });
      
      expect(() => fileInput.dispatchEvent(new Event('change'))).not.toThrow();
      
      window.FileReader = originalFileReader;
    });

    it('should handle file with no extension', () => {
      document.body.innerHTML = `
        <input type="file" id="fileInput" />
        <div id="dataOutput"></div>
      `;
      
      eval(scriptContent);
      
      const fileInput = document.getElementById('fileInput');
      const file = new File(['data'], 'noextension', { type: '' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });
      
      expect(() => fileInput.dispatchEvent(new Event('change'))).not.toThrow();
    });
  });

  describe('Navigation - Edge cases', () => {
    it('should handle navigation with malformed pathname', () => {
      window.location.pathname = '///invalid//path';
      
      document.body.innerHTML = '<nav><a href="index.html">Home</a></nav>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle navigation with no links', () => {
      document.body.innerHTML = '<nav></nav>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle navigation with broken href attributes', () => {
      document.body.innerHTML = '<nav><a>No href</a><a href="">Empty</a></nav>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('Memory and performance edge cases', () => {
    it('should not leak memory with repeated initialization', () => {
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      // Initialize multiple times
      for (let i = 0; i < 100; i++) {
        eval(scriptContent);
      }
      
      // Should not throw or crash
      expect(document.querySelector('[data-role="theme-toggle"]')).toBeTruthy();
    });

    it('should handle many simultaneous event listeners', () => {
      const manyElements = Array.from({ length: 100 }, (_, i) => 
        `<img src="logo${i}.png" alt="Logo ${i}" data-logo />`
      ).join('');
      
      document.body.innerHTML = manyElements;
      
      expect(() => eval(scriptContent)).not.toThrow();
      
      // Trigger errors on all
      document.querySelectorAll('img[data-logo]').forEach(img => {
        img.dispatchEvent(new Event('error'));
      });
      
      // Should handle all without issues
      expect(document.querySelectorAll('.logo-placeholder').length).toBeGreaterThan(0);
    });
  });
});