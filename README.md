# Net Observation Project

Cyber-neon observability suite pairing a responsive Cloudflare Pages frontend with a zero-cold-start Pages Function that aggregates live intelligence from the Censys Search v2 API.

## Directory Layout

```
net-observation-project/
  docs/                 # Frontend assets served by Cloudflare Pages
  functions/api/        # Cloudflare Pages Functions (backend)
  README.md             # Project documentation
  .gitignore            # Common project ignores
```

> **Branding note:** the layouts reference `docs/logo.png` for the site mark. The repository intentionally leaves that asset out—drop in your own PNG (ideally 512×512 with transparency) before shipping so the header and sidebar automatically pick it up.

## Features

- Animated cyber-neon theme with automatic dark/light behaviour and manual override.
- Collapsible sidebar navigation mirrored on every page for rapid context switching.
- Live `/api/censys-summary` polling drives Chart.js charts, D3 world heatmap, and terminal outputs.
- Terminal-style command runner with plugin registration API and sample plugin.
- JSON/CSV data visualiser supporting clipboard paste or file uploads.
- Settings control for backend endpoint and Auth0 SPA configuration with local persistence.
- Optional Auth0 login wiring (via `@auth0/auth0-spa-js`) when credentials are supplied.
- Versions hub highlighting roadmap milestones and multi-version documentation sidebar.

## Running Locally

1. **Clone the repository** and install any tooling you prefer for static hosting (e.g. `npm install --global wrangler` for Cloudflare previews).
2. **Serve the frontend** by pointing a static server at the `docs/` directory:
   ```bash
   npx http-server docs
   ```
   or use the Cloudflare Pages preview command:
   ```bash
   npx wrangler pages dev docs --local --persist
   ```
3. **Configure environment variables** for the backend function:
   ```bash
   export CENSYS_API_ID="your-censys-id"
   export CENSYS_API_SECRET="your-censys-secret"
   ```
4. **Run the function locally** with Wrangler (optional but recommended):
   ```bash
   npx wrangler pages dev docs --local --persist \
     --binding CENSYS_API_ID=$CENSYS_API_ID \
     --binding CENSYS_API_SECRET=$CENSYS_API_SECRET
   ```
   The function is available at <http://localhost:8788/api/censys-summary> during development.

## Deploying to Cloudflare Pages

1. **Create a Pages project** and connect it to this repository.
2. **Set the build output directory** to `docs` (no build command required unless you add one).
3. **Add environment variables** under *Pages → Settings → Environment Variables*:
   - `CENSYS_API_ID`
   - `CENSYS_API_SECRET`
4. **Deploy**. Cloudflare automatically bundles `functions/api/censys-summary.js` as a Pages Function and exposes it at `/api/censys-summary` in production and preview environments.

## Backend Function

`functions/api/censys-summary.js` performs three parallel Censys API calls:

- `/hosts/search` to collect the global host count.
- `/hosts/stats/services.service_name` to aggregate service coverage.
- `/hosts/stats/location.country_code` to map per-country exposure.

Responses are merged into a single JSON payload:

```json
{
  "total_hosts": 123,
  "total_services": 456,
  "last_sync": "2025-01-01T12:00:00.000Z",
  "countries": { "US": 120, "DE": 30 },
  "services": { "http": 80, "https": 95 }
}
```

Error conditions return a structured 502 response with diagnostic details while preserving the response schema.

## Auth0 Integration

Add your Auth0 domain and SPA client ID in the settings panel (gear icon bottom right). When supplied, the frontend initialises the Auth0 SPA SDK, exposing Login/Logout buttons in the top navigation and reflecting session state in real time.

## Plugin System

Developers can extend the UI by registering plugins at runtime:

```html
<script>
registerPlugin({
  name: 'intel-export',
  command: 'export',
  run(_, { state }) {
    return JSON.stringify(state.stats, null, 2);
  }
});
</script>
```

Plugins can provide new terminal commands, react to telemetry updates via the shared app state, and stream output to the command console using the `log` helper passed to each `run` invocation.
