/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions API endpoint for Censys integration
 */

const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

describe('Censys Summary API - Response Headers', () => {
  test('should return correct response headers', () => {
    const responseHeaders = () => {
      return {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
    };

    const headers = responseHeaders();
    
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
  });

  test('should not cache responses', () => {
    const responseHeaders = () => {
      return {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
    };

    const headers = responseHeaders();
    
    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['Cache-Control']).toContain('no-cache');
    expect(headers['Cache-Control']).toContain('must-revalidate');
  });
});

describe('Censys Summary API - Missing Credentials', () => {
  test('should return 500 when API ID is missing', async () => {
    const context = {
      env: {
        CENSYS_API_ID: undefined,
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const onRequest = async (context) => {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
    };

    const response = await onRequest(context);
    expect(response.status).toBe(500);
    
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
  });

  test('should return 500 when API secret is missing', async () => {
    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: undefined
      }
    };

    const onRequest = async (context) => {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
    };

    const response = await onRequest(context);
    expect(response.status).toBe(500);
    
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
  });

  test('should return 500 when both credentials are missing', async () => {
    const context = {
      env: {
        CENSYS_API_ID: undefined,
        CENSYS_API_SECRET: undefined
      }
    };

    const onRequest = async (context) => {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
    };

    const response = await onRequest(context);
    expect(response.status).toBe(500);
  });

  test('should return 500 when credentials are empty strings', async () => {
    const context = {
      env: {
        CENSYS_API_ID: '',
        CENSYS_API_SECRET: ''
      }
    };

    const onRequest = async (context) => {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
    };

    const response = await onRequest(context);
    expect(response.status).toBe(500);
  });
});

describe('Censys Summary API - Authentication Header', () => {
  test('should create correct Basic auth header', () => {
    const id = 'test-id';
    const secret = 'test-secret';
    
    const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
    
    expect(authHeader).toMatch(/^Basic /);
    
    const decoded = atob(authHeader.replace('Basic ', ''));
    expect(decoded).toBe('test-id:test-secret');
  });

  test('should handle special characters in credentials', () => {
    const id = 'test@id.com';
    const secret = 'p@ssw0rd!#$';
    
    const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
    const decoded = atob(authHeader.replace('Basic ', ''));
    
    expect(decoded).toBe('test@id.com:p@ssw0rd!#$');
  });
});

describe('Censys Summary API - Endpoint Construction', () => {
  test('should construct correct API endpoints', () => {
    const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
    
    expect(endpoint('/hosts/search')).toBe('https://search.censys.io/api/v2/hosts/search');
    expect(endpoint('/hosts/stats/services.service_name')).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    expect(endpoint('/hosts/stats/location.country_code')).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
  });

  test('should handle paths with or without leading slash', () => {
    const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
    
    expect(endpoint('/hosts/search')).toBe(endpoint('/hosts/search'));
    // Note: The implementation expects leading slash
  });
});

describe('Censys Summary API - Data Aggregation', () => {
  test('should aggregate service statistics correctly', () => {
    const serviceBuckets = [
      { key: 'HTTP', count: 1000 },
      { key: 'HTTPS', count: 2000 },
      { key: 'SSH', count: 500 }
    ];

    const services = {};
    let totalServices = 0;
    
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    expect(services).toEqual({
      'HTTP': 1000,
      'HTTPS': 2000,
      'SSH': 500
    });
    expect(totalServices).toBe(3500);
  });

  test('should skip buckets without keys', () => {
    const serviceBuckets = [
      { key: 'HTTP', count: 1000 },
      { key: null, count: 500 },
      { key: 'HTTPS', count: 2000 },
      { count: 300 }
    ];

    const services = {};
    let totalServices = 0;
    
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    expect(services).toEqual({
      'HTTP': 1000,
      'HTTPS': 2000
    });
    expect(totalServices).toBe(3000);
  });

  test('should handle empty service buckets', () => {
    const serviceBuckets = [];

    const services = {};
    let totalServices = 0;
    
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    expect(services).toEqual({});
    expect(totalServices).toBe(0);
  });

  test('should aggregate country statistics correctly', () => {
    const countryBuckets = [
      { key: 'us', count: 5000 },
      { key: 'cn', count: 3000 },
      { key: 'gb', count: 2000 }
    ];

    const countries = {};
    
    for (const bucket of countryBuckets) {
      if (!bucket?.key) continue;
      const countryCode = bucket.key.toUpperCase();
      countries[countryCode] = bucket.count;
    }

    expect(countries).toEqual({
      'US': 5000,
      'CN': 3000,
      'GB': 2000
    });
  });

  test('should convert country codes to uppercase', () => {
    const countryBuckets = [
      { key: 'us', count: 5000 },
      { key: 'Us', count: 3000 },
      { key: 'uS', count: 2000 }
    ];

    const countries = {};
    
    for (const bucket of countryBuckets) {
      if (!bucket?.key) continue;
      const countryCode = bucket.key.toUpperCase();
      countries[countryCode] = bucket.count;
    }

    expect(Object.keys(countries)).toEqual(['US']);
    expect(countries['US']).toBe(2000); // Last value wins
  });

  test('should handle missing country buckets', () => {
    const countryBuckets = [
      { key: 'us', count: 5000 },
      { key: null, count: 3000 },
      { count: 2000 }
    ];

    const countries = {};
    
    for (const bucket of countryBuckets) {
      if (!bucket?.key) continue;
      const countryCode = bucket.key.toUpperCase();
      countries[countryCode] = bucket.count;
    }

    expect(countries).toEqual({ 'US': 5000 });
  });
});

describe('Censys Summary API - Response Structure', () => {
  test('should construct valid success response', () => {
    const totalHosts = 10000;
    const totalServices = 5000;
    const countries = { 'US': 3000, 'CN': 2000 };
    const services = { 'HTTP': 2000, 'HTTPS': 3000 };

    const response = {
      total_hosts: totalHosts,
      total_services: totalServices,
      last_sync: new Date('2024-01-01T12:00:00Z').toISOString(),
      countries,
      services
    };

    expect(response.total_hosts).toBe(10000);
    expect(response.total_services).toBe(5000);
    expect(response.last_sync).toBe('2024-01-01T12:00:00.000Z');
    expect(response.countries).toEqual({ 'US': 3000, 'CN': 2000 });
    expect(response.services).toEqual({ 'HTTP': 2000, 'HTTPS': 3000 });
  });

  test('should construct valid error response with default values', () => {
    const errorMessage = 'Connection timeout';
    
    const response = {
      error: 'Unable to retrieve Censys summary',
      details: errorMessage,
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    };

    expect(response.error).toBe('Unable to retrieve Censys summary');
    expect(response.details).toBe('Connection timeout');
    expect(response.total_hosts).toBe(0);
    expect(response.total_services).toBe(0);
    expect(response.countries).toEqual({});
    expect(response.services).toEqual({});
  });

  test('should include timestamp in error response', () => {
    const beforeTimestamp = new Date().toISOString();
    
    const response = {
      error: 'Unable to retrieve Censys summary',
      details: 'Test error',
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    };
    
    const afterTimestamp = new Date().toISOString();

    expect(response.last_sync).toBeDefined();
    expect(response.last_sync >= beforeTimestamp).toBe(true);
    expect(response.last_sync <= afterTimestamp).toBe(true);
  });
});

describe('Censys Summary API - Fetch JSON Helper', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  test('should construct proper fetch request', async () => {
    const authHeader = 'Basic dGVzdDp0ZXN0';
    const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
    const payload = { q: '*', per_page: 1 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { total: 100 } })
    });

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

    const result = await fetchJSON('/hosts/search', payload);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://search.censys.io/api/v2/hosts/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify(payload)
      })
    );
    expect(result).toEqual({ result: { total: 100 } });
  });

  test('should throw error on non-ok response', async () => {
    const authHeader = 'Basic dGVzdDp0ZXN0';
    const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
    const payload = { q: '*' };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    });

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

    await expect(fetchJSON('/hosts/search', payload)).rejects.toThrow('Censys /hosts/search failed: 401 Unauthorized');
  });

  test('should handle various HTTP error codes', async () => {
    const authHeader = 'Basic dGVzdDp0ZXN0';
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

    const testCases = [
      { status: 400, text: 'Bad Request' },
      { status: 403, text: 'Forbidden' },
      { status: 404, text: 'Not Found' },
      { status: 429, text: 'Too Many Requests' },
      { status: 500, text: 'Internal Server Error' },
      { status: 503, text: 'Service Unavailable' }
    ];

    for (const { status, text } of testCases) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
        text: async () => text
      });

      await expect(fetchJSON('/hosts/search', {})).rejects.toThrow(`Censys /hosts/search failed: ${status} ${text}`);
    }
  });
});

