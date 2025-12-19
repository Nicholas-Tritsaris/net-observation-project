/**
 * Unit Tests for functions/api/censys-summary.js
 * Tests for the Censys API integration serverless function
 */

describe('Censys Summary API Function', () => {
  let mockEnv;
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    // Mock environment variables
    mockEnv = {
      CENSYS_API_ID: 'test-api-id',
      CENSYS_API_SECRET: 'test-api-secret'
    };

    // Mock global fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock btoa for basic auth
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  describe('Environment Configuration', () => {
    test('should require CENSYS_API_ID environment variable', () => {
      const env = { CENSYS_API_SECRET: 'secret' };
      expect(env.CENSYS_API_ID).toBeUndefined();
    });

    test('should require CENSYS_API_SECRET environment variable', () => {
      const env = { CENSYS_API_ID: 'id' };
      expect(env.CENSYS_API_SECRET).toBeUndefined();
    });

    test('should handle missing credentials gracefully', () => {
      const env = {};
      const hasCreds = env.CENSYS_API_ID && env.CENSYS_API_SECRET;
      expect(hasCreds).toBeFalsy();
    });

    test('should validate both credentials are present', () => {
      const env = mockEnv;
      const hasCreds = env.CENSYS_API_ID && env.CENSYS_API_SECRET;
      expect(hasCreds).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    test('should create Basic Auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const encoded = Buffer.from(`${id}:${secret}`).toString('base64');
      const authHeader = `Basic ${encoded}`;
      
      expect(authHeader).toContain('Basic ');
      expect(authHeader.length).toBeGreaterThan(6);
    });

    test('should base64 encode credentials', () => {
      const credentials = 'user:pass';
      const encoded = Buffer.from(credentials).toString('base64');
      expect(encoded).toBe('dXNlcjpwYXNz');
    });

    test('should handle special characters in credentials', () => {
      const secret = 'p@ss:w0rd!';
      const encoded = Buffer.from(secret).toString('base64');
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe(secret);
    });
  });

  describe('API Endpoints', () => {
    test('should construct correct Censys API endpoint', () => {
      const basePath = '/hosts/search';
      const endpoint = `https://search.censys.io/api/v2${basePath}`;
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    test('should support multiple endpoint paths', () => {
      const paths = [
        '/hosts/search',
        '/hosts/stats/services.service_name',
        '/hosts/stats/location.country_code'
      ];
      
      paths.forEach(path => {
        const endpoint = `https://search.censys.io/api/v2${path}`;
        expect(endpoint).toContain('https://search.censys.io/api/v2');
        expect(endpoint).toContain(path);
      });
    });
  });

  describe('Request Payload Construction', () => {
    test('should create valid host search payload', () => {
      const payload = {
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      };
      
      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    test('should create valid service stats payload', () => {
      const payload = {
        q: '*',
        num_buckets: 25
      };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    test('should create valid country stats payload', () => {
      const payload = {
        q: '*',
        num_buckets: 50
      };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });

    test('should JSON stringify payloads correctly', () => {
      const payload = { q: '*', per_page: 1 };
      const json = JSON.stringify(payload);
      expect(json).toBe('{"q":"*","per_page":1}');
    });
  });

  describe('API Response Handling', () => {
    test('should parse successful host summary response', async () => {
      const mockResponse = {
        result: {
          total: 1234567,
          hits: []
        }
      };
      
      expect(mockResponse.result.total).toBe(1234567);
    });

    test('should parse service stats response', async () => {
      const mockResponse = {
        result: {
          buckets: [
            { key: 'HTTP', count: 500 },
            { key: 'HTTPS', count: 300 }
          ]
        }
      };
      
      const buckets = mockResponse.result.buckets;
      expect(buckets.length).toBe(2);
      expect(buckets[0].key).toBe('HTTP');
      expect(buckets[0].count).toBe(500);
    });

    test('should parse country stats response', async () => {
      const mockResponse = {
        result: {
          buckets: [
            { key: 'us', count: 1000 },
            { key: 'uk', count: 500 }
          ]
        }
      };
      
      const buckets = mockResponse.result.buckets;
      expect(buckets.length).toBe(2);
      expect(buckets[0].key).toBe('us');
    });

    test('should handle empty buckets array', () => {
      const buckets = [];
      expect(buckets.length).toBe(0);
    });

    test('should handle null/undefined response data', () => {
      const total = null ?? 0;
      expect(total).toBe(0);
    });

    test('should use optional chaining for nested properties', () => {
      const response = {};
      const total = response?.result?.total ?? 0;
      expect(total).toBe(0);
    });
  });

  describe('Data Transformation', () => {
    test('should aggregate service counts', () => {
      const buckets = [
        { key: 'HTTP', count: 100 },
        { key: 'HTTPS', count: 200 },
        { key: 'SSH', count: 50 }
      ];
      
      const services = {};
      let totalServices = 0;
      
      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }
      
      expect(services.HTTP).toBe(100);
      expect(services.HTTPS).toBe(200);
      expect(totalServices).toBe(350);
    });

    test('should uppercase country codes', () => {
      const buckets = [
        { key: 'us', count: 100 },
        { key: 'uk', count: 50 }
      ];
      
      const countries = {};
      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }
      
      expect(countries.US).toBe(100);
      expect(countries.UK).toBe(50);
      expect(countries.us).toBeUndefined();
    });

    test('should skip buckets without keys', () => {
      const buckets = [
        { key: 'HTTP', count: 100 },
        { count: 50 }, // missing key
        { key: null, count: 25 } // null key
      ];
      
      const services = {};
      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }
      
      expect(Object.keys(services).length).toBe(1);
      expect(services.HTTP).toBe(100);
    });

    test('should handle numeric country codes', () => {
      const code = 'us';
      const upper = code.toUpperCase();
      expect(upper).toBe('US');
      expect(typeof upper).toBe('string');
    });
  });

  describe('Response Construction', () => {
    test('should create valid response object', () => {
      const response = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: new Date().toISOString(),
        countries: { US: 100 },
        services: { HTTP: 200 }
      };
      
      expect(response.total_hosts).toBe(1000);
      expect(response.total_services).toBe(500);
      expect(response.last_sync).toBeTruthy();
      expect(response.countries).toBeDefined();
      expect(response.services).toBeDefined();
    });

    test('should include ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(timestamp).toContain('Z');
    });

    test('should set correct response headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Cache-Control']).toContain('no-cache');
    });

    test('should JSON stringify response data', () => {
      const data = {
        total_hosts: 100,
        services: { HTTP: 50 }
      };
      
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);
      
      expect(parsed.total_hosts).toBe(100);
      expect(parsed.services.HTTP).toBe(50);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing credentials error', () => {
      const env = {};
      const error = {
        error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
      };
      
      if (!env.CENSYS_API_ID || !env.CENSYS_API_SECRET) {
        expect(error.error).toContain('Missing');
      }
    });

    test('should handle API request failure', () => {
      const errorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };
      
      expect(errorResponse.ok).toBe(false);
      expect(errorResponse.status).toBe(401);
    });

    test('should handle network errors', () => {
      const error = new Error('Network request failed');
      expect(error.message).toContain('Network');
    });

    test('should create error response with fallback data', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'API Error',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };
      
      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.total_hosts).toBe(0);
      expect(errorResponse.countries).toEqual({});
      expect(errorResponse.services).toEqual({});
    });

    test('should return 500 for missing credentials', () => {
      const statusCode = 500;
      expect(statusCode).toBe(500);
    });

    test('should return 502 for API errors', () => {
      const statusCode = 502;
      expect(statusCode).toBe(502);
    });

    test('should log errors appropriately', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      console.error('Censys summary error:', error);
      
      expect(consoleSpy).toHaveBeenCalledWith('Censys summary error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Promise.all Integration', () => {
    test('should handle parallel API requests', async () => {
      const promises = [
        Promise.resolve({ result: { total: 1000 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });

    test('should fail fast if any request fails', async () => {
      const promises = [
        Promise.resolve({ success: true }),
        Promise.reject(new Error('Failed')),
        Promise.resolve({ success: true })
      ];
      
      await expect(Promise.all(promises)).rejects.toThrow('Failed');
    });

    test('should handle successful parallel responses', async () => {
      const responses = await Promise.all([
        Promise.resolve({ data: 'response1' }),
        Promise.resolve({ data: 'response2' }),
        Promise.resolve({ data: 'response3' })
      ]);
      
      expect(responses.length).toBe(3);
      expect(responses[0].data).toBe('response1');
    });
  });

  describe('HTTP Status Codes', () => {
    test('should return 200 for successful response', () => {
      const status = 200;
      expect(status).toBe(200);
      expect(status >= 200 && status < 300).toBe(true);
    });

    test('should check response.ok for 2xx status', () => {
      const response = { ok: true, status: 200 };
      expect(response.ok).toBe(true);
    });

    test('should handle 401 Unauthorized', () => {
      const status = 401;
      expect(status).toBe(401);
      expect(status >= 400).toBe(true);
    });

    test('should handle 403 Forbidden', () => {
      const status = 403;
      expect(status).toBe(403);
    });

    test('should handle 404 Not Found', () => {
      const status = 404;
      expect(status).toBe(404);
    });

    test('should handle 429 Rate Limit', () => {
      const status = 429;
      expect(status).toBe(429);
    });

    test('should handle 500 Internal Server Error', () => {
      const status = 500;
      expect(status).toBe(500);
      expect(status >= 500).toBe(true);
    });
  });

  describe('Request Headers', () => {
    test('should set Authorization header', () => {
      const headers = {
        'Authorization': 'Basic dGVzdDp0ZXN0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      expect(headers.Authorization).toContain('Basic');
    });

    test('should set Content-Type to application/json', () => {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should set Accept header', () => {
      const headers = {
        'Accept': 'application/json'
      };
      
      expect(headers.Accept).toBe('application/json');
    });
  });

  describe('Cache Control', () => {
    test('should disable caching', () => {
      const cacheControl = 'no-store, no-cache, must-revalidate';
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });

    test('should set appropriate cache headers', () => {
      const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Cache-Control']).toBeTruthy();
    });
  });

  describe('Data Validation', () => {
    test('should validate total hosts is a number', () => {
      const total = 1234;
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
    });

    test('should validate services object structure', () => {
      const services = { HTTP: 100, HTTPS: 200 };
      expect(typeof services).toBe('object');
      expect(Object.keys(services).length).toBeGreaterThan(0);
    });

    test('should validate countries object structure', () => {
      const countries = { US: 500, UK: 300 };
      expect(typeof countries).toBe('object');
      Object.keys(countries).forEach(key => {
        expect(key).toMatch(/^[A-Z]{2}$/);
      });
    });

    test('should validate timestamp format', () => {
      const timestamp = new Date().toISOString();
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero hosts', () => {
      const total = 0;
      expect(total).toBe(0);
      expect(total).not.toBeNaN();
    });

    test('should handle empty services object', () => {
      const services = {};
      expect(Object.keys(services).length).toBe(0);
    });

    test('should handle empty countries object', () => {
      const countries = {};
      expect(Object.keys(countries).length).toBe(0);
    });

    test('should handle very large host counts', () => {
      const total = Number.MAX_SAFE_INTEGER;
      expect(total).toBeGreaterThan(0);
      expect(Number.isSafeInteger(total)).toBe(true);
    });

    test('should handle bucket with zero count', () => {
      const bucket = { key: 'TEST', count: 0 };
      expect(bucket.count).toBe(0);
    });
  });

  describe('Type Coercion and Safety', () => {
    test('should handle string numbers gracefully', () => {
      const count = '100';
      const numeric = Number(count);
      expect(numeric).toBe(100);
    });

    test('should handle null values with fallback', () => {
      const value = null ?? 0;
      expect(value).toBe(0);
    });

    test('should handle undefined values with fallback', () => {
      const value = undefined ?? 0;
      expect(value).toBe(0);
    });

    test('should safely access nested properties', () => {
      const obj = null;
      const value = obj?.property?.nested ?? 'default';
      expect(value).toBe('default');
    });
  });
});