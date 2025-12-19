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

  /**
   * Load persisted settings from localStorage into the in-memory AppState.settings.
   *
   * If a JSON object is stored under STORAGE_KEY, its properties are shallow-merged
   * into AppState.settings. On JSON parse or storage access errors, a warning is
   * logged and AppState.settings is not modified.
   */
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

  /**
   * Persist the current application settings to browser localStorage.
   *
   * Saves AppState.settings as JSON under the STORAGE_KEY, replacing any previously stored value.
   */
  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.settings));
  }

  /**
   * Apply the configured theme to the document.
   *
   * Resolves the "auto" setting to the system color-scheme preference and sets the documentElement `data-theme`
   * attribute and the document body `data-theme` dataset to the resolved theme (e.g., "dark" or "light").
   */
  function applyTheme() {
    let theme = AppState.settings.theme;
    if (theme === 'auto') {
      theme = prefersDark.matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.dataset.theme = theme;
  }

  /**
   * Replace missing or failed logo images with non-interactive text placeholders.
   *
   * For each <img data-logo> element, if the image fails to load or has no intrinsic size,
   * hides the image, inserts an aria-hidden placeholder containing the image's alt text
   * in uppercase (falls back to "NET OBSERVATION"), and marks the image to avoid duplicate replacements.
   */
  function initLogoPlaceholders() {
    const createFallback = (img) => {
      if (img.dataset.fallback === 'true') return;
      img.dataset.fallback = 'true';
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = (img.alt || 'Net Observation').toUpperCase();
      img.insertAdjacentElement('afterend', placeholder);
    };

    document.querySelectorAll('img[data-logo]').forEach((img) => {
      const verify = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          createFallback(img);
        }
      };
      img.addEventListener('error', () => createFallback(img));
      if (img.complete) {
        verify();
      } else {
        img.addEventListener('load', verify, { once: true });
      }
    });
  }

  /**
   * Initialize the theme toggle control and wire user and system preference handlers.
   *
   * Sets up the element matching [data-role="theme-toggle"] (if present) to cycle the site theme
   * through "auto", "dark", and "light" when activated, persists the chosen setting, applies the
   * resolved theme, and updates the visible label at [data-label]. Also listens for system
   * color-scheme changes and reapplies the theme when the current setting is "auto".
   */
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

  /**
   * Initialize the page sidebar's collapse/expand behavior and its toggle control.
   *
   * Adds a click handler to the sidebar toggle that toggles `open`/`collapsed` classes on the sidebar,
   * updates the toggle's `aria-expanded` attribute and icon, and sets the initial state (collapsed when
   * window width is less than 880px).
   */
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

  /**
   * Return the first DOM element that matches the provided CSS selector.
   * @param {string} id - CSS selector string to query (e.g., '#id', '.class', 'tag').
   * @returns {Element|null} The first matching Element, or `null` if no match is found.
   */
  function qs(id) {
    return document.querySelector(id);
  }

  /**
   * Store summary data in AppState and refresh UI elements that display those statistics.
   *
   * @param {Object} data - Summary payload used to update the dashboard.
   * @param {number} [data.total_hosts] - Total number of hosts.
   * @param {number} [data.total_services] - Total number of services.
   * @param {string|number} [data.last_sync] - Timestamp of the last sync (parsable by Date).
   * @param {Object<string, number>} [data.countries] - Mapping of country codes/labels to host counts.
   * @param {Object<string, number>} [data.services] - Mapping of service names to counts.
   */
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

  /**
   * Render rows into a table body from an object's entries, sorted by value descending.
   *
   * Clears the table's existing <tbody> and appends one <tr> per entry where the first cell
   * is the object key and the second cell is the numeric value formatted with locale separators.
   * If the selector does not match an element, the element has no <tbody>, or `objectData` is falsy,
   * the function performs no changes.
   *
   * @param {string} selector - CSS selector for a table element that contains a <tbody>.
   * @param {Object<string, number>} objectData - Mapping of label → numeric value to render; values are sorted descending and formatted with Number(...).toLocaleString().
   */
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

  /**
   * Fetches the latest Censys summary from the configured backend URL and updates application state and UI.
   *
   * On success, updates window.__latestCensys, calls updateStatsView(data), and logs a success message to the terminal.
   * On failure, logs a console warning and, unless `silent` is true, logs an error message to the terminal.
   *
   * @param {boolean} [silent=false] - When true, suppresses terminal error messages if the fetch fails.
   */
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

  /**
   * Start periodic updates of the Censys summary.
   *
   * Triggers an immediate fetch and schedules background (silent) refreshes every 60 seconds.
   */
  function initAutoRefresh() {
    fetchCensysSummary();
    setInterval(() => fetchCensysSummary(true), 60000);
  }

  /**
   * Initialize Chart.js charts for services and countries and store them on AppState.charts.
   *
   * Creates a doughnut chart for services and a bar chart for countries when their canvas
   * elements exist and Chart.js is available. Charts are initialized with empty labels and
   * datasets, apply the application's color palette via generateColorPalette, and use the
   * current theme's text color for labels and ticks.
   */
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

  /**
   * Update the services and countries Chart.js charts from a summary data object.
   *
   * If corresponding charts exist on AppState.charts, replaces their labels, dataset values,
   * and dataset background colors and refreshes the charts. Services are populated from all
   * entries sorted by count descending; countries use the top 12 entries sorted by count descending.
   * @param {Object} data - Summary data containing optional mappings:
   *   `{ services?: Record<string, number>, countries?: Record<string, number> }`.
   */
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

  /**
   * Generate an array of visually distinct HSL CSS color strings for charts or UI elements.
   * @param {number} count - Number of colors to generate.
   * @param {string} seed - Influences the base hue; when `'services'`, a different base hue is used.
   * @returns {string[]} An array of HSL CSS color strings with alpha (e.g. "hsl(... 80% 55% / 0.7)").
   */
  function generateColorPalette(count, seed) {
    const baseHue = seed === 'services' ? 180 : 300;
    return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
  }

  /**
   * Initialize the in-page terminal and register built-in and plugin commands.
   *
   * When a `.terminal` element exists, configures the terminal UI (input and run control),
   * installs built-in commands (`help`, `stats`, `theme`, `settings`, `plugins`), integrates
   * commands provided by registered plugins, and logs a startup message. If no `.terminal`
   * element is present, the function performs no actions.
   */
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

  /**
   * Append a timestamped message line to the in-page terminal output and scroll it into view.
   * If the terminal output element ('.terminal-output') is not present, the function does nothing.
   * @param {string} message - The message to append to the terminal output.
   */
  function logTerminal(message) {
    const output = document.querySelector('.terminal-output');
    if (!output) return;
    const line = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  /**
   * Initialize the data visualizer UI and wire controls to parse and display JSON or CSV input.
   *
   * If the input begins with "{" or "[" it is parsed as JSON; otherwise it is parsed as CSV where the first line provides header names and subsequent lines produce objects mapping header → value (both headers and values are trimmed). Parsed data is rendered as pretty-printed JSON into the output area and success or parse errors are logged to the in-page terminal.
   */
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

  /**
   * Initialize and bind the settings panel and its toggle, synchronizing controls with persisted AppState.settings.
   *
   * Populates panel controls from AppState.settings. When submitted, updates AppState.settings, persists them with saveSettings(), applies the selected theme via applyTheme(), re-initializes Auth0 with initAuth0(), and logs a confirmation to the in-page terminal. If the panel or its toggle is not present, the function does nothing.
   */
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

  /**
   * Initialize the Auth0 client when the Auth0 library and required settings are present.
   *
   * Creates and stores an Auth0 client on AppState.auth0Client, updates authentication UI via
   * updateAuthControls, and logs success or error messages to the in-page terminal. If the
   * Auth0 factory or required configuration (domain and clientId) is missing, the function is a no-op.
   */
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

  /**
   * Synchronize authentication UI with the current Auth0 client and sign-in state.
   *
   * Updates the element with [data-auth-status] to "Authenticated" or "Anonymous", shows or hides
   * the [data-action="login"] and [data-action="logout"] buttons based on authentication status,
   * and attaches click handlers (only once per button) that trigger Auth0 login via popup and logout
   * with return-to-current-page behavior.
   */
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

  /**
   * Renders a world choropleth heatmap into the element with id "worldHeatmap" using per-country counts.
   *
   * If the world topology is not already cached on AppState.worldData the function will fetch and cache it.
   * The function is a no-op when the target element or required libraries (D3 and TopoJSON on window) are missing.
   *
   * @param {Object} data - Data used to color the map.
   * @param {Object<string, number>} [data.countries] - Mapping of country identifiers (prefer ISO A2 codes, fallback to country name) to numeric counts.
   */
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

  /**
   * Initialize smooth in-page scrolling for fragment links within the docs sidebar.
   *
   * Intercepts clicks on anchors inside `.docs-sidebar` whose `href` begins with `#` and scrolls
   * the referenced element into view with smooth behavior aligned to the start of the viewport.
   */
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

  /**
   * Render a predefined list of release cards into the element with [data-version-list].
   *
   * Replaces the container's contents with cards for v2.3, v2.2, v2.1, and v1.x showing version, status, and notes. If the container is not found, the function does nothing.
   */
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

  /**
   * Initialize UI features for the current page based on the document body's `data-page` attribute.
   *
   * Initializes the following feature sets:
   * - "dashboard": charts, auto-refresh, terminal, and data visualizer
   * - "docs": docs sidebar and version list
   * - "versions": version list
   * - "api": terminal and auto-refresh
   * - "data": data visualizer and auto-refresh
   * - default: auto-refresh and terminal
   */
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

  /**
   * Mark the navigation link that corresponds to the current page as active.
   *
   * Adds the `active` class to anchors inside <nav> whose href matches the current
   * page's last pathname segment. Treats the site root as "index.html" and matches
   * anchors with href="/" to the root.
   */
  function markActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === path || (path === 'index.html' && href === '/')) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Bootstrap the application's UI, services, and plugins on page load.
   *
   * Loads persisted settings, applies the resolved theme, initializes UI components
   * (theme toggle, sidebar, logo placeholders, settings panel), sets up authentication
   * controls, marks the active navigation link, initializes page-specific features,
   * and registers a default "echo-plugin".
   */
  function init() {
    loadSettings();
    applyTheme();
    initThemeToggle();
    initSidebar();
    initLogoPlaceholders();
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