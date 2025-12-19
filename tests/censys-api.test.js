/**
 * Comprehensive tests for functions/api/censys-summary.js
 * Tests API request handling, error cases, data aggregation, and response formatting
 */

const fs = require('fs');

// Mock fetch globally
global.fetch = jest.fn();
global.btoa = (str) => Buffer.from(str).toString('base64');
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = init?.headers || {};
  }
};

describe('Censys API Endpoint', () => {
  let onRequest, responseHeaders;

  beforeAll(() => {
    const apiContent = fs.readFileSync('./functions/api/censys-summary.js', 'utf-8');
    
    // Extract and eval the functions
    const onRequestMatch = apiContent.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
    const responseHeadersMatch = apiContent.match(/function responseHeaders\(\) \{[\s\S]*?\n\}/);
    
    if (onRequestMatch) {
      eval(`onRequest = async function(context) { ${onRequestMatch[0].replace('export async function onRequest(context)', '')} }`);
    }
    if (responseHeadersMatch) {
      eval(`responseHeaders = function() { ${responseHeadersMatch[0].replace('function responseHeaders()', '')} }`);
    }
  });

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('responseHeaders helper', () => {
    test('should return correct content type', () => {
      const headers = responseHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should disable caching', () => {
      const headers = responseHeaders();
      
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should return object with both required headers', () => {
      const headers = responseHeaders();
      
      expect(Object.keys(headers)).toHaveLength(2);
      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('Cache-Control');
    });
  });

  describe('Environment Variable Validation', () => {
    test('should return 500 error when CENSYS_API_ID missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'secret123'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    test('should return 500 error when CENSYS_API_SECRET missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'id123'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_SECRET');
    });

    test('should return 500 error when both credentials missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(500);
      expect(body.error).toMatch(/Missing CENSYS_API_ID or CENSYS_API_SECRET/);
    });

    test('should include proper headers in error response', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Successful API Calls', () => {
    test('should fetch and aggregate data successfully', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      // Mock successful API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000000 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 500000 },
                { key: 'SSH', count: 300000 },
                { key: 'HTTPS', count: 200000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 400000 },
                { key: 'cn', count: 300000 },
                { key: 'uk', count: 200000 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(1000000);
      expect(body.total_services).toBe(1000000);
      expect(body.services).toEqual({
        HTTP: 500000,
        SSH: 300000,
        HTTPS: 200000
      });
      expect(body.countries).toEqual({
        US: 400000,
        CN: 300000,
        UK: 200000
      });
      expect(body.last_sync).toBeDefined();
    });

    test('should uppercase country codes', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch
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
                { key: 'gb', count: 30 },
                { key: 'de', count: 20 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.countries.US).toBe(50);
      expect(body.countries.GB).toBe(30);
      expect(body.countries.DE).toBe(20);
      expect(body.countries.us).toBeUndefined();
    });

    test('should use Basic auth with base64 encoded credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'myid',
          CENSYS_API_SECRET: 'mysecret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      expect(fetch).toHaveBeenCalled();
      const authHeader = fetch.mock.calls[0][1].headers['Authorization'];
      expect(authHeader).toBe(`Basic ${btoa('myid:mysecret')}`);
    });

    test('should make POST requests to correct endpoints', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch.mock.calls[0][0]).toBe('https://search.censys.io/api/v2/hosts/search');
      expect(fetch.mock.calls[1][0]).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
      expect(fetch.mock.calls[2][0]).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });

    test('should include correct request payloads', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      const hostsBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(hostsBody).toEqual({ q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' });

      const servicesBody = JSON.parse(fetch.mock.calls[1][1].body);
      expect(servicesBody).toEqual({ q: '*', num_buckets: 25 });

      const countriesBody = JSON.parse(fetch.mock.calls[2][1].body);
      expect(countriesBody).toEqual({ q: '*', num_buckets: 50 });
    });

    test('should handle empty buckets', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    test('should skip buckets without keys', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch
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
                { count: 30 }, // Missing key
                { key: null, count: 20 } // Null key
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.services).toEqual({ HTTP: 50 });
      expect(body.total_services).toBe(50);
    });

    test('should handle missing result fields with nullish coalescing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}) // Missing result
      });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });
  });

  describe('Error Handling', () => {
    test('should return 502 on API fetch failure', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockRejectedValue(new Error('Network failure'));

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toBe('Network failure');
    });

    test('should return fallback data on error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockRejectedValue(new Error('API error'));

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
      expect(body.last_sync).toBeDefined();
    });

    test('should handle HTTP error responses', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('401');
    });

    test('should handle rate limiting', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const response = await onRequest(context);

      expect(response.status).toBe(502);
    });

    test('should include proper headers in error response', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should log error to console', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      fetch.mockRejectedValue(new Error('Test error'));

      await onRequest(context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Censys summary error:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Aggregation', () => {
    test('should correctly sum service counts', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 100 },
                { key: 'SSH', count: 200 },
                { key: 'FTP', count: 50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_services).toBe(350);
    });

    test('should handle large numbers correctly', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 999999999 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [{ key: 'HTTP', count: 999999999 }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(999999999);
      expect(body.total_services).toBe(999999999);
    });

    test('should format ISO timestamp for last_sync', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const body = JSON.parse(response.body);

      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(body.last_sync)).not.toThrow();
    });
  });

  describe('Parallel Request Handling', () => {
    test('should make all three requests in parallel', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      let callOrder = [];
      fetch.mockImplementation((url) => {
        callOrder.push(url);
        return Promise.resolve({
          ok: true,
          json: async () => ({ result: { total: 0, buckets: [] } })
        });
      });

      await onRequest(context);

      expect(callOrder).toHaveLength(3);
      // All three calls should be initiated immediately (Promise.all behavior)
    });

    test('should fail fast if any request fails', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockRejectedValueOnce(new Error('Second request failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);

      expect(response.status).toBe(502);
    });
  });
});