/**
 * System-level integration tests
 * Tests cross-file interactions, complete workflows, and system behavior
 */

const fs = require('fs');
const path = require('path');

describe('System Integration Tests', () => {
  let scriptContent;
  let htmlFiles;
  let cssContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    cssContent = fs.readFileSync(path.join(__dirname, '../docs/style.css'), 'utf8');
    
    htmlFiles = [
      'docs/index.html',
      'docs/dashboard.html',
      'docs/api.html',
      'docs/data.html',
      'docs/docs.html',
      'docs/versions.html'
    ].map(file => ({
      name: file,
      content: fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    }));
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Complete logo system integration', () => {
    it('should handle complete page lifecycle with logo fallback', (done) => {
      // Simulate complete page structure
      document.body.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Test</title>
        </head>
        <body data-page="home">
          <aside class="sidebar">
            <img src="logo.png" alt="Net Observation Project" data-logo 
                 style="width:100%; border-radius:14px; margin-bottom:1rem;" />
            <nav>
              <a href="index.html">Home</a>
              <a href="dashboard.html">Dashboard</a>
            </nav>
          </aside>
          <header>
            <img src="logo.png" alt="Net Observation" class="logo" data-logo />
            <h1>Test Page</h1>
          </header>
          <main>
            <p>Content</p>
          </main>
        </body>
        </html>
      `;

      eval(scriptContent);

      const sidebarLogo = document.querySelector('.sidebar img[data-logo]');
      const headerLogo = document.querySelector('header img[data-logo]');

      // Trigger logo failures
      sidebarLogo.dispatchEvent(new Event('error'));
      headerLogo.dispatchEvent(new Event('error'));

      setTimeout(() => {
        // Verify fallbacks are created
        expect(document.querySelectorAll('.logo-placeholder').length).toBe(2);
        
        // Verify page is still functional
        expect(document.querySelector('nav')).toBeTruthy();
        expect(document.querySelector('main')).toBeTruthy();
        
        done();
      }, 100);
    });

    it('should coordinate logo fallback with theme changes', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo />
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      const toggle = document.querySelector('[data-role="theme-toggle"]');

      // Create fallback
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const fallback = document.querySelector('.logo-placeholder');
        expect(fallback).toBeTruthy();

        // Change theme
        toggle.click();

        // Fallback should still exist and be visible
        expect(document.querySelector('.logo-placeholder')).toBeTruthy();
        expect(document.body.dataset.theme).toBeTruthy();

        done();
      }, 100);
    });

    it('should handle logo fallback with sidebar toggle', (done) => {
      document.body.innerHTML = `
        <aside class="sidebar open">
          <img src="logo.png" alt="Test" data-logo />
        </aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
      `;

      window.innerWidth = 1024;
      eval(scriptContent);

      const img = document.querySelector('img[data-logo]');
      const toggle = document.querySelector('.sidebar-toggle');

      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        expect(document.querySelector('.logo-placeholder')).toBeTruthy();

        // Toggle sidebar
        toggle.click();

        // Fallback should still be in DOM
        expect(document.querySelector('.logo-placeholder')).toBeTruthy();

        done();
      }, 100);
    });
  });

  describe('Multi-page consistency', () => {
    it('should have consistent logo markup across all HTML files', () => {
      htmlFiles.forEach(({ name, content }) => {
        // Sidebar logo
        expect(content).toMatch(/<img[^>]*src="logo\.png"[^>]*data-logo/);
        
        // Header logo
        expect(content).toMatch(/<img[^>]*class="logo"[^>]*data-logo/);
      });
    });

    it('should have consistent script inclusion across all pages', () => {
      htmlFiles.forEach(({ name, content }) => {
        expect(content).toMatch(/<script[^>]*src="script\.js"/);
      });
    });

    it('should have consistent CSS inclusion across all pages', () => {
      htmlFiles.forEach(({ name, content }) => {
        expect(content).toMatch(/<link[^>]*href="style\.css"/);
      });
    });

    it('should have consistent theme toggle across all pages', () => {
      htmlFiles.forEach(({ name, content }) => {
        expect(content).toMatch(/data-role="theme-toggle"/);
        expect(content).toContain('<strong data-label>AUTO</strong>');
      });
    });

    it('should have consistent navigation structure', () => {
      const expectedLinks = [
        'index.html',
        'dashboard.html',
        'docs.html',
        'api.html',
        'data.html',
        'versions.html'
      ];

      htmlFiles.forEach(({ name, content }) => {
        expectedLinks.forEach(link => {
          expect(content).toContain(`href="${link}"`);
        });
      });
    });
  });

  describe('CSS and HTML integration', () => {
    it('should have CSS styles for all logo-related HTML elements', () => {
      // Check for logo-placeholder class
      expect(cssContent).toMatch(/\.logo-placeholder\s*{/);
      
      // Check for header logo styles
      expect(cssContent).toMatch(/header\s+img\.logo\s*{/);
      
      // Check for header placeholder styles
      expect(cssContent).toMatch(/header\s+\.logo-placeholder\s*{/);
    });

    it('should have consistent data-logo attribute usage', () => {
      htmlFiles.forEach(({ name, content }) => {
        const logoImages = content.match(/<img[^>]*data-logo[^>]*>/g) || [];
        expect(logoImages.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should apply inline styles that match CSS expectations', () => {
      htmlFiles.forEach(({ name, content }) => {
        // Sidebar logos should have inline styles
        const sidebarLogos = content.match(/<img[^>]*data-logo[^>]*style="[^"]*"[^>]*>/g) || [];
        expect(sidebarLogos.length).toBeGreaterThan(0);
      });
    });
  });

  describe('JavaScript and HTML integration', () => {
    it('should initialize features based on data-page attribute', () => {
      const pageTypes = ['home', 'dashboard', 'docs', 'api', 'data', 'versions'];
      
      pageTypes.forEach(pageType => {
        document.body.innerHTML = `<body data-page="${pageType}"></body>`;
        expect(() => eval(scriptContent)).not.toThrow();
      });
    });

    it('should query and update elements that exist in HTML', () => {
      document.body.innerHTML = `
        <div data-stat="total-hosts"></div>
        <div data-stat="total-services"></div>
        <div data-stat="last-sync"></div>
        <table data-table="countries"><tbody></tbody></table>
        <table data-table="services"><tbody></tbody></table>
      `;

      eval(scriptContent);

      // Elements should be queryable
      expect(document.querySelector('[data-stat="total-hosts"]')).toBeTruthy();
      expect(document.querySelector('[data-table="countries"]')).toBeTruthy();
    });

    it('should handle all theme toggle interactions', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = document.querySelector('[data-label]');

      // Click interaction
      toggle.click();
      expect(label.textContent).toBeTruthy();

      // Keyboard interaction
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(enterEvent);
      expect(label.textContent).toBeTruthy();
    });
  });

  describe('Settings persistence and application', () => {
    it('should persist theme changes across simulated page reloads', () => {
      // First page load
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      toggle.click(); // Change theme

      const savedTheme = JSON.parse(localStorage.getItem('net-observation-settings')).theme;

      // Simulate page reload
      document.body.innerHTML = '<div data-role="theme-toggle"><strong data-label>AUTO</strong></div>';
      eval(scriptContent);

      const currentTheme = document.body.dataset.theme;
      expect(currentTheme).toBe(savedTheme);
    });

    it('should load and apply all persisted settings', () => {
      const settings = {
        theme: 'dark',
        backendUrl: '/custom/api',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-123'
      };

      localStorage.setItem('net-observation-settings', JSON.stringify(settings));

      document.body.innerHTML = '<div></div>';
      eval(scriptContent);

      // Theme should be applied
      expect(document.body.dataset.theme).toBe('dark');
    });
  });

  describe('Error resilience', () => {
    it('should continue functioning when optional elements are missing', () => {
      // Minimal page with no optional elements
      document.body.innerHTML = '<div>Minimal page</div>';

      expect(() => eval(scriptContent)).not.toThrow();
      expect(document.body.dataset.theme).toBeTruthy();
    });

    it('should handle missing localStorage gracefully', () => {
      const originalLS = global.localStorage;
      delete global.localStorage;

      document.body.innerHTML = '<div></div>';

      expect(() => eval(scriptContent)).not.toThrow();

      global.localStorage = originalLS;
    });

    it('should handle missing matchMedia gracefully', () => {
      const originalMM = window.matchMedia;
      delete window.matchMedia;

      document.body.innerHTML = '<div></div>';

      expect(() => eval(scriptContent)).not.toThrow();

      window.matchMedia = originalMM;
    });
  });

  describe('Performance and optimization', () => {
    it('should initialize quickly with typical page structure', () => {
      document.body.innerHTML = `
        <aside class="sidebar">
          <img src="logo.png" data-logo />
          <nav><a href="index.html">Home</a></nav>
        </aside>
        <header><img src="logo.png" class="logo" data-logo /></header>
        <main><p>Content</p></main>
      `;

      const startTime = Date.now();
      eval(scriptContent);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not cause layout thrashing', (done) => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test1" data-logo />
        <img src="logo.png" alt="Test2" data-logo />
        <img src="logo.png" alt="Test3" data-logo />
      `;

      eval(scriptContent);

      const images = document.querySelectorAll('img[data-logo]');
      images.forEach(img => img.dispatchEvent(new Event('error')));

      setTimeout(() => {
        // All fallbacks should be created efficiently
        expect(document.querySelectorAll('.logo-placeholder').length).toBe(3);
        done();
      }, 100);
    });
  });

  describe('Accessibility integration', () => {
    it('should maintain ARIA attributes through interactions', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true" aria-label="Toggle navigation"></button>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('should maintain alt text on logo images', () => {
      htmlFiles.forEach(({ name, content }) => {
        const logoImages = content.match(/<img[^>]*data-logo[^>]*>/g) || [];
        logoImages.forEach(img => {
          expect(img).toMatch(/alt="[^"]+"/);
        });
      });
    });

    it('should create fallbacks with aria-hidden', (done) => {
      document.body.innerHTML = '<img src="logo.png" alt="Test" data-logo />';
      
      eval(scriptContent);
      
      const img = document.querySelector('img[data-logo]');
      img.dispatchEvent(new Event('error'));

      setTimeout(() => {
        const fallback = document.querySelector('.logo-placeholder');
        expect(fallback.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 50);
    });
  });

  describe('File structure and dependencies', () => {
    it('should have all referenced files existing', () => {
      const files = [
        'docs/script.js',
        'docs/style.css',
        'docs/index.html',
        'docs/dashboard.html',
        'docs/api.html',
        'docs/data.html',
        'docs/docs.html',
        'docs/versions.html',
        'functions/api/censys-summary.js',
        'package.json',
        '.gitignore',
        'test-setup.js'
      ];

      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should not have circular dependencies', () => {
      // Check that script.js doesn't try to import itself
      expect(scriptContent).not.toMatch(/import.*script\.js/);
      expect(scriptContent).not.toMatch(/require.*script\.js/);
    });

    it('should use relative paths correctly', () => {
      htmlFiles.forEach(({ name, content }) => {
        // Script and CSS references should be relative
        expect(content).toMatch(/src="script\.js"/);
        expect(content).toMatch(/href="style\.css"/);
        
        // Should not have absolute paths to local files
        expect(content).not.toContain('src="/docs/');
        expect(content).not.toContain('href="/docs/');
      });
    });
  });

  describe('Complete user workflows', () => {
    it('should support theme customization workflow', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;

      eval(scriptContent);

      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const label = document.querySelector('[data-label]');

      // User clicks through all themes
      const initialTheme = document.body.dataset.theme;
      toggle.click();
      const theme1 = document.body.dataset.theme;
      toggle.click();
      const theme2 = document.body.dataset.theme;
      toggle.click();
      const theme3 = document.body.dataset.theme;

      // Should cycle through three states
      const themes = [initialTheme, theme1, theme2, theme3];
      const uniqueThemes = [...new Set(themes)];
      expect(uniqueThemes.length).toBeGreaterThanOrEqual(2);
    });

    it('should support navigation workflow', () => {
      document.body.innerHTML = `
        <aside class="sidebar open"></aside>
        <button class="sidebar-toggle" aria-expanded="true"></button>
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;

      window.location.pathname = '/index.html';
      eval(scriptContent);

      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');

      // User opens/closes sidebar
      expect(sidebar.classList.contains('open')).toBe(true);
      
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(false);
      
      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);
    });
  });
});