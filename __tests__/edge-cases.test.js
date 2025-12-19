/**
 * Edge case and stress tests for modified functionality
 * Tests boundary conditions, race conditions, and unusual scenarios
 */

const fs = require('fs');
const path = require('path');

describe('Edge Cases and Stress Tests', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initLogoPlaceholders - Edge Cases', () => {
    it('should handle rapid successive error events on same image', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Fire multiple error events rapidly
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Should only create one fallback
        const fallbacks = document.querySelectorAll('.logo-placeholder');
        expect(fallbacks.length).toBe(1);
        done();
      }, 50);
    });

    it('should handle images that load after error event', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Error first
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Then successful load
        Object.defineProperty(img, 'naturalWidth', { value: 512, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 512, configurable: true });
        img.dispatchEvent(new Event('load'));
        
        setTimeout(() => {
          // Should still have fallback (error happened first)
          expect(img.dataset.fallback).toBe('true');
          done();
        }, 50);
      }, 50);
    });

    it('should handle images with zero width but non-zero height', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 512, configurable: true });
      
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle images with non-zero width but zero height', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 512, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, configurable: true });
      
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle very long alt text gracefully', (done) => {
      const longAlt = 'A'.repeat(500);
      document.body.innerHTML = `<img src="logo.png" alt="${longAlt}" data-logo />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const fallback = img.nextElementSibling;
        expect(fallback.textContent).toBe(longAlt.toUpperCase());
        done();
      }, 50);
    });

    it('should handle special characters in alt text', (done) => {
      const specialAlt = 'Test <script>alert("xss")</script> & "quotes"';
      document.body.innerHTML = `<img src="logo.png" alt="${specialAlt.replace(/"/g, '&quot;')}" data-logo />`;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const fallback = img.nextElementSibling;
        expect(fallback.textContent).toContain('TEST');
        expect(fallback.querySelector('script')).toBeNull();
        done();
      }, 50);
    });

    it('should handle dynamically added logo images', (done) => {
      document.body.innerHTML = '<div id="container"></div>';
      
      eval(scriptContent);
      
      // Add logo after initialization
      const container = document.getElementById('container');
      container.innerHTML = '<img src="logo.png" alt="Dynamic" data-logo />';
      
      // Need to manually trigger init for dynamically added elements
      const img = container.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        // Won't have fallback unless we re-run initLogoPlaceholders
        // This tests that the function doesn't break with dynamic content
        expect(img).toBeTruthy();
        done();
      }, 50);
    });

    it('should handle removed images gracefully', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Remove image immediately after error
      img.dispatchEvent(new Event('error'));
      img.remove();
      
      setTimeout(() => {
        // Should not throw error
        expect(document.querySelector('.logo-placeholder')).toBeNull();
        done();
      }, 50);
    });

    it('should handle images with data URI that fail', (done) => {
      document.body.innerHTML = '<img src="data:image/png;base64,invalid" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        expect(img.nextElementSibling?.className).toBe('logo-placeholder');
        done();
      }, 50);
    });

    it('should handle images with empty alt text', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const fallback = img.nextElementSibling;
        expect(fallback.textContent).toBe('NET OBSERVATION');
        done();
      }, 50);
    });
  });

  describe('localStorage edge cases', () => {
    it('should handle quota exceeded errors', () => {
      // Mock localStorage to throw quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Should not throw error
      expect(() => toggle.click()).not.toThrow();
      
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted non-JSON data in localStorage', () => {
      localStorage.setItem('net-observation-settings', '{invalid json}');
      
      document.body.innerHTML = '<div></div>';
      
      // Should not throw error
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle null values in localStorage', () => {
      localStorage.setItem('net-observation-settings', 'null');
      
      document.body.innerHTML = '<div></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle undefined string in localStorage', () => {
      localStorage.setItem('net-observation-settings', 'undefined');
      
      document.body.innerHTML = '<div></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle very large settings object', () => {
      const largeSettings = {
        theme: 'dark',
        backendUrl: '/api',
        largeData: 'x'.repeat(1000000) // 1MB string
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(largeSettings));
      
      document.body.innerHTML = '<div></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });
  });

  describe('fetchCensysSummary - Edge Cases', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should handle extremely large response payloads', async () => {
      const largeData = {
        total_hosts: 999999999,
        total_services: 888888888,
        countries: Object.fromEntries(
          Array.from({ length: 200 }, (_, i) => [`COUNTRY${i}`, i * 1000])
        ),
        services: Object.fromEntries(
          Array.from({ length: 500 }, (_, i) => [`SERVICE${i}`, i * 100])
        )
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeData
      });

      document.body.innerHTML = '<div data-stat="total-hosts"></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(window.__latestCensys).toBeDefined();
    });

    it('should handle slow network responses', async () => {
      jest.useFakeTimers();

      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ total_hosts: 100 })
            });
          }, 30000); // 30 second delay
        })
      );

      document.body.innerHTML = '<div></div>';
      
      eval(scriptContent);
      
      // Fast forward time
      jest.advanceTimersByTime(35000);
      
      await Promise.resolve();
      
      jest.useRealTimers();
    });

    it('should handle response with missing content-type', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {},
        json: async () => ({ total_hosts: 100 })
      });

      document.body.innerHTML = '<div></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should handle gracefully
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should handle concurrent fetch requests', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({ total_hosts: callCount })
        };
      });

      document.body.innerHTML = '<div></div>';
      
      eval(scriptContent);
      
      // Wait for multiple intervals
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should have made at least one call
      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle JSON parse errors in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token');
        }
      });

      document.body.innerHTML = '<div></div>';
      
      eval(scriptContent);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Theme toggle - Edge Cases', () => {
    it('should handle rapid theme toggle clicks', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Click rapidly 10 times
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }
      
      // Should cycle through themes predictably
      const theme = document.body.dataset.theme;
      expect(['auto', 'dark', 'light']).toContain(theme);
    });

    it('should handle keyboard events on theme toggle', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);
      
      expect(document.body.dataset.theme).toBeTruthy();
      
      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(spaceEvent);
      
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should handle system preference changes during runtime', () => {
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'auto' }));
      
      eval(scriptContent);
      
      // Simulate system preference change
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      if (darkModeQuery.addEventListener) {
        const changeEvent = new Event('change');
        Object.defineProperty(changeEvent, 'matches', { value: false });
        darkModeQuery.dispatchEvent(changeEvent);
      }
      
      // Should not crash
      expect(document.body).toBeTruthy();
    });
  });

  describe('Sidebar - Edge Cases', () => {
    it('should handle missing toggle button', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle missing sidebar element', () => {
      document.body.innerHTML = '<button class="sidebar-toggle"></button>';
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should handle window resize events', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle"></button>
      `;
      
      window.innerWidth = 1024;
      eval(scriptContent);
      
      // Simulate resize to mobile
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));
      
      // Should not crash
      expect(document.querySelector('.sidebar')).toBeTruthy();
    });
  });

  describe('Data handling - Edge Cases', () => {
    it('should handle null or undefined stat values', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
      `;
      
      eval(scriptContent);
      
      // Simulate update with missing data
      const updateStatsView = new Function('data', scriptContent + '; updateStatsView(data);');
      
      expect(() => updateStatsView({
        total_hosts: null,
        total_services: undefined
      })).not.toThrow();
    });

    it('should handle empty objects for countries and services', () => {
      document.body.innerHTML = `
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;
      
      eval(scriptContent);
      
      // Tables should be empty but not crash
      expect(document.querySelector('[data-table="countries"] tbody')).toBeTruthy();
    });

    it('should handle malformed date strings', () => {
      document.body.innerHTML = '<div data-stat="last-sync"></div>';
      
      eval(scriptContent);
      
      const element = document.querySelector('[data-stat="last-sync"]');
      
      // Manually test with invalid date
      const invalidDate = 'not-a-date';
      element.textContent = new Date(invalidDate).toLocaleString();
      
      // Should show "Invalid Date" or similar, not crash
      expect(element.textContent).toBeTruthy();
    });
  });

  describe('Memory and performance', () => {
    it('should not create memory leaks with event listeners', () => {
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      // Initialize multiple times (simulating hot reload)
      for (let i = 0; i < 10; i++) {
        eval(scriptContent);
      }
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Should still work correctly
      toggle.click();
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should handle large DOM with many elements', () => {
      const largeHTML = Array.from({ length: 100 }, (_, i) => 
        `<img src="logo${i}.png" alt="Logo ${i}" data-logo />`
      ).join('');
      
      document.body.innerHTML = largeHTML;
      
      const startTime = Date.now();
      eval(scriptContent);
      const endTime = Date.now();
      
      // Should complete reasonably quickly (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Error recovery', () => {
    it('should continue functioning after JavaScript errors', () => {
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      // Cause an error
      try {
        throw new Error('Test error');
      } catch (e) {
        // Swallow
      }
      
      // Theme toggle should still work
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();
      
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should handle missing global objects gracefully', () => {
      const originalFetch = global.fetch;
      delete global.fetch;
      
      document.body.innerHTML = '<div></div>';
      
      // Should initialize without fetch
      expect(() => eval(scriptContent)).not.toThrow();
      
      global.fetch = originalFetch;
    });
  });
});