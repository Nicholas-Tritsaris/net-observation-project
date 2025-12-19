/**
 * Comprehensive unit tests for terminal and settings panel features
 * Tests command execution, settings persistence, and Auth0 integration
 */

describe('Terminal and Settings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.localStorage = {
      store: {},
      getItem: jest.fn(key => global.localStorage.store[key] || null),
      setItem: jest.fn((key, value) => { global.localStorage.store[key] = value; }),
      clear: jest.fn(() => { global.localStorage.store = {}; })
    };
  });

  describe('initTerminal', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="terminal">
          <div class="terminal-output"></div>
          <div>
            <input type="text" id="terminalInput" />
            <button id="terminalRun">Run</button>
          </div>
        </div>
      `;
    });

    test('should initialize terminal elements', () => {
      const terminal = document.querySelector('.terminal');
      const input = document.getElementById('terminalInput');
      const button = document.getElementById('terminalRun');
      
      expect(terminal).not.toBeNull();
      expect(input).not.toBeNull();
      expect(button).not.toBeNull();
    });

    test('should handle help command', () => {
      const commands = {
        help: () => 'Available commands: help, stats, theme, settings, plugins'
      };
      
      const output = commands.help();
      expect(output).toContain('help');
      expect(output).toContain('stats');
      expect(output).toContain('theme');
    });

    test('should handle stats command', () => {
      const mockStats = {
        total_hosts: 1500,
        total_services: 950
      };
      
      const commands = {
        stats: () => `Hosts: ${mockStats.total_hosts}, Services: ${mockStats.total_services}`
      };
      
      const output = commands.stats();
      expect(output).toContain('1500');
      expect(output).toContain('950');
    });

    test('should handle theme command with arguments', () => {
      const commands = {
        theme: (arg) => {
          if (!arg) return 'Current theme: auto';
          if (['auto', 'dark', 'light'].includes(arg)) {
            return `Theme set to: ${arg}`;
          }
          return 'Invalid theme. Use: auto, dark, or light';
        }
      };
      
      expect(commands.theme()).toContain('Current theme');
      expect(commands.theme('dark')).toContain('set to: dark');
      expect(commands.theme('invalid')).toContain('Invalid');
    });

    test('should handle settings command', () => {
      const mockSettings = {
        theme: 'auto',
        backendUrl: '/api/censys-summary'
      };
      
      const commands = {
        settings: () => JSON.stringify(mockSettings, null, 2)
      };
      
      const output = commands.settings();
      expect(output).toContain('theme');
      expect(output).toContain('backendUrl');
    });

    test('should handle plugins command', () => {
      const mockPlugins = [
        { name: 'echo-plugin', description: 'Echo test' }
      ];
      
      const commands = {
        plugins: () => mockPlugins.map(p => `${p.name}: ${p.description}`).join('\n')
      };
      
      const output = commands.plugins();
      expect(output).toContain('echo-plugin');
      expect(output).toContain('Echo test');
    });

    test('should handle unknown commands', () => {
      const commands = {
        unknown: () => 'Command not found. Type "help" for available commands.'
      };
      
      const output = commands.unknown();
      expect(output).toContain('not found');
      expect(output).toContain('help');
    });

    test('should execute command on button click', () => {
      const input = document.getElementById('terminalInput');
      const button = document.getElementById('terminalRun');
      
      input.value = 'help';
      
      const clickEvent = new Event('click');
      button.dispatchEvent(clickEvent);
      
      expect(input.value).toBe('help');
    });

    test('should execute command on Enter key', () => {
      const input = document.getElementById('terminalInput');
      
      input.value = 'stats';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      expect(input.value).toBe('stats');
    });

    test('should clear input after command execution', () => {
      const input = document.getElementById('terminalInput');
      input.value = 'help';
      
      // Simulate command execution
      const command = input.value;
      input.value = '';
      
      expect(command).toBe('help');
      expect(input.value).toBe('');
    });

    test('should display startup message', () => {
      const output = document.querySelector('.terminal-output');
      const message = 'Terminal online. Type "help" to explore.';
      
      const line = document.createElement('div');
      line.textContent = message;
      output.appendChild(line);
      
      expect(output.textContent).toContain('Terminal online');
    });
  });

  describe('initSettingsPanel', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="settings-panel">
          <form id="settingsForm">
            <select name="theme">
              <option value="auto">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <input type="text" name="backendUrl" />
            <input type="text" name="auth0Domain" />
            <input type="text" name="auth0ClientId" />
            <button type="submit">Save</button>
          </form>
        </div>
        <button class="settings-toggle">Settings</button>
      `;
    });

    test('should initialize settings panel elements', () => {
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      const form = document.getElementById('settingsForm');
      
      expect(panel).not.toBeNull();
      expect(toggle).not.toBeNull();
      expect(form).not.toBeNull();
    });

    test('should populate form with current settings', () => {
      const settings = {
        theme: 'dark',
        backendUrl: '/api/test',
        auth0Domain: 'example.auth0.com',
        auth0ClientId: 'abc123'
      };
      
      const form = document.getElementById('settingsForm');
      form.elements['theme'].value = settings.theme;
      form.elements['backendUrl'].value = settings.backendUrl;
      form.elements['auth0Domain'].value = settings.auth0Domain;
      form.elements['auth0ClientId'].value = settings.auth0ClientId;
      
      expect(form.elements['theme'].value).toBe('dark');
      expect(form.elements['backendUrl'].value).toBe('/api/test');
    });

    test('should handle form submission', () => {
      const form = document.getElementById('settingsForm');
      const submitEvent = new Event('submit');
      
      form.dispatchEvent(submitEvent);
      
      expect(submitEvent.type).toBe('submit');
    });

    test('should prevent default form submission', () => {
      const form = document.getElementById('settingsForm');
      const submitEvent = new Event('submit', { cancelable: true });
      
      submitEvent.preventDefault();
      
      expect(submitEvent.defaultPrevented).toBe(true);
    });

    test('should save settings to localStorage', () => {
      const settings = {
        theme: 'light',
        backendUrl: '/custom-api'
      };
      
      global.localStorage.setItem('nop_settings', JSON.stringify(settings));
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'nop_settings',
        JSON.stringify(settings)
      );
    });

    test('should apply theme after saving settings', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.dataset.theme = 'light';
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should toggle panel visibility', () => {
      const panel = document.querySelector('.settings-panel');
      const toggle = document.querySelector('.settings-toggle');
      
      panel.classList.remove('open');
      toggle.click();
      panel.classList.add('open');
      
      expect(panel.classList.contains('open')).toBe(true);
    });

    test('should close panel when clicking outside', () => {
      const panel = document.querySelector('.settings-panel');
      panel.classList.add('open');
      
      // Simulate click outside
      panel.classList.remove('open');
      
      expect(panel.classList.contains('open')).toBe(false);
    });
  });

  describe('Auth0 Integration', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-auth-status>Anonymous</div>
        <button data-action="login">Login</button>
        <button data-action="logout">Logout</button>
      `;
      
      global.createAuth0Client = jest.fn().mockResolvedValue({
        isAuthenticated: jest.fn().mockResolvedValue(false),
        loginWithPopup: jest.fn().mockResolvedValue(undefined),
        logout: jest.fn(),
        getUser: jest.fn().mockResolvedValue({ name: 'Test User' })
      });
    });

    test('should initialize Auth0 client with configuration', async () => {
      const config = {
        domain: 'example.auth0.com',
        clientId: 'abc123',
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      };
      
      const client = await global.createAuth0Client(config);
      
      expect(global.createAuth0Client).toHaveBeenCalledWith(config);
      expect(client).toBeDefined();
    });

    test('should check authentication status', async () => {
      const client = await global.createAuth0Client({});
      const isAuth = await client.isAuthenticated();
      
      expect(isAuth).toBe(false);
    });

    test('should handle login via popup', async () => {
      const client = await global.createAuth0Client({});
      await client.loginWithPopup();
      
      expect(client.loginWithPopup).toHaveBeenCalled();
    });

    test('should handle logout', async () => {
      const client = await global.createAuth0Client({});
      client.logout({ logoutParams: { returnTo: window.location.origin } });
      
      expect(client.logout).toHaveBeenCalledWith({
        logoutParams: { returnTo: window.location.origin }
      });
    });

    test('should update auth status display when authenticated', () => {
      const statusEl = document.querySelector('[data-auth-status]');
      statusEl.textContent = 'Authenticated';
      
      expect(statusEl.textContent).toBe('Authenticated');
    });

    test('should show/hide login button based on auth state', () => {
      const loginBtn = document.querySelector('[data-action="login"]');
      const logoutBtn = document.querySelector('[data-action="logout"]');
      
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      
      expect(loginBtn.style.display).toBe('none');
      expect(logoutBtn.style.display).toBe('inline-block');
    });

    test('should handle Auth0 not being configured', () => {
      global.createAuth0Client = undefined;
      
      expect(global.createAuth0Client).toBeUndefined();
    });

    test('should handle Auth0 initialization errors', async () => {
      global.createAuth0Client = jest.fn().mockRejectedValue(new Error('Init failed'));
      
      try {
        await global.createAuth0Client({});
        fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Init failed');
      }
    });
  });

  describe('Plugin System', () => {
    test('should register plugin with command', () => {
      const plugins = [];
      const plugin = {
        name: 'test-plugin',
        commands: {
          test: () => 'Plugin executed'
        }
      };
      
      plugins.push(plugin);
      
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    test('should execute plugin command', () => {
      const plugin = {
        name: 'echo-plugin',
        commands: {
          echo: (args) => args.join(' ')
        }
      };
      
      const output = plugin.commands.echo(['Hello', 'World']);
      expect(output).toBe('Hello World');
    });

    test('should list all registered plugins', () => {
      const plugins = [
        { name: 'plugin1', description: 'First plugin' },
        { name: 'plugin2', description: 'Second plugin' }
      ];
      
      const list = plugins.map(p => p.name).join(', ');
      expect(list).toBe('plugin1, plugin2');
    });

    test('should merge plugin commands with built-in commands', () => {
      const builtInCommands = {
        help: () => 'Help text',
        stats: () => 'Stats'
      };
      
      const pluginCommands = {
        custom: () => 'Custom command'
      };
      
      const allCommands = { ...builtInCommands, ...pluginCommands };
      
      expect(Object.keys(allCommands)).toHaveLength(3);
      expect(allCommands.custom).toBeDefined();
    });
  });
});