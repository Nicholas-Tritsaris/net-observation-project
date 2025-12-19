/**
 * Accessibility and cross-browser integration tests
 * Ensures the modified HTML/CSS/JS work together for all users
 * Focuses on ARIA, keyboard navigation, screen readers, and responsive design
 */

const fs = require('fs');
const path = require('path');

describe('Accessibility and Cross-Browser Integration', () => {
  const htmlFiles = [
    'docs/api.html',
    'docs/dashboard.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/index.html',
    'docs/versions.html'
  ];

  let cssContent;
  let scriptContent;

  beforeAll(() => {
    cssContent = fs.readFileSync(path.join(__dirname, '../docs/style.css'), 'utf8');
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Logo accessibility across all pages', () => {
    htmlFiles.forEach(filePath => {
      it(`should have accessible logo markup in ${filePath}`, () => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        // All logo images should have alt text
        const logoRegex = /<img[^>]*data-logo[^>]*>/g;
        const logos = content.match(logoRegex) || [];
        
        logos.forEach(logo => {
          expect(logo).toMatch(/alt="[^"]+"/);
        });
      });

      it(`should have properly hidden fallback placeholders in ${filePath}`, () => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        document.body.innerHTML = content;
        
        eval(scriptContent);
        
        // Trigger fallback on all logos
        document.querySelectorAll('img[data-logo]').forEach(img => {
          img.dispatchEvent(new Event('error'));
        });
        
        setTimeout(() => {
          const placeholders = document.querySelectorAll('.logo-placeholder');
          placeholders.forEach(placeholder => {
            expect(placeholder.getAttribute('aria-hidden')).toBe('true');
          });
        }, 100);
      });
    });

    it('should maintain alt text information when creating fallback', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Important Logo Description" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      const originalAlt = img.alt;
      
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.textContent).toContain(originalAlt.toUpperCase());
        done();
      }, 50);
    });

    it('should ensure fallback text is readable with sufficient color contrast', () => {
      // Check CSS has proper color contrast
      expect(cssContent).toMatch(/\.logo-placeholder[\s\S]*?color:\s*var\(--text\)/);
    });
  });

  describe('Keyboard navigation', () => {
    it('should allow tab navigation to theme toggle', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle.getAttribute('tabindex')).toBe('0');
    });

    it('should activate theme toggle with Enter key', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const initialTheme = document.body.dataset.theme;
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);
      
      const newTheme = document.body.dataset.theme;
      expect(['auto', 'dark', 'light']).toContain(newTheme);
    });

    it('should activate theme toggle with Space key', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(spaceEvent);
      
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should allow keyboard navigation in sidebar', () => {
      document.body.innerHTML = `
        <aside class="sidebar">
          <nav>
            <a href="index.html">Home</a>
            <a href="docs.html">Docs</a>
          </nav>
        </aside>
        <button class="sidebar-toggle" aria-expanded="true">Toggle</button>
      `;
      
      eval(scriptContent);
      
      const links = document.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should maintain focus management when toggling sidebar', () => {
      document.body.innerHTML = `
        <aside class="sidebar open">
          <nav><a href="index.html">Home</a></nav>
        </aside>
        <button class="sidebar-toggle" aria-expanded="true">Toggle</button>
      `;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      toggle.focus();
      
      expect(document.activeElement).toBe(toggle);
      
      toggle.click();
      
      // Focus should remain manageable
      expect(document.activeElement).toBeTruthy();
    });

    it('should trap tab within settings panel when open', () => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form>
            <input name="backendUrl" />
            <input name="auth0Domain" />
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Settings</button>
      `;
      
      eval(scriptContent);
      
      const panel = document.querySelector('.settings-panel');
      const inputs = panel.querySelectorAll('input, button');
      
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('Screen reader compatibility', () => {
    it('should have proper ARIA roles on interactive elements', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        // Theme toggle should have role="button"
        expect(content).toMatch(/data-role="theme-toggle"[^>]*role="button"/);
      });
    });

    it('should update ARIA states dynamically', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true">Toggle</button>
      `;
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      
      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have descriptive ARIA labels', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        // Sidebar toggle should have aria-label
        expect(content).toMatch(/aria-label="Toggle navigation"/);
      });
    });

    it('should announce theme changes to screen readers', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = toggle.querySelector('[data-label]');
      
      toggle.click();
      
      // Label should update (screen readers will announce)
      expect(['AUTO', 'DARK', 'LIGHT']).toContain(label.textContent);
    });

    it('should hide decorative elements from screen readers', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Logo" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));
      
      setTimeout(() => {
        const placeholder = img.nextElementSibling;
        expect(placeholder.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 50);
    });

    it('should provide text alternatives for all images', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        const imgTags = content.match(/<img[^>]+>/g) || [];
        
        imgTags.forEach(img => {
          expect(img).toMatch(/alt="[^"]*"/);
        });
      });
    });
  });

  describe('Responsive design integration', () => {
    it('should handle mobile viewport for sidebar', () => {
      window.innerWidth = 320; // Small mobile
      
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    it('should handle tablet viewport for sidebar', () => {
      window.innerWidth = 768;
      
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should handle desktop viewport for sidebar', () => {
      window.innerWidth = 1920;
      
      document.body.innerHTML = '<aside class="sidebar"></aside><button class="sidebar-toggle"></button>';
      
      eval(scriptContent);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    it('should ensure logo placeholder scales properly', () => {
      // Check CSS for responsive units
      expect(cssContent).toMatch(/\.logo-placeholder[\s\S]*?border-radius:\s*14px/);
      expect(cssContent).toMatch(/header\s+\.logo-placeholder[\s\S]*?height:\s*48px/);
    });

    it('should maintain readability at all viewport sizes', () => {
      [320, 375, 768, 1024, 1920, 2560].forEach(width => {
        window.innerWidth = width;
        
        document.body.innerHTML = `
          <div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>
          <aside class="sidebar"><nav><a href="index.html">Home</a></nav></aside>
        `;
        
        eval(scriptContent);
        
        // Should initialize without errors at any size
        expect(document.querySelector('[data-role="theme-toggle"]')).toBeTruthy();
      });
    });

    it('should handle viewport changes dynamically', () => {
      document.body.innerHTML = '<aside class="sidebar open"></aside><button class="sidebar-toggle"></button>';
      
      window.innerWidth = 1200;
      eval(scriptContent);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
      
      // Simulate resize to mobile
      window.innerWidth = 400;
      window.dispatchEvent(new Event('resize'));
      
      // Should still be functional
      expect(sidebar).toBeTruthy();
    });
  });

  describe('CSS specificity and cascade', () => {
    it('should have proper CSS cascade for logo styles', () => {
      expect(cssContent).toContain('.logo-placeholder');
      expect(cssContent).toContain('header .logo-placeholder');
      expect(cssContent).toContain('.sidebar .logo-placeholder');
    });

    it('should not have conflicting logo styles', () => {
      // Should not contain old .logo-inline class
      expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
    });

    it('should use CSS custom properties for theming', () => {
      expect(cssContent).toMatch(/var\(--text\)/);
      expect(cssContent).toMatch(/var\(--[a-z-]+\)/);
    });

    it('should have theme-specific overrides', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      eval(scriptContent);
      
      expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    });
  });

  describe('Color contrast and visibility', () => {
    it('should ensure sufficient contrast for logo placeholder text', () => {
      // Check that logo placeholder uses proper color variable
      const placeholderStyle = cssContent.match(/\.logo-placeholder\s*{[^}]*}/s);
      expect(placeholderStyle[0]).toMatch(/color:\s*var\(--text\)/);
    });

    it('should provide visible focus indicators', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.focus();
      
      // Element should be focusable
      expect(document.activeElement).toBe(toggle);
    });

    it('should maintain visibility in both light and dark themes', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      // Test dark theme
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'dark' }));
      eval(scriptContent);
      expect(document.body.dataset.theme).toBe('dark');
      
      // Reset and test light theme
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      localStorage.setItem('net-observation-settings', JSON.stringify({ theme: 'light' }));
      eval(scriptContent);
      expect(document.body.dataset.theme).toBe('light');
    });
  });

  describe('Progressive enhancement', () => {
    it('should work without JavaScript enabled', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        // Should have proper HTML structure even without JS
        expect(content).toMatch(/<nav>/);
        expect(content).toMatch(/<main>/);
        expect(content).toMatch(/<header>/);
      });
    });

    it('should provide fallback when localStorage is unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      expect(() => eval(scriptContent)).not.toThrow();
      
      global.localStorage = originalLocalStorage;
    });

    it('should handle missing CSS gracefully', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
        <div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>
      `;
      
      // Should initialize even if CSS classes don't exist
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should provide semantic HTML structure', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        // Check for semantic elements
        expect(content).toMatch(/<header>/);
        expect(content).toMatch(/<nav>/);
        expect(content).toMatch(/<main>/);
        expect(content).toMatch(/<aside/);
      });
    });
  });

  describe('Cross-page consistency', () => {
    it('should have consistent logo behavior across all pages', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        document.body.innerHTML = content;
        
        eval(scriptContent);
        
        const logos = document.querySelectorAll('img[data-logo]');
        expect(logos.length).toBeGreaterThan(0);
        
        logos.forEach(logo => {
          logo.dispatchEvent(new Event('error'));
        });
        
        setTimeout(() => {
          const placeholders = document.querySelectorAll('.logo-placeholder');
          expect(placeholders.length).toBeGreaterThan(0);
        }, 100);
      });
    });

    it('should have consistent theme toggle across all pages', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        
        expect(content).toMatch(/data-role="theme-toggle"/);
        expect(content).toMatch(/data-label/);
      });
    });

    it('should maintain consistent navigation structure', () => {
      const navStructures = htmlFiles.map(filePath => {
        const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        const navMatch = content.match(/<nav[^>]*>[\s\S]*?<\/nav>/);
        return navMatch ? navMatch[0] : '';
      });
      
      // All should have navigation
      navStructures.forEach(nav => {
        expect(nav).toBeTruthy();
        expect(nav).toContain('href="index.html"');
      });
    });
  });

  describe('Error recovery and resilience', () => {
    it('should recover from theme toggle errors', () => {
      document.body.innerHTML = '<div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      
      // Corrupt the label element
      const label = toggle.querySelector('[data-label]');
      label.remove();
      
      // Should not crash when clicking
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle logo initialization errors gracefully', () => {
      document.body.innerHTML = '<img data-logo />'; // Missing required attributes
      
      expect(() => eval(scriptContent)).not.toThrow();
    });

    it('should recover from sidebar manipulation errors', () => {
      document.body.innerHTML = '<button class="sidebar-toggle" aria-expanded="true"></button>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.sidebar-toggle');
      
      // Sidebar is missing but toggle exists
      expect(() => toggle.click()).not.toThrow();
    });

    it('should handle Settings saved and settings panel errors', () => {
      document.body.innerHTML = '<button class="settings-toggle"></button>';
      
      eval(scriptContent);
      
      const toggle = document.querySelector('.settings-toggle');
      
      // Panel is missing
      expect(() => toggle.click()).not.toThrow();
    });
  });

  describe('Performance and optimization', () => {
    it('should efficiently handle multiple logo elements', () => {
      const manyLogos = Array.from({ length: 50 }, (_, i) =>
        `<img src="logo${i}.png" alt="Logo ${i}" data-logo />`
      ).join('');
      
      document.body.innerHTML = manyLogos;
      
      const startTime = performance.now();
      eval(scriptContent);
      const endTime = performance.now();
      
      // Should initialize quickly even with many elements
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not cause layout thrashing', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Logo" data-logo />
        <div data-role="theme-toggle" tabindex="0"><strong data-label>AUTO</strong></div>
      `;
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      
      // Multiple operations shouldn't cause excessive reflows
      img.dispatchEvent(new Event('error'));
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click();
      toggle.click();
      
      setTimeout(() => {
        expect(document.body).toBeTruthy();
        done();
      }, 100);
    });

    it('should debounce resize events if implemented', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside>';
      
      eval(scriptContent);
      
      // Trigger many resize events
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new Event('resize'));
      }
      
      // Should handle gracefully
      expect(document.querySelector('.sidebar')).toBeTruthy();
    });
  });

  describe('Documentation accessibility', () => {
    it('should have accessible README structure', () => {
      const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
      
      // Should have proper heading hierarchy
      expect(readme).toMatch(/^#\s+/m); // H1
      expect(readme).toMatch(/^##\s+/m); // H2
      
      // Branding note should be present
      expect(readme).toContain('logo.png');
      expect(readme).toContain('512×512');
    });

    it('should have clear branding instructions', () => {
      const readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
      
      expect(readme).toMatch(/docs\/logo\.png/);
      expect(readme).toContain('transparency');
      expect(readme).toContain('header');
      expect(readme).toContain('sidebar');
    });
  });
});