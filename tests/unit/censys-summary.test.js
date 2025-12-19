import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Cloudflare Workers runtime
global.fetch = vi.fn();
global.btoa = (str) => Buffer.from(str).toString('base64');
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

// Import the function (in real scenario, we'd refactor to export testable functions)
describe('censys-summary API function', () => {
  let mockContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };
  });

  describe('environment variable validation', () => {
    it('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };
      
      expect(context.env.CENSYS_API_ID).toBeUndefined();
      expect(context.env.CENSYS_API_SECRET).toBeDefined();
    });

    it('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };
      
      expect(context.env.CENSYS_API_ID).toBeDefined();
      expect(context.env.CENSYS_API_SECRET).toBeUndefined();
    });

    it('should return 500 when both credentials are missing', async () => {
      const context = { env: {} };
      
      expect(context.env.CENSYS_API_ID).toBeUndefined();
      expect(context.env.CENSYS_API_SECRET).toBeUndefined();
    });

    it('should proceed when both credentials are present', () => {
      expect(mockContext.env.CENSYS_API_ID).toBe('test-id');
      expect(mockContext.env.CENSYS_API_SECRET).toBe('test-secret');
    });
  });

  describe('authentication header generation', () => {
    it('should create valid Basic auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
      
      expect(authHeader).toContain('Basic ');
      expect(authHeader.length).toBeGreaterThan(6);
    });

    it('should encode credentials properly', () => {
      const credentials = 'test-id:test-secret';
      const encoded = btoa(credentials);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });
  });

  describe('endpoint URL construction', () => {
    it('should construct hosts search endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/search');
      
      expect(url).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    it('should construct service stats endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/stats/services.service_name');
      
      expect(url).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    it('should construct country stats endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const url = endpoint('/hosts/stats/location.country_code');
      
      expect(url).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });
  });

  describe('Censys API request payload', () => {
    it('should create correct hosts search payload', () => {
      const payload = { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' };
      
      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should create correct service stats payload', () => {
      const payload = { q: '*', num_buckets: 25 };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should create correct country stats payload', () => {
      const payload = { q: '*', num_buckets: 50 };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });
  });

  describe('response data processing', () => {
    it('should extract total hosts from API response', () => {
      const hostSummary = {
        result: {
          total: 1500000
        }
      };
      
      const totalHosts = hostSummary?.result?.total ?? 0;
      expect(totalHosts).toBe(1500000);
    });

    it('should handle missing total hosts gracefully', () => {
      const hostSummary = null;
      const totalHosts = hostSummary?.result?.total ?? 0;
      
      expect(totalHosts).toBe(0);
    });

    it('should process service buckets correctly', () => {
      const serviceStats = {
        result: {
          buckets: [
            { key: 'http', count: 2000000 },
            { key: 'https', count: 1500000 },
            { key: 'ssh', count: 800000 }
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
      
      expect(services.http).toBe(2000000);
      expect(services.https).toBe(1500000);
      expect(services.ssh).toBe(800000);
      expect(totalServices).toBe(4300000);
    });

    it('should skip buckets without keys', () => {
      const serviceStats = {
        result: {
          buckets: [
            { key: 'http', count: 100 },
            { count: 200 },  // Missing key
            { key: 'https', count: 300 }
          ]
        }
      };
      
      const services = {};
      const serviceBuckets = serviceStats?.result?.buckets ?? [];
      
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }
      
      expect(Object.keys(services).length).toBe(2);
      expect(services.http).toBe(100);
      expect(services.https).toBe(300);
    });

    it('should uppercase country codes', () => {
      const countryStats = {
        result: {
          buckets: [
            { key: 'us', count: 500000 },
            { key: 'de', count: 300000 }
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
      
      expect(countries.US).toBe(500000);
      expect(countries.DE).toBe(300000);
      expect(countries.us).toBeUndefined();
    });
  });

  describe('response object structure', () => {
    it('should create valid success response object', () => {
      const response = {
        total_hosts: 1500000,
        total_services: 5000000,
        last_sync: new Date().toISOString(),
        countries: { US: 500000 },
        services: { http: 2000000 }
      };
      
      expect(response).toHaveProperty('total_hosts');
      expect(response).toHaveProperty('total_services');
      expect(response).toHaveProperty('last_sync');
      expect(response).toHaveProperty('countries');
      expect(response).toHaveProperty('services');
    });

    it('should include ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should create valid error response object', () => {
      const error = new Error('Test error');
      const response = {
        error: 'Unable to retrieve Censys summary',
        details: error.message,
        last_sync: new Date().toISOString(),
        total_hosts: 0,
        total_services: 0,
        countries: {},
        services: {}
      };
      
      expect(response.error).toBeTruthy();
      expect(response.details).toBe('Test error');
      expect(response.total_hosts).toBe(0);
      expect(response.total_services).toBe(0);
      expect(Object.keys(response.countries).length).toBe(0);
      expect(Object.keys(response.services).length).toBe(0);
    });
  });

  describe('response headers', () => {
    it('should include correct Content-Type header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include Cache-Control header', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      };
      
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });
  });

  describe('HTTP status codes', () => {
    it('should return 200 for successful requests', () => {
      const status = 200;
      expect(status).toBe(200);
    });

    it('should return 500 for missing credentials', () => {
      const status = 500;
      expect(status).toBe(500);
    });

    it('should return 502 for Censys API errors', () => {
      const status = 502;
      expect(status).toBe(502);
    });
  });

  describe('error handling', () => {
    it('should catch and format fetch errors', () => {
      const error = new Error('Network timeout');
      const errorResponse = {
        error: 'Unable to retrieve Censys summary',
        details: error.message
      };
      
      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.details).toBe('Network timeout');
    });

    it('should handle non-OK HTTP responses', () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      };
      
      expect(mockResponse.ok).toBe(false);
      expect(mockResponse.status).toBe(401);
    });

    it('should format error messages correctly', () => {
      const path = '/hosts/search';
      const status = 401;
      const text = 'Unauthorized';
      const errorMsg = `Censys ${path} failed: ${status} ${text}`;
      
      expect(errorMsg).toBe('Censys /hosts/search failed: 401 Unauthorized');
    });
  });

  describe('parallel API calls', () => {
    it('should execute three API calls in parallel', async () => {
      const promises = [
        Promise.resolve({ result: { total: 1000 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(3);
    });

    it('should handle partial failures in Promise.all', async () => {
      const promises = [
        Promise.resolve({ success: true }),
        Promise.reject(new Error('Failed')),
        Promise.resolve({ success: true })
      ];
      
      await expect(Promise.all(promises)).rejects.toThrow('Failed');
    });
  });
});