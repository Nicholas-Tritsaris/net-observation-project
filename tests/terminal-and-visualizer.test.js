/**
 * Comprehensive tests for terminal UI and data visualizer functionality
 * Tests command execution, terminal output, JSON/CSV parsing, and data rendering
 */

const fs = require('fs');

describe('Terminal and Data Visualizer', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  describe('logTerminal', () => {
    let logTerminal;

    beforeEach(() => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
        </div>
      `;

      const funcMatch = scriptContent.match(/function logTerminal\([^)]*\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should append message to terminal output', () => {
      logTerminal('Test message');

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Test message');
    });

    test('should include timestamp in output', () => {
      logTerminal('Test');

      const output = document.querySelector('.terminal-output').textContent;
      expect(output).toMatch(/\[\d{1,2}:\d{2}:\d{2}\]/);
    });

    test('should create new line for each message', () => {
      logTerminal('First message');
      logTerminal('Second message');

      const lines = document.querySelectorAll('.terminal-output div');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });

    test('should scroll terminal to bottom after adding message', () => {
      const output = document.querySelector('.terminal-output');
      output.scrollTop = 0;

      logTerminal('New message');

      expect(output.scrollTop).toBe(output.scrollHeight);
    });

    test('should handle special characters in messages', () => {
      logTerminal('Message with <script>alert("xss")</script>');

      const output = document.querySelector('.terminal-output');
      expect(output.innerHTML).toContain('&lt;script&gt;');
    });

    test('should handle empty messages', () => {
      logTerminal('');

      const output = document.querySelector('.terminal-output');
      expect(output.children.length).toBeGreaterThan(0);
    });

    test('should handle multiline messages', () => {
      logTerminal('Line 1\nLine 2\nLine 3');

      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Line 1');
      expect(output.textContent).toContain('Line 2');
    });

    test('should do nothing when terminal output not found', () => {
      document.body.innerHTML = '';
      
      expect(() => logTerminal('Test')).not.toThrow();
    });

    test('should handle rapid consecutive messages', () => {
      for (let i = 0; i < 100; i++) {
        logTerminal(`Message ${i}`);
      }

      const output = document.querySelector('.terminal-output');
      expect(output.children.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('initDataVisualizer - JSON parsing', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <textarea id="dataInput"></textarea>
        <input type="file" id="fileInput" />
        <button id="renderData">Render</button>
        <div id="dataOutput"></div>
        <div class="terminal">
          <div class="terminal-output"></div>
        </div>
      `;
    });

    test('should parse valid JSON object', () => {
      const input = document.getElementById('dataInput');
      const output = document.getElementById('dataOutput');
      
      input.value = '{"name": "Test", "value": 42}';
      
      // Extract and execute initDataVisualizer
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDataVisualizer();
        
        document.getElementById('renderData').click();
        
        expect(output.innerHTML).toContain('name');
        expect(output.innerHTML).toContain('Test');
      }
    });

    test('should parse valid JSON array', () => {
      const input = document.getElementById('dataInput');
      input.value = '[{"id": 1}, {"id": 2}]';
      
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDataVisualizer();
        
        document.getElementById('renderData').click();
        
        const output = document.getElementById('dataOutput');
        expect(output.innerHTML).toContain('id');
      }
    });

    test('should parse CSV data', () => {
      const input = document.getElementById('dataInput');
      input.value = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
      
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDataVisualizer();
        
        document.getElementById('renderData').click();
        
        const output = document.getElementById('dataOutput');
        expect(output.innerHTML).toContain('Alice');
        expect(output.innerHTML).toContain('NYC');
      }
    });

    test('should handle empty input gracefully', () => {
      const input = document.getElementById('dataInput');
      input.value = '';
      
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDataVisualizer();
        
        expect(() => document.getElementById('renderData').click()).not.toThrow();
      }
    });

    test('should handle invalid JSON gracefully', () => {
      const input = document.getElementById('dataInput');
      input.value = '{invalid json}';
      
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDataVisualizer();
        
        expect(() => document.getElementById('renderData').click()).not.toThrow();
      }
    });
  });

  describe('initVersionList', () => {
    let initVersionList;

    beforeEach(() => {
      document.body.innerHTML = '<div data-version-list></div>';

      const funcMatch = scriptContent.match(/function initVersionList\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should populate version list container', () => {
      initVersionList();

      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).not.toBe('');
    });

    test('should include version numbers', () => {
      initVersionList();

      const container = document.querySelector('[data-version-list]');
      expect(container.innerHTML).toMatch(/v?\d+\.\d+/);
    });

    test('should include version statuses', () => {
      initVersionList();

      const container = document.querySelector('[data-version-list]');
      const html = container.innerHTML.toLowerCase();
      expect(html).toMatch(/stable|beta|alpha|planned|current/);
    });

    test('should create version cards', () => {
      initVersionList();

      const container = document.querySelector('[data-version-list]');
      expect(container.querySelectorAll('.version-card, [class*="version"]').length).toBeGreaterThan(0);
    });

    test('should handle missing container gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => initVersionList()).not.toThrow();
    });
  });

  describe('initDocsSidebar - smooth scrolling', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
          <a href="other.html">External</a>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
      `;
    });

    test('should add click handlers to hash links', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDocsSidebar();

        const link = document.querySelector('a[href="#section1"]');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        
        let defaultPrevented = false;
        link.addEventListener('click', (e) => {
          if (e.defaultPrevented) defaultPrevented = true;
        });
        
        link.dispatchEvent(clickEvent);
        
        expect(defaultPrevented).toBe(true);
      }
    });

    test('should not interfere with external links', () => {
      const funcMatch = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initDocsSidebar();

        const link = document.querySelector('a[href="other.html"]');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        
        link.dispatchEvent(clickEvent);
        
        // External links should not have default prevented
        expect(clickEvent.defaultPrevented).toBe(false);
      }
    });

    test('should handle missing target elements gracefully', () => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <a href="#nonexistent">Link</a>
        </div>
      `;

      const funcMatch = scriptContent.match(/function initDocsSidebar\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        
        expect(() => initDocsSidebar()).not.toThrow();
      }
    });
  });

  describe('initPageSpecificFeatures', () => {
    let initPageSpecificFeatures;

    beforeEach(() => {
      // Mock required functions
      global.initCharts = jest.fn();
      global.initAutoRefresh = jest.fn();
      global.initTerminal = jest.fn();
      global.initDataVisualizer = jest.fn();
      global.initDocsSidebar = jest.fn();
      global.initVersionList = jest.fn();

      const funcMatch = scriptContent.match(/function initPageSpecificFeatures\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) eval(funcMatch[0]);
    });

    test('should initialize dashboard features', () => {
      document.body.dataset.page = 'dashboard';
      
      initPageSpecificFeatures();

      expect(global.initCharts).toHaveBeenCalled();
      expect(global.initAutoRefresh).toHaveBeenCalled();
    });

    test('should initialize docs features', () => {
      document.body.dataset.page = 'docs';
      
      initPageSpecificFeatures();

      expect(global.initDocsSidebar).toHaveBeenCalled();
      expect(global.initVersionList).toHaveBeenCalled();
    });

    test('should initialize versions features', () => {
      document.body.dataset.page = 'versions';
      
      initPageSpecificFeatures();

      expect(global.initVersionList).toHaveBeenCalled();
    });

    test('should initialize api features', () => {
      document.body.dataset.page = 'api';
      
      initPageSpecificFeatures();

      expect(global.initTerminal).toHaveBeenCalled();
      expect(global.initAutoRefresh).toHaveBeenCalled();
    });

    test('should initialize data features', () => {
      document.body.dataset.page = 'data';
      
      initPageSpecificFeatures();

      expect(global.initDataVisualizer).toHaveBeenCalled();
      expect(global.initAutoRefresh).toHaveBeenCalled();
    });

    test('should handle default case', () => {
      document.body.dataset.page = 'unknown';
      
      expect(() => initPageSpecificFeatures()).not.toThrow();
    });

    test('should handle missing page attribute', () => {
      delete document.body.dataset.page;
      
      expect(() => initPageSpecificFeatures()).not.toThrow();
    });
  });
});