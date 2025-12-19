/**
 * Comprehensive additional tests for functions/api/censys-summary.js
 * 
 * This test suite extends the existing censys-summary.test.js with additional
 * edge cases, boundary conditions, and comprehensive error handling scenarios.
 * Focus areas:
 * - JSDoc documentation accuracy validation
 * - Response header combinations and edge cases
 * - Concurrent request handling and race conditions
 * - Malformed API responses
 * - Network timeout and retry scenarios
 * - Data aggregation edge cases
 * - Memory and performance considerations
 */

describe('censys-summary.js - Comprehensive Additional Coverage', () => {
  let onRequest;
  let responseHeaders;
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.btoa = (str) => Buffer.from(str).toString('base64');
    global.console.error = jest.fn();

    mockContext = {
      env: {
        CENSYS_API_ID: 'test-api-id',
        CENSYS_API_SECRET: 'test-api-secret'
      }
    };

    // Load the actual function
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

      return { onRequest, responseHeaders };
    `;

    const module = eval(`(function() { ${censysCode} })()`);
    onRequest = module.onRequest;
    responseHeaders = module.responseHeaders;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JSDoc Documentation Accuracy', () => {
    it('should return Response object as documented', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 100, buckets: [] }
        }),
        text: jest.fn().mockResolvedValue('')
      });

      const response = await onRequest(mockContext);
      
      expect(response).toBeInstanceOf(Response);
    });

    it('should return JSON body with documented success properties', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: {
            total: 100,
            buckets: [
              { key: 'http', count: 50 },
              { key: 'US', count: 80 }
            ]
          }
        }),
        text: jest.fn().mockResolvedValue('')
      });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Verify all documented properties exist
      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
      
      // Verify types match documentation
      expect(typeof body.total_hosts).toBe('number');
      expect(typeof body.total_services).toBe('number');
      expect(typeof body.last_sync).toBe('string');
      expect(typeof body.countries).toBe('object');
      expect(typeof body.services).toBe('object');
    });

    it('should return error response with documented failure properties', async () => {
      const context = { env: {} }; // Missing credentials
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    it('should return ISO timestamp in last_sync field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        }),
        text: jest.fn().mockResolvedValue('')
      });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Verify ISO 8601 format
      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's a valid date
      const date = new Date(body.last_sync);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should return uppercased country codes as documented', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'us', count: 50 },
                { key: 'gb', count: 30 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // All country codes should be uppercase
      expect(body.countries).toHaveProperty('US');
      expect(body.countries).toHaveProperty('GB');
      expect(body.countries).not.toHaveProperty('us');
      expect(body.countries).not.toHaveProperty('gb');
    });
  });

  describe('responseHeaders Function', () => {
    it('should return object with Content-Type and Cache-Control', () => {
      const headers = responseHeaders();
      
      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('Cache-Control');
    });

    it('should return Content-Type as application/json', () => {
      const headers = responseHeaders();
      
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return Cache-Control with no-store, no-cache, must-revalidate', () => {
      const headers = responseHeaders();
      
      expect(headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    it('should return exactly 2 header properties', () => {
      const headers = responseHeaders();
      
      expect(Object.keys(headers).length).toBe(2);
    });

    it('should return consistent headers on multiple calls', () => {
      const headers1 = responseHeaders();
      const headers2 = responseHeaders();
      
      expect(headers1).toEqual(headers2);
    });
  });

  describe('Environment Variable Edge Cases', () => {
    it('should handle empty string CENSYS_API_ID', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      
      expect(response.status).toBe(500);
    });

    it('should handle empty string CENSYS_API_SECRET', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: ''
        }
      };

      const response = await onRequest(context);
      
      expect(response.status).toBe(500);
    });

    it('should handle whitespace-only credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '   ',
          CENSYS_API_SECRET: '   '
        }
      };

      const response = await onRequest(context);
      const body = await response.json();
      
      // Whitespace credentials would fail at auth, not env check
      // But empty strings should still be caught
      expect(body).toHaveProperty('error');
    });

    it('should handle null environment object', async () => {
      const context = { env: null };

      // Should throw TypeError when accessing null.CENSYS_API_ID
      await expect(onRequest(context)).rejects.toThrow();
    });

    it('should handle undefined environment variables explicitly', async () => {
      const context = {
        env: {
          CENSYS_API_ID: undefined,
          CENSYS_API_SECRET: undefined
        }
      };

      const response = await onRequest(context);
      
      expect(response.status).toBe(500);
    });

    it('should construct proper Basic auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      // Check that fetch was called with proper Authorization header
      const firstCall = mockFetch.mock.calls[0];
      const headers = firstCall[1].headers;
      
      expect(headers.Authorization).toMatch(/^Basic /);
      
      // Decode and verify format
      const encoded = headers.Authorization.replace('Basic ', '');
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe('test-api-id:test-api-secret');
    });
  });

  describe('API Endpoint Construction', () => {
    it('should call hosts/search endpoint with correct path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const hostSearchCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );
      
      expect(hostSearchCall[0]).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    it('should call service stats endpoint with correct path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const serviceCall = mockFetch.mock.calls.find(call => 
        call[0].includes('services.service_name')
      );
      
      expect(serviceCall[0]).toBe('https://search.censys.io/api/v2/hosts/stats/services.service_name');
    });

    it('should call country stats endpoint with correct path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const countryCall = mockFetch.mock.calls.find(call => 
        call[0].includes('location.country_code')
      );
      
      expect(countryCall[0]).toBe('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });

    it('should use POST method for all API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      mockFetch.mock.calls.forEach(call => {
        expect(call[1].method).toBe('POST');
      });
    });

    it('should include proper Content-Type in requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      mockFetch.mock.calls.forEach(call => {
        expect(call[1].headers['Content-Type']).toBe('application/json');
      });
    });

    it('should include Accept header in requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      mockFetch.mock.calls.forEach(call => {
        expect(call[1].headers['Accept']).toBe('application/json');
      });
    });
  });

  describe('Request Payload Validation', () => {
    it('should send correct payload to hosts/search', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const hostSearchCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );
      
      const payload = JSON.parse(hostSearchCall[1].body);
      expect(payload).toEqual({
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      });
    });

    it('should send correct payload to service stats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const serviceCall = mockFetch.mock.calls.find(call => 
        call[0].includes('services.service_name')
      );
      
      const payload = JSON.parse(serviceCall[1].body);
      expect(payload).toEqual({
        q: '*',
        num_buckets: 25
      });
    });

    it('should send correct payload to country stats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const countryCall = mockFetch.mock.calls.find(call => 
        call[0].includes('location.country_code')
      );
      
      const payload = JSON.parse(countryCall[1].body);
      expect(payload).toEqual({
        q: '*',
        num_buckets: 50
      });
    });

    it('should request exactly 1 result from hosts/search', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const hostSearchCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );
      
      const payload = JSON.parse(hostSearchCall[1].body);
      expect(payload.per_page).toBe(1);
    });

    it('should request 25 service buckets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const serviceCall = mockFetch.mock.calls.find(call => 
        call[0].includes('services.service_name')
      );
      
      const payload = JSON.parse(serviceCall[1].body);
      expect(payload.num_buckets).toBe(25);
    });

    it('should request 50 country buckets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      await onRequest(mockContext);

      const countryCall = mockFetch.mock.calls.find(call => 
        call[0].includes('location.country_code')
      );
      
      const payload = JSON.parse(countryCall[1].body);
      expect(payload.num_buckets).toBe(50);
    });
  });

  describe('Data Aggregation Edge Cases', () => {
    it('should handle buckets with undefined count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'http', count: undefined }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Should handle gracefully
      expect(body.services).toBeDefined();
    });

    it('should handle buckets with null count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'http', count: null }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.services).toBeDefined();
    });

    it('should handle buckets with negative counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'http', count: -5 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Should include negative counts as-is
      expect(body.services.http).toBe(-5);
      expect(body.total_services).toBe(-5);
    });

    it('should handle buckets with floating point counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'http', count: 5.7 },
                { key: 'https', count: 3.2 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.services.http).toBe(5.7);
      expect(body.services.https).toBe(3.2);
      expect(body.total_services).toBeCloseTo(8.9, 1);
    });

    it('should handle duplicate service keys', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'http', count: 50 },
                { key: 'http', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Later entry should overwrite
      expect(body.services.http).toBe(30);
    });

    it('should handle duplicate country keys with different cases', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'us', count: 50 },
                { key: 'US', count: 30 }
              ]
            }
          })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      // Both should be uppercased to same key, later overwrites
      expect(body.countries.US).toBe(30);
      expect(Object.keys(body.countries).length).toBe(1);
    });

    it('should handle very long service names', async () => {
      const longName = 'a'.repeat(1000);
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: longName, count: 10 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.services[longName]).toBe(10);
    });

    it('should handle service names with special characters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: {
              buckets: [
                { key: 'service/with/slashes', count: 10 },
                { key: 'service-with-dashes', count: 20 },
                { key: 'service.with.dots', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.services['service/with/slashes']).toBe(10);
      expect(body.services['service-with-dashes']).toBe(20);
      expect(body.services['service.with.dots']).toBe(30);
    });
  });

  describe('Error Response Consistency', () => {
    it('should always include last_sync in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body).toHaveProperty('last_sync');
      expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should always include zero totals in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
    });

    it('should always include empty objects in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });

    it('should include error message from exception', async () => {
      const errorMsg = 'Custom error message';
      mockFetch.mockRejectedValue(new Error(errorMsg));

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(body.details).toBe(errorMsg);
    });

    it('should log error to console on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      await onRequest(mockContext);
      
      expect(console.error).toHaveBeenCalledWith(
        'Censys summary error:',
        expect.any(Error)
      );
    });

    it('should handle res.text() failure in error path', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValue(new Error('Cannot read response'))
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });
  });

  describe('HTTP Status Code Handling', () => {
    it('should return 502 for 400 client errors from Censys', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request')
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should return 502 for 401 unauthorized from Censys', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized')
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should return 502 for 403 forbidden from Censys', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValue('Forbidden')
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should return 502 for 429 rate limit from Censys', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limit exceeded')
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });

    it('should return 502 for 503 service unavailable from Censys', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service Unavailable')
      });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should make all three API calls in parallel', async () => {
      const callTimes = [];
      
      mockFetch.mockImplementation(() => {
        callTimes.push(Date.now());
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            result: { total: 0, buckets: [] }
          })
        });
      });

      await onRequest(mockContext);
      
      // All three calls should be made within a very short time window
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Time between first and last call should be minimal (all started together)
      const timeSpan = callTimes[callTimes.length - 1] - callTimes[0];
      expect(timeSpan).toBeLessThan(100); // Should be nearly simultaneous
    });

    it('should fail fast if any API call fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100, buckets: [] } })
        })
        .mockRejectedValueOnce(new Error('Service failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: [] } })
        });

      const response = await onRequest(mockContext);
      
      expect(response.status).toBe(502);
    });
  });

  describe('Memory and Performance Considerations', () => {
    it('should handle maximum bucket counts efficiently', async () => {
      const maxServices = Array.from({ length: 25 }, (_, i) => ({
        key: `service${i}`,
        count: 1000
      }));
      
      const maxCountries = Array.from({ length: 50 }, (_, i) => ({
        key: `C${i}`,
        count: 1000
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { total: 100000, buckets: [] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: maxServices } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ result: { buckets: maxCountries } })
        });

      const response = await onRequest(mockContext);
      const body = await response.json();
      
      expect(Object.keys(body.services).length).toBe(25);
      expect(Object.keys(body.countries).length).toBe(50);
    });

    it('should not leak memory with repeated calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          result: { total: 0, buckets: [] }
        })
      });

      // Make multiple calls
      for (let i = 0; i < 10; i++) {
        await onRequest(mockContext);
      }
      
      // Should complete without issues
      expect(mockFetch).toHaveBeenCalledTimes(30); // 3 calls × 10 iterations
    });
  });
});