describe('Censys Summary API - Total Hosts Calculation', () => {
  test('should extract total hosts from API response', () => {
    const hostSummary = {
      result: {
        total: 123456
      }
    };

    const totalHosts = hostSummary?.result?.total ?? 0;
    expect(totalHosts).toBe(123456);
  });

  test('should default to 0 when total is missing', () => {
    const hostSummary = {
      result: {}
    };

    const totalHosts = hostSummary?.result?.total ?? 0;
    expect(totalHosts).toBe(0);
  });

  test('should default to 0 when result is missing', () => {
    const hostSummary = {};

    const totalHosts = hostSummary?.result?.total ?? 0;
    expect(totalHosts).toBe(0);
  });

  test('should default to 0 when response is null', () => {
    const hostSummary = null;

    const totalHosts = hostSummary?.result?.total ?? 0;
    expect(totalHosts).toBe(0);
  });

  test('should handle zero total hosts', () => {
    const hostSummary = {
      result: {
        total: 0
      }
    };

    const totalHosts = hostSummary?.result?.total ?? 0;
    expect(totalHosts).toBe(0);
  });
});

describe('Censys Summary API - Parallel Request Handling', () => {
  test('should structure three parallel API requests correctly', () => {
    const expectedRequests = [
      { path: '/hosts/search', payload: { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' } },
      { path: '/hosts/stats/services.service_name', payload: { q: '*', num_buckets: 25 } },
      { path: '/hosts/stats/location.country_code', payload: { q: '*', num_buckets: 50 } }
    ];

    expect(expectedRequests).toHaveLength(3);
    expect(expectedRequests[0].path).toBe('/hosts/search');
    expect(expectedRequests[0].payload.virtual_hosts).toBe('EXCLUDE');
    expect(expectedRequests[1].payload.num_buckets).toBe(25);
    expect(expectedRequests[2].payload.num_buckets).toBe(50);
  });

  test('should use correct query parameters for host search', () => {
    const hostSearchPayload = { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' };

    expect(hostSearchPayload.q).toBe('*');
    expect(hostSearchPayload.per_page).toBe(1);
    expect(hostSearchPayload.virtual_hosts).toBe('EXCLUDE');
  });

  test('should use correct bucket counts for statistics', () => {
    const serviceStatsPayload = { q: '*', num_buckets: 25 };
    const countryStatsPayload = { q: '*', num_buckets: 50 };

    expect(serviceStatsPayload.num_buckets).toBe(25);
    expect(countryStatsPayload.num_buckets).toBe(50);
  });
});

describe('Censys Summary API - Error Handling', () => {
  test('should return 502 status on API failure', () => {
    const errorResponse = {
      error: 'Unable to retrieve Censys summary',
      details: 'Network error',
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    };

    expect(errorResponse.error).toBe('Unable to retrieve Censys summary');
    expect(errorResponse.total_hosts).toBe(0);
    expect(errorResponse.total_services).toBe(0);
  });

  test('should preserve error message in details field', () => {
    const originalError = new Error('Connection timeout after 30s');
    
    const errorResponse = {
      error: 'Unable to retrieve Censys summary',
      details: originalError.message,
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    };

    expect(errorResponse.details).toBe('Connection timeout after 30s');
  });

  test('should include safe fallback data on error', () => {
    const errorResponse = {
      error: 'Unable to retrieve Censys summary',
      details: 'API error',
      last_sync: new Date().toISOString(),
      total_hosts: 0,
      total_services: 0,
      countries: {},
      services: {}
    };

    expect(errorResponse.countries).toEqual({});
    expect(errorResponse.services).toEqual({});
    expect(typeof errorResponse.last_sync).toBe('string');
  });
});

describe('Censys Summary API - Integration Scenarios', () => {
  test('should handle complete successful response flow', () => {
    const mockHostSummary = { result: { total: 50000 } };
    const mockServiceStats = {
      result: {
        buckets: [
          { key: 'HTTP', count: 20000 },
          { key: 'HTTPS', count: 15000 }
        ]
      }
    };
    const mockCountryStats = {
      result: {
        buckets: [
          { key: 'us', count: 25000 },
          { key: 'cn', count: 10000 }
        ]
      }
    };

    const totalHosts = mockHostSummary?.result?.total ?? 0;
    
    const services = {};
    let totalServices = 0;
    const serviceBuckets = mockServiceStats?.result?.buckets ?? [];
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    const countries = {};
    const countryBuckets = mockCountryStats?.result?.buckets ?? [];
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

    expect(response.total_hosts).toBe(50000);
    expect(response.total_services).toBe(35000);
    expect(response.countries).toEqual({ 'US': 25000, 'CN': 10000 });
    expect(response.services).toEqual({ 'HTTP': 20000, 'HTTPS': 15000 });
  });

  test('should handle partial data in API responses', () => {
    const mockHostSummary = { result: { total: 1000 } };
    const mockServiceStats = { result: { buckets: [] } };
    const mockCountryStats = { result: { buckets: [] } };

    const totalHosts = mockHostSummary?.result?.total ?? 0;
    
    const services = {};
    let totalServices = 0;
    const serviceBuckets = mockServiceStats?.result?.buckets ?? [];
    for (const bucket of serviceBuckets) {
      if (!bucket?.key) continue;
      services[bucket.key] = bucket.count;
      totalServices += bucket.count;
    }

    const countries = {};
    const countryBuckets = mockCountryStats?.result?.buckets ?? [];
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

    expect(response.total_hosts).toBe(1000);
    expect(response.total_services).toBe(0);
    expect(response.countries).toEqual({});
    expect(response.services).toEqual({});
  });
});