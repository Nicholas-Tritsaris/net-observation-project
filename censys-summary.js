// Cloudflare Worker: /api/censys-summary
// Secure backend proxy → Used by your GitHub Pages dashboard

export default {
  async fetch(request, env, ctx) {
    // Get credentials from Cloudflare KV/Env Vars
    const apiId = env.CENSYS_API_ID;
    const apiSecret = env.CENSYS_API_SECRET;

    if (!apiId || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Missing Censys credentials in Worker env" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic authorization
    const authHeader = "Basic " + btoa(`${apiId}:${apiSecret}`);

    // Pull IPv4 scan summary
    const url = "https://search.censys.io/api/v2/hosts/search?q=services.service_name:*&per_page=1";

    let summary;
    try {
      const res = await fetch(url, {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("Censys API error");

      const json = await res.json();

      summary = json.result || {};
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Failed to query Censys", details: err.message }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract approximate totals (Censys API v2 method)
    const totalHosts = summary.total || 0;

    // Service frequency aggregation
    const serviceCounts = {};
    const countryCounts = {};

    if (summary.facets) {
      if (summary.facets["services.service_name"]) {
        for (const svc of summary.facets["services.service_name"]) {
          serviceCounts[svc.name] = svc.count;
        }
      }

      if (summary.facets["location.country"]) {
        for (const c of summary.facets["location.country"]) {
          countryCounts[c.name] = c.count;
        }
      }
    }

    // Build response
    const output = {
      total_hosts: totalHosts,
      total_services: Object.values(serviceCounts).reduce((a, b) => a + b, 0),
      last_sync: new Date().toISOString(),
      countries: countryCounts,
      services: serviceCounts
    };

    return new Response(JSON.stringify(output, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
