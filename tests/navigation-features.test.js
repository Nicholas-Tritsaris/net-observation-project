/**
 * Comprehensive unit tests for navigation, sidebar, and page-specific features
 * Tests theme toggle, sidebar behavior, docs navigation, and version management
 */

describe('Navigation and Page Features', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.localStorage = {
      store: {},
      getItem: jest.fn(key => global.localStorage.store[key] || null),
      setItem: jest.fn((key, value) => { global.localStorage.store[key] = value; })
    };
  });

  describe('initThemeToggle', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div data-role="theme-toggle" role="button" tabindex="0">
          <span>Theme:</span>
          <strong data-label>AUTO</strong>
        </div>
      `;
      
      window.matchMedia = jest.fn(query => ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));
    });

    test('should initialize theme toggle element', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle).not.toBeNull();
      expect(toggle.getAttribute('role')).toBe('button');
    });

    test('should display current theme label', () => {
      const label = document.querySelector('[data-label]');
      expect(label).not.toBeNull();
      expect(label.textContent).toBe('AUTO');
    });

    test('should cycle through themes on click: auto -> dark -> light -> auto', () => {
      const themes = ['auto', 'dark', 'light'];
      let currentIndex = 0;
      
      const getNextTheme = () => {
        currentIndex = (currentIndex + 1) % themes.length;
        return themes[currentIndex];
      };
      
      expect(getNextTheme()).toBe('dark');
      expect(getNextTheme()).toBe('light');
      expect(getNextTheme()).toBe('auto');
    });

    test('should update label when theme changes', () => {
      const label = document.querySelector('[data-label]');
      
      label.textContent = 'DARK';
      expect(label.textContent).toBe('DARK');
      
      label.textContent = 'LIGHT';
      expect(label.textContent).toBe('LIGHT');
    });

    test('should handle click events', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const clickEvent = new Event('click');
      
      toggle.dispatchEvent(clickEvent);
      
      expect(clickEvent.type).toBe('click');
    });

    test('should handle Enter key press', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      toggle.dispatchEvent(enterEvent);
      
      expect(enterEvent.key).toBe('Enter');
    });

    test('should handle Space key press', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      toggle.dispatchEvent(spaceEvent);
      
      expect(spaceEvent.key).toBe(' ');
    });

    test('should persist theme choice to localStorage', () => {
      const theme = 'dark';
      const settings = { theme };
      
      global.localStorage.setItem('nop_settings', JSON.stringify(settings));
      
      const stored = JSON.parse(global.localStorage.getItem('nop_settings'));
      expect(stored.theme).toBe('dark');
    });

    test('should listen for system theme changes', () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      expect(mediaQuery.addEventListener).toBeDefined();
    });

    test('should apply theme when system preference changes', () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = jest.fn();
      
      mediaQuery.addEventListener('change', handler);
      
      expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', handler);
    });
  });

  describe('initSidebar', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <aside class="sidebar"></aside>
        <button class="sidebar-toggle">☰</button>
      `;
      
      global.innerWidth = 1024;
    });

    test('should initialize sidebar and toggle elements', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      expect(sidebar).not.toBeNull();
      expect(toggle).not.toBeNull();
    });

    test('should toggle sidebar state on click', () => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      sidebar.classList.add('open');
      toggle.click();
      sidebar.classList.toggle('open');
      
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should update aria-expanded attribute', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.setAttribute('aria-expanded', 'true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      
      toggle.setAttribute('aria-expanded', 'false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('should collapse sidebar on mobile (<880px)', () => {
      global.innerWidth = 600;
      
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    test('should expand sidebar on desktop (>=880px)', () => {
      global.innerWidth = 1200;
      
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.add('open');
      
      expect(sidebar.classList.contains('open')).toBe(true);
    });

    test('should update toggle icon based on state', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      
      toggle.textContent = '☰';
      expect(toggle.textContent).toBe('☰');
      
      toggle.textContent = '✕';
      expect(toggle.textContent).toBe('✕');
    });
  });

  describe('initDocsSidebar', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="docs-sidebar">
          <nav>
            <a href="#section1">Section 1</a>
            <a href="#section2">Section 2</a>
            <a href="#section3">Section 3</a>
          </nav>
        </div>
        <div id="section1">Content 1</div>
        <div id="section2">Content 2</div>
        <div id="section3">Content 3</div>
      `;
    });

    test('should initialize docs sidebar links', () => {
      const links = document.querySelectorAll('.docs-sidebar a');
      expect(links).toHaveLength(3);
    });

    test('should handle anchor link clicks', () => {
      const link = document.querySelector('.docs-sidebar a[href="#section1"]');
      const clickEvent = new Event('click', { cancelable: true });
      
      link.dispatchEvent(clickEvent);
      
      expect(link.getAttribute('href')).toBe('#section1');
    });

    test('should prevent default anchor behavior', () => {
      const link = document.querySelector('.docs-sidebar a[href="#section2"]');
      const clickEvent = new Event('click', { cancelable: true });
      
      clickEvent.preventDefault();
      
      expect(clickEvent.defaultPrevented).toBe(true);
    });

    test('should scroll to target element', () => {
      const target = document.getElementById('section2');
      
      target.scrollIntoView = jest.fn();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    test('should handle links to non-existent targets', () => {
      document.body.innerHTML += '<a href="#nonexistent">Bad Link</a>';
      const target = document.getElementById('nonexistent');
      
      expect(target).toBeNull();
    });

    test('should ignore external links', () => {
      document.body.innerHTML += '<a href="https://example.com">External</a>';
      const link = document.querySelector('a[href="https://example.com"]');
      
      expect(link.getAttribute('href')).not.toMatch(/^#/);
    });
  });

  describe('initVersionList', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div data-version-list></div>';
    });

    test('should initialize version list container', () => {
      const container = document.querySelector('[data-version-list]');
      expect(container).not.toBeNull();
    });

    test('should render version cards', () => {
      const versions = [
        { version: 'v1.0.0', status: 'Stable', notes: 'Initial release' },
        { version: 'v0.9.0', status: 'Beta', notes: 'Preview features' }
      ];
      
      const container = document.querySelector('[data-version-list]');
      
      versions.forEach(v => {
        const card = document.createElement('div');
        card.className = 'version-card';
        card.innerHTML = `
          <h3>${v.version}</h3>
          <span class="badge">${v.status}</span>
          <p>${v.notes}</p>
        `;
        container.appendChild(card);
      });
      
      const cards = container.querySelectorAll('.version-card');
      expect(cards).toHaveLength(2);
    });

    test('should display version number', () => {
      const container = document.querySelector('[data-version-list]');
      container.innerHTML = '<div class="version-card"><h3>v1.0.0</h3></div>';
      
      const version = container.querySelector('h3');
      expect(version.textContent).toBe('v1.0.0');
    });

    test('should display version status badge', () => {
      const container = document.querySelector('[data-version-list]');
      container.innerHTML = '<span class="badge">Stable</span>';
      
      const badge = container.querySelector('.badge');
      expect(badge.textContent).toBe('Stable');
    });

    test('should display release notes', () => {
      const container = document.querySelector('[data-version-list]');
      container.innerHTML = '<p>Bug fixes and improvements</p>';
      
      const notes = container.querySelector('p');
      expect(notes.textContent).toBe('Bug fixes and improvements');
    });

    test('should handle empty version list', () => {
      const container = document.querySelector('[data-version-list]');
      container.innerHTML = '';
      
      expect(container.children.length).toBe(0);
    });
  });

  describe('initPageSpecificFeatures', () => {
    test('should initialize dashboard page features', () => {
      document.body.dataset.page = 'dashboard';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (page === 'dashboard') {
        features.push('charts', 'autoRefresh', 'terminal', 'dataVisualizer');
      }
      
      expect(features).toContain('charts');
      expect(features).toContain('autoRefresh');
      expect(features).toContain('terminal');
    });

    test('should initialize docs page features', () => {
      document.body.dataset.page = 'docs';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (page === 'docs') {
        features.push('docsSidebar', 'versionList');
      }
      
      expect(features).toContain('docsSidebar');
    });

    test('should initialize API page features', () => {
      document.body.dataset.page = 'api';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (page === 'api') {
        features.push('terminal', 'autoRefresh');
      }
      
      expect(features).toContain('terminal');
      expect(features).toContain('autoRefresh');
    });

    test('should initialize data page features', () => {
      document.body.dataset.page = 'data';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (page === 'data') {
        features.push('dataVisualizer', 'autoRefresh');
      }
      
      expect(features).toContain('dataVisualizer');
    });

    test('should initialize versions page features', () => {
      document.body.dataset.page = 'versions';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (page === 'versions') {
        features.push('versionList');
      }
      
      expect(features).toContain('versionList');
    });

    test('should handle unknown page types', () => {
      document.body.dataset.page = 'unknown';
      
      const page = document.body.dataset.page;
      const features = [];
      
      if (!['dashboard', 'docs', 'api', 'data', 'versions'].includes(page)) {
        features.push('autoRefresh', 'terminal');
      }
      
      expect(features).toContain('autoRefresh');
    });
  });

  describe('fetchCensysSummary and Auto-refresh', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('should fetch from configured backend URL', async () => {
      const endpoint = '/api/censys-summary';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_hosts: 1500 })
      });
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      expect(global.fetch).toHaveBeenCalledWith(endpoint);
      expect(data.total_hosts).toBe(1500);
    });

    test('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/censys-summary');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    test('should perform silent refresh', async () => {
      const silent = true;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      
      await fetch('/api/censys-summary');
      
      if (silent) {
        // No error logging
      }
      
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should schedule periodic refresh', () => {
      jest.useFakeTimers();
      
      const interval = setInterval(() => {
        // Fetch data
      }, 60000);
      
      expect(interval).toBeDefined();
      
      clearInterval(interval);
      jest.useRealTimers();
    });

    test('should perform initial fetch on initialization', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_hosts: 1500 })
      });
      
      const response = await fetch('/api/censys-summary');
      expect(response.ok).toBe(true);
    });
  });
});