
// basic theme persistence
(function initTheme(){
  const saved = localStorage.getItem('netobs_theme');
  if(saved){
    document.body.classList.remove('dark','light');
    document.body.classList.add(saved);
  } else {
    document.body.classList.add('dark');
  }
})();

function toggleTheme(){
  if(document.body.classList.contains('dark')){
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    localStorage.setItem('netobs_theme','light');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('netobs_theme','dark');
  }
}

function toggleSidebar(){
  const sb = document.querySelector('.sidebar');
  if(sb) sb.classList.toggle('collapsed');
}

function toggleSettings(){
  const panel = document.getElementById('settingsPanel');
  if(panel) panel.classList.toggle('hidden');
}

// config storage
function loadConfig(){
  try{
    const raw = localStorage.getItem('netobs_config');
    if(!raw) return {};
    return JSON.parse(raw);
  }catch(e){ return {}; }
}
function saveConfig(cfg){
  localStorage.setItem('netobs_config', JSON.stringify(cfg || {}));
}

// apply config to settings UI
function bindSettingsUI(){
  const cfg = loadConfig();
  const ep = document.getElementById('cfgEndpoint');
  const iv = document.getElementById('cfgInterval');
  const ad = document.getElementById('cfgAuthDomain');
  const ac = document.getElementById('cfgAuthClient');
  if(ep) ep.value = cfg.endpoint || '/api/censys-summary';
  if(iv) iv.value = cfg.interval || 60;
  if(ad) ad.value = cfg.auth0Domain || '';
  if(ac) ac.value = cfg.auth0Client || '';

  const saveBtn = document.getElementById('cfgSaveBtn');
  if(saveBtn){
    saveBtn.onclick = () => {
      const newCfg = {
        endpoint: ep ? ep.value || '/api/censys-summary' : '/api/censys-summary',
        interval: iv ? parseInt(iv.value || '60', 10) : 60,
        auth0Domain: ad ? ad.value : '',
        auth0Client: ac ? ac.value : ''
      };
      saveConfig(newCfg);
      alert('Settings saved locally.');
    };
  }
}

// search filter
const searchBox = document.getElementById('searchBox');
if(searchBox){
  searchBox.addEventListener('input', function(){
    const text = this.value.toLowerCase();
    document.querySelectorAll('main section').forEach(sec=>{
      if(!text){ sec.style.display='block'; return; }
      sec.style.display = sec.innerText.toLowerCase().includes(text)?'block':'none';
    });
  });
}

// safety: ensure intro disappears eventually
setTimeout(()=>{
  const intro = document.getElementById('terminalIntro');
  if(intro) intro.style.display='none';
}, 8000);

// live stats loop
let liveIntervalId = null;

async function loadLiveStatsOnce(){
  const cfg = loadConfig();
  const endpoint = cfg.endpoint || '/api/censys-summary';

  let data;
  try {
    const res = await fetch(endpoint, {cache:'no-store'});
    if(res.ok){
      data = await res.json();
    }
  } catch(e){
    // ignore, fallback
  }
  if(!data){
    // demo data
    data = {
      total_hosts: 123456789,
      total_services: 987654321,
      last_sync: new Date().toISOString(),
      countries: { US: 120, DE: 80, NL: 42, AU: 35, GB: 60, FR: 55 },
      services: { http: 80, https: 95, ssh: 40, rdp: 12, smtp: 22, dns: 60 }
    };
  }

  updateLiveUI(data);
  initTrafficChart(data);
  initWorldMap(data.countries || {});
  renderPlugins();
}

function startLiveLoop(){
  const cfg = loadConfig();
  const seconds = cfg.interval || 60;
  if(liveIntervalId) clearInterval(liveIntervalId);
  loadLiveStatsOnce();
  liveIntervalId = setInterval(loadLiveStatsOnce, seconds * 1000);
}

function updateLiveUI(data){
  const homeHosts = document.getElementById('card-live-hosts');
  const homeServices = document.getElementById('card-live-services');
  const homeSync = document.getElementById('card-live-sync');
  const dashHosts = document.getElementById('live-total-hosts');
  const dashServices = document.getElementById('live-total-services');
  const dashSync = document.getElementById('live-last-sync');

  if(homeHosts) homeHosts.textContent = 'Total hosts: ' + data.total_hosts.toLocaleString();
  if(homeServices) homeServices.textContent = 'Tracked services: ' + data.total_services.toLocaleString();
  if(homeSync) homeSync.textContent = 'Sync: ' + new Date(data.last_sync).toLocaleString();

  if(dashHosts) dashHosts.textContent = data.total_hosts.toLocaleString();
  if(dashServices) dashServices.textContent = data.total_services.toLocaleString();
  if(dashSync) dashSync.textContent = new Date(data.last_sync).toLocaleString();
}

