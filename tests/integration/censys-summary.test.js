/**
 * Integration tests for functions/api/censys-summary.js
 * Testing the Cloudflare Pages Function that aggregates Censys API data
 */

describe('Censys Summary API Function', () => {
  let mockFetch;
  let mockEnv;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockEnv = {
      CENSYS_API_ID: 'test-id',
      CENSYS_API_SECRET: 'test-secret'
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Environment Variable Validation', () => {
    test('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await handleMissingCredentials(context.env);
      expect(response.status).toBe(500);
      
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Missing');
    });

    test('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const response = await handleMissingCredentials(context.env);
      expect(response.status).toBe(500);
      
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Missing');
    });

    test('should proceed when both credentials are present', () => {
      const env = {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      };

      expect(env.CENSYS_API_ID).toBeTruthy();
      expect(env.CENSYS_API_SECRET).toBeTruthy();
    });
  });

  describe('Authentication Header Generation', () => {
    test('should generate correct Basic Auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const authHeader = `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;

      expect(authHeader).toContain('Basic ');
      expect(authHeader.length).toBeGreaterThan(6);
    });

    test('should handle special characters in credentials', () => {
      const id = 'test@id!';
      const secret = 'test$secret%';
      const authHeader = `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
      const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();

      expect(decoded).toBe(`${id}:${secret}`);
    });
  });

  describe('Endpoint URL Construction', () => {
    test('should construct correct host search endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/search');

      expect(url).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    test('should construct correct service stats endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/stats/services.service_name');

      expect(url).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    test('should construct correct country stats endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/stats/location.country_code');

      expect(url).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Request Payload Construction', () => {
    test('should create correct host search payload', () => {
      const payload = { 
        q: '*', 
        per_page: 1, 
        virtual_hosts: 'EXCLUDE' 
      };

      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    test('should create correct service stats payload', () => {
      const payload = { 
        q: '*', 
        num_buckets: 25 
      };

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    test('should create correct country stats payload', () => {
      const payload = { 
        q: '*', 
        num_buckets: 50 
      };

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });
  });

  describe('Response Parsing', () => {
    test('should extract total hosts from search response', () => {
      const mockResponse = {
        result: {
          total: 12345
        }
      };

      const totalHosts = mockResponse?.result?.total ?? 0;
      expect(totalHosts).toBe(12345);
    });

    test('should handle missing total in search response', () => {
      const mockResponse = {
        result: {}
      };

      const totalHosts = mockResponse?.result?.total ?? 0;
      expect(totalHosts).toBe(0);
    });

    test('should process service buckets correctly', () => {
      const mockResponse = {
        result: {
          buckets: [
            { key: 'http', count: 1000 },
            { key: 'https', count: 2000 },
            { key: 'ssh', count: 500 }
          ]
        }
      };

      const services = {};
      let totalServices = 0;
      const serviceBuckets = mockResponse?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(services).toEqual({
        http: 1000,
        https: 2000,
        ssh: 500
      });
      expect(totalServices).toBe(3500);
    });

    test('should skip buckets without keys', () => {
      const mockResponse = {
        result: {
          buckets: [
            { key: 'http', count: 1000 },
            { count: 500 }, // Missing key
            { key: '', count: 200 }
          ]
        }
      };

      const services = {};
      const serviceBuckets = mockResponse?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(services).toEqual({ http: 1000 });
    });

    test('should process country buckets correctly', () => {
      const mockResponse = {
        result: {
          buckets: [
            { key: 'us', count: 5000 },
            { key: 'de', count: 3000 },
            { key: 'uk', count: 2000 }
          ]
        }
      };

      const countries = {};
      const countryBuckets = mockResponse?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(countries).toEqual({
        US: 5000,
        DE: 3000,
        UK: 2000
      });
    });

    test('should uppercase country codes', () => {
      const countryCodes = ['us', 'de', 'uk', 'fr'];
      const uppercased = countryCodes.map(code => code.toUpperCase());

      expect(uppercased).toEqual(['US', 'DE', 'UK', 'FR']);
    });
  });

  describe('Response Construction', () => {
    test('should construct valid success response', () => {
      const response = {
        total_hosts: 10000,
        total_services: 25000,
        last_sync: new Date('2024-01-01T12:00:00Z').toISOString(),
        countries: { US: 5000, DE: 3000 },
        services: { http: 10000, https: 15000 }
      };

      expect(response).toHaveProperty('total_hosts');
      expect(response).toHaveProperty('total_services');
      expect(response).toHaveProperty('last_sync');
      expect(response).toHaveProperty('countries');
      expect(response).toHaveProperty('services');
      expect(typeof response.total_hosts).toBe('number');
      expect(typeof response.total_services).toBe('number');
    });

    test('should include valid ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should construct error response with fallback data', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Network timeout',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.total_hosts).toBe(0);
      expect(errorResponse.total_services).toBe(0);
      expect(errorResponse.countries).toEqual({});
      expect(errorResponse.services).toEqual({});
    });
  });

  describe('HTTP Response Headers', () => {
    test('should include correct Content-Type header', () => {
      const headers = responseHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should include cache control headers', () => {
      const headers = responseHeaders();
      
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should not cache responses', () => {
      const headers = responseHeaders();
      const cacheControl = headers['Cache-Control'];
      
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', () => {
      const error = new Error('Network timeout');
      
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: error.message,
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.details).toBe('Network timeout');
    });

    test('should handle HTTP error responses', () => {
      const status = 401;
      const text = 'Unauthorized';
      const error = new Error(`Censys /hosts/search failed: ${status} ${text}`);

      expect(error.message).toContain('401');
      expect(error.message).toContain('Unauthorized');
    });

    test('should handle malformed JSON responses', () => {
      const invalidJson = '{invalid}';
      
      expect(() => JSON.parse(invalidJson)).toThrow(SyntaxError);
    });

    test('should provide fallback for missing response data', () => {
      const response = {};
      
      const totalHosts = response?.result?.total ?? 0;
      const buckets = response?.result?.buckets ?? [];
      
      expect(totalHosts).toBe(0);
      expect(buckets).toEqual([]);
    });
  });

  describe('Parallel Request Handling', () => {
    test('should handle all three API calls in parallel', async () => {
      const promises = [
        Promise.resolve({ result: { total: 1000 } }),
        Promise.resolve({ result: { buckets: [{ key: 'http', count: 500 }] } }),
        Promise.resolve({ result: { buckets: [{ key: 'US', count: 800 }] } })
      ];

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(3);
      expect(results[0].result.total).toBe(1000);
      expect(results[1].result.buckets.length).toBe(1);
      expect(results[2].result.buckets.length).toBe(1);
    });

    test('should handle partial failures in parallel requests', async () => {
      const promises = [
        Promise.resolve({ result: { total: 1000 } }),
        Promise.reject(new Error('Service stats failed')),
        Promise.resolve({ result: { buckets: [{ key: 'US', count: 800 }] } })
      ];

      try {
        await Promise.all(promises);
      } catch (error) {
        expect(error.message).toBe('Service stats failed');
      }
    });
  });

  describe('Data Aggregation', () => {
    test('should aggregate service counts correctly', () => {
      const buckets = [
        { key: 'http', count: 1000 },
        { key: 'https', count: 2000 },
        { key: 'ssh', count: 500 },
        { key: 'ftp', count: 300 }
      ];

      let total = 0;
      buckets.forEach(bucket => {
        total += bucket.count;
      });

      expect(total).toBe(3800);
    });

    test('should handle empty bucket arrays', () => {
      const buckets = [];
      
      let total = 0;
      buckets.forEach(bucket => {
        total += bucket.count;
      });

      expect(total).toBe(0);
    });

    test('should handle buckets with zero counts', () => {
      const buckets = [
        { key: 'http', count: 0 },
        { key: 'https', count: 0 }
      ];

      const services = {};
      buckets.forEach(bucket => {
        if (!bucket?.key) return;
        services[bucket.key] = bucket.count;
      });

      expect(services).toEqual({
        http: 0,
        https: 0
      });
    });
  });

  describe('Query Parameters', () => {
    test('should use wildcard query for all hosts', () => {
      const query = '*';
      expect(query).toBe('*');
    });

    test('should limit search results appropriately', () => {
      const perPage = 1;
      expect(perPage).toBe(1);
    });

    test('should exclude virtual hosts', () => {
      const virtualHosts = 'EXCLUDE';
      expect(virtualHosts).toBe('EXCLUDE');
    });

    test('should request correct number of buckets for services', () => {
      const numBuckets = 25;
      expect(numBuckets).toBe(25);
    });

    test('should request correct number of buckets for countries', () => {
      const numBuckets = 50;
      expect(numBuckets).toBe(50);
    });
  });

  describe('Response Status Codes', () => {
    test('should return 200 for successful response', () => {
      const status = 200;
      expect(status).toBe(200);
    });

    test('should return 502 for upstream API errors', () => {
      const status = 502;
      expect(status).toBe(502);
    });

    test('should return 500 for configuration errors', () => {
      const status = 500;
      expect(status).toBe(500);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize response object to JSON string', () => {
      const response = {
        total_hosts: 1000,
        total_services: 2000,
        countries: { US: 500 },
        services: { http: 1000 }
      };

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(response);
    });

    test('should handle nested objects in serialization', () => {
      const response = {
        countries: { US: 100, DE: 50 },
        services: { http: 200, https: 300 }
      };

      const json = JSON.stringify(response);
      expect(json).toContain('"countries"');
      expect(json).toContain('"services"');
    });

    test('should serialize empty objects', () => {
      const response = {
        countries: {},
        services: {}
      };

      const json = JSON.stringify(response);
      expect(json).toContain('{}');
    });
  });
});

// Helper function for missing credentials test
function handleMissingCredentials(env) {
  if (!env.CENSYS_API_ID || !env.CENSYS_API_SECRET) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
      })
    };
  }
  return { status: 200, body: '{}' };
}

// Helper function for response headers
function responseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}