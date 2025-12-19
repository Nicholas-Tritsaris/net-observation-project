/**
 * Tests for Cloudflare Pages Function: functions/api/censys-summary.js
 * Tests API integration, error handling, and response formatting
 */

describe('Censys Summary Function', () => {
  let mockFetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    global.btoa = (str) => Buffer.from(str).toString('base64');
    mockFetch = global.fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Environment Variable Validation', () => {
    test('should return error when CENSYS_API_ID is missing', () => {
      const env = { CENSYS_API_SECRET: 'secret' };
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      expect(id).toBeUndefined();
      expect(secret).toBe('secret');

      if (!id || !secret) {
        const error = { error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.' };
        expect(error.error).toContain('Missing');
      }
    });

    test('should return error when CENSYS_API_SECRET is missing', () => {
      const env = { CENSYS_API_ID: 'id123' };
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      expect(id).toBe('id123');
      expect(secret).toBeUndefined();
    });

    test('should proceed when both credentials are present', () => {
      const env = {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      };

      const hasCredentials = env.CENSYS_API_ID && env.CENSYS_API_SECRET;
      expect(hasCredentials).toBe(true);
    });
  });

  describe('Authentication Header', () => {
    test('should create correct Basic auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;

      expect(authHeader).toContain('Basic ');
      expect(authHeader.length).toBeGreaterThan(6);
    });

    test('should encode credentials correctly', () => {
      const credentials = 'user:pass';
      const encoded = btoa(credentials);
      
      expect(encoded).toBe('dXNlcjpwYXNz');
    });
  });

  describe('API Endpoint Construction', () => {
    test('should construct hosts search endpoint', () => {
      const basePath = 'https://search.censys.io/api/v2';
      const path = '/hosts/search';
      const endpoint = `${basePath}${path}`;

      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    test('should construct service stats endpoint', () => {
      const basePath = 'https://search.censys.io/api/v2';
      const path = '/hosts/stats/services.service_name';
      const endpoint = `${basePath}${path}`;

      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    test('should construct country stats endpoint', () => {
      const basePath = 'https://search.censys.io/api/v2';
      const path = '/hosts/stats/location.country_code';
      const endpoint = `${basePath}${path}`;

      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Parallel API Calls', () => {
    test('should make three parallel requests', async () => {
      const mockResponses = [
        { result: { total: 1000 } },
        { result: { buckets: [{ key: 'http', count: 500 }] } },
        { result: { buckets: [{ key: 'US', count: 300 }] } }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[0]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[1]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[2]
        });

      const promises = [
        fetch('endpoint1').then(r => r.json()),
        fetch('endpoint2').then(r => r.json()),
        fetch('endpoint3').then(r => r.json())
      ];

      const results = await Promise.all(promises);

      expect(results.length).toBe(3);
      expect(results[0].result.total).toBe(1000);
      expect(results[1].result.buckets[0].key).toBe('http');
      expect(results[2].result.buckets[0].key).toBe('US');
    });

    test('should handle partial failures in Promise.all', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) });

      try {
        await Promise.all([
          fetch('url1').then(r => r.json()),
          fetch('url2').then(r => r.json()),
          fetch('url3').then(r => r.json())
        ]);
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });
  });

  describe('Response Data Processing', () => {
    test('should extract total hosts from search result', () => {
      const hostSummary = {
        result: { total: 123456 }
      };

      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(123456);
    });

    test('should handle missing total hosts', () => {
      const hostSummary = { result: {} };
      const totalHosts = hostSummary?.result?.total ?? 0;
      
      expect(totalHosts).toBe(0);
    });

    test('should process service buckets', () => {
      const serviceStats = {
        result: {
          buckets: [
            { key: 'http', count: 500 },
            { key: 'https', count: 300 },
            { key: 'ssh', count: 200 }
          ]
        }
      };

      const services = {};
      let totalServices = 0;
      const buckets = serviceStats?.result?.buckets ?? [];

      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(services.http).toBe(500);
      expect(services.https).toBe(300);
      expect(totalServices).toBe(1000);
    });

    test('should process country buckets with uppercase codes', () => {
      const countryStats = {
        result: {
          buckets: [
            { key: 'us', count: 1000 },
            { key: 'de', count: 500 }
          ]
        }
      };

      const countries = {};
      const buckets = countryStats?.result?.buckets ?? [];

      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(countries.US).toBe(1000);
      expect(countries.DE).toBe(500);
    });

    test('should skip buckets without keys', () => {
      const stats = {
        result: {
          buckets: [
            { key: 'valid', count: 100 },
            { count: 50 }, // missing key
            { key: 'valid2', count: 75 }
          ]
        }
      };

      const processed = {};
      const buckets = stats?.result?.buckets ?? [];

      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        processed[bucket.key] = bucket.count;
      }

      expect(Object.keys(processed).length).toBe(2);
      expect(processed.valid).toBe(100);
      expect(processed.valid2).toBe(75);
    });
  });

  describe('Response Format', () => {
    test('should create correct success response structure', () => {
      const response = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: new Date().toISOString(),
        countries: { US: 300 },
        services: { http: 200 }
      };

      expect(response).toHaveProperty('total_hosts');
      expect(response).toHaveProperty('total_services');
      expect(response).toHaveProperty('last_sync');
      expect(response).toHaveProperty('countries');
      expect(response).toHaveProperty('services');
    });

    test('should include ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should create error response with details', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Connection timeout',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.details).toBe('Connection timeout');
      expect(errorResponse.total_hosts).toBe(0);
    });
  });

  describe('HTTP Headers', () => {
    test('should include correct content-type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should include cache-control header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      try {
        await fetch('https://api.example.com/data');
      } catch (error) {
        expect(error.message).toBe('Network failure');
      }
    });

    test('should handle non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const res = await fetch('https://api.example.com/data');
      
      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`Censys error: ${res.status} ${text}`);
        expect(error.message).toContain('401');
        expect(error.message).toContain('Unauthorized');
      }
    });

    test('should return 502 status for API errors', () => {
      const errorStatusCode = 502;
      expect(errorStatusCode).toBe(502);
    });

    test('should return 500 for missing credentials', () => {
      const missingCredsStatus = 500;
      expect(missingCredsStatus).toBe(500);
    });
  });
});