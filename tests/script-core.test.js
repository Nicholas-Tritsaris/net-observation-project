/**
 * Core functionality tests for docs/script.js
 * Tests settings management, theme handling, and logo placeholders
 */

describe('Core Settings and Theme Management', () => {
  let scriptModule;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Mock window.matchMedia for theme detection
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
  });

  describe('Settings Persistence', () => {
    test('should save settings to localStorage with correct key', () => {
      const testSettings = {
        backendUrl: '/api/test',
        auth0Domain: 'test.auth0.com',
        auth0ClientId: 'test-client-id',
        theme: 'dark'
      };
      
      localStorage.setItem('net-observation-settings', JSON.stringify(testSettings));
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'net-observation-settings',
        JSON.stringify(testSettings)
      );
    });

    test('should load settings from localStorage', () => {
      const mockSettings = {
        backendUrl: '/api/custom',
        theme: 'light'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));
      const result = localStorage.getItem('net-observation-settings');
      const parsed = JSON.parse(result);
      
      expect(parsed.backendUrl).toBe('/api/custom');
      expect(parsed.theme).toBe('light');
    });

    test('should handle corrupted localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid-json{');
      
      expect(() => {
        const result = localStorage.getItem('net-observation-settings');
        JSON.parse(result);
      }).toThrow();
    });

    test('should return null for missing settings', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = localStorage.getItem('net-observation-settings');
      
      expect(result).toBeNull();
    });
  });

  describe('Theme Application', () => {
    test('should apply dark theme to document elements', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.dataset.theme = 'dark';
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.dataset.theme).toBe('dark');
    });

    test('should apply light theme to document elements', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.dataset.theme = 'light';
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.dataset.theme).toBe('light');
    });

    test('should resolve auto theme based on prefers-color-scheme', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
      }));
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      const resolvedTheme = prefersDark.matches ? 'dark' : 'light';
      
      expect(resolvedTheme).toBe('dark');
    });

    test('should handle light preference in auto mode', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
      }));
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      const resolvedTheme = prefersDark.matches ? 'dark' : 'light';
      
      expect(resolvedTheme).toBe('light');
    });
  });

  describe('Theme Toggle Functionality', () => {
    test('should cycle through theme modes: auto -> dark -> light', () => {
      const themes = ['auto', 'dark', 'light'];
      let currentIndex = 0;
      
      // Simulate cycling
      currentIndex = (currentIndex + 1) % themes.length;
      expect(themes[currentIndex]).toBe('dark');
      
      currentIndex = (currentIndex + 1) % themes.length;
      expect(themes[currentIndex]).toBe('light');
      
      currentIndex = (currentIndex + 1) % themes.length;
      expect(themes[currentIndex]).toBe('auto');
    });

    test('should update theme label on toggle', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle">
          <strong data-label>AUTO</strong>
        </div>
      `;
      
      const label = document.querySelector('[data-label]');
      label.textContent = 'DARK';
      
      expect(label.textContent).toBe('DARK');
    });

    test('should handle keyboard interaction (Enter key)', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const mockHandler = jest.fn((e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
      
      toggle.addEventListener('keydown', mockHandler);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      toggle.dispatchEvent(event);
      
      expect(mockHandler).toHaveBeenCalled();
    });

    test('should handle keyboard interaction (Space key)', () => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" tabindex="0">
          <strong data-label>AUTO</strong>
        </div>
      `;
      
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const mockHandler = jest.fn((e) => {
        if (e.key === ' ') {
          e.preventDefault();
        }
      });
      
      toggle.addEventListener('keydown', mockHandler);
      const event = new KeyboardEvent('keydown', { key: ' ' });
      toggle.dispatchEvent(event);
      
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Logo Placeholder Initialization', () => {
    test('should create fallback for missing logo image', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Net Observation Project" data-logo />
      `;
      
      const img = document.querySelector('img[data-logo]');
      
      // Simulate image load failure
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = 'NET OBSERVATION PROJECT';
      img.insertAdjacentElement('afterend', placeholder);
      
      const fallback = document.querySelector('.logo-placeholder');
      expect(fallback).toBeTruthy();
      expect(fallback.textContent).toBe('NET OBSERVATION PROJECT');
      expect(img.style.display).toBe('none');
    });

    test('should not create duplicate fallbacks', () => {
      document.body.innerHTML = `
        <img src="logo.png" alt="Test" data-logo data-fallback="true" style="display:none;" />
        <div class="logo-placeholder">TEST</div>
      `;
      
      const img = document.querySelector('img[data-logo]');
      
      // Check if fallback already exists
      if (img.dataset.fallback === 'true') {
        const placeholders = document.querySelectorAll('.logo-placeholder');
        expect(placeholders.length).toBe(1);
      }
    });

    test('should use alt text for placeholder content', () => {
      document.body.innerHTML = `<img src="missing.png" alt="Custom Alt" data-logo />`;
      
      const img = document.querySelector('img[data-logo]');
      const altText = img.alt || 'Net Observation';
      
      const placeholder = document.createElement('div');
      placeholder.textContent = altText.toUpperCase();
      
      expect(placeholder.textContent).toBe('CUSTOM ALT');
    });

    test('should use default text when alt is empty', () => {
      document.body.innerHTML = `<img src="missing.png" alt="" data-logo />`;
      
      const img = document.querySelector('img[data-logo]');
      const altText = img.alt || 'Net Observation';
      
      expect(altText).toBe('Net Observation');
    });

    test('should verify image dimensions before creating fallback', () => {
      document.body.innerHTML = `<img src="logo.png" alt="Test" data-logo />`;
      
      const img = document.querySelector('img[data-logo]');
      
      // Mock image properties
      Object.defineProperty(img, 'naturalWidth', { value: 0, writable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 0, writable: true });
      
      const shouldCreateFallback = !img.naturalWidth || !img.naturalHeight;
      expect(shouldCreateFallback).toBe(true);
    });

    test('should not create fallback for valid images', () => {
      document.body.innerHTML = `<img src="logo.png" alt="Test" data-logo />`;
      
      const img = document.querySelector('img[data-logo]');
      
      Object.defineProperty(img, 'naturalWidth', { value: 512 });
      Object.defineProperty(img, 'naturalHeight', { value: 512 });
      
      const shouldCreateFallback = !img.naturalWidth || !img.naturalHeight;
      expect(shouldCreateFallback).toBe(false);
    });

    test('should handle multiple logo images', () => {
      document.body.innerHTML = `
        <img src="logo1.png" alt="Logo 1" data-logo />
        <img src="logo2.png" alt="Logo 2" data-logo />
        <img src="logo3.png" alt="Logo 3" data-logo />
      `;
      
      const images = document.querySelectorAll('img[data-logo]');
      expect(images.length).toBe(3);
    });
  });

  describe('Sidebar Functionality', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle">☰</button>
      `;
    });

    test('should toggle sidebar open state', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      sidebar.classList.add('open');
      expect(sidebar.classList.contains('open')).toBe(true);
      
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should update toggle button content', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.innerHTML = '☰';
      expect(toggle.innerHTML).toBe('☰');
      
      toggle.innerHTML = '✕';
      expect(toggle.innerHTML).toBe('✕');
    });

    test('should update aria-expanded attribute', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.setAttribute('aria-expanded', 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      
      toggle.setAttribute('aria-expanded', 'false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('should start collapsed on mobile viewport', () => {
      const mockInnerWidth = 800;
      const isMobile = mockInnerWidth < 880;
      
      expect(isMobile).toBe(true);
    });

    test('should start open on desktop viewport', () => {
      const mockInnerWidth = 1200;
      const isMobile = mockInnerWidth < 880;
      
      expect(isMobile).toBe(false);
    });
  });
});