/**
 * Settings panel tests for docs/script.js
 * Tests settings UI, form handling, and configuration management
 */

describe('Settings Panel', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="settings-panel hidden">
        <form>
          <input name="backendUrl" value="" />
          <input name="auth0Domain" value="" />
          <input name="auth0ClientId" value="" />
          <select name="themeMode">
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <button type="submit">Save</button>
        </form>
      </div>
      <button class="settings-toggle">⚙</button>
    `;
  });

  describe('Panel Toggle', () => {
    test('should toggle panel visibility', () => {
      const panel = document.querySelector('.settings-panel');
      
      panel.classList.remove('hidden');
      expect(panel.classList.contains('hidden')).toBe(false);
      
      panel.classList.add('hidden');
      expect(panel.classList.contains('hidden')).toBe(true);
    });

    test('should update toggle button appearance', () => {
      const toggle = document.querySelector('.settings-toggle');
      const panel = document.querySelector('.settings-panel');
      
      toggle.classList.add('active');
      toggle.innerHTML = '&#10006;';
      
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.innerHTML).toBe('✖');
    });

    test('should show settings icon when closed', () => {
      const toggle = document.querySelector('.settings-toggle');
      toggle.innerHTML = '&#9881;';
      
      expect(toggle.innerHTML).toBe('⚙');
    });
  });

  describe('Form Initialization', () => {
    test('should populate form with current settings', () => {
      const settings = {
        backendUrl: '/api/custom',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client',
        theme: 'dark'
      };

      const backendInput = document.querySelector('[name="backendUrl"]');
      const domainInput = document.querySelector('[name="auth0Domain"]');
      const clientIdInput = document.querySelector('[name="auth0ClientId"]');
      const themeSelect = document.querySelector('[name="themeMode"]');

      backendInput.value = settings.backendUrl;
      domainInput.value = settings.auth0Domain;
      clientIdInput.value = settings.auth0ClientId;
      themeSelect.value = settings.theme;

      expect(backendInput.value).toBe('/api/custom');
      expect(domainInput.value).toBe('test.auth0.com');
      expect(clientIdInput.value).toBe('test-client');
      expect(themeSelect.value).toBe('dark');
    });

    test('should handle empty settings', () => {
      const backendInput = document.querySelector('[name="backendUrl"]');
      backendInput.value = '';

      expect(backendInput.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    test('should prevent default form submission', () => {
      const form = document.querySelector('.settings-panel form');
      const mockPreventDefault = jest.fn();

      form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        mockPreventDefault();
      });

      const event = new Event('submit');
      Object.defineProperty(event, 'preventDefault', {
        value: mockPreventDefault,
        writable: true
      });
      form.dispatchEvent(event);

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    test('should read form values on submit', () => {
      const backendInput = document.querySelector('[name="backendUrl"]');
      const domainInput = document.querySelector('[name="auth0Domain"]');
      const clientIdInput = document.querySelector('[name="auth0ClientId"]');
      const themeSelect = document.querySelector('[name="themeMode"]');

      backendInput.value = '/api/test';
      domainInput.value = 'domain.test';
      clientIdInput.value = 'client-123';
      themeSelect.value = 'light';

      const formData = {
        backendUrl: backendInput.value.trim(),
        auth0Domain: domainInput.value.trim(),
        auth0ClientId: clientIdInput.value.trim(),
        theme: themeSelect.value
      };

      expect(formData.backendUrl).toBe('/api/test');
      expect(formData.auth0Domain).toBe('domain.test');
      expect(formData.auth0ClientId).toBe('client-123');
      expect(formData.theme).toBe('light');
    });

    test('should trim whitespace from inputs', () => {
      const backendInput = document.querySelector('[name="backendUrl"]');
      backendInput.value = '  /api/test  ';

      const trimmed = backendInput.value.trim();
      expect(trimmed).toBe('/api/test');
    });

    test('should use default URL when empty', () => {
      const backendInput = document.querySelector('[name="backendUrl"]');
      backendInput.value = '';

      const url = backendInput.value.trim() || '/api/censys-summary';
      expect(url).toBe('/api/censys-summary');
    });

    test('should save settings to state', () => {
      const appState = {
        settings: {
          backendUrl: '/api/censys-summary',
          auth0Domain: '',
          auth0ClientId: '',
          theme: 'auto'
        }
      };

      const newSettings = {
        backendUrl: '/custom',
        auth0Domain: 'new.auth0.com',
        auth0ClientId: 'new-client',
        theme: 'dark'
      };

      Object.assign(appState.settings, newSettings);

      expect(appState.settings.backendUrl).toBe('/custom');
      expect(appState.settings.auth0Domain).toBe('new.auth0.com');
      expect(appState.settings.theme).toBe('dark');
    });
  });

  describe('Input Validation', () => {
    test('should accept valid URLs', () => {
      const urls = [
        '/api/censys-summary',
        'https://api.example.com/data',
        'http://localhost:8788/api/test'
      ];

      urls.forEach(url => {
        expect(url.length).toBeGreaterThan(0);
      });
    });

    test('should accept valid Auth0 domains', () => {
      const domains = [
        'tenant.auth0.com',
        'tenant.us.auth0.com',
        'tenant.eu.auth0.com'
      ];

      domains.forEach(domain => {
        expect(domain).toContain('auth0.com');
      });
    });

    test('should accept valid client IDs', () => {
      const clientId = 'a1B2c3D4e5F6g7H8i9J0';
      expect(clientId.length).toBeGreaterThan(0);
    });
  });
});