/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions backend API that aggregates Censys data
 */

const fs = require('fs');
const path = require('path');

describe('Censys Summary API Function', () => {
  let onRequest, responseHeaders;
  let mockFetch;
  let mockBtoa;

  beforeEach(() => {
    // Read and evaluate the module
    const moduleContent = fs.readFileSync(
      path.join(__dirname, '../functions/api/censys-summary.js'),
      'utf8'
    );

    // Create module scope
    const module = { exports: {} };
    const exports = module.exports;

    // Mock global functions
    mockFetch = jest.fn();
    mockBtoa = jest.fn((str) => Buffer.from(str).toString('base64'));
    global.fetch = mockFetch;
    global.btoa = mockBtoa;
    global.Response = class Response {
      constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
        this.headers = init?.headers || {};
      }
      async json() {
        return JSON.parse(this.body);
      }
      async text() {
        return this.body;
      }
    };

    // Execute the module code
    eval(moduleContent.replace(/export /g, 'module.exports.'));

    onRequest = module.exports.onRequest;
    responseHeaders = module.exports.responseHeaders || (() => ({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment variable validation', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toContain('CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toBeTruthy();
    });

    it('should set proper response headers for error responses', async () => {
      const context = { env: {} };

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toContain('no-store');
    });
  });

  describe('Successful API calls', () => {
    beforeEach(() => {
      // Mock successful Censys API responses
      mockFetch.mockImplementation(async (url, options) => {
        const body = JSON.parse(options.body);
        
        if (url.includes('/hosts/search')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                total: 12345
              }
            })
          };
        }
        
        if (url.includes('services.service_name')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                buckets: [
                  { key: 'HTTP', count: 5000 },
                  { key: 'HTTPS', count: 4500 },
                  { key: 'SSH', count: 2000 }
                ]
              }
            })
          };
        }
        
        if (url.includes('location.country_code')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                buckets: [
                  { key: 'us', count: 3000 },
                  { key: 'gb', count: 1500 },
                  { key: 'de', count: 1200 }
                ]
              }
            })
          };
        }

        throw new Error('Unexpected URL');
      });
    });

    it('should successfully fetch and aggregate data from all endpoints', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(12345);
      expect(body.total_services).toBe(11500); // 5000 + 4500 + 2000
      expect(body.services).toEqual({
        HTTP: 5000,
        HTTPS: 4500,
        SSH: 2000
      });
      expect(body.countries).toEqual({
        US: 3000,
        GB: 1500,
        DE: 1200
      });
      expect(body.last_sync).toBeTruthy();
      expect(new Date(body.last_sync).getTime()).toBeGreaterThan(0);
    });

    it('should make three parallel API calls', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      await onRequest(context);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/hosts/search'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('services.service_name'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location.country_code'),
        expect.any(Object)
      );
    });

    it('should include proper authentication header', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'my-id',
          CENSYS_API_SECRET: 'my-secret'
        }
      };

      await onRequest(context);

      expect(mockBtoa).toHaveBeenCalledWith('my-id:my-secret');
      
      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toMatch(/^Basic /);
    });

    it('should send proper request body with search parameters', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      await onRequest(context);

      // Check hosts search payload
      const hostsCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );
      const hostsBody = JSON.parse(hostsCall[1].body);
      expect(hostsBody.q).toBe('*');
      expect(hostsBody.per_page).toBe(1);
      expect(hostsBody.virtual_hosts).toBe('EXCLUDE');

      // Check services stats payload
      const servicesCall = mockFetch.mock.calls.find(call => 
        call[0].includes('services.service_name')
      );
      const servicesBody = JSON.parse(servicesCall[1].body);
      expect(servicesBody.q).toBe('*');
      expect(servicesBody.num_buckets).toBe(25);

      // Check countries stats payload
      const countriesCall = mockFetch.mock.calls.find(call => 
        call[0].includes('location.country_code')
      );
      const countriesBody = JSON.parse(countriesCall[1].body);
      expect(countriesBody.q).toBe('*');
      expect(countriesBody.num_buckets).toBe(50);
    });

    it('should use POST method for all requests', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      await onRequest(context);

      mockFetch.mock.calls.forEach(call => {
        expect(call[1].method).toBe('POST');
      });
    });

    it('should include proper headers in all requests', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      await onRequest(context);

      mockFetch.mock.calls.forEach(call => {
        const headers = call[1].headers;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Accept']).toBe('application/json');
        expect(headers['Authorization']).toMatch(/^Basic /);
      });
    });

    it('should uppercase country codes', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.countries).toHaveProperty('US');
      expect(body.countries).toHaveProperty('GB');
      expect(body.countries).toHaveProperty('DE');
      expect(body.countries).not.toHaveProperty('us');
      expect(body.countries).not.toHaveProperty('gb');
    });

    it('should set proper response headers', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toContain('no-store');
      expect(response.headers['Cache-Control']).toContain('no-cache');
      expect(response.headers['Cache-Control']).toContain('must-revalidate');
    });
  });

  describe('Edge cases and data handling', () => {
    it('should handle empty service buckets', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/hosts/search')) {
          return { ok: true, json: async () => ({ result: { total: 100 } }) };
        }
        if (url.includes('services.service_name')) {
          return { ok: true, json: async () => ({ result: { buckets: [] } }) };
        }
        if (url.includes('location.country_code')) {
          return { ok: true, json: async () => ({ result: { buckets: [] } }) };
        }
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should handle missing result objects', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({})
      }));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should skip buckets with missing keys', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/hosts/search')) {
          return { ok: true, json: async () => ({ result: { total: 100 } }) };
        }
        if (url.includes('services.service_name')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                buckets: [
                  { key: 'HTTP', count: 100 },
                  { count: 50 }, // Missing key
                  { key: 'SSH', count: 75 },
                  { key: null, count: 25 } // Null key
                ]
              }
            })
          };
        }
        if (url.includes('location.country_code')) {
          return { ok: true, json: async () => ({ result: { buckets: [] } }) };
        }
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.services).toEqual({
        HTTP: 100,
        SSH: 75
      });
      expect(body.total_services).toBe(175); // Only valid buckets counted
    });

    it('should handle large numbers correctly', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/hosts/search')) {
          return { ok: true, json: async () => ({ result: { total: 999999999 } }) };
        }
        if (url.includes('services.service_name')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                buckets: [
                  { key: 'HTTP', count: 500000000 },
                  { key: 'HTTPS', count: 499999999 }
                ]
              }
            })
          };
        }
        if (url.includes('location.country_code')) {
          return { ok: true, json: async () => ({ result: { buckets: [] } }) };
        }
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(999999999);
      expect(body.total_services).toBe(999999999);
    });

    it('should handle mixed case country codes', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/hosts/search')) {
          return { ok: true, json: async () => ({ result: { total: 100 } }) };
        }
        if (url.includes('services.service_name')) {
          return { ok: true, json: async () => ({ result: { buckets: [] } }) };
        }
        if (url.includes('location.country_code')) {
          return {
            ok: true,
            json: async () => ({
              result: {
                buckets: [
                  { key: 'uS', count: 100 },
                  { key: 'Gb', count: 50 },
                  { key: 'DE', count: 25 }
                ]
              }
            })
          };
        }
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.countries).toEqual({
        US: 100,
        GB: 50,
        DE: 25
      });
    });
  });

  describe('Error handling', () => {
    it('should return 502 error when Censys API returns non-OK status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('401');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
      expect(body.last_sync).toBeTruthy();
    });

    it('should return 502 error when network request fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Network failure');
    });

    it('should return 502 error when API returns invalid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.details).toContain('timeout');
    });

    it('should handle 404 errors from Censys API', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.details).toContain('404');
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.details).toContain('429');
    });

    it('should handle partial failures in Promise.all', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async (url) => {
        callCount++;
        if (callCount === 1) {
          return { ok: true, json: async () => ({ result: { total: 100 } }) };
        }
        throw new Error('Partial failure');
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });
  });

  describe('Response format validation', () => {
    beforeEach(() => {
      mockFetch.mockImplementation(async (url) => {
        if (url.includes('/hosts/search')) {
          return { ok: true, json: async () => ({ result: { total: 100 } }) };
        }
        if (url.includes('services.service_name')) {
          return {
            ok: true,
            json: async () => ({
              result: { buckets: [{ key: 'HTTP', count: 50 }] }
            })
          };
        }
        if (url.includes('location.country_code')) {
          return {
            ok: true,
            json: async () => ({
              result: { buckets: [{ key: 'us', count: 25 }] }
            })
          };
        }
      });
    });

    it('should return all required fields in success response', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    it('should return all required fields in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('details');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    it('should return ISO 8601 formatted timestamp', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(body.last_sync).toISOString()).toBe(body.last_sync);
    });

    it('should return numbers for total fields', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(typeof body.total_hosts).toBe('number');
      expect(typeof body.total_services).toBe('number');
    });

    it('should return objects for countries and services', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(typeof body.countries).toBe('object');
      expect(typeof body.services).toBe('object');
      expect(Array.isArray(body.countries)).toBe(false);
      expect(Array.isArray(body.services)).toBe(false);
    });
  });

  describe('Security considerations', () => {
    it('should not expose credentials in response on error', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      const context = {
        env: {
          CENSYS_API_ID: 'secret-id-12345',
          CENSYS_API_SECRET: 'secret-key-67890'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);
      const responseStr = JSON.stringify(body);

      expect(responseStr).not.toContain('secret-id-12345');
      expect(responseStr).not.toContain('secret-key-67890');
    });

    it('should use Basic authentication with base64 encoding', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      }));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      await onRequest(context);

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toMatch(/^Basic [A-Za-z0-9+/=]+$/);
    });

    it('should set cache control headers to prevent caching sensitive data', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      }));

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);

      expect(response.headers['Cache-Control']).toContain('no-store');
      expect(response.headers['Cache-Control']).toContain('no-cache');
    });
  });
});