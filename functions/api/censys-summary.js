/**
 * Handle an HTTP request and return a consolidated summary of Censys host, service, and country statistics.
 *
 * @param {object} context - Execution context containing environment variables and runtime helpers.
 * @param {object} context.env - Environment variables.
 * @param {string} context.env.CENSYS_API_ID - Censys API ID used for Basic authentication.
 * @param {string} context.env.CENSYS_API_SECRET - Censys API secret used for Basic authentication.
 * @returns {Response} A Response whose JSON body on success contains:
 *   - total_hosts: total number of hosts,
 *   - total_services: summed count of reported services,
 *   - last_sync: ISO timestamp of the query,
 *   - countries: map of uppercased country codes to counts,
 *   - services: map of service names to counts.
 *   On error the response contains an error message, details, last_sync, and zero/empty metrics, with an appropriate HTTP status.
 */
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
 * Return standard HTTP headers for JSON responses with no-cache directives.
 * @returns {{'Content-Type': string, 'Cache-Control': string}} An object containing headers: `Content-Type` set to `application/json` and `Cache-Control` set to `no-store, no-cache, must-revalidate`.
 */
function responseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}