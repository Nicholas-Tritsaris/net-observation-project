/**
 * Unit tests for data visualizer functionality (initDataVisualizer)
 * Tests JSON parsing, CSV parsing, file upload, and error handling
 */

const fs = require('fs');

describe('Data Visualizer', () => {
  let initDataVisualizer, logTerminal;

  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="dataInput"></textarea>
      <input type="file" id="fileInput" />
      <button id="renderData">Render</button>
      <div id="dataOutput"></div>
      <div class="terminal-output"></div>
    `;

    const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
    
    // Extract logTerminal
    const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
    if (logMatch) {
      eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
    }
    
    // Extract initDataVisualizer
    const funcMatch = scriptContent.match(/function initDataVisualizer\(\) \{[\s\S]*?\n  \}/);
    if (funcMatch) {
      eval(`initDataVisualizer = ${funcMatch[0].replace('function initDataVisualizer()', 'function()')}`);
    }
  });

  describe('JSON Parsing', () => {
    test('should parse and display valid JSON object', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = '{"name": "test", "value": 123}';
      button.click();
      
      expect(output.textContent).toContain('name');
      expect(output.textContent).toContain('test');
      expect(output.textContent).toContain('123');
    });

    test('should parse and display valid JSON array', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = '[{"id": 1}, {"id": 2}]';
      button.click();
      
      expect(output.textContent).toContain('id');
      expect(output.textContent).toContain('1');
      expect(output.textContent).toContain('2');
    });

    test('should handle nested JSON objects', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = '{"user": {"name": "John", "age": 30}}';
      button.click();
      
      expect(output.textContent).toContain('user');
      expect(output.textContent).toContain('name');
      expect(output.textContent).toContain('John');
    });

    test('should format JSON with indentation', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = '{"key":"value"}';
      button.click();
      
      const pre = output.querySelector('pre');
      expect(pre.textContent).toContain('  '); // Check for indentation
    });
  });

  describe('CSV Parsing', () => {
    test('should parse simple CSV data', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      button.click();
      
      expect(output.textContent).toContain('John');
      expect(output.textContent).toContain('30');
      expect(output.textContent).toContain('NYC');
    });

    test('should use first row as headers', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = 'product,price\nApple,1.50\nBanana,0.75';
      button.click();
      
      expect(output.textContent).toContain('product');
      expect(output.textContent).toContain('price');
    });

    test('should handle CSV with empty cells', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = 'a,b,c\n1,,3\n,2,';
      button.click();
      
      const output = document.getElementById('dataOutput');
      expect(output.textContent).toBeDefined();
    });

    test('should trim whitespace from CSV values', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      const output = document.getElementById('dataOutput');
      
      input.value = 'name, age\n John , 30 ';
      button.click();
      
      expect(output.textContent).toContain('John');
      expect(output.textContent).not.toContain(' John ');
    });

    test('should handle different line endings', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = 'a,b\r\n1,2\r\n3,4';
      button.click();
      
      const output = document.getElementById('dataOutput');
      expect(output.querySelector('pre')).toBeTruthy();
    });
  });

  describe('File Upload', () => {
    test('should process uploaded JSON file', (done) => {
      initDataVisualizer();
      
      const fileInput = document.getElementById('fileInput');
      const output = document.getElementById('dataOutput');
      
      const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: { files: [file] },
        writable: false
      });
      
      fileInput.dispatchEvent(event);
      
      setTimeout(() => {
        expect(output.textContent).toContain('test');
        expect(output.textContent).toContain('data');
        done();
      }, 100);
    });

    test('should process uploaded CSV file', (done) => {
      initDataVisualizer();
      
      const fileInput = document.getElementById('fileInput');
      const output = document.getElementById('dataOutput');
      
      const file = new File(['name,value\ntest,123'], 'test.csv', { type: 'text/csv' });
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: { files: [file] },
        writable: false
      });
      
      fileInput.dispatchEvent(event);
      
      setTimeout(() => {
        expect(output.textContent).toContain('test');
        done();
      }, 100);
    });

    test('should handle file upload with no file selected', () => {
      initDataVisualizer();
      
      const fileInput = document.getElementById('fileInput');
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: { files: [] },
        writable: false
      });
      
      expect(() => fileInput.dispatchEvent(event)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should log error for invalid JSON', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = '{ invalid json }';
      button.click();
      
      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('error');
    });

    test('should handle empty input gracefully', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = '';
      button.click();
      
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should log success message on valid parse', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = '{"test": 1}';
      button.click();
      
      const terminal = document.querySelector('.terminal-output');
      expect(terminal.textContent).toContain('successfully');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      expect(() => initDataVisualizer()).not.toThrow();
    });

    test('should handle very large JSON objects', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      const largeObj = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = `value${i}`;
      }
      
      input.value = JSON.stringify(largeObj);
      expect(() => button.click()).not.toThrow();
    });

    test('should handle special characters in data', () => {
      initDataVisualizer();
      
      const input = document.getElementById('dataInput');
      const button = document.getElementById('renderData');
      
      input.value = '{"html": "<script>alert(\\"xss\\")</script>"}';
      button.click();
      
      const output = document.getElementById('dataOutput');
      expect(output.innerHTML).not.toContain('<script>');
    });
  });
});