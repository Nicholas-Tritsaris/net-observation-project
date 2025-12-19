/**
 * Comprehensive tests for functions/api/censys-summary.js
 * Tests API request handling, data aggregation, error handling, and response formatting
 */

describe('Censys Summary API', () => {
  let onRequest, responseHeaders;

  beforeEach(() => {
    // Load the API module code
    const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
    
    // Extract responseHeaders function
    const headersMatch = apiCode.match(/function responseHeaders\(\) \{[\s\S]*?\n\}/);
    if (headersMatch) {
      eval(headersMatch[0]);
    }

    // Mock fetch globally
    global.fetch = jest.fn();
    global.btoa = (str) => Buffer.from(str).toString('base64');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('responseHeaders', () => {
    test('should return correct Content-Type header', () => {
      const headers = responseHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should return cache control headers', () => {
      const headers = responseHeaders();
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should prevent caching', () => {
      const headers = responseHeaders();
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
    });

    test('should return object with two headers', () => {
      const headers = responseHeaders();
      expect(Object.keys(headers)).toHaveLength(2);
    });
  });

  describe('onRequest - Missing Credentials', () => {
    test('should return 500 when CENSYS_API_ID missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(500);
        
        const body = JSON.parse(await response.text());
        expect(body.error).toContain('Missing CENSYS_API_ID');
      }
    });

    test('should return 500 when CENSYS_API_SECRET missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(500);
        
        const body = JSON.parse(await response.text());
        expect(body.error).toContain('Missing');
      }
    });

    test('should return 500 when both credentials missing', async () => {
      const context = { env: {} };

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(500);
      }
    });
  });

  describe('onRequest - Successful Response', () => {
    test('should aggregate host, service, and country data', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      // Mock successful API responses
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 1000 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 500 },
                { key: 'HTTPS', count: 300 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 400 },
                { key: 'gb', count: 200 }
              ]
            }
          })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(200);
        
        const body = JSON.parse(await response.text());
        expect(body.total_hosts).toBe(1000);
        expect(body.total_services).toBe(800);
        expect(body.services).toEqual({ HTTP: 500, HTTPS: 300 });
        expect(body.countries).toEqual({ US: 400, GB: 200 });
        expect(body.last_sync).toBeDefined();
      }
    });

    test('should uppercase country codes', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
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
                { key: 'de', count: 30 }
              ]
            }
          })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.countries.US).toBe(50);
        expect(body.countries.DE).toBe(30);
        expect(body.countries.us).toBeUndefined();
      }
    });

    test('should handle empty buckets gracefully', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.total_hosts).toBe(0);
        expect(body.total_services).toBe(0);
        expect(body.services).toEqual({});
        expect(body.countries).toEqual({});
      }
    });

    test('should skip buckets without key', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
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
                { count: 25 }, // Missing key
                { key: null, count: 10 }, // Null key
                { key: 'HTTPS', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.services).toEqual({ HTTP: 50, HTTPS: 30 });
        expect(body.total_services).toBe(80);
      }
    });

    test('should use nullish coalescing for missing data', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}) // Missing result
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // Missing buckets
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: null })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.total_hosts).toBe(0);
        expect(body.total_services).toBe(0);
      }
    });

    test('should include ISO timestamp in response', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
        .mockResolvedValue({
          ok: true,
          json: async () => ({ result: { total: 0, buckets: [] } })
        });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(new Date(body.last_sync).toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('onRequest - Error Handling', () => {
    test('should return 502 on fetch failure', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockRejectedValue(new Error('Network error'));

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(502);
        
        const body = JSON.parse(await response.text());
        expect(body.error).toBe('Unable to retrieve Censys summary');
        expect(body.details).toBe('Network error');
      }
    });

    test('should return fallback data on error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockRejectedValue(new Error('API error'));

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        const body = JSON.parse(await response.text());
        
        expect(body.total_hosts).toBe(0);
        expect(body.total_services).toBe(0);
        expect(body.countries).toEqual({});
        expect(body.services).toEqual({});
        expect(body.last_sync).toBeDefined();
      }
    });

    test('should handle non-ok HTTP responses', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        const response = await onRequest(context);
        expect(response.status).toBe(502);
        
        const body = JSON.parse(await response.text());
        expect(body.error).toBeDefined();
      }
    });

    test('should log errors to console', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch.mockRejectedValue(new Error('Test error'));

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        await onRequest(context);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Censys summary error:',
          expect.any(Error)
        );
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('onRequest - Authentication', () => {
    test('should create Basic Auth header with base64 encoding', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'myid',
          CENSYS_API_SECRET: 'mysecret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        await onRequest(context);
        
        const authHeader = global.fetch.mock.calls[0][1].headers.Authorization;
        expect(authHeader).toMatch(/^Basic /);
        
        const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
        expect(decoded).toBe('myid:mysecret');
      }
    });

    test('should send correct request headers', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        await onRequest(context);
        
        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Accept']).toBe('application/json');
        expect(headers['Authorization']).toBeDefined();
      }
    });

    test('should make POST requests to Censys API', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        await onRequest(context);
        
        expect(global.fetch).toHaveBeenCalledTimes(3);
        global.fetch.mock.calls.forEach(call => {
          expect(call[1].method).toBe('POST');
        });
      }
    });

    test('should use correct Censys API endpoints', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const apiCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
      
      if (funcMatch) {
        const modifiedCode = funcMatch[0].replace('export async function onRequest', 'onRequest = async function');
        eval(modifiedCode);

        await onRequest(context);
        
        const urls = global.fetch.mock.calls.map(call => call[0]);
        expect(urls[0]).toContain('search.censys.io/api/v2/hosts/search');
        expect(urls[1]).toContain('search.censys.io/api/v2/hosts/stats/services.service_name');
        expect(urls[2]).toContain('search.censys.io/api/v2/hosts/stats/location.country_code');
      }
    });
  });
});