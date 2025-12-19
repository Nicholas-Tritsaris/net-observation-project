/**
 * Unit tests for navigation and helper functions
 * Tests markActiveNav, initDocsSidebar, initVersionList, qs
 */

const fs = require('fs');

describe('Navigation Helpers', () => {
  describe('markActiveNav', () => {
    let markActiveNav;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function markActiveNav\(\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`markActiveNav = ${funcMatch[0].replace('function markActiveNav()', 'function()')}`);
      }
    });

    test('should mark current page link as active', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="api.html">API</a>
        </nav>
      `;
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard.html' },
        writable: true
      });
      
      markActiveNav();
      
      const dashboardLink = document.querySelector('a[href="dashboard.html"]');
      expect(dashboardLink.classList.contains('active')).toBe(true);
    });

    test('should mark index.html as active for root path', () => {
      document.body.innerHTML = `
        <nav>
          <a href="/">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true
      });
      
      markActiveNav();
      
      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink.classList.contains('active')).toBe(true);
    });

    test('should handle nested paths', () => {
      document.body.innerHTML = `
        <nav>
          <a href="api.html">API</a>
          <a href="data.html">Data</a>
        </nav>
      `;
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/subfolder/api.html' },
        writable: true
      });
      
      markActiveNav();
      
      const apiLink = document.querySelector('a[href="api.html"]');
      expect(apiLink.classList.contains('active')).toBe(true);
    });

    test('should not mark multiple links as active', () => {
      document.body.innerHTML = `
        <nav>
          <a href="index.html">Home</a>
          <a href="dashboard.html">Dashboard</a>
        </nav>
      `;
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard.html' },
        writable: true
      });
      
      markActiveNav();
      
      const activeLinks = document.querySelectorAll('nav a.active');
      expect(activeLinks.length).toBe(1);
    });
  });

  describe('initDocsSidebar', () => {
    let initDocsSidebar;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`initDocsSidebar = ${funcMatch[0].replace('function initDocsSidebar()', 'function()')}`);
      }
    });

    test('should enable smooth scrolling for anchor links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
        </div>
        <div id="section1">Content</div>
      `;
      
      initDocsSidebar();
      
      const link = document.querySelector('.docs-sidebar a');
      const scrollSpy = jest.fn();
      document.querySelector('#section1').scrollIntoView = scrollSpy;
      
      link.click();
      
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    test('should prevent default navigation for hash links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#test">Test</a>
        </div>
        <div id="test">Content</div>
      `;
      
      initDocsSidebar();
      
      const link = document.querySelector('.docs-sidebar a');
      const event = new MouseEvent('click', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      link.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should handle missing target elements', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#nonexistent">Missing</a>
        </div>
      `;
      
      initDocsSidebar();
      
      const link = document.querySelector('.docs-sidebar a');
      expect(() => link.click()).not.toThrow();
    });

    test('should not affect external links', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="https://example.com">External</a>
        </div>
      `;
      
      initDocsSidebar();
      
      const link = document.querySelector('.docs-sidebar a');
      const event = new MouseEvent('click', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      link.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('initVersionList', () => {
    let initVersionList;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initVersionList\(\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`initVersionList = ${funcMatch[0].replace('function initVersionList()', 'function()')}`);
      }
    });

    test('should populate version cards', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      
      initVersionList();
      
      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('v2.3');
      expect(container.innerHTML).toContain('v2.2');
      expect(container.innerHTML).toContain('v2.1');
      expect(container.innerHTML).toContain('v1.x');
    });

    test('should include version status badges', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      
      initVersionList();
      
      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('CURRENT');
      expect(container.innerHTML).toContain('LTS');
      expect(container.innerHTML).toContain('LEGACY');
      expect(container.innerHTML).toContain('ARCHIVED');
    });

    test('should include version notes', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      
      initVersionList();
      
      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toContain('Stable release');
      expect(container.innerHTML).toContain('Long-term support');
    });

    test('should create card elements', () => {
      document.body.innerHTML = '<div data-version-list></div>';
      
      initVersionList();
      
      const cards = document.querySelectorAll('.card');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('should handle missing container', () => {
      document.body.innerHTML = '';
      expect(() => initVersionList()).not.toThrow();
    });
  });

  describe('qs (querySelector helper)', () => {
    let qs;

    beforeEach(() => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function qs\(id\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`qs = ${funcMatch[0].replace('function qs(id)', 'function(id)')}`);
      }
    });

    test('should select element by ID selector', () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      
      const el = qs('#test');
      
      expect(el).not.toBeNull();
      expect(el.textContent).toBe('Content');
    });

    test('should select element by class selector', () => {
      document.body.innerHTML = '<div class="test">Content</div>';
      
      const el = qs('.test');
      
      expect(el).not.toBeNull();
      expect(el.textContent).toBe('Content');
    });

    test('should select element by attribute selector', () => {
      document.body.innerHTML = '<div data-test="value">Content</div>';
      
      const el = qs('[data-test="value"]');
      
      expect(el).not.toBeNull();
    });

    test('should return null for non-existent element', () => {
      document.body.innerHTML = '';
      
      const el = qs('#nonexistent');
      
      expect(el).toBeNull();
    });

    test('should return first matching element', () => {
      document.body.innerHTML = `
        <div class="item">First</div>
        <div class="item">Second</div>
      `;
      
      const el = qs('.item');
      
      expect(el.textContent).toBe('First');
    });
  });
});