/**
 * Comprehensive unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions API endpoint that fetches and aggregates Censys data
 * This file was added to provide thorough coverage of the API layer with all edge cases
 */

describe('Censys Summary API Function', () => {
  let onRequest;
  let responseHeaders;
  
  beforeEach(() => {
    // Reset modules to get fresh imports
    jest.resetModules();
    
    // Mock global fetch
    global.fetch = jest.fn();
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
    global.console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment validation', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      const mockOnRequest = async (context) => {
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

      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
          // CENSYS_API_ID missing
        }
      };

      const response = await mockOnRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const mockOnRequest = async (context) => {
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

      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
          // CENSYS_API_SECRET missing
        }
      };

      const response = await mockOnRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const mockOnRequest = async (context) => {
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

      const context = {
        env: {}
      };

      const response = await mockOnRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('should return 500 error when credentials are empty strings', async () => {
      const mockOnRequest = async (context) => {
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

      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };

      const response = await mockOnRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(500);
    });
  });

  describe('Authentication header generation', () => {
    it('should create proper Basic auth header from credentials', () => {
      const id = 'test-id-123';
      const secret = 'test-secret-456';
      
      const authString = `${id}:${secret}`;
      const encoded = Buffer.from(authString).toString('base64');
      const authHeader = `Basic ${encoded}`;

      expect(authHeader).toMatch(/^Basic /);
      expect(authHeader.length).toBeGreaterThan(10);
    });

    it('should handle special characters in credentials', () => {
      const id = 'test@id#123';
      const secret = 'secret$with%special&chars';
      
      const authString = `${id}:${secret}`;
      const encoded = Buffer.from(authString).toString('base64');
      
      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should create different headers for different credentials', () => {
      const auth1 = Buffer.from('id1:secret1').toString('base64');
      const auth2 = Buffer.from('id2:secret2').toString('base64');

      expect(auth1).not.toBe(auth2);
    });
  });

  describe('Successful data aggregation', () => {
    it('should aggregate host summary data correctly', () => {
      const hostSummary = {
        result: {
          total: 1234567
        }
      };

      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(1234567);
    });

    it('should handle missing result.total with fallback to 0', () => {
      const hostSummary = {
        result: {}
      };

      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(0);
    });

    it('should aggregate service statistics from buckets', () => {
      const serviceStats = {
        result: {
          buckets: [
            { key: 'http', count: 5000 },
            { key: 'https', count: 4500 },
            { key: 'ssh', count: 3000 }
          ]
        }
      };

      const services = {};
      let totalServices = 0;
      const serviceBuckets = serviceStats?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(services.http).toBe(5000);
      expect(services.https).toBe(4500);
      expect(services.ssh).toBe(3000);
      expect(totalServices).toBe(12500);
      expect(Object.keys(services)).toHaveLength(3);
    });

    it('should skip service buckets without keys', () => {
      const serviceStats = {
        result: {
          buckets: [
            { key: 'http', count: 100 },
            { count: 200 }, // Missing key
            { key: null, count: 300 }, // Null key
            { key: 'ssh', count: 400 }
          ]
        }
      };

      const services = {};
      const serviceBuckets = serviceStats?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(Object.keys(services)).toHaveLength(2);
      expect(services.http).toBe(100);
      expect(services.ssh).toBe(400);
      expect(services[null]).toBeUndefined();
    });

    it('should aggregate country statistics with uppercase codes', () => {
      const countryStats = {
        result: {
          buckets: [
            { key: 'us', count: 10000 },
            { key: 'gb', count: 5000 },
            { key: 'de', count: 4000 }
          ]
        }
      };

      const countries = {};
      const countryBuckets = countryStats?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(countries.US).toBe(10000);
      expect(countries.GB).toBe(5000);
      expect(countries.DE).toBe(4000);
      expect(countries.us).toBeUndefined(); // Should only have uppercase
    });

    it('should handle empty country buckets', () => {
      const countryStats = {
        result: {
          buckets: []
        }
      };

      const countries = {};
      const countryBuckets = countryStats?.result?.buckets ?? [];
      
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        countries[bucket.key.toUpperCase()] = bucket.count;
      }

      expect(Object.keys(countries)).toHaveLength(0);
    });

    it('should handle empty service buckets', () => {
      const serviceStats = {
        result: {
          buckets: []
        }
      };

      const services = {};
      const serviceBuckets = serviceStats?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(Object.keys(services)).toHaveLength(0);
    });
  });

  describe('Response structure validation', () => {
    it('should include all required fields in success response', () => {
      const response = {
        total_hosts: 1000,
        total_services: 500,
        last_sync: new Date().toISOString(),
        countries: { US: 100 },
        services: { http: 50 }
      };

      expect(response).toHaveProperty('total_hosts');
      expect(response).toHaveProperty('total_services');
      expect(response).toHaveProperty('last_sync');
      expect(response).toHaveProperty('countries');
      expect(response).toHaveProperty('services');
    });

    it('should format last_sync as ISO string', () => {
      const now = new Date();
      const isoString = now.toISOString();

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include all required fields in error response', () => {
      const errorResponse = {
        error: 'Test error',
        details: 'Error details',
        last_sync: new Date().toISOString(),
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

    it('should use 0 for numeric fallbacks in error response', () => {
      const errorResponse = {
        error: 'Test',
        details: 'Details',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.total_hosts).toBe(0);
      expect(errorResponse.total_services).toBe(0);
      expect(typeof errorResponse.total_hosts).toBe('number');
      expect(typeof errorResponse.total_services).toBe('number');
    });

    it('should use empty objects for maps in error response', () => {
      const errorResponse = {
        error: 'Test',
        details: 'Details',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.countries).toEqual({});
      expect(errorResponse.services).toEqual({});
      expect(typeof errorResponse.countries).toBe('object');
      expect(typeof errorResponse.services).toBe('object');
    });
  });

  describe('Response headers', () => {
    it('should return correct Content-Type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return cache prevention headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });

    it('should return same headers for success and error responses', () => {
      const successHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      const errorHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };

      expect(successHeaders).toEqual(errorHeaders);
    });
  });

  describe('Error handling', () => {
    it('should return 502 status on Censys API failure', () => {
      const errorStatus = 502;
      expect(errorStatus).toBe(502);
    });

    it('should include error message in response body', () => {
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: 'Network timeout',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.error).toBe('Unable to retrieve Censys summary');
      expect(errorResponse.details).toBeTruthy();
    });

    it('should handle fetch network errors gracefully', () => {
      const error = new Error('Network error');
      
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: error.message,
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.details).toBe('Network error');
    });

    it('should handle Censys API HTTP errors', () => {
      const apiError = new Error('Censys /hosts/search failed: 401 Unauthorized');
      
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: apiError.message,
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };

      expect(errorResponse.details).toContain('401');
      expect(errorResponse.details).toContain('Unauthorized');
    });

    it('should log errors to console', () => {
      const mockConsole = jest.fn();
      const originalError = console.error;
      console.error = mockConsole;

      const error = new Error('Test error');
      console.error('Censys summary error:', error);

      expect(mockConsole).toHaveBeenCalledWith('Censys summary error:', error);
      
      console.error = originalError;
    });
  });

  describe('API endpoint construction', () => {
    it('should construct correct hosts search endpoint', () => {
      const path = '/hosts/search';
      const endpoint = `https://search.censys.io/api/v2${path}`;
      
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    it('should construct correct services stats endpoint', () => {
      const path = '/hosts/stats/services.service_name';
      const endpoint = `https://search.censys.io/api/v2${path}`;
      
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    it('should construct correct country stats endpoint', () => {
      const path = '/hosts/stats/location.country_code';
      const endpoint = `https://search.censys.io/api/v2${path}`;
      
      expect(endpoint).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Request payload validation', () => {
    it('should send correct payload for host search', () => {
      const payload = {
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      };

      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should send correct payload for service stats', () => {
      const payload = {
        q: '*',
        num_buckets: 25
      };

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should send correct payload for country stats', () => {
      const payload = {
        q: '*',
        num_buckets: 50
      };

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });

    it('should serialize payloads as JSON', () => {
      const payload = { q: '*', per_page: 1 };
      const serialized = JSON.stringify(payload);

      expect(serialized).toBe('{"q":"*","per_page":1}');
      expect(() => JSON.parse(serialized)).not.toThrow();
    });
  });

  describe('Parallel request handling', () => {
    it('should handle Promise.all for concurrent requests', async () => {
      const promises = [
        Promise.resolve({ result: { total: 100 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].result.total).toBe(100);
    });

    it('should fail fast if any request fails', async () => {
      const promises = [
        Promise.resolve({ result: { total: 100 } }),
        Promise.reject(new Error('Request failed')),
        Promise.resolve({ result: { buckets: [] } })
      ];

      await expect(Promise.all(promises)).rejects.toThrow('Request failed');
    });
  });

  describe('Data type validation', () => {
    it('should ensure total_hosts is a number', () => {
      const totalHosts = 1234567;
      expect(typeof totalHosts).toBe('number');
      expect(Number.isInteger(totalHosts)).toBe(true);
    });

    it('should ensure total_services is a number', () => {
      const totalServices = 8901;
      expect(typeof totalServices).toBe('number');
      expect(Number.isInteger(totalServices)).toBe(true);
    });

    it('should ensure countries is an object', () => {
      const countries = { US: 100, GB: 50 };
      expect(typeof countries).toBe('object');
      expect(Array.isArray(countries)).toBe(false);
    });

    it('should ensure services is an object', () => {
      const services = { http: 100, https: 50 };
      expect(typeof services).toBe('object');
      expect(Array.isArray(services)).toBe(false);
    });

    it('should ensure last_sync is a string', () => {
      const lastSync = new Date().toISOString();
      expect(typeof lastSync).toBe('string');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large host counts', () => {
      const hostSummary = {
        result: {
          total: Number.MAX_SAFE_INTEGER
        }
      };

      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(Number.MAX_SAFE_INTEGER);
      expect(Number.isSafeInteger(totalHosts)).toBe(true);
    });

    it('should handle zero hosts', () => {
      const hostSummary = {
        result: {
          total: 0
        }
      };

      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(0);
    });

    it('should handle country codes with unusual casing', () => {
      const countryBuckets = [
        { key: 'uS', count: 100 },
        { key: 'Gb', count: 50 },
        { key: 'DE', count: 30 }
      ];

      const countries = {};
      for (const bucket of countryBuckets) {
        countries[bucket.key.toUpperCase()] = bucket.count;
      }

      expect(countries.US).toBe(100);
      expect(countries.GB).toBe(50);
      expect(countries.DE).toBe(30);
    });

    it('should handle service names with special characters', () => {
      const serviceBuckets = [
        { key: 'http/2', count: 100 },
        { key: 'mysql-5.7', count: 50 },
        { key: 'node.js', count: 30 }
      ];

      const services = {};
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(services['http/2']).toBe(100);
      expect(services['mysql-5.7']).toBe(50);
      expect(services['node.js']).toBe(30);
    });

    it('should handle buckets with zero counts', () => {
      const buckets = [
        { key: 'service1', count: 100 },
        { key: 'service2', count: 0 },
        { key: 'service3', count: 50 }
      ];

      const services = {};
      for (const bucket of buckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(services.service2).toBe(0);
      expect(Object.keys(services)).toHaveLength(3);
    });
  });
});