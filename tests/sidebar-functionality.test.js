/**
 * Unit tests for sidebar collapse/expand functionality
 * Tests responsive behavior, accessibility, and user interaction
 */

const fs = require('fs');

describe('Sidebar Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <aside class="sidebar">
        <div>Sidebar Content</div>
      </aside>
      <button class="sidebar-toggle">☰</button>
    `;
  });

  describe('Initialization', () => {
    test('should initialize sidebar as open on desktop widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should initialize sidebar as collapsed on mobile widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should set aria-expanded attribute', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle.hasAttribute('aria-expanded')).toBe(true);
    });
  });

  describe('Toggle Behavior', () => {
    test('should toggle sidebar from open to collapsed', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      
      expect(sidebar.classList.contains('collapsed')).toBe(true);
      expect(sidebar.classList.contains('open')).toBe(false);
    });

    test('should toggle sidebar from collapsed to open', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(sidebar.classList.contains('collapsed')).toBe(false);
    });

    test('should update aria-expanded when toggling', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      const initialAriaExpanded = toggle.getAttribute('aria-expanded');
      
      toggle.click();
      const newAriaExpanded = toggle.getAttribute('aria-expanded');
      
      expect(newAriaExpanded).not.toBe(initialAriaExpanded);
    });

    test('should update toggle icon when expanding', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      toggle.click();
      
      expect(toggle.innerHTML).toBe('✕');
    });

    test('should update toggle icon when collapsing', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      initSidebar();
      
      const toggle = document.querySelector('.sidebar-toggle');
      toggle.click();
      
      expect(toggle.innerHTML).toBe('☰');
    });
  });

  describe('Responsive Behavior', () => {
    test('should handle rapid toggling', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      for (let i = 0; i < 10; i++) {
        toggle.click();
      }
      
      expect(sidebar.classList.contains('open')).toBe(true);
      expect(sidebar.classList.contains('collapsed')).toBe(false);
    });

    test('should maintain state consistency', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      initSidebar();
      
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.click();
      
      const hasOpen = sidebar.classList.contains('open');
      const hasCollapsed = sidebar.classList.contains('collapsed');
      
      expect(hasOpen && hasCollapsed).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing sidebar element', () => {
      document.body.innerHTML = '<button class="sidebar-toggle">☰</button>';
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      expect(() => initSidebar()).not.toThrow();
    });

    test('should handle missing toggle element', () => {
      document.body.innerHTML = '<aside class="sidebar"></aside>';
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initSidebar\(\) \{[\s\S]*?\n  \}/);
      eval(funcMatch[0]);
      
      expect(() => initSidebar()).not.toThrow();
    });
  });
});