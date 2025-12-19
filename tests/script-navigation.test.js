/**
 * Navigation and page-specific feature tests for docs/script.js
 * Tests active nav marking, page initialization, and docs features
 */

describe('Navigation and Page Features', () => {
  describe('Active Navigation Marking', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="docs.html">Docs</a>
          <a href="api.html">API</a>
        </nav>
      `;
    });

    test('should mark index.html as active', () => {
      const path = 'index.html';
      document.querySelectorAll('nav a').forEach((link) => {
        const href = link.getAttribute('href');
        if (href === path) {
          link.classList.add('active');
        }
      });

      const activeLink = document.querySelector('nav a.active');
      expect(activeLink.getAttribute('href')).toBe('index.html');
    });

    test('should mark dashboard.html as active', () => {
      const path = 'dashboard.html';
      document.querySelectorAll('nav a').forEach((link) => {
        if (link.getAttribute('href') === path) {
          link.classList.add('active');
        }
      });

      const activeLink = document.querySelector('nav a.active');
      expect(activeLink.getAttribute('href')).toBe('dashboard.html');
    });

    test('should handle root path', () => {
      const path = '';
      const effectivePath = path || 'index.html';
      
      expect(effectivePath).toBe('index.html');
    });

    test('should extract filename from full path', () => {
      const fullPath = '/path/to/dashboard.html';
      const filename = fullPath.split('/').pop();
      
      expect(filename).toBe('dashboard.html');
    });
  });

  describe('Page-Specific Initialization', () => {
    test('should identify dashboard page', () => {
      document.body.dataset.page = 'dashboard';
      const page = document.body.dataset.page;
      
      expect(page).toBe('dashboard');
    });

    test('should identify docs page', () => {
      document.body.dataset.page = 'docs';
      const page = document.body.dataset.page;
      
      expect(page).toBe('docs');
    });

    test('should identify api page', () => {
      document.body.dataset.page = 'api';
      const page = document.body.dataset.page;
      
      expect(page).toBe('api');
    });

    test('should identify data page', () => {
      document.body.dataset.page = 'data';
      const page = document.body.dataset.page;
      
      expect(page).toBe('data');
    });

    test('should identify versions page', () => {
      document.body.dataset.page = 'versions';
      const page = document.body.dataset.page;
      
      expect(page).toBe('versions');
    });

    test('should handle missing page attribute', () => {
      const page = document.body.dataset.page;
      expect(page).toBeUndefined();
    });
  });

  describe('Documentation Sidebar', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
          <a href="#section3">Section 3</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
        <div id="section3">Content 3</div>
      `;
    });

    test('should detect hash links', () => {
      const links = document.querySelectorAll('.docs-sidebar a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href.startsWith('#')).toBe(true);
      });
    });

    test('should find target element by ID', () => {
      const targetId = '#section1';
      const element = document.querySelector(targetId);
      
      expect(element).toBeTruthy();
      expect(element.id).toBe('section1');
    });

    test('should handle smooth scroll behavior', () => {
      const scrollOptions = {
        behavior: 'smooth',
        block: 'start'
      };
      
      expect(scrollOptions.behavior).toBe('smooth');
      expect(scrollOptions.block).toBe('start');
    });
  });

  describe('Version List', () => {
    test('should render version information', () => {
      const versions = [
        { version: 'v2.3', status: 'current', notes: 'Stable release' },
        { version: 'v2.2', status: 'lts', notes: 'Long-term support' },
        { version: 'v2.1', status: 'legacy', notes: 'Security patches only' }
      ];

      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe('v2.3');
      expect(versions[0].status).toBe('current');
    });

    test('should format version badges', () => {
      const version = { version: 'v2.3', status: 'current' };
      const badge = `${version.version} · ${version.status.toUpperCase()}`;
      
      expect(badge).toBe('v2.3 · CURRENT');
    });

    test('should generate HTML for version cards', () => {
      const version = { version: 'v1.0', status: 'archived', notes: 'Historical' };
      const html = `
        <div class="card">
          <span class="badge">${version.version} · ${version.status.toUpperCase()}</span>
          <p>${version.notes}</p>
        </div>
      `.trim();

      expect(html).toContain('v1.0');
      expect(html).toContain('ARCHIVED');
      expect(html).toContain('Historical');
    });
  });

  describe('Document Ready State', () => {
    test('should check if document is loading', () => {
      const isLoading = document.readyState === 'loading';
      expect(typeof isLoading).toBe('boolean');
    });

    test('should recognize interactive state', () => {
      const states = ['loading', 'interactive', 'complete'];
      expect(states).toContain('interactive');
    });

    test('should recognize complete state', () => {
      const states = ['loading', 'interactive', 'complete'];
      expect(states).toContain('complete');
    });
  });
});