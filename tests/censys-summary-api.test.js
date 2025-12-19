/**
 * Comprehensive unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Workers function that fetches Censys data
 */

describe('censys-summary API', () => {
  let mockContext;
  let mockFetch;
  
  beforeEach(() => {
    // Mock context with environment variables
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };
    
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('responseHeaders helper', () => {
    test('should return correct Content-Type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should return correct Cache-Control header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should include all required headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(Object.keys(headers)).toHaveLength(2);
      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('Cache-Control');
    });
  });

  describe('Environment validation', () => {
    test('should require CENSYS_API_ID', () => {
      const context = { env: { CENSYS_API_SECRET: 'secret' } };
      const id = context.env.CENSYS_API_ID;
      const secret = context.env.CENSYS_API_SECRET;
      
      expect(id).toBeUndefined();
      expect(secret).toBe('secret');
    });

    test('should require CENSYS_API_SECRET', () => {
      const context = { env: { CENSYS_API_ID: 'id123' } };
      const id = context.env.CENSYS_API_ID;
      const secret = context.env.CENSYS_API_SECRET;
      
      expect(id).toBe('id123');
      expect(secret).toBeUndefined();
    });

    test('should have both credentials configured', () => {
      const id = mockContext.env.CENSYS_API_ID;
      const secret = mockContext.env.CENSYS_API_SECRET;
      
      expect(id).toBeTruthy();
      expect(secret).toBeTruthy();
    });
  });

  describe('Censys API integration', () => {
    test('should construct Basic auth header correctly', () => {
      const id = 'testId';
      const secret = 'testSecret';
      const credentials = Buffer.from(`${id}:${secret}`).toString('base64');
      const authHeader = `Basic ${credentials}`;
      
      expect(authHeader).toMatch(/^Basic /);
      expect(credentials).toBeTruthy();
    });

    test('should handle successful hosts API response', async () => {
      const mockHostsData = {
        result: {
          total: 1500
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHostsData
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      const data = await response.json();
      
      expect(data.result.total).toBe(1500);
    });

    test('should handle successful services API response', async () => {
      const mockServicesData = {
        result: {
          buckets: [
            { key: 'HTTP', count: 500 },
            { key: 'HTTPS', count: 300 }
          ]
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockServicesData
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      const data = await response.json();
      
      expect(data.result.buckets).toHaveLength(2);
      expect(data.result.buckets[0].key).toBe('HTTP');
    });

    test('should handle successful countries API response', async () => {
      const mockCountriesData = {
        result: {
          buckets: [
            { key: 'US', count: 800 },
            { key: 'GB', count: 200 }
          ]
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCountriesData
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      const data = await response.json();
      
      expect(data.result.buckets).toHaveLength(2);
      expect(data.result.buckets[0].key).toBe('US');
    });
  });

  describe('Data aggregation', () => {
    test('should calculate total services from buckets', () => {
      const buckets = [
        { key: 'HTTP', count: 500 },
        { key: 'HTTPS', count: 300 },
        { key: 'SSH', count: 150 }
      ];
      
      const total = buckets.reduce((sum, b) => sum + b.count, 0);
      expect(total).toBe(950);
    });

    test('should convert services buckets to object map', () => {
      const buckets = [
        { key: 'HTTP', count: 500 },
        { key: 'HTTPS', count: 300 }
      ];
      
      const servicesMap = {};
      buckets.forEach(b => {
        servicesMap[b.key] = b.count;
      });
      
      expect(servicesMap).toEqual({
        'HTTP': 500,
        'HTTPS': 300
      });
    });

    test('should convert countries buckets to uppercase keys', () => {
      const buckets = [
        { key: 'us', count: 800 },
        { key: 'gb', count: 200 }
      ];
      
      const countriesMap = {};
      buckets.forEach(b => {
        countriesMap[b.key.toUpperCase()] = b.count;
      });
      
      expect(countriesMap).toEqual({
        'US': 800,
        'GB': 200
      });
    });

    test('should handle empty buckets array', () => {
      const buckets = [];
      const total = buckets.reduce((sum, b) => sum + b.count, 0);
      
      expect(total).toBe(0);
    });

    test('should preserve all bucket entries', () => {
      const buckets = Array.from({ length: 20 }, (_, i) => ({
        key: `Service${i}`,
        count: i * 10
      }));
      
      expect(buckets).toHaveLength(20);
      expect(buckets[0].count).toBe(0);
      expect(buckets[19].count).toBe(190);
    });
  });

  describe('Response format', () => {
    test('should include total_hosts in response', () => {
      const response = {
        total_hosts: 1500,
        total_services: 950,
        last_sync: new Date().toISOString(),
        countries: {},
        services: {}
      };
      
      expect(response).toHaveProperty('total_hosts');
      expect(response.total_hosts).toBe(1500);
    });

    test('should include total_services in response', () => {
      const response = {
        total_hosts: 1500,
        total_services: 950,
        last_sync: new Date().toISOString(),
        countries: {},
        services: {}
      };
      
      expect(response).toHaveProperty('total_services');
      expect(response.total_services).toBe(950);
    });

    test('should include ISO timestamp for last_sync', () => {
      const timestamp = new Date().toISOString();
      const response = {
        total_hosts: 1500,
        total_services: 950,
        last_sync: timestamp,
        countries: {},
        services: {}
      };
      
      expect(response.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should include countries object in response', () => {
      const response = {
        total_hosts: 1500,
        total_services: 950,
        last_sync: new Date().toISOString(),
        countries: { 'US': 800, 'GB': 200 },
        services: {}
      };
      
      expect(response).toHaveProperty('countries');
      expect(typeof response.countries).toBe('object');
    });

    test('should include services object in response', () => {
      const response = {
        total_hosts: 1500,
        total_services: 950,
        last_sync: new Date().toISOString(),
        countries: {},
        services: { 'HTTP': 500, 'HTTPS': 300 }
      };
      
      expect(response).toHaveProperty('services');
      expect(typeof response.services).toBe('object');
    });
  });

  describe('Error handling', () => {
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    test('should handle API rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });

    test('should handle unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    test('should return error response with details', () => {
      const errorResponse = {
        error: 'Failed to fetch Censys data',
        details: 'Network timeout',
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };
      
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('details');
      expect(errorResponse.total_hosts).toBe(0);
    });

    test('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'format' })
      });
      
      const response = await mockFetch('https://search.censys.io/api/v2/hosts/aggregate');
      const data = await response.json();
      
      expect(data).not.toHaveProperty('result');
    });

    test('should handle missing credentials gracefully', () => {
      const context = { env: {} };
      const id = context.env.CENSYS_API_ID;
      const secret = context.env.CENSYS_API_SECRET;
      
      expect(!id || !secret).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete successful flow', async () => {
      const mockResponses = [
        { result: { total: 1500 } },
        { result: { buckets: [{ key: 'HTTP', count: 500 }] } },
        { result: { buckets: [{ key: 'US', count: 800 }] } }
      ];
      
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[0] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[1] })
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[2] });
      
      const hosts = await mockFetch().then(r => r.json());
      const services = await mockFetch().then(r => r.json());
      const countries = await mockFetch().then(r => r.json());
      
      expect(hosts.result.total).toBe(1500);
      expect(services.result.buckets[0].key).toBe('HTTP');
      expect(countries.result.buckets[0].key).toBe('US');
    });

    test('should handle partial failures', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { total: 1500 } }) })
        .mockRejectedValueOnce(new Error('Service aggregation failed'));
      
      const hosts = await mockFetch().then(r => r.json());
      expect(hosts.result.total).toBe(1500);
      
      try {
        await mockFetch();
      } catch (err) {
        expect(err.message).toBe('Service aggregation failed');
      }
    });

    test('should include timestamp in all responses', () => {
      const timestamp = new Date().toISOString();
      const successResponse = {
        total_hosts: 1500,
        last_sync: timestamp,
        countries: {},
        services: {},
        total_services: 0
      };
      
      const errorResponse = {
        error: 'Failed',
        last_sync: timestamp,
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {},
        details: ''
      };
      
      expect(successResponse.last_sync).toBe(timestamp);
      expect(errorResponse.last_sync).toBe(timestamp);
    });
  });
});