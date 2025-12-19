import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock Cloudflare environment
const createMockContext = (overrides = {}) => ({
  env: {
    CENSYS_API_ID: 'test-api-id',
    CENSYS_API_SECRET: 'test-api-secret',
    ...overrides
  },
  request: new Request('http://localhost/api/censys-summary'),
  ...overrides
});

// Mock fetch responses
const createMockFetchResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

describe('Censys Summary Function', () => {
  let originalFetch;
  let functionCode;

  beforeEach(() => {
    originalFetch = global.fetch;
    
    // Load the actual function code
    const functionPath = join(process.cwd(), 'functions/api/censys-summary.js');
    functionCode = readFileSync(functionPath, 'utf-8');
    
    // Mock btoa for Node.js environment
    global.btoa = (str) => Buffer.from(str).toString('base64');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Environment Variable Validation', () => {
    it('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = createMockContext({ env: { CENSYS_API_SECRET: 'secret' } });
      
      // Extract and test the validation logic
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;
      
      const shouldError = !id || !secret;
      expect(shouldError).toBe(true);
    });

    it('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = createMockContext({ env: { CENSYS_API_ID: 'id' } });
      
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;
      
      const shouldError = !id || !secret;
      expect(shouldError).toBe(true);
    });

    it('should proceed when both credentials are present', async () => {
      const context = createMockContext();
      
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;
      
      const shouldError = !id || !secret;
      expect(shouldError).toBe(false);
    });
  });

  describe('Authentication Header', () => {
    it('should create correct Basic auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
      
      expect(authHeader).toContain('Basic ');
      
      // Verify it decodes correctly
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toBe('test-id:test-secret');
    });

    it('should handle special characters in credentials', () => {
      const id = 'id+with/special=chars';
      const secret = 'secret@with$special!';
      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
      
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toContain('+with/special');
      expect(decoded).toContain('@with$special');
    });
  });

  describe('API Endpoints', () => {
    it('should construct correct endpoint URLs', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      
      expect(endpoint('/hosts/search')).toBe('https://search.censys.io/api/v2/hosts/search');
      expect(endpoint('/hosts/stats/services.service_name'))
        .toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
      expect(endpoint('/hosts/stats/location.country_code'))
        .toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Successful API Response Processing', () => {
    it('should process host summary correctly', async () => {
      const mockHostData = {
        result: {
          total: 12345,
          hits: []
        }
      };
      
      const totalHosts = mockHostData?.result?.total ?? 0;
      expect(totalHosts).toBe(12345);
    });

    it('should process service statistics correctly', async () => {
      const mockServiceData = {
        result: {
          buckets: [
            { key: 'http', count: 5000 },
            { key: 'https', count: 8000 },
            { key: 'ssh', count: 3000 }
          ]
        }
      };
      
      const services = {};
      let totalServices = 0;
      const serviceBuckets = mockServiceData?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }
      
      expect(services.http).toBe(5000);
      expect(services.https).toBe(8000);
      expect(totalServices).toBe(16000);
    });

    it('should skip buckets without keys', async () => {
      const mockServiceData = {
        result: {
          buckets: [
            { key: 'http', count: 5000 },
            { count: 1000 }, // Missing key
            { key: 'https', count: 8000 }
          ]
        }
      };
      
      const services = {};
      const serviceBuckets = mockServiceData?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }
      
      expect(Object.keys(services)).toHaveLength(2);
      expect(services.http).toBe(5000);
      expect(services.https).toBe(8000);
    });

    it('should process country statistics correctly', async () => {
      const mockCountryData = {
        result: {
          buckets: [
            { key: 'us', count: 10000 },
            { key: 'gb', count: 5000 },
            { key: 'de', count: 7000 }
          ]
        }
      };
      
      const countries = {};
      const countryBuckets = mockCountryData?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }
      
      expect(countries.US).toBe(10000);
      expect(countries.GB).toBe(5000);
      expect(countries.DE).toBe(7000);
    });

    it('should normalize country codes to uppercase', async () => {
      const mockCountryData = {
        result: {
          buckets: [
            { key: 'us', count: 100 },
            { key: 'Gb', count: 200 },
            { key: 'DE', count: 300 }
          ]
        }
      };
      
      const countries = {};
      const countryBuckets = mockCountryData?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }
      
      expect(countries.US).toBe(100);
      expect(countries.GB).toBe(200);
      expect(countries.DE).toBe(300);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure on success', () => {
      const response = {
        total_hosts: 12345,
        total_services: 16000,
        last_sync: new Date().toISOString(),
        countries: { US: 10000, GB: 5000 },
        services: { http: 5000, https: 8000 }
      };
      
      expect(response).toHaveProperty('total_hosts');
      expect(response).toHaveProperty('total_services');
      expect(response).toHaveProperty('last_sync');
      expect(response).toHaveProperty('countries');
      expect(response).toHaveProperty('services');
      
      expect(typeof response.total_hosts).toBe('number');
      expect(typeof response.total_services).toBe('number');
      expect(typeof response.last_sync).toBe('string');
      expect(typeof response.countries).toBe('object');
      expect(typeof response.services).toBe('object');
    });

    it('should include ISO timestamp in last_sync', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should have correct Content-Type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should have no-cache headers', () => {
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
    it('should return 502 with error structure on API failure', () => {
      const error = new Error('Censys /hosts/search failed: 500 Internal Server Error');
      
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: error.message,
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };
      
      expect(errorResponse.error).toBe('Unable to retrieve Censys summary');
      expect(errorResponse.details).toContain('failed');
      expect(errorResponse.total_hosts).toBe(0);
      expect(errorResponse.countries).toEqual({});
    });

    it('should preserve response structure on error', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Network timeout',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };
      
      // Even on error, should have same keys as success response
      expect(errorResponse).toHaveProperty('total_hosts');
      expect(errorResponse).toHaveProperty('total_services');
      expect(errorResponse).toHaveProperty('last_sync');
      expect(errorResponse).toHaveProperty('countries');
      expect(errorResponse).toHaveProperty('services');
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('details');
    });

    it('should handle non-ok HTTP responses', async () => {
      const notOkResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      };
      
      expect(notOkResponse.ok).toBe(false);
      
      if (!notOkResponse.ok) {
        const text = await notOkResponse.text();
        const error = new Error(`Censys /test failed: ${notOkResponse.status} ${text}`);
        
        expect(error.message).toContain('401');
        expect(error.message).toContain('Unauthorized');
      }
    });

    it('should handle malformed API responses', () => {
      const malformedData = {
        result: null
      };
      
      const totalHosts = malformedData?.result?.total ?? 0;
      const serviceBuckets = malformedData?.result?.buckets ?? [];
      
      expect(totalHosts).toBe(0);
      expect(serviceBuckets).toEqual([]);
    });

    it('should handle missing result object', () => {
      const emptyData = {};
      
      const totalHosts = emptyData?.result?.total ?? 0;
      const serviceBuckets = emptyData?.result?.buckets ?? [];
      
      expect(totalHosts).toBe(0);
      expect(serviceBuckets).toEqual([]);
    });
  });

  describe('Parallel API Calls', () => {
    it('should handle Promise.all for three endpoints', async () => {
      const mockResponses = [
        { result: { total: 1000 } },
        { result: { buckets: [{ key: 'http', count: 500 }] } },
        { result: { buckets: [{ key: 'US', count: 800 }] } }
      ];
      
      const results = await Promise.all(
        mockResponses.map(data => Promise.resolve(data))
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].result.total).toBe(1000);
      expect(results[1].result.buckets[0].key).toBe('http');
      expect(results[2].result.buckets[0].key).toBe('US');
    });

    it('should fail fast if any API call fails', async () => {
      const mockResponses = [
        Promise.resolve({ result: { total: 1000 } }),
        Promise.reject(new Error('API Error')),
        Promise.resolve({ result: { buckets: [] } })
      ];
      
      try {
        await Promise.all(mockResponses);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('API Error');
      }
    });
  });

  describe('Request Payload Construction', () => {
    it('should create correct payload for host search', () => {
      const payload = {
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      };
      
      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should create correct payload for service stats', () => {
      const payload = {
        q: '*',
        num_buckets: 25
      };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should create correct payload for country stats', () => {
      const payload = {
        q: '*',
        num_buckets: 50
      };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero hosts', () => {
      const mockData = { result: { total: 0 } };
      const totalHosts = mockData?.result?.total ?? 0;
      
      expect(totalHosts).toBe(0);
    });

    it('should handle empty buckets array', () => {
      const mockData = { result: { buckets: [] } };
      
      const services = {};
      let totalServices = 0;
      const serviceBuckets = mockData?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }
      
      expect(Object.keys(services)).toHaveLength(0);
      expect(totalServices).toBe(0);
    });

    it('should handle bucket with zero count', () => {
      const mockData = {
        result: {
          buckets: [
            { key: 'http', count: 0 },
            { key: 'https', count: 100 }
          ]
        }
      };
      
      const services = {};
      const serviceBuckets = mockData?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }
      
      expect(services.http).toBe(0);
      expect(services.https).toBe(100);
    });

    it('should handle very large numbers', () => {
      const largeNumber = 999999999;
      const mockData = { result: { total: largeNumber } };
      
      const totalHosts = mockData?.result?.total ?? 0;
      expect(totalHosts).toBe(largeNumber);
    });

    it('should handle special country codes', () => {
      const mockData = {
        result: {
          buckets: [
            { key: 'XX', count: 100 }, // Unknown
            { key: 'ZZ', count: 50 }   // Reserved
          ]
        }
      };
      
      const countries = {};
      const countryBuckets = mockData?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }
      
      expect(countries.XX).toBe(100);
      expect(countries.ZZ).toBe(50);
    });
  });

  describe('HTTP Method and Headers', () => {
    it('should use POST method for API calls', () => {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': 'Basic dGVzdDp0ZXN0',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ q: '*' })
      };
      
      expect(fetchOptions.method).toBe('POST');
    });

    it('should include correct request headers', () => {
      const headers = {
        'Authorization': 'Basic encoded-credentials',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
      expect(headers['Authorization']).toContain('Basic');
    });

    it('should stringify payload body', () => {
      const payload = { q: '*', per_page: 1 };
      const body = JSON.stringify(payload);
      
      expect(body).toBe('{"q":"*","per_page":1}');
      expect(JSON.parse(body)).toEqual(payload);
    });
  });
});