// Chart.js traffic chart
function initTrafficChart(data){
  const canvas = document.getElementById('trafficChart');
  if(!canvas || typeof Chart === 'undefined') return;

  const svc = data.services || {};
  const labels = Object.keys(svc).length ? Object.keys(svc) : ['http','https','ssh','rdp','smtp','dns'];
  const counts = Object.keys(svc).length ? Object.values(svc) : [80,95,40,12,22,60];

  if(window._trafficChartInstance){
    window._trafficChartInstance.data.labels = labels;
    window._trafficChartInstance.data.datasets[0].data = counts;
    window._trafficChartInstance.update();
    return;
  }

  window._trafficChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Relative Exposure',
        data: counts,
      }]
    },
    options: {
      responsive:true,
      plugins: {
        legend:{ display:false }
      },
      scales: {
        x:{ ticks:{ color:'#7fc6ff' }},
        y:{ ticks:{ color:'#7fc6ff' }}
      }
    }
  });
}

// D3 world heatmap
function initWorldMap(countryData){
  const svg = document.getElementById('worldMap');
  if(!svg || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

  const width = 960, height = 480;
  const projection = d3.geoMercator().scale(150).translate([width/2, height/1.5]);
  const path = d3.geoPath().projection(projection);

  const sel = d3.select(svg);
  sel.selectAll('*').remove();

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(worldData => {
      const countries = topojson.feature(worldData, worldData.objects.countries).features;

      const values = Object.values(countryData || {});
      const max = values.length ? Math.max(...values) : 1;
      const color = d3.scaleSequential(d3.interpolateCool).domain([0, max || 1]);

      sel.selectAll('path')
        .data(countries)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', d => {
          // Without ISO mapping we approximate with random mapping based on provided values:
          if(!values.length) return color(0);
          const v = values[Math.floor(Math.random()*values.length)];
          return color(v);
        })
        .attr('stroke', '#050915')
        .attr('stroke-width', 0.4)
        .append('title')
        .text('Demo exposure value');
    })
    .catch(err => {
      console.error('Failed to load world map', err);
    });
}

// Terminal command runner
function initTerminal(){
  const input = document.getElementById('terminalInput');
  const output = document.getElementById('terminalOutput');
  if(!input || !output) return;

  function log(line){
    output.textContent += line + "\n";
    output.scrollTop = output.scrollHeight;
  }

  log("Type 'help' for available commands.");

  input.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){
      const cmd = input.value.trim();
      input.value = '';
      if(!cmd) return;
      log("net-observation> " + cmd);
      handleCommand(cmd, log);
    }
  });
}

function handleCommand(cmd, log){
  const parts = cmd.split(/\s+/);
  const main = parts[0].toLowerCase();
  if(main === 'help'){
    log("Commands: help, stats, theme dark, theme light, plugins, reload");
  } else if(main === 'stats'){
    const cfg = loadConfig();
    log("Endpoint: " + (cfg.endpoint || '/api/censys-summary'));
    log("Interval: " + (cfg.interval || 60) + "s");
  } else if(main === 'theme'){
    const arg = (parts[1] || '').toLowerCase();
    if(arg === 'dark'){ document.body.classList.add('dark'); document.body.classList.remove('light'); saveTheme('dark'); }
    else if(arg === 'light'){ document.body.classList.add('light'); document.body.classList.remove('dark'); saveTheme('light'); }
    log("Theme set to " + arg);
  } else if(main === 'plugins'){
    if(window.NET_OBS_PLUGINS && window.NET_OBS_PLUGINS.length){
      window.NET_OBS_PLUGINS.forEach(p=>log("Plugin: " + p.id + " – " + p.title));
    } else {
      log("No plugins registered.");
    }
  } else if(main === 'reload'){
    loadLiveStatsOnce();
    log("Reloaded live stats.");
  } else {
    log("Unknown command.");
  }
}

function saveTheme(t){
  localStorage.setItem('netobs_theme', t);
}

