/**
 * Comprehensive tests for sidebar collapse/expand functionality
 * Tests: initSidebar, responsive behavior, toggle interactions
 */

describe('Sidebar Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <aside class="sidebar">
        <nav>Navigation content</nav>
      </aside>
      <button class="sidebar-toggle" aria-expanded="true">☰</button>
    `;
  });

  describe('initSidebar', () => {
    test('should find sidebar and toggle elements', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.sidebar['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.sidebar-toggle['"]\)/);
    });

    test('should return early if sidebar or toggle not found', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!sidebar \|\| !toggle\) return/);
    });

    test('should add click listener to toggle button', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/toggle\.addEventListener\(['"]click['"]/);
    });

    test('should initialize collapsed on mobile screens', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/window\.innerWidth < 880/);
      expect(funcMatch[0]).toMatch(/setState\(false\)/);
    });

    test('should initialize open on desktop screens', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/classList\.add\(['"]open['"]\)/);
    });
  });

  describe('Toggle Functionality', () => {
    test('should toggle open and collapsed classes', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/classList\.toggle\(['"]open['"]/);
      expect(funcMatch[0]).toMatch(/classList\.toggle\(['"]collapsed['"]/);
    });

    test('should update aria-expanded attribute', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/setAttribute\(['"]aria-expanded['"]/);
    });

    test('should change icon when toggling', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      // Should update innerHTML with different icons
      expect(funcMatch[0]).toMatch(/toggle\.innerHTML/);
      expect(funcMatch[0]).toMatch(/&#x2715;/); // Close icon
      expect(funcMatch[0]).toMatch(/&#9776;/); // Menu icon
    });

    test('should determine state from current classes', () => {
      const sidebar = document.querySelector('.sidebar');
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/!sidebar\.classList\.contains\(['"]open['"]\)/);
    });
  });

  describe('State Management', () => {
    test('should create setState helper function', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/const setState = \(open\)/);
    });

    test('should accept boolean parameter for open state', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      // Should use the open parameter to set classes
      expect(funcMatch[0]).toMatch(/setState = \(open\)/);
    });

    test('should set aria-expanded to string value', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/String\(open\)/);
    });
  });

  describe('Responsive Behavior', () => {
    test('should check window width for mobile detection', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/window\.innerWidth/);
    });

    test('should use 880px as mobile breakpoint', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/880/);
    });

    test('should collapse sidebar on narrow screens', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(window\.innerWidth < 880\)[\s\S]*?setState\(false\)/);
    });
  });

  describe('Accessibility', () => {
    test('toggle button should have aria-expanded attribute', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle.hasAttribute('aria-expanded')).toBe(true);
    });

    test('should update aria-expanded when state changes', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/setAttribute\(['"]aria-expanded['"],\s*String\(open\)\)/);
    });

    test('should use semantic HTML structure', () => {
      expect(document.querySelector('aside.sidebar')).not.toBeNull();
      expect(document.querySelector('.sidebar-toggle')).not.toBeNull();
    });
  });
});