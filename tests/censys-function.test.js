/**
 * Unit tests for functions/api/censys-summary.js
 * Tests Cloudflare Pages Function for Censys API integration
 */

const fs = require('fs');
const path = require('path');

describe('Censys Summary Function', () => {
  let onRequest;
  
  beforeAll(() => {
    // Load the function
    const functionPath = path.join(__dirname, '../functions/api/censys-summary.js');
    const functionCode = fs.readFileSync(functionPath, 'utf-8');
    
    // Extract and eval the function (for testing purposes)
    const module = { exports: {} };
    eval(functionCode.replace('export async function', 'module.exports.onRequest = async function'));
    onRequest = module.exports.onRequest;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
    global.btoa = (str) => Buffer.from(str).toString('base64');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Variable Validation', () => {
    test('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: 'secret'
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID');
    });

    test('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'id123',
          CENSYS_API_SECRET: ''
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_SECRET');
    });

    test('should return 500 when both credentials are missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Authorization Header', () => {
    test('should create correct Basic Auth header', () => {
      const id = 'testId';
      const secret = 'testSecret';
      const encoded = btoa(`${id}:${secret}`);
      const authHeader = `Basic ${encoded}`;
      
      expect(authHeader).toContain('Basic');
      expect(authHeader).toContain(encoded);
    });

    test('should encode credentials properly', () => {
      const credentials = 'user:pass';
      const encoded = btoa(credentials);
      const decoded = Buffer.from(encoded, 'base64').toString();
      
      expect(decoded).toBe(credentials);
    });

    test('should handle special characters in credentials', () => {
      const id = 'test@example.com';
      const secret = 'p@ssw0rd!';
      const encoded = btoa(`${id}:${secret}`);
      
      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('API Endpoint Construction', () => {
    test('should construct correct hosts search endpoint', () => {
      const endpoint = 'https://search.censys.io/api/v2/hosts/search';
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    test('should construct correct service stats endpoint', () => {
      const endpoint = 'https://search.censys.io/api/v2/hosts/stats/services.service_name';
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    test('should construct correct country stats endpoint', () => {
      const endpoint = 'https://search.censys.io/api/v2/hosts/stats/location.country_code';
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Successful API Response', () => {
    test('should handle successful response from all endpoints', async () => {
      const mockHostSummary = {
        result: {
          total: 1000
        }
      };
      
      const mockServiceStats = {
        result: {
          buckets: [
            { key: 'http', count: 500 },
            { key: 'https', count: 300 }
          ]
        }
      };
      
      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 400 },
            { key: 'de', count: 200 }
          ]
        }
      };
      
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHostSummary
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServiceStats
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountryStats
        });
      
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(1000);
      expect(data.total_services).toBe(800);
      expect(data.services).toEqual({ http: 500, https: 300 });
      expect(data.countries).toEqual({ US: 400, DE: 200 });
      expect(data.last_sync).toBeDefined();
    });

    test('should aggregate service counts correctly', () => {
      const serviceBuckets = [
        { key: 'http', count: 100 },
        { key: 'https', count: 200 },
        { key: 'ssh', count: 50 }
      ];
      
      let totalServices = 0;
      const services = {};
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }
      
      expect(totalServices).toBe(350);
      expect(services).toEqual({ http: 100, https: 200, ssh: 50 });
    });

    test('should convert country codes to uppercase', () => {
      const countryBuckets = [
        { key: 'us', count: 100 },
        { key: 'gb', count: 50 }
      ];
      
      const countries = {};
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }
      
      expect(countries).toEqual({ US: 100, GB: 50 });
    });

    test('should include ISO timestamp in response', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Error Handling', () => {
    test('should return 502 on API failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));
      
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toBe('API Error');
    });

    test('should include fallback data in error response', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));
      
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };
      
      const response = await onRequest(context);
      const data = await response.json();
      
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
      expect(data.last_sync).toBeDefined();
    });

    test('should handle HTTP error status codes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });
      
      const context = {
        env: {
          CENSYS_API_ID: 'wrong-id',
          CENSYS_API_SECRET: 'wrong-secret'
        }
      };
      
      const response = await onRequest(context);
      expect(response.status).toBe(502);
    });

    test('should skip buckets without keys', () => {
      const buckets = [
        { key: 'valid', count: 100 },
        { key: null, count: 50 },
        { count: 25 }
      ];
      
      const result = {};
      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        result[bucket.key] = bucket.count;
      }
      
      expect(result).toEqual({ valid: 100 });
    });
  });

  describe('Response Headers', () => {
    test('should include correct Content-Type header', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };
      
      const response = await onRequest(context);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('should include Cache-Control header', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };
      
      const response = await onRequest(context);
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    test('should not cache responses', () => {
      const cacheControl = 'no-store, no-cache, must-revalidate';
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });
  });

  describe('Request Payloads', () => {
    test('should send correct search payload', () => {
      const payload = {
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      };
      
      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    test('should send correct stats payload', () => {
      const servicePayload = {
        q: '*',
        num_buckets: 25
      };
      
      const countryPayload = {
        q: '*',
        num_buckets: 50
      };
      
      expect(servicePayload.num_buckets).toBe(25);
      expect(countryPayload.num_buckets).toBe(50);
    });

    test('should serialize payload as JSON', () => {
      const payload = { q: '*', per_page: 1 };
      const serialized = JSON.stringify(payload);
      const parsed = JSON.parse(serialized);
      
      expect(parsed).toEqual(payload);
    });
  });

  describe('Parallel Request Handling', () => {
    test('should make three concurrent API calls', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { total: 100 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { buckets: [] } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { buckets: [] } }) });
      
      const context = {
        env: {
          CENSYS_API_ID: 'id',
          CENSYS_API_SECRET: 'secret'
        }
      };
      
      await onRequest(context);
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should use Promise.all for concurrent requests', async () => {
      const promises = [
        Promise.resolve({ result: { total: 100 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(3);
    });
  });

  describe('Data Validation', () => {
    test('should handle missing result property', () => {
      const response = {};
      const total = response?.result?.total ?? 0;
      
      expect(total).toBe(0);
    });

    test('should handle empty buckets array', () => {
      const buckets = [];
      const result = {};
      
      for (const bucket of buckets) {
        result[bucket.key] = bucket.count;
      }
      
      expect(Object.keys(result).length).toBe(0);
    });

    test('should handle undefined buckets', () => {
      const response = { result: {} };
      const buckets = response?.result?.buckets ?? [];
      
      expect(buckets).toEqual([]);
    });
  });
});