// Plugin system
window.NET_OBS_PLUGINS = window.NET_OBS_PLUGINS || [];

// example plugin
window.NET_OBS_PLUGINS.push({
  id: 'demo-top-asn',
  title: 'Top ASNs (demo)',
  render: function(container){
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = '<h3>Top ASNs (demo)</h3><p>AS13335 (Cloudflare)<br>AS15169 (Google)<br>AS16509 (Amazon)</p>';
    container.appendChild(div);
  }
});

function renderPlugins(){
  const grid = document.getElementById('pluginGrid');
  if(!grid || !window.NET_OBS_PLUGINS) return;
  grid.innerHTML = '';
  window.NET_OBS_PLUGINS.forEach(p=>{
    if(typeof p.render === 'function'){
      p.render(grid);
    }
  });
}

// Data visualizer
function renderData(){
  const input = document.getElementById('dataInput');
  const out = document.getElementById('dataOutput');
  const summary = document.getElementById('dataSummary');
  if(!input || !out || !summary) return;

  let text = input.value.trim();
  if(!text){
    out.innerHTML = '';
    summary.textContent = 'No data.';
    return;
  }

  let rows = [];
  let mode = 'json';
  try{
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)){
      rows = parsed;
    } else {
      rows = [parsed];
    }
  } catch(e){
    mode = 'csv';
  }

  if(mode === 'csv'){
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(',').map(s=>s.trim());
    rows = lines.slice(1).map(line=>{
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h,i)=>{ obj[h] = cols[i] || ''; });
      return obj;
    });
  }

  if(!rows.length){
    out.innerHTML = '';
    summary.textContent = 'No rows parsed.';
    return;
  }

  const keys = Object.keys(rows[0]);
  summary.textContent = `Parsed ${rows.length} rows with ${keys.length} columns.`;

  let html = '<table><thead><tr>';
  keys.forEach(k=>{ html += '<th>'+k+'</th>'; });
  html += '</tr></thead><tbody>';
  rows.forEach(r=>{
    html += '<tr>';
    keys.forEach(k=>{ html += '<td>'+String(r[k])+'</td>'; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  out.innerHTML = html;
}

function clearData(){
  const input = document.getElementById('dataInput');
  const out = document.getElementById('dataOutput');
  const summary = document.getElementById('dataSummary');
  if(input) input.value = '';
  if(out) out.innerHTML = '';
  if(summary) summary.textContent = 'Cleared.';
}

// Auth0 front-end hooks (optional)
let auth0Client = null;

async function initAuth0IfConfigured(){
  const cfg = loadConfig();
  if(!cfg.auth0Domain || !cfg.auth0Client || !window.createAuth0Client){
    return;
  }
  try{
    auth0Client = await createAuth0Client({
      domain: cfg.auth0Domain,
      clientId: cfg.auth0Client,
      cacheLocation: 'localstorage'
    });
    const isAuth = await auth0Client.isAuthenticated();
    updateAuthUI(isAuth);
  } catch(e){
    console.warn('Auth0 init failed (probably not configured):', e);
  }
}

function updateAuthUI(isAuth){
  const loginBtn = document.getElementById('authLoginBtn');
  const logoutBtn = document.getElementById('authLogoutBtn');
  const status = document.getElementById('authStatus');
  if(!status) return;
  if(isAuth){
    if(loginBtn) loginBtn.classList.add('hidden');
    if(logoutBtn) logoutBtn.classList.remove('hidden');
    status.textContent = 'Auth: logged in';
  } else {
    if(loginBtn) loginBtn.classList.remove('hidden');
    if(logoutBtn) logoutBtn.classList.add('hidden');
    status.textContent = 'Auth: anon';
  }
}

async function bindAuthButtons(){
  const loginBtn = document.getElementById('authLoginBtn');
  const logoutBtn = document.getElementById('authLogoutBtn');
  if(loginBtn){
    loginBtn.onclick = async () => {
      if(!auth0Client){ alert('Auth0 not configured in Settings.'); return; }
      await auth0Client.loginWithRedirect({ redirect_uri: window.location.href });
    };
  }
  if(logoutBtn){
    logoutBtn.onclick = async () => {
      if(!auth0Client) return;
      await auth0Client.logout({ returnTo: window.location.href });
      updateAuthUI(false);
    };
  }
}

// init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  bindSettingsUI();
  initTerminal();
  startLiveLoop();
  initAuth0IfConfigured();
  bindAuthButtons();
});
