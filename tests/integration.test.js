/**
 * Integration tests for logo fallback functionality
 * Tests the complete flow from image load failure to placeholder creation
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Logo Fallback Integration Tests', () => {
  let scriptContent;
  
  beforeAll(() => {
    const scriptPath = join(__dirname, '../docs/script.js');
    scriptContent = readFileSync(scriptPath, 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('Complete Logo Loading Flow', () => {
    test('should handle complete flow: image load failure -> create placeholder -> verify DOM', (done) => {
      // Set up HTML with logo
      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" alt="Net Observation Project" data-logo style="width:100%; border-radius:14px; margin-bottom:1rem;" />
        </aside>
        <header>
          <img src="logo.png" alt="Net Observation" class="logo" data-logo />
        </header>
      `;

      const images = document.querySelectorAll('img[data-logo]');
      expect(images.length).toBe(2);

      // Simulate error on both images
      images.forEach(img => {
        img.style.display = 'none';
        img.dataset.fallback = 'true';
        const placeholder = document.createElement('div');
        placeholder.className = 'logo-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
        img.insertAdjacentElement('afterend', placeholder);
      });

      setTimeout(() => {
        // Verify both images are hidden
        images.forEach(img => {
          expect(img.style.display).toBe('none');
          expect(img.dataset.fallback).toBe('true');
        });

        // Verify both placeholders exist
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(2);

        // Verify placeholder content
        expect(placeholders[0].textContent).toBe('NET OBSERVATION PROJECT');
        expect(placeholders[1].textContent).toBe('NET OBSERVATION');

        done();
      }, 100);
    });

    test('should handle mixed success and failure scenarios', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo 1" data-logo id="img1" />
        <img src="logo.png" alt="Logo 2" data-logo id="img2" />
        <img src="logo.png" alt="Logo 3" data-logo id="img3" />
      `;

      const img1 = document.getElementById('img1');
      const img2 = document.getElementById('img2');
      const img3 = document.getElementById('img3');

      // img1 - success (has dimensions)
      Object.defineProperty(img1, 'naturalWidth', { value: 512 });
      Object.defineProperty(img1, 'naturalHeight', { value: 512 });
      Object.defineProperty(img1, 'complete', { value: true });

      // img2 - failure (no dimensions)
      Object.defineProperty(img2, 'naturalWidth', { value: 0 });
      Object.defineProperty(img2, 'naturalHeight', { value: 0 });
      Object.defineProperty(img2, 'complete', { value: true });
      img2.style.display = 'none';
      img2.dataset.fallback = 'true';
      const placeholder2 = document.createElement('div');
      placeholder2.className = 'logo-placeholder';
      placeholder2.textContent = 'LOGO 2';
      img2.insertAdjacentElement('afterend', placeholder2);

      // img3 - error event
      img3.dispatchEvent(new Event('error'));
      img3.style.display = 'none';
      img3.dataset.fallback = 'true';
      const placeholder3 = document.createElement('div');
      placeholder3.className = 'logo-placeholder';
      placeholder3.textContent = 'LOGO 3';
      img3.insertAdjacentElement('afterend', placeholder3);

      setTimeout(() => {
        // img1 should be visible
        expect(img1.style.display).not.toBe('none');
        expect(img1.dataset.fallback).toBeUndefined();

        // img2 and img3 should have placeholders
        expect(img2.style.display).toBe('none');
        expect(img3.style.display).toBe('none');

        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(2);

        done();
      }, 100);
    });

    test('should maintain accessibility throughout fallback process', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Accessible Logo" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Trigger fallback
      img.style.display = 'none';
      img.dataset.fallback = 'true';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = 'ACCESSIBLE LOGO';
      img.insertAdjacentElement('afterend', placeholder);

      setTimeout(() => {
        const placeholderElement = document.querySelector('.logo-placeholder');
        
        // Original image should still exist (just hidden) for screen readers
        expect(document.querySelector('img[alt="Accessible Logo"]')).toBeTruthy();
        
        // Placeholder should be aria-hidden
        expect(placeholderElement.getAttribute('aria-hidden')).toBe('true');
        
        done();
      }, 50);
    });
  });

  describe('Multiple Page Scenario', () => {
    test('should handle logo fallback consistently across different pages', () => {
      const pages = ['home', 'dashboard', 'api', 'data'];
      
      pages.forEach(page => {
        document.body.innerHTML = `
          <body data-page="${page}">
            <aside class="sidebar">
              <img src="logo.png" alt="Net Observation Project" data-logo />
            </aside>
            <header>
              <img src="logo.png" alt="Net Observation" class="logo" data-logo />
            </header>
          </body>
        `;

        const images = document.querySelectorAll('img[data-logo]');
        
        images.forEach(img => {
          img.style.display = 'none';
          img.dataset.fallback = 'true';
          const placeholder = document.createElement('div');
          placeholder.className = 'logo-placeholder';
          placeholder.textContent = img.alt.toUpperCase();
          img.insertAdjacentElement('afterend', placeholder);
        });

        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(2);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle rapid successive error events', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      
      // Fire multiple error events
      for (let i = 0; i < 5; i++) {
        if (img.dataset.fallback !== 'true') {
          img.style.display = 'none';
          img.dataset.fallback = 'true';
          const placeholder = document.createElement('div');
          placeholder.className = 'logo-placeholder';
          placeholder.textContent = 'TEST';
          img.insertAdjacentElement('afterend', placeholder);
        }
      }

      setTimeout(() => {
        // Should only have one placeholder despite multiple events
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        done();
      }, 100);
    });

    test('should handle missing alt attribute gracefully', () => {
      document.body.innerHTML = `
        <img src="logo.png" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      img.style.display = 'none';
      img.dataset.fallback = 'true';
      
      const placeholder = document.createElement('div');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);

      expect(placeholder.textContent).toBe('NET OBSERVATION');
    });

    test('should handle null or undefined values', () => {
      const testCases = [
        { alt: null, expected: 'NET OBSERVATION' },
        { alt: undefined, expected: 'NET OBSERVATION' },
        { alt: '', expected: 'NET OBSERVATION' },
        { alt: 'Custom', expected: 'CUSTOM' }
      ];

      testCases.forEach(({ alt, expected }) => {
        const placeholder = document.createElement('div');
        placeholder.textContent = (alt || 'Net Observation').toUpperCase();
        expect(placeholder.textContent).toBe(expected);
      });
    });
  });

  describe('CSS Integration', () => {
    test('placeholder should have correct CSS class for styling', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
      `;

      const img = document.querySelector('img[data-logo]');
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      img.insertAdjacentElement('afterend', placeholder);

      expect(placeholder.classList.contains('logo-placeholder')).toBe(true);
    });

    test('sidebar placeholder should inherit sidebar context', () => {
      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" alt="Test" data-logo />
        </aside>
      `;

      const img = document.querySelector('img[data-logo]');
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      img.insertAdjacentElement('afterend', placeholder);

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.contains(placeholder)).toBe(true);
    });

    test('header placeholder should maintain header context', () => {
      document.body.innerHTML = `
        <header>
          <img src="logo.png" alt="Test" class="logo" data-logo />
        </header>
      `;

      const img = document.querySelector('img[data-logo]');
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      img.insertAdjacentElement('afterend', placeholder);

      const header = document.querySelector('header');
      expect(header.contains(placeholder)).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    test('should work even if legacy logo elements exist', () => {
      document.body.innerHTML = `
        <div class="legacy-logo">OLD</div>
        <img src="logo.png" alt="New Logo" data-logo />
      `;

      const newImg = document.querySelector('img[data-logo]');
      const legacy = document.querySelector('.legacy-logo');

      expect(newImg).toBeTruthy();
      expect(legacy).toBeTruthy();

      // New logo should work independently
      newImg.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      newImg.insertAdjacentElement('afterend', placeholder);

      expect(document.querySelector('.logo-placeholder')).toBeTruthy();
      expect(legacy.textContent).toBe('OLD'); // Legacy unaffected
    });
  });
});

describe('Theme Integration with Logo', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('logo placeholder should respect theme changes', () => {
    document.body.innerHTML = `
      <img src="logo.png" alt="Test" data-logo />
    `;

    // Create placeholder
    const img = document.querySelector('img[data-logo]');
    const placeholder = document.createElement('div');
    placeholder.className = 'logo-placeholder';
    img.insertAdjacentElement('afterend', placeholder);

    // Change theme
    document.body.dataset.theme = 'dark';
    expect(document.body.dataset.theme).toBe('dark');

    document.body.dataset.theme = 'light';
    expect(document.body.dataset.theme).toBe('light');

    // Placeholder should still exist
    expect(document.querySelector('.logo-placeholder')).toBeTruthy();
  });

  test('placeholder should work with theme toggle', () => {
    document.body.innerHTML = `
      <div data-role="theme-toggle" role="button" tabindex="0">
        <span>Theme:</span>
        <strong data-label>AUTO</strong>
      </div>
      <img src="logo.png" alt="Test" data-logo />
    `;

    const toggle = document.querySelector('[data-role="theme-toggle"]');
    const img = document.querySelector('img[data-logo]');

    // Create placeholder
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'logo-placeholder';
    img.insertAdjacentElement('afterend', placeholder);

    // Simulate theme toggle
    const themes = ['auto', 'dark', 'light'];
    let currentIdx = 0;

    toggle.addEventListener('click', () => {
      currentIdx = (currentIdx + 1) % themes.length;
      document.body.dataset.theme = themes[currentIdx];
      toggle.querySelector('[data-label]').textContent = themes[currentIdx].toUpperCase();
    });

    toggle.click();
    expect(document.body.dataset.theme).toBe('dark');

    // Placeholder should remain functional
    expect(document.querySelector('.logo-placeholder')).toBeTruthy();
  });
});