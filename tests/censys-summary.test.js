/**
 * Comprehensive unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions API endpoint that aggregates Censys data
 */

describe('censys-summary API Function', () => {
  let onRequest, responseHeaders;
  
  beforeEach(() => {
    // Mock global fetch
    global.fetch = jest.fn();
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
    
    // Import the module functions
    const moduleCode = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
    
    // Extract and evaluate responseHeaders function
    const responseHeadersMatch = moduleCode.match(/function responseHeaders\(\) \{[\s\S]*?\n\}/);
    if (responseHeadersMatch) {
      eval(responseHeadersMatch[0]);
    }
    
    // Extract onRequest function (requires more careful extraction due to export)
    const onRequestMatch = moduleCode.match(/export async function onRequest\(context\) \{[\s\S]*?\n\}/);
    if (onRequestMatch) {
      const funcCode = onRequestMatch[0].replace('export async function onRequest', 'onRequest = async function');
      eval(funcCode);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Variable Validation', () => {
    test('should return 500 error when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    test('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_SECRET');
    });

    test('should return 500 error when both credentials are missing', async () => {
      const context = { env: {} };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing');
    });
  });

  describe('Successful API Calls', () => {
    test('should fetch and aggregate Censys data successfully', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const mockHostResponse = {
        result: { total: 1500000 }
      };

      const mockServiceResponse = {
        result: {
          buckets: [
            { key: 'HTTP', count: 500000 },
            { key: 'HTTPS', count: 400000 },
            { key: 'SSH', count: 100000 }
          ]
        }
      };

      const mockCountryResponse = {
        result: {
          buckets: [
            { key: 'us', count: 600000 },
            { key: 'cn', count: 400000 },
            { key: 'de', count: 200000 }
          ]
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHostResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServiceResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountryResponse
        });

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(1500000);
      expect(body.total_services).toBe(1000000);
      expect(body.services).toEqual({
        HTTP: 500000,
        HTTPS: 400000,
        SSH: 100000
      });
      expect(body.countries).toEqual({
        US: 600000,
        CN: 400000,
        DE: 200000
      });
      expect(body.last_sync).toBeDefined();
      expect(new Date(body.last_sync).toString()).not.toBe('Invalid Date');
    });

    test('should handle empty service buckets', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
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
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    test('should handle missing result fields gracefully', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
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

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
    });

    test('should skip buckets without keys', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch
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
                { count: 50 }, // Missing key
                { key: null, count: 25 }, // Null key
                { key: 'SSH', count: 75 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.services).toEqual({ HTTP: 100, SSH: 75 });
      expect(body.total_services).toBe(175);
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
          json: async () => ({ result: { total: 1000 } })
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
                { key: 'us', count: 500 },
                { key: 'Gb', count: 300 },
                { key: 'FR', count: 200 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(body.countries).toEqual({
        US: 500,
        GB: 300,
        FR: 200
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle HTTP error from Censys API', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('401');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });

    test('should handle network errors', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Network timeout');
    });

    test('should handle JSON parse errors', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.details).toContain('Invalid JSON');
    });
  });

  describe('Authentication', () => {
    test('should create proper Basic auth header', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'my-id',
          CENSYS_API_SECRET: 'my-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0 } })
      });

      await onRequest(context);

      expect(global.btoa).toHaveBeenCalledWith('my-id:my-secret');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    test('should call Censys API with correct endpoints', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} })
      });

      await onRequest(context);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/search',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/services.service_name',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/location.country_code',
        expect.any(Object)
      );
    });
  });

  describe('responseHeaders function', () => {
    test('should return correct headers', () => {
      const headers = responseHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    test('should return headers that prevent caching', () => {
      const headers = responseHeaders();
      
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Cache-Control']).toContain('must-revalidate');
    });
  });

  describe('Request Payloads', () => {
    test('should send correct payload for host search', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} })
      });

      await onRequest(context);

      const hostSearchCall = global.fetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );
      
      const body = JSON.parse(hostSearchCall[1].body);
      expect(body).toEqual({
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      });
    });

    test('should send correct payload for service stats', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} })
      });

      await onRequest(context);

      const serviceStatsCall = global.fetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/services')
      );
      
      const body = JSON.parse(serviceStatsCall[1].body);
      expect(body).toEqual({
        q: '*',
        num_buckets: 25
      });
    });

    test('should send correct payload for country stats', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} })
      });

      await onRequest(context);

      const countryStatsCall = global.fetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/location')
      );
      
      const body = JSON.parse(countryStatsCall[1].body);
      expect(body).toEqual({
        q: '*',
        num_buckets: 50
      });
    });
  });
});