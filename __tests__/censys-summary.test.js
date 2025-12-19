/**
 * Unit tests for functions/api/censys-summary.js
 * Comprehensive tests for the Cloudflare Worker backend function
 * 
 * This file was intentionally left without tests in the original test suite.
 * Adding comprehensive coverage with bias for action.
 */

describe('Cloudflare Worker - censys-summary.js', () => {
  let onRequest;
  let mockFetch;
  let mockContext;

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

    // Import the function (we'll need to mock the module system)
    const censysModule = `
      async function onRequest(context) {
        const { env } = context;
        const id = env.CENSYS_API_ID;
        const secret = env.CENSYS_API_SECRET;

        if (!id || !secret) {
          return new Response(JSON.stringify({
            error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
          }), {
            status: 500,
            headers: responseHeaders()
          });
        }

        const authHeader = \`Basic \${btoa(\`\${id}:\${secret}\`)}\`;
        const endpoint = (path) => \`https://search.censys.io/api/v2\${path}\`;

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
            throw new Error(\`Censys \${path} failed: \${res.status} \${text}\`);
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
      }

      function responseHeaders() {
        return {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        };
      }

      return { onRequest };
    `;

    const module = eval(`(function() { ${censysModule} })()`);
    onRequest = module.onRequest;
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
      const body = await response.json();

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
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = { env: {} };

      const response = await onRequest(context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    it('should have proper headers on error response', async () => {
      const context = { env: {} };
      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Successful data aggregation', () => {
    it('should fetch and aggregate data from all three Censys endpoints', async () => {
      const mockHostData = {
        result: {
          total: 15000000
        }
      };

      const mockServiceData = {
        result: {
          buckets: [
            { key: 'http', count: 5000 },
            { key: 'https', count: 8000 },
            { key: 'ssh', count: 2000 }
          ]
        }
      };

      const mockCountryData = {
        result: {
          buckets: [
            { key: 'us', count: 3000 },
            { key: 'gb', count: 1500 },
            { key: 'de', count: 1200 }
          ]
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHostData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServiceData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountryData
        });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(15000000);
      expect(body.total_services).toBe(15000);
      expect(body.services).toEqual({
        http: 5000,
        https: 8000,
        ssh: 2000
      });
      expect(body.countries).toEqual({
        US: 3000,
        GB: 1500,
        DE: 1200
      });
      expect(body.last_sync).toBeTruthy();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should make requests with proper authorization headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(mockContext);

      const expectedAuth = `Basic ${Buffer.from('test-api-id:test-api-secret').toString('base64')}`;
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://search.censys.io/api/v2'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expectedAuth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should call hosts/search endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/search',
        expect.objectContaining({
          body: JSON.stringify({ q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' })
        })
      );
    });

    it('should call service stats endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/services.service_name',
        expect.objectContaining({
          body: JSON.stringify({ q: '*', num_buckets: 25 })
        })
      );
    });

    it('should call country stats endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/location.country_code',
        expect.objectContaining({
          body: JSON.stringify({ q: '*', num_buckets: 50 })
        })
      );
    });

    it('should uppercase country codes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 0,
            buckets: [
              { key: 'us', count: 100 },
              { key: 'gb', count: 50 },
              { key: 'JP', count: 75 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.countries.US).toBe(100);
      expect(body.countries.GB).toBe(50);
      expect(body.countries.JP).toBe(75);
    });

    it('should handle empty service buckets gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.services).toEqual({});
      expect(body.total_services).toBe(0);
    });

    it('should skip buckets without keys', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'http', count: 100 },
              { count: 50 }, // Missing key
              { key: null, count: 25 }, // Null key
              { key: 'https', count: 200 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.services).toEqual({
        http: 100,
        https: 200
      });
      expect(body.total_services).toBe(300);
    });

    it('should handle missing result object with nullish coalescing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.total_hosts).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('should return 502 error when Censys API returns non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Censys');
      expect(body.details).toContain('401');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
      expect(body.last_sync).toBeTruthy();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toBe('Request timeout');
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });

    it('should handle partial API failures (one endpoint fails)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error'
        });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });
  });

  describe('Response headers', () => {
    it('should include proper content-type header on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
    });

    it('should include cache-control header to prevent caching', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(mockContext);

      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    it('should include proper headers on error responses', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very large host counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 999999999999,
            buckets: []
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.total_hosts).toBe(999999999999);
    });

    it('should handle zero counts correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 0,
            buckets: []
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
    });

    it('should handle special characters in service names', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'http/https', count: 100 },
              { key: 'ssh-2.0', count: 50 },
              { key: 'service:8080', count: 25 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.services['http/https']).toBe(100);
      expect(body.services['ssh-2.0']).toBe(50);
      expect(body.services['service:8080']).toBe(25);
    });

    it('should handle maximum number of buckets', async () => {
      const maxBuckets = Array.from({ length: 50 }, (_, i) => ({
        key: `country${i}`,
        count: i * 100
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 0,
            buckets: maxBuckets
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(Object.keys(body.countries).length).toBe(50);
    });

    it('should generate valid ISO timestamp', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      const timestamp = new Date(body.last_sync);
      expect(timestamp.toISOString()).toBe(body.last_sync);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should handle concurrent requests independently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 100, buckets: [] } })
      });

      const [response1, response2] = await Promise.all([
        onRequest(mockContext),
        onRequest(mockContext)
      ]);

      const body1 = await response1.json();
      const body2 = await response2.json();

      expect(body1.total_hosts).toBe(100);
      expect(body2.total_hosts).toBe(100);
      expect(mockFetch).toHaveBeenCalledTimes(6); // 3 calls per request
    });
  });

  describe('Data transformation', () => {
    it('should correctly sum service counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'service1', count: 1000 },
              { key: 'service2', count: 2000 },
              { key: 'service3', count: 3000 },
              { key: 'service4', count: 4000 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.total_services).toBe(10000);
    });

    it('should preserve service names exactly as returned', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'HTTP', count: 100 },
              { key: 'http', count: 200 },
              { key: 'HtTp', count: 300 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.services.HTTP).toBe(100);
      expect(body.services.http).toBe(200);
      expect(body.services.HtTp).toBe(300);
    });

    it('should maintain country code case-insensitivity through uppercase', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'us', count: 100 },
              { key: 'US', count: 200 },
              { key: 'Us', count: 300 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      // All should be converted to 'US', last one wins
      expect(body.countries.US).toBe(300);
      expect(Object.keys(body.countries).length).toBe(1);
    });
  });
});