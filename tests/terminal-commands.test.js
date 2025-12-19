/**
 * Unit tests for terminal functionality (initTerminal, logTerminal, command execution)
 * Tests command parsing, execution, plugin system integration
 */

const fs = require('fs');

describe('Terminal System', () => {
  describe('logTerminal', () => {
    let logTerminal;

    beforeEach(() => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
      
      if (funcMatch) {
        eval(`logTerminal = ${funcMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
      }
    });

    test('should append message to terminal output', () => {
      logTerminal('Test message');
      
      const output = document.querySelector('.terminal-output');
      expect(output.children.length).toBe(1);
      expect(output.textContent).toContain('Test message');
    });

    test('should prepend timestamp to message', () => {
      logTerminal('Test message');
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toMatch(/\[\d+:\d+:\d+.*\] Test message/);
    });

    test('should append multiple messages', () => {
      logTerminal('First');
      logTerminal('Second');
      logTerminal('Third');
      
      const output = document.querySelector('.terminal-output');
      expect(output.children.length).toBe(3);
    });

    test('should auto-scroll to bottom', () => {
      const output = document.querySelector('.terminal-output');
      Object.defineProperty(output, 'scrollHeight', { value: 1000, writable: true });
      Object.defineProperty(output, 'scrollTop', { value: 0, writable: true });
      
      logTerminal('Test');
      
      expect(output.scrollTop).toBe(1000);
    });

    test('should handle missing output element', () => {
      document.body.innerHTML = '';
      expect(() => logTerminal('Test')).not.toThrow();
    });

    test('should handle empty messages', () => {
      logTerminal('');
      
      const output = document.querySelector('.terminal-output');
      expect(output.children.length).toBe(1);
    });

    test('should handle special characters', () => {
      logTerminal('<script>alert("xss")</script>');
      
      const output = document.querySelector('.terminal-output');
      expect(output.innerHTML).not.toContain('<script>');
    });

    test('should create div elements for messages', () => {
      logTerminal('Test');
      
      const output = document.querySelector('.terminal-output');
      const messageEl = output.firstChild;
      expect(messageEl.tagName).toBe('DIV');
    });
  });

  describe('initTerminal - Command Parsing', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="" />
          <button>Run</button>
        </div>
      `;
    });

    test('should display welcome message on initialization', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      // Mock dependencies
      const AppState = { settings: {}, stats: null };
      const AppPlugins = { list: () => [], getCommand: () => null };
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      // Extract and setup function
      const funcMatch = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initTerminal();
      }
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Terminal online');
    });

    test('should handle empty command input', () => {
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      const AppState = { settings: {} };
      const AppPlugins = { list: () => [], getCommand: () => null };
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const funcMatch = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/);
      if (funcMatch) {
        eval(funcMatch[0]);
        initTerminal();
        
        const input = document.querySelector('.terminal input');
        const button = document.querySelector('.terminal button');
        
        input.value = '';
        button.click();
        
        // Should not crash or add error messages
        const output = document.querySelector('.terminal-output');
        expect(output.children.length).toBe(1); // Only welcome message
      }
    });
  });

  describe('Plugin System', () => {
    let AppPlugins, logTerminal;

    beforeEach(() => {
      document.body.innerHTML = '<div class="terminal-output"></div>';
      
      const scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
      
      // Extract logTerminal
      const logMatch = scriptContent.match(/function logTerminal\(message\) \{[\s\S]*?\n  \}/);
      if (logMatch) {
        eval(`logTerminal = ${logMatch[0].replace('function logTerminal(message)', 'function(message)')}`);
      }
      
      // Extract AppPlugins
      const pluginsMatch = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/);
      if (pluginsMatch) {
        eval(pluginsMatch[0]);
      }
    });

    test('should register plugin with name', () => {
      const plugin = {
        name: 'test-plugin',
        init: jest.fn()
      };
      
      AppPlugins.register(plugin);
      
      expect(AppPlugins.list()).toContain('test-plugin');
    });

    test('should call plugin init function', () => {
      const plugin = {
        name: 'test-plugin',
        init: jest.fn()
      };
      
      AppPlugins.register(plugin);
      
      expect(plugin.init).toHaveBeenCalled();
    });

    test('should throw error for plugin without name', () => {
      const plugin = { init: jest.fn() };
      
      expect(() => AppPlugins.register(plugin)).toThrow('Plugin requires a name');
    });

    test('should register plugin command', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: jest.fn(() => 'result')
      };
      
      AppPlugins.register(plugin);
      
      const command = AppPlugins.getCommand('test');
      expect(command).not.toBeNull();
    });

    test('should execute plugin command', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: jest.fn(() => 'test result')
      };
      
      AppPlugins.register(plugin);
      
      const command = AppPlugins.getCommand('test');
      const result = command('arg1');
      
      expect(result).toBe('test result');
    });

    test('should return null for non-existent command', () => {
      const command = AppPlugins.getCommand('nonexistent');
      expect(command).toBeNull();
    });

    test('should list all registered plugins', () => {
      AppPlugins.register({ name: 'plugin1', init: jest.fn() });
      AppPlugins.register({ name: 'plugin2', init: jest.fn() });
      
      const list = AppPlugins.list();
      expect(list).toContain('plugin1');
      expect(list).toContain('plugin2');
    });

    test('should avoid duplicate plugin names in list', () => {
      AppPlugins.register({ name: 'test', command: 'cmd1', run: jest.fn() });
      AppPlugins.register({ name: 'test', command: 'cmd2', run: jest.fn() });
      
      const list = AppPlugins.list();
      const count = list.filter(name => name === 'test').length;
      expect(count).toBe(1);
    });

    test('should log plugin registration', () => {
      AppPlugins.register({ name: 'logger-test', init: jest.fn() });
      
      const output = document.querySelector('.terminal-output');
      expect(output.textContent).toContain('Plugin registered: logger-test');
    });
  });
});