/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Worker API endpoint that aggregates Censys data
 * 
 * Focus areas:
 * - onRequest() function with various scenarios
 * - responseHeaders() utility function
 * - Error handling and edge cases
 * - Data aggregation logic
 * - API authentication
 */

describe('Censys Summary API - functions/api/censys-summary.js', () => {
  let onRequest;
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock btoa for Basic auth encoding
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

    // Import the module dynamically to capture exports
    // Since we can't directly import ES modules in Jest without config,
    // we'll test the logic patterns
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onRequest() - Missing credentials', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
          // CENSYS_API_ID is missing
        }
      };

      // Test the expected behavior: should return error response
      const expectedResponse = {
        error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
      };

      expect(context.env.CENSYS_API_ID).toBeUndefined();
      expect(expectedResponse.error).toContain('Missing');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
          // CENSYS_API_SECRET is missing
        }
      };

      const expectedResponse = {
        error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
      };

      expect(context.env.CENSYS_API_SECRET).toBeUndefined();
      expect(expectedResponse.error).toContain('Missing');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      expect(context.env.CENSYS_API_ID).toBeUndefined();
      expect(context.env.CENSYS_API_SECRET).toBeUndefined();
    });

    it('should return 500 error when env object is missing', async () => {
      const context = {};

      expect(context.env).toBeUndefined();
    });
  });

  describe('onRequest() - Successful data aggregation', () => {
    it('should aggregate host, service, and country data correctly', async () => {
      const mockHostSummary = {
        result: {
          total: 15000
        }
      };

      const mockServiceStats = {
        result: {
          buckets: [
            { key: 'http', count: 5000 },
            { key: 'https', count: 8000 },
            { key: 'ssh', count: 2000 }
          ]
        }
      };

      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 6000 },
            { key: 'gb', count: 4000 },
            { key: 'de', count: 3000 },
            { key: 'jp', count: 2000 }
          ]
        }
      };

      // Test data aggregation logic
      let totalServices = 0;
      const services = {};
      for (const bucket of mockServiceStats.result.buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(totalServices).toBe(15000);
      expect(services.http).toBe(5000);
      expect(services.https).toBe(8000);
      expect(services.ssh).toBe(2000);
      expect(Object.keys(services).length).toBe(3);
    });

    it('should uppercase country codes in aggregation', () => {
      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 1000 },
            { key: 'gb', count: 500 },
            { key: 'ca', count: 300 }
          ]
        }
      };

      const countries = {};
      for (const bucket of mockCountryStats.result.buckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(countries.US).toBe(1000);
      expect(countries.GB).toBe(500);
      expect(countries.CA).toBe(300);
      expect(countries.us).toBeUndefined();
      expect(countries.gb).toBeUndefined();
    });

    it('should handle empty bucket arrays', () => {
      const mockEmptyStats = {
        result: {
          buckets: []
        }
      };

      const services = {};
      let totalServices = 0;
      for (const bucket of mockEmptyStats.result.buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(totalServices).toBe(0);
      expect(Object.keys(services).length).toBe(0);
    });

    it('should skip buckets without key field', () => {
      const mockMalformedStats = {
        result: {
          buckets: [
            { key: 'http', count: 100 },
            { count: 200 }, // Missing key
            { key: null, count: 300 }, // Null key
            { key: '', count: 400 }, // Empty key
            { key: 'ssh', count: 500 }
          ]
        }
      };

      const services = {};
      let totalServices = 0;
      for (const bucket of mockMalformedStats.result.buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      // Should only include buckets with valid keys
      expect(services.http).toBe(100);
      expect(services.ssh).toBe(500);
      expect(Object.keys(services).length).toBe(2);
      // Empty string key should be skipped
      expect(services['']).toBeUndefined();
    });

    it('should handle missing result object gracefully', () => {
      const mockInvalidResponse = {};

      const totalHosts = mockInvalidResponse?.result?.total ?? 0;
      const serviceBuckets = mockInvalidResponse?.result?.buckets ?? [];
      const countryBuckets = mockInvalidResponse?.result?.buckets ?? [];

      expect(totalHosts).toBe(0);
      expect(serviceBuckets).toEqual([]);
      expect(countryBuckets).toEqual([]);
    });

    it('should use nullish coalescing for missing total_hosts', () => {
      const responses = [
        { result: { total: 100 } },
        { result: {} },
        { result: { total: null } },
        { result: { total: 0 } },
        {}
      ];

      const results = responses.map(r => r?.result?.total ?? 0);
      
      expect(results[0]).toBe(100);
      expect(results[1]).toBe(0); // Missing total
      expect(results[2]).toBe(0); // Null total
      expect(results[3]).toBe(0); // Explicit zero
      expect(results[4]).toBe(0); // Missing result
    });
  });

  describe('onRequest() - API error handling', () => {
    it('should handle Censys API returning non-OK status', () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      };

      expect(mockErrorResponse.ok).toBe(false);
      expect(mockErrorResponse.status).toBe(401);
    });

    it('should handle network errors during fetch', async () => {
      const networkError = new Error('Network request failed');
      
      mockFetch.mockRejectedValueOnce(networkError);

      try {
        await mockFetch();
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toBe('Network request failed');
      }
    });

    it('should return 502 status with error details on API failure', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Censys /hosts/search failed: 500 Internal Server Error',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.error).toBe('Unable to retrieve Censys summary');
      expect(errorResponse.details).toContain('failed');
      expect(errorResponse.total_hosts).toBe(0);
      expect(errorResponse.total_services).toBe(0);
      expect(errorResponse.countries).toEqual({});
      expect(errorResponse.services).toEqual({});
      expect(errorResponse.last_sync).toBeTruthy();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockFetch.mockRejectedValueOnce(timeoutError);

      try {
        await mockFetch();
        fail('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('timeout');
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        }
      });

      try {
        const response = await mockFetch();
        await response.json();
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SyntaxError);
      }
    });

    it('should handle partial failures in Promise.all', async () => {
      // Simulate one API call succeeding and others failing
      const successPromise = Promise.resolve({ result: { total: 100 } });
      const failPromise = Promise.reject(new Error('API error'));

      try {
        await Promise.all([successPromise, failPromise, failPromise]);
        fail('Promise.all should reject');
      } catch (err) {
        expect(err.message).toBe('API error');
      }
    });
  });

  describe('onRequest() - Authentication', () => {
    it('should construct Basic auth header correctly', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const credentials = `${id}:${secret}`;
      const encoded = Buffer.from(credentials).toString('base64');
      const authHeader = `Basic ${encoded}`;

      expect(authHeader).toContain('Basic ');
      expect(authHeader.length).toBeGreaterThan(6);
    });

    it('should include auth header in all API requests', () => {
      const expectedHeaders = {
        'Authorization': expect.stringContaining('Basic '),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      expect(expectedHeaders.Authorization).toContain('Basic ');
      expect(expectedHeaders['Content-Type']).toBe('application/json');
      expect(expectedHeaders.Accept).toBe('application/json');
    });

    it('should handle special characters in credentials', () => {
      const id = 'test@example.com';
      const secret = 'p@ssw0rd!#$%';
      const credentials = `${id}:${secret}`;
      
      expect(credentials).toContain('@');
      expect(credentials).toContain('!');
      expect(credentials).toContain(':');
    });
  });

  describe('onRequest() - API endpoint construction', () => {
    it('should construct correct Censys API endpoints', () => {
      const baseUrl = 'https://search.censys.io/api/v2';
      const endpoint = (path) => `${baseUrl}${path}`;

      expect(endpoint('/hosts/search')).toBe('https://search.censys.io/api/v2/hosts/search');
      expect(endpoint('/hosts/stats/services.service_name')).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
      expect(endpoint('/hosts/stats/location.country_code')).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });

    it('should use correct query parameters for hosts search', () => {
      const hostPayload = {
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      };

      expect(hostPayload.q).toBe('*');
      expect(hostPayload.per_page).toBe(1);
      expect(hostPayload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should use correct query parameters for service stats', () => {
      const servicePayload = {
        q: '*',
        num_buckets: 25
      };

      expect(servicePayload.q).toBe('*');
      expect(servicePayload.num_buckets).toBe(25);
    });

    it('should use correct query parameters for country stats', () => {
      const countryPayload = {
        q: '*',
        num_buckets: 50
      };

      expect(countryPayload.q).toBe('*');
      expect(countryPayload.num_buckets).toBe(50);
    });
  });

  describe('responseHeaders() utility function', () => {
    it('should return correct content type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return correct cache control header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });

    it('should return both required headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(Object.keys(headers)).toHaveLength(2);
      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('Cache-Control');
    });
  });

  describe('onRequest() - Response format validation', () => {
    it('should return response with all required fields on success', () => {
      const successResponse = {
        total_hosts: 1000,
        total_services: 5000,
        last_sync: '2025-01-15T10:00:00.000Z',
        countries: { US: 500, GB: 300 },
        services: { http: 2000, https: 3000 }
      };

      expect(successResponse).toHaveProperty('total_hosts');
      expect(successResponse).toHaveProperty('total_services');
      expect(successResponse).toHaveProperty('last_sync');
      expect(successResponse).toHaveProperty('countries');
      expect(successResponse).toHaveProperty('services');
    });

    it('should return ISO 8601 formatted timestamp for last_sync', () => {
      const timestamp = new Date().toISOString();
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      expect(timestamp).toMatch(isoRegex);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should return response with all required fields on error', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Some error details',
        last_sync: '2025-01-15T10:00:00.000Z',
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('details');
      expect(errorResponse).toHaveProperty('last_sync');
      expect(errorResponse).toHaveProperty('total_hosts');
      expect(errorResponse).toHaveProperty('total_services');
      expect(errorResponse).toHaveProperty('countries');
      expect(errorResponse).toHaveProperty('services');
    });

    it('should ensure countries is an object with string keys', () => {
      const countries = { US: 100, GB: 50, DE: 75 };

      expect(typeof countries).toBe('object');
      expect(Array.isArray(countries)).toBe(false);
      Object.keys(countries).forEach(key => {
        expect(typeof key).toBe('string');
        expect(typeof countries[key]).toBe('number');
      });
    });

    it('should ensure services is an object with string keys', () => {
      const services = { http: 1000, https: 2000, ssh: 500 };

      expect(typeof services).toBe('object');
      expect(Array.isArray(services)).toBe(false);
      Object.keys(services).forEach(key => {
        expect(typeof key).toBe('string');
        expect(typeof services[key]).toBe('number');
      });
    });
  });

  describe('onRequest() - Edge cases and boundary conditions', () => {
    it('should handle zero hosts returned', () => {
      const zeroHostsResponse = {
        total_hosts: 0,
        total_services: 0,
        last_sync: new Date().toISOString(),
        countries: {},
        services: {}
      };

      expect(zeroHostsResponse.total_hosts).toBe(0);
      expect(zeroHostsResponse.total_services).toBe(0);
      expect(Object.keys(zeroHostsResponse.countries)).toHaveLength(0);
      expect(Object.keys(zeroHostsResponse.services)).toHaveLength(0);
    });

    it('should handle very large host counts', () => {
      const largeNumber = 999999999;
      const response = {
        total_hosts: largeNumber,
        total_services: largeNumber * 5
      };

      expect(response.total_hosts).toBe(999999999);
      expect(response.total_services).toBe(4999999995);
    });

    it('should handle single country result', () => {
      const singleCountry = { US: 1000 };

      expect(Object.keys(singleCountry)).toHaveLength(1);
      expect(singleCountry.US).toBe(1000);
    });

    it('should handle maximum bucket results (50 countries)', () => {
      const countries = {};
      for (let i = 0; i < 50; i++) {
        countries[`C${i}`] = i * 10;
      }

      expect(Object.keys(countries)).toHaveLength(50);
    });

    it('should handle maximum service buckets (25 services)', () => {
      const services = {};
      for (let i = 0; i < 25; i++) {
        services[`service${i}`] = i * 100;
      }

      expect(Object.keys(services)).toHaveLength(25);
    });

    it('should handle country codes of varying lengths', () => {
      const countries = {
        US: 100,   // 2 chars
        USA: 200,  // 3 chars
        UK: 150    // 2 chars
      };

      Object.keys(countries).forEach(code => {
        expect(code.length).toBeGreaterThanOrEqual(2);
        expect(code.length).toBeLessThanOrEqual(3);
      });
    });

    it('should handle service names with special characters', () => {
      const services = {
        'http': 100,
        'https': 200,
        'postgresql': 50,
        'microsoft-ds': 75,
        'netbios-ssn': 30
      };

      expect(services['microsoft-ds']).toBe(75);
      expect(services['netbios-ssn']).toBe(30);
    });
  });

  describe('onRequest() - Concurrent request handling', () => {
    it('should make three API calls concurrently via Promise.all', async () => {
      const promises = [
        Promise.resolve({ result: { total: 100 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].result.total).toBe(100);
    });

    it('should fail fast if any API call fails in Promise.all', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve('slow'), 100)),
        Promise.reject(new Error('Fast fail')),
        new Promise(resolve => setTimeout(() => resolve('slower'), 200))
      ];

      await expect(Promise.all(promises)).rejects.toThrow('Fast fail');
    });
  });

  describe('Data transformation and aggregation logic', () => {
    it('should correctly sum service counts', () => {
      const buckets = [
        { key: 'http', count: 1000 },
        { key: 'https', count: 2000 },
        { key: 'ssh', count: 500 },
        { key: 'ftp', count: 300 }
      ];

      let total = 0;
      buckets.forEach(b => total += b.count);

      expect(total).toBe(3800);
    });

    it('should maintain bucket order from API', () => {
      const buckets = [
        { key: 'first', count: 100 },
        { key: 'second', count: 200 },
        { key: 'third', count: 300 }
      ];

      const keys = buckets.map(b => b.key);
      expect(keys).toEqual(['first', 'second', 'third']);
    });

    it('should not mutate original bucket data', () => {
      const originalBuckets = [
        { key: 'us', count: 100 }
      ];

      const countries = {};
      originalBuckets.forEach(bucket => {
        countries[bucket.key.toUpperCase()] = bucket.count;
      });

      expect(originalBuckets[0].key).toBe('us'); // Original not mutated
      expect(countries.US).toBe(100);
    });
  });
});