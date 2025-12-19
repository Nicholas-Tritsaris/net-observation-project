/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Pages Function that fetches and aggregates Censys data
 * 
 * Note: These tests use dynamic import and mock the module's dependencies
 * since it's an ES module for Cloudflare Pages Functions.
 */

describe('Censys Summary API Function', () => {
  let mockFetch;
  let mockBtoa;
  let mockConsoleError;
  
  // Store original globals
  let originalFetch;
  let originalBtoa;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalBtoa = global.btoa;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    global.btoa = originalBtoa;
  });

  beforeEach(() => {
    // Setup mocks
    mockFetch = jest.fn();
    mockBtoa = jest.fn((str) => Buffer.from(str).toString('base64'));
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    global.fetch = mockFetch;
    global.btoa = mockBtoa;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockRestore();
  });

  // Helper to create mock context
  const createMockContext = (apiId = 'test-api-id', apiSecret = 'test-api-secret') => ({
    env: {
      CENSYS_API_ID: apiId,
      CENSYS_API_SECRET: apiSecret
    }
  });

  // Helper to create successful mock responses
  const setupSuccessfulMocks = (hostTotal = 12345) => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            total: hostTotal
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'HTTP', count: 5000 },
              { key: 'HTTPS', count: 4000 },
              { key: 'SSH', count: 2000 },
              { key: 'FTP', count: 1000 }
            ]
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'us', count: 3000 },
              { key: 'gb', count: 2000 },
              { key: 'de', count: 1500 }
            ]
          }
        })
      });
  };

  // Since we can't easily import ES modules in Jest with current config,
  // we'll test the function's behavior by reading and evaluating it
  const loadModule = () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(__dirname, '../functions/api/censys-summary.js'),
      'utf8'
    );
    
    // Create a module context
    const module = { exports: {} };
    const exports = module.exports;
    
    // Transform ES module to something we can evaluate
    const transformedCode = code
      .replace(/export async function onRequest/, 'module.exports.onRequest = async function')
      .replace(/export function responseHeaders/, 'module.exports.responseHeaders = function');
    
    // Evaluate in isolated context
    const func = new Function('module', 'exports', 'Response', 'fetch', 'btoa', 'console', transformedCode);
    func(module, exports, Response, global.fetch, global.btoa, console);
    
    return module.exports;
  };

  describe('Environment validation', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext(undefined, 'secret');

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext('id', undefined);

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const { onRequest } = loadModule();
      const context = { env: {} };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing');
    });

    it('should return proper headers for error responses', async () => {
      const { onRequest } = loadModule();
      const context = { env: {} };

      const response = await onRequest(context);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Successful API calls', () => {
    it('should successfully fetch and aggregate Censys data', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(12345);
      expect(body.total_services).toBe(12000); // Sum of service counts
      expect(body.last_sync).toBeTruthy();
      expect(body.countries).toEqual({
        US: 3000,
        GB: 2000,
        DE: 1500
      });
      expect(body.services).toEqual({
        HTTP: 5000,
        HTTPS: 4000,
        SSH: 2000,
        FTP: 1000
      });
    });

    it('should call Censys API with correct authentication', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      expect(mockBtoa).toHaveBeenCalledWith('test-api-id:test-api-secret');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://search.censys.io/api/v2'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic')
          })
        })
      );
    });

    it('should make three parallel API calls', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Verify all three endpoints were called
      const calls = mockFetch.mock.calls;
      expect(calls[0][0]).toContain('/hosts/search');
      expect(calls[1][0]).toContain('/hosts/stats/services.service_name');
      expect(calls[2][0]).toContain('/hosts/stats/location.country_code');
    });

    it('should include proper request headers', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      const firstCall = mockFetch.mock.calls[0];
      expect(firstCall[1].headers).toEqual({
        'Authorization': expect.any(String),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    });

    it('should send correct payload for host search', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      const hostSearchCall = mockFetch.mock.calls[0];
      const payload = JSON.parse(hostSearchCall[1].body);
      
      expect(payload).toEqual({
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      });
    });

    it('should send correct payload for service stats', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      const serviceStatsCall = mockFetch.mock.calls[1];
      const payload = JSON.parse(serviceStatsCall[1].body);
      
      expect(payload).toEqual({
        q: '*',
        num_buckets: 25
      });
    });

    it('should send correct payload for country stats', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      const countryStatsCall = mockFetch.mock.calls[2];
      const payload = JSON.parse(countryStatsCall[1].body);
      
      expect(payload).toEqual({
        q: '*',
        num_buckets: 50
      });
    });

    it('should uppercase country codes', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      // Verify lowercase country codes from API are uppercased
      expect(body.countries).toHaveProperty('US');
      expect(body.countries).toHaveProperty('GB');
      expect(body.countries).toHaveProperty('DE');
      expect(body.countries).not.toHaveProperty('us');
      expect(body.countries).not.toHaveProperty('gb');
    });

    it('should return ISO timestamp for last_sync', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(body.last_sync).toISOString()).toBe(body.last_sync);
    });

    it('should include cache control headers', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);

      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('should include content-type header', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Edge cases and data validation', () => {
    it('should handle empty service buckets', async () => {
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
          json: async () => ({ result: { buckets: [] } })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should handle missing result objects', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should skip buckets without keys', async () => {
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
                { key: 'HTTP', count: 100 },
                { count: 50 }, // Missing key
                { key: null, count: 25 }, // Null key
                { key: 'HTTPS', count: 75 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 50 },
                { count: 25 } // Missing key
              ]
            }
          })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.services).toEqual({
        HTTP: 100,
        HTTPS: 75
      });
      expect(body.total_services).toBe(175);
      expect(body.countries).toEqual({ US: 50 });
    });

    it('should handle very large numbers', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 999999999 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [{ key: 'HTTP', count: 888888888 }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [{ key: 'us', count: 777777777 }]
            }
          })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.total_hosts).toBe(999999999);
      expect(body.total_services).toBe(888888888);
      expect(body.countries.US).toBe(777777777);
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
            result: {
              buckets: [{ key: 'HTTP', count: 0 }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [{ key: 'us', count: 0 }]
            }
          })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.total_hosts).toBe(0);
      expect(body.services.HTTP).toBe(0);
      expect(body.countries.US).toBe(0);
    });

    it('should handle country codes with mixed case', async () => {
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
                { key: 'Us', count: 100 },
                { key: 'gB', count: 50 },
                { key: 'FR', count: 25 }
              ]
            }
          })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.countries).toEqual({
        US: 100,
        GB: 50,
        FR: 25
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP error from host search endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('401');
      expect(body.details).toContain('Unauthorized');
    });

    it('should handle HTTP error from service stats endpoint', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded'
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('429');
    });

    it('should handle HTTP error from country stats endpoint', async () => {
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
          ok: false,
          status: 500,
          text: async () => 'Internal server error'
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.details).toContain('500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Network failure');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.details).toContain('Invalid JSON');
    });

    it('should return fallback data structure on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('details');
      expect(body).toHaveProperty('last_sync');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });

    it('should include timestamp in error responses', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.last_sync).toBeTruthy();
      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should log errors to console', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Censys summary error:',
        expect.any(Error)
      );
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 0)
        )
      );

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.details).toContain('timeout');
    });

    it('should handle malformed API responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'not an object'
      });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
    });
  });

  describe('Response format validation', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 100 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'HTTP', count: 50 }] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [{ key: 'us', count: 25 }] }
          })
        });
    });

    it('should return Response object', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return valid JSON', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const text = await response.text();
      
      expect(() => JSON.parse(text)).not.toThrow();
    });

    it('should have all required fields in success response', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    it('should return objects for countries and services', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(typeof body.countries).toBe('object');
      expect(typeof body.services).toBe('object');
      expect(Array.isArray(body.countries)).toBe(false);
      expect(Array.isArray(body.services)).toBe(false);
    });

    it('should return numbers for counts', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(typeof body.total_hosts).toBe('number');
      expect(typeof body.total_services).toBe('number');
    });

    it('should return string for timestamp', async () => {
      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(typeof body.last_sync).toBe('string');
    });
  });

  describe('Performance and optimization', () => {
    it('should use Promise.all for parallel requests', async () => {
      const startTime = Date.now();
      
      mockFetch
        .mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: async () => ({ result: {} })
            }), 50)
          )
        );

      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);
      const duration = Date.now() - startTime;

      // Should complete in roughly the time of one request, not three sequential
      expect(duration).toBeLessThan(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should reuse auth header for all requests', async () => {
      setupSuccessfulMocks();
      const { onRequest } = loadModule();
      const context = createMockContext();

      await onRequest(context);

      const authHeaders = mockFetch.mock.calls.map(call => call[1].headers.Authorization);
      const uniqueAuthHeaders = new Set(authHeaders);
      
      expect(uniqueAuthHeaders.size).toBe(1); // Same auth header reused
      expect(mockBtoa).toHaveBeenCalledTimes(1); // Only encoded once
    });
  });

  describe('Integration scenarios', () => {
    it('should handle realistic production data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 4500000,
              query: '*',
              duration: 125
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 1800000 },
                { key: 'HTTPS', count: 1500000 },
                { key: 'SSH', count: 450000 },
                { key: 'FTP', count: 300000 },
                { key: 'SMTP', count: 250000 },
                { key: 'DNS', count: 200000 }
              ],
              total: 4500000
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 1350000 },
                { key: 'cn', count: 900000 },
                { key: 'de', count: 450000 },
                { key: 'gb', count: 405000 },
                { key: 'jp', count: 360000 },
                { key: 'fr', count: 315000 },
                { key: 'ca', count: 270000 },
                { key: 'au', count: 225000 },
                { key: 'in', count: 180000 },
                { key: 'br', count: 45000 }
              ]
            }
          })
        });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(4500000);
      expect(body.total_services).toBe(4500000);
      expect(Object.keys(body.services)).toHaveLength(6);
      expect(Object.keys(body.countries)).toHaveLength(10);
      expect(body.countries.US).toBe(1350000);
      expect(body.countries.CN).toBe(900000);
    });

    it('should handle rate limiting gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Too many requests'
        })
      });

      const { onRequest } = loadModule();
      const context = createMockContext();

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBeTruthy();
      expect(body.total_hosts).toBe(0);
    });
  });

  describe('JSDoc documentation completeness', () => {
    it('should have JSDoc for onRequest function', () => {
      const fs = require('fs');
      const path = require('path');
      const code = fs.readFileSync(
        path.join(__dirname, '../functions/api/censys-summary.js'),
        'utf8'
      );

      expect(code).toContain('@param {object} context');
      expect(code).toContain('@returns {Response}');
      expect(code).toContain('total_hosts');
      expect(code).toContain('total_services');
      expect(code).toContain('last_sync');
      expect(code).toContain('countries');
      expect(code).toContain('services');
    });

    it('should have JSDoc for responseHeaders function', () => {
      const fs = require('fs');
      const path = require('path');
      const code = fs.readFileSync(
        path.join(__dirname, '../functions/api/censys-summary.js'),
        'utf8'
      );

      expect(code).toContain('Provide standard JSON response headers');
      expect(code).toContain('@returns');
      expect(code).toContain('Content-Type');
      expect(code).toContain('Cache-Control');
    });
  });
});