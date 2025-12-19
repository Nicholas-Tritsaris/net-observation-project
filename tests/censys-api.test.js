/**
 * Unit tests for Censys API function (functions/api/censys-summary.js)
 * Tests request handling, data aggregation, error handling
 */

describe('Censys API Summary', () => {
  let onRequest, responseHeaders;

  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
    global.btoa = (str) => Buffer.from(str).toString('base64');
    
    // Load the module
    const module = require('../functions/api/censys-summary.js');
    onRequest = module.onRequest;
    
    // Extract responseHeaders function
    const fs = require('fs');
    const content = fs.readFileSync('./functions/api/censys-summary.js', 'utf-8');
    const match = content.match(/function responseHeaders\(\) \{[\s\S]*?\n\}/);
    if (match) {
      eval(match[0]);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Validation', () => {
    test('should return error when CENSYS_API_ID is missing', async () => {
      const context = { env: { CENSYS_API_SECRET: 'secret' } };
      
      const response = await onRequest(context);
      const data = JSON.parse(await response.text());
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID');
    });

    test('should return error when CENSYS_API_SECRET is missing', async () => {
      const context = { env: { CENSYS_API_ID: 'id' } };
      
      const response = await onRequest(context);
      const data = JSON.parse(await response.text());
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_SECRET');
    });

    test('should return error when both credentials are missing', async () => {
      const context = { env: {} };
      
      const response = await onRequest(context);
      const data = JSON.parse(await response.text());
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Successful Data Aggregation', () => {
    test('should aggregate hosts, services, and countries', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const mockHostsResponse = { result: { total: 1000 } };
      const mockServicesResponse = {
        result: {
          buckets: [
            { key: 'HTTP', count: 500 },
            { key: 'SSH', count: 300 }
          ]
        }
      };
      const mockCountriesResponse = {
        result: {
          buckets: [
            { key: 'us', count: 400 },
            { key: 'uk', count: 200 }
          ]
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHostsResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServicesResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountriesResponse
        });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(1000);
      expect(data.total_services).toBe(800);
      expect(data.services.HTTP).toBe(500);
      expect(data.countries.US).toBe(400);
    });

    test('should uppercase country codes', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 50 },
                { key: 'ca', count: 30 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(data.countries.US).toBe(50);
      expect(data.countries.CA).toBe(30);
      expect(data.countries.us).toBeUndefined();
    });

    test('should include ISO timestamp', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(data.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should set correct response headers', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const headers = Object.fromEntries(response.headers.entries());

      expect(headers['content-type']).toBe('application/json');
      expect(headers['cache-control']).toContain('no-store');
    });
  });

  describe('Error Handling', () => {
    test('should handle Censys API errors gracefully', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('401');
    });

    test('should return fallback data on error', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch.mockRejectedValue(new Error('Network error'));

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
    });

    test('should handle malformed API responses', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: null })
      });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(data.total_hosts).toBe(0);
    });

    test('should skip buckets without keys', async () => {
      const context = {
        env: { CENSYS_API_ID: 'id', CENSYS_API_SECRET: 'secret' }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 50 },
                { key: null, count: 30 },
                { count: 20 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const data = JSON.parse(await response.text());

      expect(data.services.HTTP).toBe(50);
      expect(Object.keys(data.services).length).toBe(1);
    });
  });

  describe('responseHeaders function', () => {
    test('should return correct content type', () => {
      const headers = responseHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should set cache control headers', () => {
      const headers = responseHeaders();
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });
  });
});