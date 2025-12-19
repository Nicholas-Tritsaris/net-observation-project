/**
 * Handle an HTTP request that fetches and aggregates Censys host, service, and country statistics, then returns a JSON summary.
 *
 * @param {object} context - Request context object containing environment variables under `env` (expects `CENSYS_API_ID` and `CENSYS_API_SECRET`).
 * @returns {Response} An HTTP Response whose JSON body on success contains:
 *   - `total_hosts` (number): total host count,
 *   - `total_services` (number): aggregated service counts,
 *   - `last_sync` (string): ISO timestamp of the response,
 *   - `countries` (object): map of uppercased country codes to counts,
 *   - `services` (object): map of service names to counts.
 *   On failure the JSON body contains an `error` message, `details` with error information, `last_sync`, and empty/fallback totals and maps. */
export async function onRequest(context) {
  const { env } = context;
  const id = env.CENSYS_API_ID;
  const secret = env.CENSYS_API_SECRET;

  if (!id || !secret) {
    return new Response(JSON.stringify({
      error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
    }), {
      status: 500,
      headers: responseHeaders()
    });
  }

  const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
  const endpoint = (path) => `https://search.censys.io/api/v2${path}`;

  const fetchJSON = async (path, payload) => {
    const res = await fetch(endpoint(path), {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Censys ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  };

  try {
    const [hostSummary, serviceStats, countryStats] = await Promise.all([
      fetchJSON('/hosts/search', { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' }),
      fetchJSON('/hosts/stats/services.service_name', { q: '*', num_buckets: 25 }),
      fetchJSON('/hosts/stats/location.country_code', { q: '*', num_buckets: 50 })
    ]);

    const totalHosts = hostSummary?.result?.total ?? 0;
    const services = {};
    let totalServices = 0;
    const serviceBuckets = serviceStats?.result?.buckets ?? [];
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    const countries = {};
    const countryBuckets = countryStats?.result?.buckets ?? [];
    for (const bucket of countryBuckets) {
      if (!bucket?.key) continue;
      const countryCode = bucket.key.toUpperCase();
      countries[countryCode] = bucket.count;
    }

    const response = {
      total_hosts: totalHosts,
      total_services: totalServices,
      last_sync: new Date().toISOString(),
      countries,
      services
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: responseHeaders()
    });
  } catch (error) {
    console.error('Censys summary error:', error);
    return new Response(JSON.stringify({
      error: 'Unable to retrieve Censys summary',
      details: error.message,
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    }), {
      status: 502,
      headers: responseHeaders()
    });
  }
}

/**
 * Return standard JSON response headers with caching disabled.
 * @returns {{'Content-Type': string, 'Cache-Control': string}} Headers object with `Content-Type` set to "application/json" and `Cache-Control` set to "no-store, no-cache, must-revalidate".
 */
function responseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}