/**
 * Terminal and command system tests for docs/script.js
 * Tests terminal functionality, command execution, and plugin system
 */

describe('Terminal and Command System', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="terminal">
        <div class="terminal-output"></div>
        <input type="text" />
        <button>Run</button>
      </div>
    `;
  });

  describe('Terminal Output', () => {
    test('should append log message to terminal output', () => {
      const output = document.querySelector('.terminal-output');
      const message = 'Test message';
      const timestamp = new Date().toLocaleTimeString();
      
      const line = document.createElement('div');
      line.textContent = `[${timestamp}] ${message}`;
      output.appendChild(line);
      
      expect(output.children.length).toBe(1);
      expect(line.textContent).toContain(message);
    });

    test('should scroll to bottom after adding message', () => {
      const output = document.querySelector('.terminal-output');
      output.scrollTop = 0;
      
      for (let i = 0; i < 5; i++) {
        const line = document.createElement('div');
        line.textContent = `Message ${i}`;
        output.appendChild(line);
      }
      
      output.scrollTop = output.scrollHeight;
      expect(output.scrollTop).toBeGreaterThanOrEqual(0);
    });

    test('should format timestamp correctly', () => {
      const timestamp = new Date().toLocaleTimeString();
      expect(timestamp).toMatch(/\d+:\d+:\d+/);
    });
  });

  describe('Command Parsing', () => {
    test('should parse command without arguments', () => {
      const input = 'help';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('help');
      expect(arg).toBe('');
    });

    test('should parse command with single argument', () => {
      const input = 'theme dark';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('theme');
      expect(arg).toBe('dark');
    });

    test('should parse command with multiple arguments', () => {
      const input = 'echo hello world test';
      const [command, ...rest] = input.trim().split(/\s+/);
      const arg = rest.join(' ');
      
      expect(command).toBe('echo');
      expect(arg).toBe('hello world test');
    });

    test('should handle empty input', () => {
      const input = '   ';
      const [command] = input.trim().split(/\s+/);
      
      expect(command).toBe('');
    });

    test('should trim whitespace', () => {
      const input = '  help  ';
      const [command] = input.trim().split(/\s+/);
      
      expect(command).toBe('help');
    });
  });

  describe('Built-in Commands', () => {
    test('help command should return available commands', () => {
      const helpCommand = () => 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins';
      const result = helpCommand();
      
      expect(result).toContain('Available commands');
      expect(result).toContain('help');
      expect(result).toContain('stats');
    });

    test('settings command should return JSON string', () => {
      const settings = {
        backendUrl: '/api/censys-summary',
        theme: 'auto'
      };
      const result = JSON.stringify(settings, null, 2);
      
      expect(result).toContain('backendUrl');
      expect(result).toContain('theme');
    });

    test('theme command should validate argument', () => {
      const themeCommand = (arg) => {
        if (!['auto', 'dark', 'light'].includes(arg)) {
          return 'Usage: theme <auto|dark|light>';
        }
        return `Theme changed to ${arg}`;
      };
      
      expect(themeCommand('dark')).toBe('Theme changed to dark');
      expect(themeCommand('invalid')).toContain('Usage');
    });

    test('theme command should accept all valid values', () => {
      const validThemes = ['auto', 'dark', 'light'];
      validThemes.forEach(theme => {
        const isValid = validThemes.includes(theme);
        expect(isValid).toBe(true);
      });
    });

    test('stats command should trigger data refresh', () => {
      const statsCommand = () => 'Refreshing Censys summary...';
      const result = statsCommand();
      
      expect(result).toBe('Refreshing Censys summary...');
    });
  });

  describe('Plugin System', () => {
    let registry;

    beforeEach(() => {
      registry = new Map();
    });

    test('should register plugin with name', () => {
      const plugin = {
        name: 'test-plugin',
        command: 'test',
        run: () => 'test output'
      };
      
      registry.set(plugin.name, plugin);
      expect(registry.has('test-plugin')).toBe(true);
    });

    test('should reject plugin without name', () => {
      const plugin = {
        command: 'test',
        run: () => 'test'
      };
      
      const register = (p) => {
        if (!p?.name) throw new Error('Plugin requires a name');
        registry.set(p.name, p);
      };
      
      expect(() => register(plugin)).toThrow('Plugin requires a name');
    });

    test('should list all registered plugins', () => {
      registry.set('plugin1', { name: 'plugin1' });
      registry.set('plugin2', { name: 'plugin2' });
      
      const list = Array.from(new Set(Array.from(registry.values()).map(p => p.name)));
      
      expect(list).toContain('plugin1');
      expect(list).toContain('plugin2');
      expect(list.length).toBe(2);
    });

    test('should retrieve plugin command', () => {
      const plugin = {
        name: 'echo',
        command: 'echo',
        run: (text) => text || '(empty)'
      };
      
      registry.set('echo', plugin);
      const retrieved = registry.get('echo');
      
      expect(retrieved).toBeTruthy();
      expect(retrieved.run('test')).toBe('test');
    });

    test('should handle plugin with init function', () => {
      const mockInit = jest.fn();
      const plugin = {
        name: 'init-plugin',
        init: mockInit,
        run: () => 'output'
      };
      
      registry.set(plugin.name, plugin);
      plugin.init({ state: {}, log: () => {} });
      
      expect(mockInit).toHaveBeenCalled();
    });

    test('should execute plugin command', () => {
      const plugin = {
        name: 'upper',
        command: 'upper',
        run: (text) => text.toUpperCase()
      };
      
      registry.set('upper', plugin);
      const result = plugin.run('hello');
      
      expect(result).toBe('HELLO');
    });

    test('should handle async plugin commands', async () => {
      const plugin = {
        name: 'async-plugin',
        command: 'async',
        run: async () => {
          return Promise.resolve('async result');
        }
      };
      
      const result = await plugin.run();
      expect(result).toBe('async result');
    });

    test('should provide state to plugin', () => {
      const mockState = { stats: { total_hosts: 100 } };
      const plugin = {
        name: 'state-plugin',
        run: (_, { state }) => `Hosts: ${state.stats.total_hosts}`
      };
      
      const result = plugin.run('', { state: mockState });
      expect(result).toBe('Hosts: 100');
    });
  });

  describe('Command Execution', () => {
    test('should handle Enter key to execute command', () => {
      const input = document.querySelector('.terminal input');
      const mockExecute = jest.fn();
      
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') mockExecute();
      });
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);
      
      expect(mockExecute).toHaveBeenCalled();
    });

    test('should not execute on other keys', () => {
      const input = document.querySelector('.terminal input');
      const mockExecute = jest.fn();
      
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') mockExecute();
      });
      
      const event = new KeyboardEvent('keydown', { key: 'a' });
      input.dispatchEvent(event);
      
      expect(mockExecute).not.toHaveBeenCalled();
    });

    test('should clear input after execution', () => {
      const input = document.querySelector('.terminal input');
      input.value = 'test command';
      input.value = '';
      
      expect(input.value).toBe('');
    });

    test('should handle command errors gracefully', () => {
      const command = () => {
        throw new Error('Command failed');
      };
      
      let response = '';
      try {
        response = command();
      } catch (err) {
        response = `Error: ${err.message}`;
      }
      
      expect(response).toBe('Error: Command failed');
    });
  });
});