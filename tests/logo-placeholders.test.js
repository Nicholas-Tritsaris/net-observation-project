/**
 * Tests for initLogoPlaceholders function in docs/script.js
 * This function creates fallback placeholders when logo images fail to load
 */

describe('initLogoPlaceholders', () => {
  let initLogoPlaceholders;
  
  beforeEach(() => {
    // Extract and execute the initLogoPlaceholders function from script.js
    const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
    const funcMatch = scriptContent.match(/function initLogoPlaceholders\(\) \{[\s\S]*?\n  \}/);
    
    if (funcMatch) {
      // Create isolated function scope
      const funcCode = funcMatch[0].replace('function initLogoPlaceholders()', 'initLogoPlaceholders = function()');
      eval(funcCode);
    }
  });

  describe('Image Load Success', () => {
    test('should not create fallback when image loads successfully', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test Logo" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      // Mock successful image load
      Object.defineProperty(img, 'naturalWidth', { value: 512, writable: false });
      Object.defineProperty(img, 'naturalHeight', { value: 512, writable: false });
      Object.defineProperty(img, 'complete', { value: true, writable: false });
      
      initLogoPlaceholders();
      
      setTimeout(() => {
        expect(img.style.display).not.toBe('none');
        expect(img.dataset.fallback).toBeUndefined();
        expect(document.querySelector('.logo-placeholder')).toBeNull();
        done();
      }, 10);
    });

    test('should handle image with non-standard dimensions', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Brand" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 800, writable: false });
      Object.defineProperty(img, 'naturalHeight', { value: 200, writable: false });
      Object.defineProperty(img, 'complete', { value: true, writable: false });
      
      initLogoPlaceholders();
      
      setTimeout(() => {
        expect(img.style.display).not.toBe('none');
        expect(document.querySelector('.logo-placeholder')).toBeNull();
        done();
      }, 10);
    });
  });

  describe('Image Load Failure', () => {
    test('should create fallback placeholder when image fails to load', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Test Logo" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      initLogoPlaceholders();
      
      // Trigger error event
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(img.dataset.fallback).toBe('true');
        
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).not.toBeNull();
        expect(placeholder.textContent).toBe('TEST LOGO');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 10);
    });

    test('should create fallback when image has zero dimensions', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Company" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: false });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: false });
      Object.defineProperty(img, 'complete', { value: true, writable: false });
      
      initLogoPlaceholders();
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).not.toBeNull();
        expect(placeholder.textContent).toBe('COMPANY');
        done();
      }, 10);
    });

    test('should use default text when alt attribute is empty', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      initLogoPlaceholders();
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).not.toBeNull();
        expect(placeholder.textContent).toBe('NET OBSERVATION');
        done();
      }, 10);
    });

    test('should handle missing alt attribute gracefully', (done) => {
      document.body.innerHTML = '<img src="missing.png" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      initLogoPlaceholders();
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder).not.toBeNull();
        expect(placeholder.textContent).toBe('NET OBSERVATION');
        done();
      }, 10);
    });
  });

  describe('Multiple Images', () => {
    test('should handle multiple logo images independently', (done) => {
      document.body.innerHTML = `
        <img src="logo1.png" alt="Logo One" data-logo id="img1" />
        <img src="logo2.png" alt="Logo Two" data-logo id="img2" />
      `;
      
      const img1 = document.getElementById('img1');
      const img2 = document.getElementById('img2');
      
      // img1 succeeds
      Object.defineProperty(img1, 'naturalWidth', { value: 512, writable: false });
      Object.defineProperty(img1, 'naturalHeight', { value: 512, writable: false });
      Object.defineProperty(img1, 'complete', { value: true, writable: false });
      
      initLogoPlaceholders();
      
      // img2 fails
      img2.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        expect(img1.style.display).not.toBe('none');
        expect(img1.dataset.fallback).toBeUndefined();
        
        expect(img2.style.display).toBe('none');
        expect(img2.dataset.fallback).toBe('true');
        
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        expect(placeholders[0].textContent).toBe('LOGO TWO');
        done();
      }, 10);
    });

    test('should create fallbacks for all failed images', (done) => {
      document.body.innerHTML = `
        <header><img src="header-logo.png" alt="Header" data-logo /></header>
        <aside><img src="sidebar-logo.png" alt="Sidebar" data-logo /></aside>
      `;
      
      initLogoPlaceholders();
      
      const imgs = document.querySelectorAll('img[data-logo]');
      imgs.forEach(img => img.dispatchEvent(new Event('error')));
      
      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(2);
        
        const texts = Array.from(placeholders).map(p => p.textContent);
        expect(texts).toContain('HEADER');
        expect(texts).toContain('SIDEBAR');
        done();
      }, 10);
    });
  });

  describe('Edge Cases', () => {
    test('should not create duplicate fallbacks', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Test" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      initLogoPlaceholders();
      
      // Trigger error multiple times
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        done();
      }, 10);
    });

    test('should handle images without data-logo attribute', () => {
      document.body.innerHTML = '<img src="regular.png" alt="Regular Image" />';
      
      initLogoPlaceholders();
      
      const img = document.querySelector('img');
      img.dispatchEvent(new Event('error'));
      
      expect(document.querySelector('.logo-placeholder')).toBeNull();
    });

    test('should work when called multiple times', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Logo" data-logo />';
      
      initLogoPlaceholders();
      initLogoPlaceholders(); // Call again
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
        done();
      }, 10);
    });

    test('should handle image load event after complete', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'complete', { value: false, writable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });
      
      initLogoPlaceholders();
      
      // Simulate delayed load
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: false });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: false });
      img.dispatchEvent(new Event('load'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        expect(document.querySelector('.logo-placeholder')).not.toBeNull();
        done();
      }, 10);
    });
  });

  describe('Placeholder Properties', () => {
    test('should set correct CSS class on placeholder', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Brand" data-logo />';
      
      initLogoPlaceholders();
      document.querySelector('img[data-logo]').dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder.className).toBe('logo-placeholder');
        done();
      }, 10);
    });

    test('should insert placeholder immediately after image', (done) => {
      document.body.innerHTML = `
        <div>
          <img src="missing.png" alt="Logo" data-logo />
          <p>Following content</p>
        </div>
      `;
      
      initLogoPlaceholders();
      document.querySelector('img[data-logo]').dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const img = document.querySelector('img[data-logo]');
        const placeholder = img.nextElementSibling;
        expect(placeholder.className).toBe('logo-placeholder');
        expect(placeholder.nextElementSibling.tagName).toBe('P');
        done();
      }, 10);
    });

    test('should preserve image alt text in uppercase', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="My Company Logo" data-logo />';
      
      initLogoPlaceholders();
      document.querySelector('img[data-logo]').dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder.textContent).toBe('MY COMPANY LOGO');
        done();
      }, 10);
    });
  });

  describe('Accessibility', () => {
    test('should set aria-hidden on placeholder', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Logo" data-logo />';
      
      initLogoPlaceholders();
      document.querySelector('img[data-logo]').dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = document.querySelector('.logo-placeholder');
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 10);
    });

    test('should hide original image from screen readers when failed', (done) => {
      document.body.innerHTML = '<img src="missing.png" alt="Logo" data-logo />';
      
      initLogoPlaceholders();
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        expect(img.style.display).toBe('none');
        done();
      }, 10);
    });
  });
});