/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Workers API function for fetching Censys data
 * 
 * This file was modified in the current branch to add JSDoc documentation.
 * These tests ensure the API function handles all scenarios correctly:
 * - Successful data fetching and aggregation
 * - Missing environment variables
 * - API authentication failures
 * - Network errors
 * - Malformed responses
 * - Empty/null data handling
 */

const fs = require('fs');
const path = require('path');

describe('Censys API Function - functions/api/censys-summary.js', () => {
  let onRequest;
  let responseHeaders;
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    // Read and parse the API function
    const apiContent = fs.readFileSync(
      path.join(__dirname, '../functions/api/censys-summary.js'),
      'utf8'
    );

    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock btoa for Base64 encoding
    global.btoa = (str) => Buffer.from(str).toString('base64');

    // Mock Response constructor
    global.Response = class Response {
      constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
        this.headers = init?.headers || {};
        this.ok = this.status >= 200 && this.status < 300;
      }
      
      async json() {
        return JSON.parse(this.body);
      }
      
      async text() {
        return this.body;
      }
    };

    // Execute the module code to get the functions
    // We need to evaluate it in a way that exports are accessible
    const moduleCode = apiContent
      .replace('export async function onRequest', 'onRequest = async function')
      .replace('function responseHeaders()', 'responseHeaders = function()');
    
    eval(moduleCode);

    // Standard mock context
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };

    // Clear console mocks
    console.error.mockClear();
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
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing');
      expect(data.error).toContain('CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('should return proper headers with error response', async () => {
      const context = { env: {} };

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toContain('no-store');
    });

    it('should handle empty string credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing');
    });

    it('should handle whitespace-only credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '   ',
          CENSYS_API_SECRET: '\t\n'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should handle null credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: null,
          CENSYS_API_SECRET: null
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should handle undefined env object', async () => {
      const context = {};

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
    });
  });

  describe('Successful data fetching', () => {
    beforeEach(() => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 15000,
              hits: []
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 8000 },
                { key: 'https', count: 6000 },
                { key: 'ssh', count: 1000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 5000 },
                { key: 'gb', count: 3000 },
                { key: 'de', count: 2000 }
              ]
            }
          })
        });
    });

    it('should fetch and aggregate data successfully', async () => {
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(15000);
      expect(data.total_services).toBe(15000); // 8000 + 6000 + 1000
      expect(data.last_sync).toBeTruthy();
      expect(data.countries).toBeDefined();
      expect(data.services).toBeDefined();
    });

    it('should make three parallel API calls', async () => {
      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should use correct authentication header', async () => {
      await onRequest(mockContext);

      const authHeader = `Basic ${btoa('test-api-id:test-api-secret')}`;
      
      mockFetch.mock.calls.forEach(call => {
        const options = call[1];
        expect(options.headers.Authorization).toBe(authHeader);
      });
    });

    it('should use POST method for all requests', async () => {
      await onRequest(mockContext);

      mockFetch.mock.calls.forEach(call => {
        const options = call[1];
        expect(options.method).toBe('POST');
      });
    });

    it('should call correct Censys API endpoints', async () => {
      await onRequest(mockContext);

      const urls = mockFetch.mock.calls.map(call => call[0]);
      
      expect(urls[0]).toContain('/hosts/search');
      expect(urls[1]).toContain('/hosts/stats/services.service_name');
      expect(urls[2]).toContain('/hosts/stats/location.country_code');
    });

    it('should aggregate service counts correctly', async () => {
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.services.http).toBe(8000);
      expect(data.services.https).toBe(6000);
      expect(data.services.ssh).toBe(1000);
      expect(data.total_services).toBe(15000);
    });

    it('should uppercase country codes', async () => {
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.countries.US).toBe(5000);
      expect(data.countries.GB).toBe(3000);
      expect(data.countries.DE).toBe(2000);
      expect(data.countries.us).toBeUndefined(); // Should be uppercase
    });

    it('should include ISO timestamp in last_sync', async () => {
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Should be recent (within last second)
      const syncTime = new Date(data.last_sync);
      const now = new Date();
      expect(now - syncTime).toBeLessThan(1000);
    });

    it('should return proper response headers', async () => {
      const response = await onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Empty and null data handling', () => {
    it('should handle missing total field', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // No total field
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(0);
    });

    it('should handle missing buckets array', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // No buckets
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // No buckets
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
      expect(data.total_services).toBe(0);
    });

    it('should handle null result', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: null })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(response.status).toBe(200);
    });

    it('should skip buckets without key field', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 50 },
                { count: 25 }, // Missing key
                { key: null, count: 10 }, // Null key
                { key: 'https', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.services.http).toBe(50);
      expect(data.services.https).toBe(30);
      expect(data.total_services).toBe(80); // Should only count valid buckets
    });

    it('should handle empty buckets array', async () => {
      mockFetch
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

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
    });
  });

  describe('API error handling', () => {
    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('401');
    });

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('403');
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('429');
    });

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBeTruthy();
    });

    it('should return fallback data on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
      expect(data.last_sync).toBeTruthy();
    });

    it('should log error to console', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      await onRequest(mockContext);

      expect(console.error).toHaveBeenCalledWith(
        'Censys summary error:',
        expect.any(Error)
      );
    });

    it('should include error details in response', async () => {
      const errorMessage = 'Specific API failure';
      mockFetch.mockRejectedValue(new Error(errorMessage));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.details).toContain(errorMessage);
    });
  });

  describe('Network error handling', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
    });

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValue(new Error('connect ECONNREFUSED'));

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should handle SSL/TLS errors', async () => {
      mockFetch.mockRejectedValue(new Error('certificate has expired'));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('certificate');
    });
  });

  describe('Malformed response handling', () => {
    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token in JSON');
        }
      });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBeTruthy();
    });

    it('should handle unexpected response structure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ unexpected: 'structure' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // Should handle gracefully with defaults
      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(0);
    });
  });

  describe('Request payload validation', () => {
    it('should send correct payload for hosts search', async () => {
      mockFetch
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

      await onRequest(mockContext);

      const hostsCall = mockFetch.mock.calls[0];
      const payload = JSON.parse(hostsCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should send correct payload for service stats', async () => {
      mockFetch
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

      await onRequest(mockContext);

      const servicesCall = mockFetch.mock.calls[1];
      const payload = JSON.parse(servicesCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should send correct payload for country stats', async () => {
      mockFetch
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

      await onRequest(mockContext);

      const countriesCall = mockFetch.mock.calls[2];
      const payload = JSON.parse(countriesCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });

    it('should set correct Content-Type header', async () => {
      mockFetch
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

      await onRequest(mockContext);

      mockFetch.mock.calls.forEach(call => {
        const headers = call[1].headers;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Accept']).toBe('application/json');
      });
    });
  });

  describe('responseHeaders() helper function', () => {
    it('should return correct content type', () => {
      const headers = responseHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should disable caching', () => {
      const headers = responseHeaders();
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });

    it('should return object with exactly two properties', () => {
      const headers = responseHeaders();
      const keys = Object.keys(headers);
      expect(keys.length).toBe(2);
      expect(keys).toContain('Content-Type');
      expect(keys).toContain('Cache-Control');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle extremely large host count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 999999999 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(999999999);
      expect(typeof data.total_hosts).toBe('number');
    });

    it('should handle zero counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'service', count: 0 }] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'US', count: 0 }] }
          })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(0);
      expect(data.services.service).toBe(0);
      expect(data.countries.US).toBe(0);
    });

    it('should handle special characters in service names', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http/1.1', count: 50 },
                { key: 'ssl/tls', count: 30 },
                { key: 'smtp-over-tls', count: 20 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.services['http/1.1']).toBe(50);
      expect(data.services['ssl/tls']).toBe(30);
      expect(data.services['smtp-over-tls']).toBe(20);
    });

    it('should handle lowercase country codes', async () => {
      mockFetch
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
                { key: 'fr', count: 20 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // All should be uppercased
      expect(data.countries.US).toBe(50);
      expect(data.countries.GB).toBe(30);
      expect(data.countries.FR).toBe(20);
      expect(data.countries.us).toBeUndefined();
      expect(data.countries.gb).toBeUndefined();
    });

    it('should handle very long country code lists', async () => {
      const manyCountries = Array.from({ length: 200 }, (_, i) => ({
        key: `C${i}`,
        count: i + 1
      }));

      mockFetch
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
            result: { buckets: manyCountries }
          })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(Object.keys(data.countries).length).toBe(200);
      expect(data.countries.C0).toBe(1);
      expect(data.countries.C199).toBe(200);
    });
  });

  describe('Parallel request handling', () => {
    it('should handle all requests completing successfully', async () => {
      const startTime = Date.now();
      
      mockFetch
        .mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ result: { total: 100, buckets: [] } })
          }), 50);
        }));

      const response = await onRequest(mockContext);
      const endTime = Date.now();

      // Should complete in parallel (~ 50ms), not sequential (~ 150ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(response.status).toBe(200);
    });

    it('should fail fast if any request fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);

      expect(response.status).toBe(502);
    });
  });

  describe('JSDoc documentation validation', () => {
    it('should have JSDoc for onRequest function', () => {
      const apiContent = fs.readFileSync(
        path.join(__dirname, '../functions/api/censys-summary.js'),
        'utf8'
      );

      expect(apiContent).toMatch(/\/\*\*[\s\S]*?@param[\s\S]*?@returns[\s\S]*?\*\//);
      expect(apiContent).toContain('@param {object} context');
      expect(apiContent).toContain('@returns {Response}');
    });

    it('should have JSDoc for responseHeaders function', () => {
      const apiContent = fs.readFileSync(
        path.join(__dirname, '../functions/api/censys-summary.js'),
        'utf8'
      );

      // Should have JSDoc before responseHeaders function
      const funcIndex = apiContent.indexOf('function responseHeaders()');
      const docComment = apiContent.substring(Math.max(0, funcIndex - 500), funcIndex);
      
      expect(docComment).toContain('/**');
      expect(docComment).toContain('@returns');
    });

    it('should document all response fields', () => {
      const apiContent = fs.readFileSync(
        path.join(__dirname, '../functions/api/censys-summary.js'),
        'utf8'
      );

      expect(apiContent).toContain('total_hosts');
      expect(apiContent).toContain('total_services');
      expect(apiContent).toContain('last_sync');
      expect(apiContent).toContain('countries');
      expect(apiContent).toContain('services');
    });
  });

  describe('Additional security and robustness tests', () => {
    it('should handle very long API credentials', async () => {
      const longId = 'a'.repeat(10000);
      const longSecret = 'b'.repeat(10000);
      
      const context = {
        env: {
          CENSYS_API_ID: longId,
          CENSYS_API_SECRET: longSecret
        }
      };

      mockFetch
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

      const response = await onRequest(context);
      
      expect(response.status).toBe(200);
      
      // Verify auth header was constructed
      const authCall = mockFetch.mock.calls[0];
      expect(authCall[1].headers.Authorization).toContain('Basic');
    });

    it('should handle special characters in credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'id:with:colons',
          CENSYS_API_SECRET: 'secret@with#special$chars%'
        }
      };

      mockFetch
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

      const response = await onRequest(context);
      
      expect(response.status).toBe(200);
    });

    it('should handle Unicode in service names', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http™', count: 50 },
                { key: 'ssh®', count: 30 },
                { key: 'ftp…', count: 20 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.services['http™']).toBe(50);
      expect(data.services['ssh®']).toBe(30);
      expect(data.services['ftp…']).toBe(20);
    });

    it('should handle negative counts gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: -100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: -50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // Should handle even if data is invalid
      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(-100);
      expect(data.services.http).toBe(-50);
    });

    it('should handle floating point counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100.5 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 50.75 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(100.5);
      expect(data.services.http).toBe(50.75);
    });

    it('should handle empty string service keys', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: '', count: 50 },
                { key: 'http', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // Empty string keys should still be included
      expect(data.services['']).toBeUndefined(); // Skipped because !bucket.key
      expect(data.services.http).toBe(30);
    });

    it('should handle duplicate service keys', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 50 },
                { key: 'http', count: 30 } // Duplicate
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // Last one wins
      expect(data.services.http).toBe(30);
      expect(data.total_services).toBe(80); // Both counted
    });

    it('should handle response without result wrapper', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ total: 100 }) // No result wrapper
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(0); // Falls back to 0
    });

    it('should handle mixed case country codes', async () => {
      mockFetch
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
                { key: 'Us', count: 50 },
                { key: 'gB', count: 30 },
                { key: 'FR', count: 20 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      // All should be normalized to uppercase
      expect(data.countries.US).toBe(50);
      expect(data.countries.GB).toBe(30);
      expect(data.countries.FR).toBe(20);
    });

    it('should handle extremely large bucket arrays', async () => {
      const largeServiceArray = Array.from({ length: 10000 }, (_, i) => ({
        key: `service-${i}`,
        count: i
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: largeServiceArray }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(Object.keys(data.services).length).toBe(10000);
      expect(data.services['service-0']).toBe(0);
      expect(data.services['service-9999']).toBe(9999);
    });

    it('should preserve timestamp precision', async () => {
      mockFetch
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

      const beforeTime = new Date().getTime();
      const response = await onRequest(mockContext);
      const afterTime = new Date().getTime();
      const data = await response.json();

      const syncTime = new Date(data.last_sync).getTime();
      
      expect(syncTime).toBeGreaterThanOrEqual(beforeTime);
      expect(syncTime).toBeLessThanOrEqual(afterTime);
      
      // Should have millisecond precision
      expect(data.last_sync).toMatch(/\.\d{3}Z$/);
    });

    it('should handle concurrent requests to same endpoint', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => ({ result: { total: 100, buckets: [] } })
        });

      const promise1 = onRequest(mockContext);
      const promise2 = onRequest(mockContext);
      const promise3 = onRequest(mockContext);

      const [response1, response2, response3] = await Promise.all([promise1, promise2, promise3]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });
  });

  describe('Response structure validation', () => {
    it('should always return all expected top-level fields', async () => {
      mockFetch.mockRejectedValue(new Error('Complete failure'));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data).toHaveProperty('total_hosts');
      expect(data).toHaveProperty('total_services');
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('services');
    });

    it('should return valid JSON even on error', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);
      const jsonText = response.body;

      expect(() => JSON.parse(jsonText)).not.toThrow();
    });

    it('should have consistent field types in success response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'http', count: 50 }] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'US', count: 25 }] }
          })
        });

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(typeof data.total_hosts).toBe('number');
      expect(typeof data.total_services).toBe('number');
      expect(typeof data.last_sync).toBe('string');
      expect(typeof data.countries).toBe('object');
      expect(typeof data.services).toBe('object');
      expect(Array.isArray(data.countries)).toBe(false);
      expect(Array.isArray(data.services)).toBe(false);
    });

    it('should have consistent field types in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Test'));

      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(typeof data.error).toBe('string');
      expect(typeof data.details).toBe('string');
      expect(typeof data.last_sync).toBe('string');
      expect(typeof data.total_hosts).toBe('number');
      expect(typeof data.total_services).toBe('number');
      expect(typeof data.countries).toBe('object');
      expect(typeof data.services).toBe('object');
    });
  });
});