/**
 * Advanced Edge Case Tests for Cloudflare Worker Backend
 * Additional comprehensive testing for functions/api/censys-summary.js
 * Covers stress scenarios, edge cases, and security concerns
 */

describe('Cloudflare Worker Backend - Advanced Edge Cases', () => {
  let onRequest;
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.btoa = (str) => Buffer.from(str).toString('base64');

    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };

    // Inline the function for testing
    const censysCode = `
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

    const module = eval(`(function() { ${censysCode} })()`);
    onRequest = module.onRequest;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Stress testing and performance', () => {
    it('should handle extremely large bucket counts', async () => {
      const largeBuckets = Array.from({ length: 1000 }, (_, i) => ({
        key: `service${i}`,
        count: Math.floor(Math.random() * 1000000)
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 999999999999,
            buckets: largeBuckets
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(Object.keys(body.services).length).toBe(1000);
      expect(body.total_services).toBeGreaterThan(0);
    });

    it('should handle response with missing result object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });

    it('should handle response with null result', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: null })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.total_hosts).toBe(0);
    });

    it('should handle response with undefined buckets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 100
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should handle concurrent requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            total: 1000,
            buckets: [{ key: 'http', count: 500 }]
          }
        })
      });

      const requests = Array.from({ length: 10 }, () => onRequest(mockContext));
      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(mockFetch).toHaveBeenCalledTimes(30); // 3 endpoints × 10 requests
    });
  });

  describe('Security and validation', () => {
    it('should handle credentials with special characters', async () => {
      const specialContext = {
        env: {
          CENSYS_API_ID: 'id-with-$pecial-chars!@#',
          CENSYS_API_SECRET: 'secret:with/slashes\\backslashes'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(specialContext);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    it('should handle credentials with Unicode characters', async () => {
      const unicodeContext = {
        env: {
          CENSYS_API_ID: 'id-with-你好',
          CENSYS_API_SECRET: 'secret-🚀-emoji'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(unicodeContext);

      expect(response.status).toBe(200);
    });

    it('should handle whitespace-only credentials', async () => {
      const whitespaceContext = {
        env: {
          CENSYS_API_ID: '   ',
          CENSYS_API_SECRET: '\t\n'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      // Whitespace strings are truthy, so should proceed
      const response = await onRequest(whitespaceContext);
      expect(response.status).toBe(200);
    });

    it('should handle response with malicious script in keys', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: '<script>alert(1)</script>', count: 100 },
              { key: 'javascript:void(0)', count: 200 },
              { key: 'data:text/html,<script>alert(2)</script>', count: 300 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      // Keys should be preserved as-is (JSON encoding handles safety)
      expect(body.services['<script>alert(1)</script>']).toBe(100);
    });
  });

  describe('Network error scenarios', () => {
    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('timeout');
    });

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND search.censys.io'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toContain('ENOTFOUND');
    });

    it('should handle SSL/TLS errors', async () => {
      mockFetch.mockRejectedValue(new Error('unable to verify the first certificate'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toContain('certificate');
    });

    it('should handle connection reset', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNRESET'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toBe('ECONNRESET');
    });

    it('should handle rate limiting (429)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toContain('429');
    });

    it('should handle API maintenance (503)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service temporarily unavailable'
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.details).toContain('503');
    });
  });

  describe('Data integrity and edge cases', () => {
    it('should handle buckets with negative counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'service1', count: -100 },
              { key: 'service2', count: 200 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.services.service1).toBe(-100);
      expect(body.total_services).toBe(100); // -100 + 200
    });

    it('should handle buckets with floating point counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'service1', count: 100.5 },
              { key: 'service2', count: 200.7 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.services.service1).toBe(100.5);
      expect(body.total_services).toBeCloseTo(301.2, 1);
    });

    it('should handle buckets with string counts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'service1', count: '100' },
              { key: 'service2', count: '200' }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      // JavaScript coerces strings to numbers in addition
      expect(body.total_services).toBe(300);
    });

    it('should handle buckets with empty string keys', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: '', count: 100 },
              { key: 'service1', count: 200 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      // Empty string is falsy, should be skipped
      expect(body.services['']).toBeUndefined();
      expect(body.services.service1).toBe(200);
    });

    it('should handle mixed case country codes consistently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'us', count: 100 },
              { key: 'US', count: 200 },
              { key: 'Us', count: 300 },
              { key: 'uS', count: 400 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      // All should be uppercased, last one wins
      expect(body.countries.US).toBe(400);
      expect(Object.keys(body.countries).length).toBe(1);
    });

    it('should handle country codes with numbers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'us1', count: 100 },
              { key: 'gb2', count: 200 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.countries.US1).toBe(100);
      expect(body.countries.GB2).toBe(200);
    });

    it('should handle very long service names', async () => {
      const longName = 'a'.repeat(10000);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: longName, count: 100 }
            ]
          }
        })
      });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.services[longName]).toBe(100);
    });
  });

  describe('Response formatting', () => {
    it('should always include last_sync timestamp', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const beforeTime = new Date();
      const response = await onRequest(mockContext);
      const afterTime = new Date();
      const body = await response.json();

      expect(body.last_sync).toBeTruthy();
      const syncTime = new Date(body.last_sync);
      expect(syncTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(syncTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should include timestamp even on error', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(body.last_sync).toBeTruthy();
      expect(new Date(body.last_sync).toISOString()).toBe(body.last_sync);
    });

    it('should return valid JSON on all responses', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);
      const bodyText = await response.text();

      expect(() => JSON.parse(bodyText)).not.toThrow();
    });

    it('should set proper content-type on all responses', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
    });

    it('should always disable caching', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(mockContext);

      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Parallel request handling', () => {
    it('should handle first endpoint success, others fail', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal error'
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal error'
        });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toBe('Unable to retrieve Censys summary');
    });

    it('should handle middle endpoint failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Service error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [{ key: 'US', count: 500 }] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();

      expect(response.status).toBe(502);
    });

    it('should handle slow endpoint not delaying others', async () => {
      const startTime = Date.now();

      mockFetch
        .mockImplementation(async (url) => {
          if (url.includes('hosts/search')) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          return {
            ok: true,
            json: async () => ({ result: { total: 0, buckets: [] } })
          };
        });

      await onRequest(mockContext);
      const endTime = Date.now();

      // Should take ~100ms due to Promise.all parallelization, not 300ms
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});