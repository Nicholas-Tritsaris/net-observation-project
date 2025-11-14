(() => {
  window.__latestCensys = window.__latestCensys || null;
  const AppState = {
    settings: {
      backendUrl: '/api/censys-summary',
      auth0Domain: '',
      auth0ClientId: '',
      theme: 'auto'
    },
    stats: null,
    charts: {},
    auth0Client: null,
    worldData: null
  };

  const STORAGE_KEY = 'net-observation-settings';
  const prefersDark = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : { matches: true };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(AppState.settings, parsed);
      }
    } catch (err) {
      console.warn('Failed to load settings', err);
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.settings));
  }

  function applyTheme() {
    let theme = AppState.settings.theme;
    if (theme === 'auto') {
      theme = prefersDark.matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.dataset.theme = theme;
  }

  function initThemeToggle() {
    const toggle = document.querySelector('[data-role="theme-toggle"]');
    if (!toggle) return;

    const updateLabel = () => {
      const theme = document.body.dataset.theme || 'dark';
      toggle.querySelector('[data-label]').textContent = theme.toUpperCase();
    };

    const cycleTheme = () => {
      const order = ['auto', 'dark', 'light'];
      const idx = order.indexOf(AppState.settings.theme);
      AppState.settings.theme = order[(idx + 1) % order.length];
      saveSettings();
      applyTheme();
      updateLabel();
    };

    toggle.addEventListener('click', cycleTheme);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cycleTheme();
      }
    });

    const prefersListener = () => {
      if (AppState.settings.theme === 'auto') {
        applyTheme();
        updateLabel();
      }
    };

    if (typeof prefersDark.addEventListener === 'function') {
      prefersDark.addEventListener('change', prefersListener);
    } else if (typeof prefersDark.addListener === 'function') {
      prefersDark.addListener(prefersListener);
    }

    updateLabel();
  }

  function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    if (!sidebar || !toggle) return;

    const setState = (open) => {
      sidebar.classList.toggle('open', open);
      sidebar.classList.toggle('collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? '&#x2715;' : '&#9776;';
    };

    toggle.addEventListener('click', () => {
      const open = !sidebar.classList.contains('open');
      setState(open);
    });

    // start collapsed on mobile
    if (window.innerWidth < 880) {
      setState(false);
    } else {
      sidebar.classList.add('open');
    }
  }

  function qs(id) {
    return document.querySelector(id);
  }

  function updateStatsView(data) {
    AppState.stats = data;
    const totalHosts = qs('[data-stat="total-hosts"]');
    const totalServices = qs('[data-stat="total-services"]');
    const lastSync = qs('[data-stat="last-sync"]');
    if (totalHosts) totalHosts.textContent = data.total_hosts?.toLocaleString() ?? '—';
    if (totalServices) totalServices.textContent = data.total_services?.toLocaleString() ?? '—';
    if (lastSync) lastSync.textContent = data.last_sync ? new Date(data.last_sync).toLocaleString() : '—';

    renderTable('[data-table="countries"]', data.countries);
    renderTable('[data-table="services"]', data.services);
    updateCharts(data);
    renderHeatmap(data);
  }

  function renderTable(selector, objectData) {
    const container = qs(selector);
    if (!container) return;
    const tbody = container.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!objectData) return;
    Object.entries(objectData)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, value]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
        tbody.appendChild(row);
      });
  }

  async function fetchCensysSummary(silent = false) {
    const endpoint = AppState.settings.backendUrl || '/api/censys-summary';
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      window.__latestCensys = data;
      updateStatsView(data);
      logTerminal(`Fetched stats from ${endpoint}`);
    } catch (err) {
      if (!silent) {
        logTerminal(`Error fetching stats: ${err.message}`);
      }
      console.warn('Censys fetch error', err);
    }
  }

  function initAutoRefresh() {
    fetchCensysSummary();
    setInterval(() => fetchCensysSummary(true), 60000);
  }

  function initCharts() {
    const servicesCtx = document.getElementById('servicesChart');
    const countriesCtx = document.getElementById('countriesChart');
    if (servicesCtx && window.Chart) {
      AppState.charts.services = new Chart(servicesCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            label: 'Services',
            data: [],
            backgroundColor: generateColorPalette(12, 'services'),
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') } }
          }
        }
      });
    }

    if (countriesCtx && window.Chart) {
      AppState.charts.countries = new Chart(countriesCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Hosts',
            data: [],
            backgroundColor: generateColorPalette(12, 'countries')
          }]
        },
        options: {
          scales: {
            x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') } },
            y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') } }
          },
          plugins: {
            legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') } }
          }
        }
      });
    }
  }

  function updateCharts(data) {
    if (!data) return;
    if (AppState.charts.services) {
      const chart = AppState.charts.services;
      const entries = Object.entries(data.services || {}).sort((a, b) => b[1] - a[1]);
      chart.data.labels = entries.map(([service]) => service);
      chart.data.datasets[0].data = entries.map(([, count]) => count);
      chart.data.datasets[0].backgroundColor = generateColorPalette(entries.length || 1, 'services');
      chart.update('none');
    }

    if (AppState.charts.countries) {
      const chart = AppState.charts.countries;
      const entries = Object.entries(data.countries || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);
      chart.data.labels = entries.map(([country]) => country);
      chart.data.datasets[0].data = entries.map(([, count]) => count);
      chart.data.datasets[0].backgroundColor = generateColorPalette(entries.length || 1, 'countries');
      chart.update('none');
    }
  }

  function generateColorPalette(count, seed) {
    const baseHue = seed === 'services' ? 180 : 300;
    return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
  }

  function initTerminal() {
    const terminal = document.querySelector('.terminal');
    if (!terminal) return;

    const output = terminal.querySelector('.terminal-output');
    const input = terminal.querySelector('input');
    const runButton = terminal.querySelector('button');

    const commands = {
      help() {
        return 'Available commands: help, stats, theme <auto|dark|light>, settings, plugins';
      },
      stats() {
        fetchCensysSummary();
        return 'Refreshing Censys summary...';
      },
      theme(arg) {
        if (!['auto', 'dark', 'light'].includes(arg)) {
          return 'Usage: theme <auto|dark|light>';
        }
        AppState.settings.theme = arg;
        saveSettings();
        applyTheme();
        return `Theme changed to ${arg}`;
      },
      settings() {
        return JSON.stringify(AppState.settings, null, 2);
      },
      plugins() {
        return `Registered plugins: ${AppPlugins.list().join(', ') || 'none'}`;
      }
    };

    const execute = () => {
      const [command, ...rest] = input.value.trim().split(/\s+/);
      if (!command) return;
      const arg = rest.join(' ');
      const handler = commands[command] || AppPlugins.getCommand(command);
      let response = '';
      if (handler) {
        try {
          const result = handler(arg, { state: AppState, log: logTerminal });
          if (result instanceof Promise) {
            result.then(res => logTerminal(res ?? 'done'));
          } else {
            response = result ?? 'done';
          }
        } catch (err) {
          response = `Error: ${err.message}`;
        }
      } else {
        response = `Unknown command: ${command}`;
      }
      if (response) logTerminal(response);
      input.value = '';
    };

    runButton?.addEventListener('click', execute);
    input?.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') execute();
    });

    logTerminal('Terminal online. Type "help" to explore.');
  }

  function logTerminal(message) {
    const output = document.querySelector('.terminal-output');
    if (!output) return;
    const line = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function initDataVisualizer() {
    const jsonInput = document.getElementById('dataInput');
    const fileInput = document.getElementById('fileInput');
    const renderBtn = document.getElementById('renderData');
    const output = document.getElementById('dataOutput');

    const parseCSV = (text) => {
      const [headerLine, ...rows] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      return rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });
    };

    const renderData = (data) => {
      if (!output) return;
      output.innerHTML = '<pre></pre>';
      output.querySelector('pre').textContent = JSON.stringify(data, null, 2);
    };

    const processText = (text) => {
      try {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          renderData(JSON.parse(trimmed));
        } else {
          renderData(parseCSV(trimmed));
        }
        logTerminal('Data visualizer rendered input successfully.');
      } catch (err) {
        logTerminal(`Data visualizer error: ${err.message}`);
      }
    };

    renderBtn?.addEventListener('click', () => {
      if (!jsonInput?.value) return;
      processText(jsonInput.value);
    });

    fileInput?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processText(reader.result);
      reader.readAsText(file);
    });
  }

  const AppPlugins = (() => {
    const registry = new Map();
    return {
      register(plugin) {
        if (!plugin?.name) throw new Error('Plugin requires a name');
        registry.set(plugin.name, plugin);
        plugin?.init?.({ state: AppState, log: logTerminal });
        if (plugin.command) {
          registry.set(plugin.command, plugin);
        }
        logTerminal(`Plugin registered: ${plugin.name}`);
      },
      list() {
        return Array.from(new Set(Array.from(registry.values()).map(p => p.name)));
      },
      getCommand(name) {
        const plugin = registry.get(name);
        if (plugin && plugin.run) {
          return (...args) => plugin.run(...args);
        }
        return null;
      }
    };
  })();

  window.registerPlugin = (plugin) => {
    try {
      AppPlugins.register(plugin);
    } catch (err) {
      logTerminal(`Plugin registration failed: ${err.message}`);
    }
  };

  function initSettingsPanel() {
    const panel = document.querySelector('.settings-panel');
    const toggle = document.querySelector('.settings-toggle');
    if (!panel || !toggle) return;

    const backendInput = panel.querySelector('[name="backendUrl"]');
    const domainInput = panel.querySelector('[name="auth0Domain"]');
    const clientIdInput = panel.querySelector('[name="auth0ClientId"]');
    const themeSelect = panel.querySelector('[name="themeMode"]');

    backendInput.value = AppState.settings.backendUrl;
    domainInput.value = AppState.settings.auth0Domain;
    clientIdInput.value = AppState.settings.auth0ClientId;
    themeSelect.value = AppState.settings.theme;

    panel.addEventListener('submit', (evt) => {
      evt.preventDefault();
      AppState.settings.backendUrl = backendInput.value.trim() || '/api/censys-summary';
      AppState.settings.auth0Domain = domainInput.value.trim();
      AppState.settings.auth0ClientId = clientIdInput.value.trim();
      AppState.settings.theme = themeSelect.value;
      saveSettings();
      applyTheme();
      initAuth0();
      logTerminal('Settings saved.');
    });

    toggle.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      toggle.classList.toggle('active');
      toggle.innerHTML = panel.classList.contains('hidden') ? '&#9881;' : '&#10006;';
    });
  }

  async function initAuth0() {
    if (!window.createAuth0Client) return;
    if (!AppState.settings.auth0Domain || !AppState.settings.auth0ClientId) return;

    try {
      AppState.auth0Client = await createAuth0Client({
        domain: AppState.settings.auth0Domain,
        clientId: AppState.settings.auth0ClientId,
        cacheLocation: 'localstorage',
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      });
      logTerminal('Auth0 client initialised.');
      updateAuthControls();
    } catch (err) {
      logTerminal(`Auth0 init failed: ${err.message}`);
    }
  }

  async function updateAuthControls() {
    const loginBtn = document.querySelector('[data-action="login"]');
    const logoutBtn = document.querySelector('[data-action="logout"]');
    const status = document.querySelector('[data-auth-status]');
    if (!AppState.auth0Client) {
      loginBtn?.classList.add('hidden');
      logoutBtn?.classList.add('hidden');
      if (status) status.textContent = 'Anonymous';
      return;
    }

    const isAuthenticated = await AppState.auth0Client.isAuthenticated();
    if (status) status.textContent = isAuthenticated ? 'Authenticated' : 'Anonymous';
    loginBtn?.classList.toggle('hidden', isAuthenticated);
    logoutBtn?.classList.toggle('hidden', !isAuthenticated);

    if (loginBtn && !loginBtn.dataset.bound) {
      loginBtn.dataset.bound = 'true';
      loginBtn.addEventListener('click', async () => {
        await AppState.auth0Client.loginWithPopup();
        updateAuthControls();
        logTerminal('Logged in via Auth0.');
      });
    }

    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = 'true';
      logoutBtn.addEventListener('click', async () => {
        await AppState.auth0Client.logout({ returnTo: window.location.href });
        updateAuthControls();
        logTerminal('Logged out of Auth0.');
      });
    }
  }

  async function renderHeatmap(data) {
    const container = document.getElementById('worldHeatmap');
    if (!container || !window.d3) return;
    if (!window.topojson) {
      logTerminal('TopoJSON library missing; heatmap unavailable.');
      return;
    }

    if (!AppState.worldData) {
      try {
        const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        AppState.worldData = topojson.feature(world, world.objects.countries);
      } catch (err) {
        logTerminal('Failed to load world map data.');
        return;
      }
    }

    const svg = d3.select(container).attr('viewBox', '0 0 960 500');
    svg.selectAll('*').remove();

    const projection = d3.geoNaturalEarth1().fitWidth(960, { type: 'Sphere' });
    const path = d3.geoPath(projection);
    const countries = AppState.worldData.features;

    const counts = data?.countries || {};
    const values = Object.values(counts);
    const max = values.length ? Math.max(...values) : 1;
    const color = d3.scaleSequential(d3.interpolateTurbo).domain([0, max || 1]);

    svg.append('path')
      .attr('d', path({ type: 'Sphere' }))
      .attr('fill', '#020314')
      .attr('stroke', 'rgba(0,255,255,0.35)');

    svg.selectAll('path.country')
      .data(countries)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        const iso = d.properties.iso_a2 || d.properties.name;
        return color(counts[iso] || 0);
      })
      .attr('stroke', 'rgba(0, 255, 255, 0.2)')
      .append('title')
      .text(d => {
        const iso = d.properties.iso_a2 || d.properties.name;
        const count = counts[iso] || 0;
        return `${d.properties.name}: ${count}`;
      });
  }

  function initDocsSidebar() {
    const tocLinks = document.querySelectorAll('.docs-sidebar a');
    tocLinks.forEach(link => {
      link.addEventListener('click', (evt) => {
        const id = link.getAttribute('href');
        if (id.startsWith('#')) {
          evt.preventDefault();
          document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initVersionList() {
    const container = document.querySelector('[data-version-list]');
    if (!container) return;
    const versions = [
      { version: 'v2.3', status: 'current', notes: 'Stable release' },
      { version: 'v2.2', status: 'lts', notes: 'Long-term support' },
      { version: 'v2.1', status: 'legacy', notes: 'Security patches only' },
      { version: 'v1.x', status: 'archived', notes: 'Historical data' }
    ];
    container.innerHTML = versions.map(v => `
      <div class="card">
        <span class="badge">${v.version} · ${v.status.toUpperCase()}</span>
        <p>${v.notes}</p>
      </div>`).join('');
  }

  function initPageSpecificFeatures() {
    const page = document.body.dataset.page;
    switch (page) {
      case 'dashboard':
        initCharts();
        initAutoRefresh();
        initTerminal();
        initDataVisualizer();
        break;
      case 'docs':
        initDocsSidebar();
        initVersionList();
        break;
      case 'versions':
        initVersionList();
        break;
      case 'api':
        initTerminal();
        initAutoRefresh();
        break;
      case 'data':
        initDataVisualizer();
        initAutoRefresh();
        break;
      default:
        initAutoRefresh();
        initTerminal();
    }
  }

  function markActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === path || (path === 'index.html' && href === '/')) {
        link.classList.add('active');
      }
    });
  }

  function init() {
    loadSettings();
    applyTheme();
    initThemeToggle();
    initSidebar();
    initSettingsPanel();
    initAuth0();
    updateAuthControls();
    markActiveNav();
    initPageSpecificFeatures();
    AppPlugins.register({
      name: 'echo-plugin',
      command: 'echo',
      run(text) {
        return text || '(empty)';
      }
    });
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
