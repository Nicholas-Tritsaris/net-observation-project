/**
 * Comprehensive unit tests for terminal UI and plugin system
 * Tests initTerminal, terminal commands, and AppPlugins
 */

describe('Terminal and Plugin System', () => {
  let scriptContent;
  
  beforeAll(() => {
    scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('initTerminal', () => {
    test('should initialize terminal with all commands', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" />
          <button>Run</button>
        </div>
      `;
      
      const AppState = { settings: { theme: 'auto' }, stats: null, charts: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      expect(() => initTerminal()).not.toThrow();
    });

    test('should not initialize when terminal element is missing', () => {
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      expect(() => initTerminal()).not.toThrow();
    });

    test('should execute command on button click', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      
      document.querySelector('button').click();
      
      expect(outputs.some(o => o.includes('Available commands'))).toBe(true);
    });

    test('should execute command on Enter key', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      
      const input = document.querySelector('input');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);
      
      expect(outputs.some(o => o.includes('Available commands'))).toBe(true);
    });

    test('should clear input after command execution', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;
      
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) {}';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      
      const input = document.querySelector('input');
      document.querySelector('button').click();
      
      expect(input.value).toBe('');
    });

    test('should handle unknown command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="unknowncommand" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(outputs.some(o => o.includes('Unknown command'))).toBe(true);
    });

    test('should execute stats command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="stats" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(fetchCensysSummary).toHaveBeenCalled();
      expect(outputs.some(o => o.includes('Refreshing'))).toBe(true);
    });

    test('should execute theme command with valid argument', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="theme dark" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: { theme: 'auto' } };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(AppState.settings.theme).toBe('dark');
      expect(saveSettings).toHaveBeenCalled();
      expect(applyTheme).toHaveBeenCalled();
      expect(outputs.some(o => o.includes('Theme changed to dark'))).toBe(true);
    });

    test('should reject invalid theme argument', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="theme invalid" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: { theme: 'auto' } };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(AppState.settings.theme).toBe('auto');
      expect(outputs.some(o => o.includes('Usage: theme'))).toBe(true);
    });

    test('should execute settings command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="settings" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = {
        settings: {
          theme: 'dark',
          backendUrl: '/api/test'
        }
      };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(outputs.some(o => o.includes('"theme"'))).toBe(true);
      expect(outputs.some(o => o.includes('dark'))).toBe(true);
    });

    test('should execute plugins command', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="plugins" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => ['test-plugin', 'other-plugin']),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      expect(outputs.some(o => o.includes('test-plugin'))).toBe(true);
      expect(outputs.some(o => o.includes('other-plugin'))).toBe(true);
    });

    test('should handle command errors gracefully', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="help" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => {
          throw new Error('Plugin error');
        }),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      
      // This should not throw
      expect(() => document.querySelector('button').click()).not.toThrow();
    });

    test('should handle empty command input', () => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="   " />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => null)
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      // Should not log anything for empty command
      expect(outputs.filter(o => !o.includes('Terminal online')).length).toBe(0);
    });

    test('should handle async command results', (done) => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <input type="text" value="test" />
          <button>Run</button>
        </div>
      `;
      
      const outputs = [];
      const AppState = { settings: {} };
      const AppPlugins = {
        list: jest.fn(() => []),
        getCommand: jest.fn(() => async () => {
          return 'async result';
        })
      };
      const logTerminalFunc = 'function logTerminal(msg) { outputs.push(msg); }';
      const fetchCensysSummary = jest.fn();
      const saveSettings = jest.fn();
      const applyTheme = jest.fn();
      
      const initTerminalFunc = scriptContent.match(/function initTerminal\(\) \{[\s\S]*?\n  \}/)[0];
      
      eval(logTerminalFunc);
      eval(initTerminalFunc);
      
      initTerminal();
      document.querySelector('button').click();
      
      setTimeout(() => {
        expect(outputs.some(o => o.includes('async result'))).toBe(true);
        done();
      }, 100);
    });
  });

  describe('AppPlugins system', () => {
    test('should register plugin with valid configuration', () => {
      const appPluginsCode = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/)[0];
      eval(appPluginsCode);
      
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: (text) => `Echo: ${text}`
      };
      
      expect(() => AppPlugins.register(plugin)).not.toThrow();
    });

    test('should list registered plugins', () => {
      const appPluginsCode = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/)[0];
      eval(appPluginsCode);
      
      AppPlugins.register({
        name: 'plugin1',
        command: 'cmd1',
        run: () => 'test'
      });
      
      AppPlugins.register({
        name: 'plugin2',
        command: 'cmd2',
        run: () => 'test'
      });
      
      const list = AppPlugins.list();
      expect(list).toContain('plugin1');
      expect(list).toContain('plugin2');
    });

    test('should retrieve registered command', () => {
      const appPluginsCode = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/)[0];
      eval(appPluginsCode);
      
      const runFn = (text) => `Result: ${text}`;
      AppPlugins.register({
        name: 'test-plugin',
        command: 'test',
        run: runFn
      });
      
      const command = AppPlugins.getCommand('test');
      expect(command).toBe(runFn);
    });

    test('should return null for non-existent command', () => {
      const appPluginsCode = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/)[0];
      eval(appPluginsCode);
      
      const command = AppPlugins.getCommand('non-existent');
      expect(command).toBeNull();
    });

    test('should reject plugin without name', () => {
      const appPluginsCode = scriptContent.match(/const AppPlugins = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/)[0];
      eval(appPluginsCode);
      
      const plugin = {
        command: 'test',
        run: () => 'test'
      };
      
      expect(() => AppPlugins.register(plugin)).toThrow('Plugin requires a name');
    });
  });
});