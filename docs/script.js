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
   * Load persisted settings from localStorage and merge them into AppState.settings.
   *
   * Looks up STORAGE_KEY in localStorage, parses the stored JSON if present, and
   * shallow-merges the parsed values into AppState.settings. If parsing or access
   * fails, the function leaves AppState.settings unchanged and logs a warning.
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
   * Persist the current application settings to localStorage.
   *
   * Stores AppState.settings as a JSON string under STORAGE_KEY, replacing any existing stored settings.
   */
  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.settings));
  }

  /**
   * Apply the current theme setting to the document.
   *
   * Resolves the 'auto' setting to the system color-scheme preference and sets the resulting theme
   * as the `data-theme` attribute on the document root and as `data-theme` on the body.
   * The source setting is read from `AppState.settings.theme`.
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
   * Replace missing or failed logo images with accessible text placeholders.
   *
   * For every <img> with a `data-logo` attribute, this adds a sibling <div class="logo-placeholder">
   * containing the image's uppercase alt text (or "Net Observation" if alt is empty) when the image
   * fails to load or has no intrinsic size. The original image is hidden and a `data-fallback="true"`
   * flag is set to avoid creating multiple fallbacks. Error and load events are used to detect failures.
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
   * Initialize the theme toggle control and wire its interactions.
   *
   * Sets up click and keyboard handlers to cycle the application's theme between
   * "auto", "dark", and "light", updates the toggle label, persists the chosen
   * theme to application settings, and applies the theme immediately. Also
   * listens for system color-scheme changes and reapplies the theme when the
   * current setting is "auto".
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
   * Initialize sidebar toggle behavior and responsive open/collapsed state.
   *
   * Adds a click handler to the element with class `sidebar-toggle` that toggles
   * the sidebar between open and collapsed states by adding/removing the
   * `open`/`collapsed` classes. The toggle control's `aria-expanded` attribute
   * and icon (innerHTML) are updated to reflect the current state. On load,
   * the sidebar starts collapsed when the viewport width is less than 880px and
   * open otherwise.
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
   * Selects the first element that matches a CSS selector.
   * @param {string} id - A CSS selector string.
   * @returns {Element|null} The first matching Element, or `null` if no match is found.
   */
  function qs(id) {
    return document.querySelector(id);
  }

  /**
   * Update application stats state and refresh the visible summary, tables, charts, and heatmap.
   *
   * Updates AppState.stats and populates DOM elements showing total hosts, total services, and last sync time.
   * Also re-renders the countries and services tables and refreshes charts and the world heatmap with the provided data.
   *
   * @param {Object} data - Summary data used to update state and UI.
   * @param {number} [data.total_hosts] - Total number of hosts.
   * @param {number} [data.total_services] - Total number of services.
   * @param {string|number} [data.last_sync] - Timestamp (ISO string or epoch) of the last sync.
   * @param {Object<string, number>} [data.countries] - Mapping of country identifiers to counts for the countries table/heatmap.
   * @param {Object<string, number>} [data.services] - Mapping of service names to counts for the services table/chart.
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
   * Populate a table body found by the given selector with rows generated from a mapping of labels to values.
   * @param {string} selector - CSS selector for the table element that contains a <tbody>.
   * @param {Object<string, number>} objectData - Mapping of label to numeric value; entries are rendered as rows sorted by value in descending order, with numbers formatted using the current locale.
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
   * Fetches the latest Censys summary from the configured backend and applies it to the UI.
   *
   * On success, stores the fetched summary as the current latest data, updates the stats view, and logs a success message to the terminal. On failure, logs a warning to the console and, unless suppressed, logs an error message to the terminal.
   * @param {boolean} [silent=false] - If true, suppresses the terminal error message when the fetch fails.
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
   * Starts the initial data fetch and schedules periodic refreshes of the Censys summary.
   *
   * Performs an immediate fetch of the Censys summary, then triggers subsequent fetches every 60 seconds.
   * Subsequent periodic fetches are invoked with the `silent` flag enabled.
   */
  function initAutoRefresh() {
    fetchCensysSummary();
    setInterval(() => fetchCensysSummary(true), 60000);
  }

  /**
   * Initialize Chart.js charts for services and countries and store them in AppState.charts when the corresponding canvas elements and Chart.js are available.
   *
   * If a services canvas with id "servicesChart" exists, creates a doughnut chart seeded with an empty dataset and a color palette. If a countries canvas with id "countriesChart" exists, creates a bar chart seeded with an empty dataset and a color palette.
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
   * Update the registered service and country charts in AppState using the provided counts.
   *
   * Updates each chart's labels, dataset values, and colors; service entries are sorted by count
   * in descending order, and country data is limited to the top 12 countries by count.
   *
   * @param {Object} data - Summary counts used to populate charts.
   * @param {Object.<string, number>} [data.services] - Map of service name to count.
   * @param {Object.<string, number>} [data.countries] - Map of country name to count.
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
   * Create a palette of HSL color strings for charting or UI elements.
   * @param {number} count - Number of colors to generate.
   * @param {string} seed - Seed that influences the starting hue; e.g., 'services' selects a different base hue.
   * @returns {string[]} An array of CSS color strings in HSL format with alpha (e.g., "hsl(... / 0.7)").
   */
  function generateColorPalette(count, seed) {
    const baseHue = seed === 'services' ? 180 : 300;
    return Array.from({ length: count }, (_, idx) => `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`);
  }

  /**
   * Initializes the in-page terminal UI, wiring input, run button, and command execution.
   *
   * Sets up a small command interpreter with built-in commands (help, stats, theme, settings, plugins),
   * supports plugin-provided commands via AppPlugins.getCommand, and logs results to the terminal via logTerminal.
   * Handlers may return a value or a Promise; asynchronous results are logged when they resolve. After execution the
   * input field is cleared. If the terminal element is not present the function is a no-op.
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
   * Append a timestamped line to the terminal output area and scroll it into view.
   * @param {string} message - The text to append to the element with class `terminal-output`.
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
   * Initializes the data visualizer UI that accepts JSON or CSV input and renders it for preview.
   *
   * Reads input from the textarea (#dataInput) or a selected file (#fileInput), parses JSON or CSV,
   * pretty-prints the resulting data structure into the output container (#dataOutput), and logs
   * success or parsing errors to the in-app terminal.
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
   * Initializes the settings panel UI: binds inputs to persisted settings, saves changes, and manages panel visibility.
   *
   * Populates form fields from AppState.settings, wires the form submit handler to persist updates (backendUrl defaults to "/api/censys-summary" when empty), reapplies the active theme, reinitializes Auth0, and logs a confirmation. Also wires the settings toggle to show/hide the panel and update the toggle icon and active state.
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
   * Initializes the Auth0 client when Auth0 is available and credentials are configured.
   *
   * If successful, stores the created client on AppState.auth0Client and updates auth-related UI controls.
   * If Auth0 is not available or required settings are missing, the function does nothing.
   * On initialization failure, a message is logged to the in-app terminal.
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
   * Update authentication UI controls and bind login/logout handlers based on Auth0 client state.
   *
   * Updates the status text to "Authenticated" or "Anonymous", toggles visibility of elements
   * with data-action="login" and data-action="logout", and attaches click handlers that
   * perform Auth0 login/logout and log the actions to the in-app terminal. If no Auth0 client
   * is configured, hides both buttons and sets the status to "Anonymous".
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
   * Render a world heatmap into the element with id "worldHeatmap" using provided country counts.
   *
   * Renders an interactive SVG world map colored by country counts from `data.countries`. Requires D3 and topojson; if world geometry is not yet loaded it will fetch it from a CDN. If the target element or required libraries are missing, the function no-ops.
   *
   * @param {Object} data - Data object containing country counts.
   * @param {Object<string, number>} [data.countries] - Mapping of country ISO codes (or names) to numeric counts used to color the map.
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
   * Enable smooth in-page scrolling for anchors inside the docs sidebar.
   *
   * Attaches click handlers to links within `.docs-sidebar` whose `href` starts with `#`.
   * For those links, prevents the default navigation and smoothly scrolls the referenced
   * element into view at the start of the viewport.
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
   * Renders a list of release/version cards into the element marked with `data-version-list`.
   *
   * If the element is not present, the function performs no action.
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
   * Initialize features for the current page based on the body's `data-page` attribute.
   *
   * Calls the appropriate initialization routines for recognized pages:
   * - 'dashboard': charts, auto-refresh, terminal, data visualizer
   * - 'docs': docs sidebar and version list
   * - 'versions': version list
   * - 'api': terminal and auto-refresh
   * - 'data': data visualizer and auto-refresh
   * For any other page, enables auto-refresh and the terminal.
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
   * Highlights the current page's navigation link by adding the `active` class.
   *
   * Compares the last segment of the current location pathname (defaults to "index.html")
   * against each anchor's `href` inside `nav`; treats `index.html` as equivalent to `/`.
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
   * Bootstraps the application by performing startup initialization of state, UI, auth, and plugins.
   *
   * Loads persisted settings, applies the resolved theme, initializes the theme toggle, sidebar,
   * logo placeholders, settings panel, and Auth0 client/controls; marks the active navigation,
   * initializes page-specific features, and registers the default echo plugin.
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