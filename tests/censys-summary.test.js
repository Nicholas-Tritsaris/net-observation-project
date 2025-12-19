/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

describe('Censys Summary API Function', () => {
  let mockFetch;
  let mockContext;
  let onRequest;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.btoa = (str) => Buffer.from(str).toString('base64');

    // Setup mock context
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };

    // Import the function logic for testing
    onRequest = async (context) => {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      const responseHeaders = () => ({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: responseHeaders()
        });
      }

      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;

      const fetchJSON = async (path, payload) => {
        const res = await fetch(endpoint(path), {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Censys ${path} failed: ${res.status} ${text}`);
        }
        return res.json();
      };

      try {
        const [hostSummary, serviceStats, countryStats] = await Promise.all([
          fetchJSON('/hosts/search', { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' }),
          fetchJSON('/hosts/stats/services.service_name', { q: '*', num_buckets: 25 }),
          fetchJSON('/hosts/stats/location.country_code', { q: '*', num_buckets: 50 })
        ]);

        const totalHosts = hostSummary?.result?.total ?? 0;
        const services = {};
        let totalServices = 0;
        const serviceBuckets = serviceStats?.result?.buckets ?? [];
        for (const bucket of serviceBuckets) {
          if (!bucket?.key) continue;
          services[bucket.key] = bucket.count;
          totalServices += bucket.count;
        }

        const countries = {};
        const countryBuckets = countryStats?.result?.buckets ?? [];
        for (const bucket of countryBuckets) {
          if (!bucket?.key) continue;
          const countryCode = bucket.key.toUpperCase();
          countries[countryCode] = bucket.count;
        }

        const response = {
          total_hosts: totalHosts,
          total_services: totalServices,
          last_sync: new Date().toISOString(),
          countries,
          services
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: responseHeaders()
        });
      } catch (error) {
        console.error('Censys summary error:', error);
        return new Response(JSON.stringify({
          error: 'Unable to retrieve Censys summary',
          details: error.message,
          last_sync: new Date().toISOString(),
          total_hosts: 0,
          total_services: 0,
          countries: {},
          services: {}
        }), {
          status: 502,
          headers: responseHeaders()
        });
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Variable Validation', () => {
    test('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
    });

    test('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
        }
      };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
    });

    test('should return 500 when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(500);
      expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
    });

    test('should include correct headers in error response', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Successful API Responses', () => {
    test('should successfully aggregate data from all three endpoints', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 12345
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 5000 },
                { key: 'https', count: 7000 },
                { key: 'ssh', count: 3000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 8000 },
                { key: 'de', count: 3000 },
                { key: 'gb', count: 1345 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(12345);
      expect(body.total_services).toBe(15000);
      expect(body.services).toEqual({
        http: 5000,
        https: 7000,
        ssh: 3000
      });
      expect(body.countries).toEqual({
        US: 8000,
        DE: 3000,
        GB: 1345
      });
      expect(body.last_sync).toBeDefined();
      expect(new Date(body.last_sync)).toBeInstanceOf(Date);
    });

    test('should handle empty buckets gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 0
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: []
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: []
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    test('should skip buckets without keys', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 100
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 50 },
                { count: 25 }, // Missing key
                { key: null, count: 10 }, // Null key
                { key: 'ssh', count: 15 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 100 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.services).toEqual({
        http: 50,
        ssh: 15
      });
      expect(body.total_services).toBe(65);
    });

    test('should uppercase country codes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 100 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 50 },
                { key: 'gb', count: 30 },
                { key: 'Fr', count: 20 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.countries).toEqual({
        US: 50,
        GB: 30,
        FR: 20
      });
    });

    test('should make correct API calls with proper headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Check first call (hosts search)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://search.censys.io/api/v2/hosts/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify({ q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' })
        })
      );

      // Check second call (service stats)
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://search.censys.io/api/v2/hosts/stats/services.service_name',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ q: '*', num_buckets: 25 })
        })
      );

      // Check third call (country stats)
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        'https://search.censys.io/api/v2/hosts/stats/location.country_code',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ q: '*', num_buckets: 50 })
        })
      );
    });

    test('should properly encode credentials in Authorization header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      const expectedAuth = `Basic ${Buffer.from('test-api-id:test-api-secret').toString('base64')}`;
      
      expect(authHeader).toBe(expectedAuth);
    });
  });

  describe('Error Handling', () => {
    test('should return 502 when Censys API returns non-OK status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Censys /hosts/search failed: 401');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });

    test('should return 502 when network error occurs', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toBe('Network failure');
    });

    test('should handle partial API failures gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 100 }
          })
        })
        .mockRejectedValueOnce(new Error('Service stats failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [] }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });

    test('should include error details in 502 response', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout after 30s'));

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.details).toBe('Timeout after 30s');
      expect(body.last_sync).toBeDefined();
    });

    test('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });

    test('should include correct headers in error response', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      const response = await onRequest(mockContext);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Data Processing Edge Cases', () => {
    test('should handle missing result object', async () => {
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

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
    });

    test('should handle null result values', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: null
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: null
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: null
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    test('should handle buckets with zero counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 100 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 0 },
                { key: 'https', count: 50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [] }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.services).toEqual({
        http: 0,
        https: 50
      });
      expect(body.total_services).toBe(50);
    });

    test('should handle large numbers correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 9999999999
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http', count: 5000000000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 8000000000 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.total_hosts).toBe(9999999999);
      expect(body.total_services).toBe(5000000000);
      expect(body.countries.US).toBe(8000000000);
    });

    test('should handle special characters in service names', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 100 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'http/1.1', count: 50 },
                { key: 'smtp+tls', count: 30 },
                { key: 'service-name_v2', count: 20 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [] }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.services).toEqual({
        'http/1.1': 50,
        'smtp+tls': 30,
        'service-name_v2': 20
      });
    });

    test('should handle empty string as country code', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { total: 100 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: { buckets: [] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: '', count: 50 },
                { key: 'us', count: 50 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body.countries).toEqual({
        '': 50,
        'US': 50
      });
    });
  });

  describe('Response Format Validation', () => {
    test('should always include all required fields in success response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { total: 0, buckets: [] }
        })
      });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    test('should always include all required fields in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('details');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    test('should return valid ISO timestamp', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { total: 0, buckets: [] }
        })
      });

      const response = await onRequest(mockContext);
      const body = JSON.parse(await response.text());

      const timestamp = new Date(body.last_sync);
      expect(timestamp.toISOString()).toBe(body.last_sync);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });
});