/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions backend API that aggregates Censys data
 * 
 * This is a critical backend function that:
 * - Handles authentication with Censys API
 * - Makes multiple concurrent API requests
 * - Aggregates and transforms data
 * - Handles errors gracefully
 */

const fs = require('fs');
const path = require('path');

describe('Censys Summary API Function', () => {
  let onRequest;
  let mockFetch;
  let originalFetch;

  beforeAll(() => {
    // Read and evaluate the function code
    const functionCode = fs.readFileSync(
      path.join(__dirname, '../../../functions/api/censys-summary.js'),
      'utf8'
    );
    
    // Extract the onRequest function by evaluating in a controlled context
    const moduleExports = {};
    const mockModule = { exports: moduleExports };
    
    // Create a function wrapper to evaluate the code
    const wrappedCode = `
      (function(exports, module) {
        ${functionCode}
        return { onRequest: typeof onRequest !== 'undefined' ? onRequest : exports.onRequest };
      })
    `;
    
    const evalFunc = eval(wrappedCode);
    const result = evalFunc(moduleExports, mockModule);
    onRequest = result.onRequest || moduleExports.onRequest;
  });

  beforeEach(() => {
    // Mock global fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock btoa for Basic Auth encoding
    if (typeof global.btoa === 'undefined') {
      global.btoa = (str) => Buffer.from(str).toString('base64');
    }
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Environment Variable Validation', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      const context = {
        env: {
          CENSYS_API_SECRET: 'test-secret'
          // CENSYS_API_ID is missing
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID or CENSYS_API_SECRET');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id'
          // CENSYS_API_SECRET is missing
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID or CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID or CENSYS_API_SECRET');
    });

    it('should include proper headers in error response', async () => {
      const context = { env: {} };
      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Successful API Aggregation', () => {
    it('should successfully aggregate all Censys API responses', async () => {
      const mockHostSummary = {
        result: {
          total: 15000,
          hits: []
        }
      };

      const mockServiceStats = {
        result: {
          buckets: [
            { key: 'HTTP', count: 5000 },
            { key: 'HTTPS', count: 7000 },
            { key: 'SSH', count: 3000 }
          ]
        }
      };

      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 6000 },
            { key: 'gb', count: 4000 },
            { key: 'de', count: 3000 },
            { key: 'fr', count: 2000 }
          ]
        }
      };

      // Mock all three API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockHostSummary
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockServiceStats
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockCountryStats
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(15000);
      expect(data.total_services).toBe(15000); // 5000 + 7000 + 3000
      expect(data.countries).toEqual({
        US: 6000,
        GB: 4000,
        DE: 3000,
        FR: 2000
      });
      expect(data.services).toEqual({
        HTTP: 5000,
        HTTPS: 7000,
        SSH: 3000
      });
      expect(data.last_sync).toBeTruthy();
      expect(new Date(data.last_sync).getTime()).not.toBeNaN();
    });

    it('should make parallel API calls with correct authentication', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const context = {
        env: {
          CENSYS_API_ID: 'my-api-id',
          CENSYS_API_SECRET: 'my-secret-key'
        }
      };

      await onRequest(context);

      // Should make 3 concurrent calls
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Check authentication header on all calls
      const expectedAuth = `Basic ${Buffer.from('my-api-id:my-secret-key').toString('base64')}`;
      
      mockFetch.mock.calls.forEach(call => {
        const [url, options] = call;
        expect(options.headers.Authorization).toBe(expectedAuth);
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(options.headers['Accept']).toBe('application/json');
        expect(options.method).toBe('POST');
      });
    });

    it('should call correct Censys API endpoints', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      await onRequest(context);

      const urls = mockFetch.mock.calls.map(call => call[0]);
      expect(urls).toContain('https://search.censys.io/api/v2/hosts/search');
      expect(urls).toContain('https://search.censys.io/api/v2/hosts/stats/services.service_name');
      expect(urls).toContain('https://search.censys.io/api/v2/hosts/stats/location.country_code');
    });

    it('should include correct query payloads in API requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      await onRequest(context);

      const payloads = mockFetch.mock.calls.map(call => JSON.parse(call[1].body));
      
      // Host search payload
      expect(payloads[0]).toEqual({
        q: '*',
        per_page: 1,
        virtual_hosts: 'EXCLUDE'
      });

      // Service stats payload
      expect(payloads[1]).toEqual({
        q: '*',
        num_buckets: 25
      });

      // Country stats payload
      expect(payloads[2]).toEqual({
        q: '*',
        num_buckets: 50
      });
    });

    it('should include proper response headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 401 unauthorized error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'invalid-id',
          CENSYS_API_SECRET: 'invalid-secret'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('401');
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle HTTP 429 rate limit error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('429');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('Network connection failed');
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('timeout');
    });

    it('should handle partial API failures gracefully', async () => {
      // First call succeeds, second fails, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 1000 } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal server error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      // Should return error response due to Promise.all behavior
      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
    });

    it('should include timestamp even in error responses', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.last_sync).toBeTruthy();
      const timestamp = new Date(data.last_sync);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Data Processing and Transformation', () => {
    it('should handle missing result in API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}) // No result field
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
    });

    it('should handle missing buckets in stats responses', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 5000 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // No buckets
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} }) // No buckets
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(5000);
      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
    });

    it('should skip buckets with missing keys', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 100 },
                { count: 50 }, // Missing key
                { key: 'HTTPS', count: 200 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services).toEqual({
        HTTP: 100,
        HTTPS: 200
      });
      expect(data.total_services).toBe(300);
    });

    it('should uppercase country codes', async () => {
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
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 100 },
                { key: 'Gb', count: 50 },
                { key: 'DE', count: 75 }
              ]
            }
          })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.countries).toEqual({
        US: 100,
        GB: 50,
        DE: 75
      });
    });

    it('should calculate total services correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 1234 },
                { key: 'HTTPS', count: 5678 },
                { key: 'SSH', count: 910 },
                { key: 'FTP', count: 42 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_services).toBe(7864); // 1234 + 5678 + 910 + 42
    });

    it('should handle empty buckets arrays', async () => {
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

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_services).toBe(0);
      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
    });
  });

  describe('Edge Cases', () => {
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
              buckets: [
                { key: 'HTTP', count: 500000000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_hosts).toBe(999999999);
      expect(data.total_services).toBe(500000000);
    });

    it('should handle special characters in service names', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP/2', count: 100 },
                { key: 'HTTPS (TLS 1.3)', count: 200 },
                { key: 'SSH-2.0', count: 50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services['HTTP/2']).toBe(100);
      expect(data.services['HTTPS (TLS 1.3)']).toBe(200);
      expect(data.services['SSH-2.0']).toBe(50);
    });

    it('should handle malformed JSON in error text', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => '<html>Internal Server Error</html>'
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
    });

    it('should handle null or undefined bucket values', async () => {
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
                { key: 'HTTP', count: 50 },
                null,
                undefined,
                { key: 'HTTPS', count: 30 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services).toEqual({
        HTTP: 50,
        HTTPS: 30
      });
      expect(data.total_services).toBe(80);
    });
  });

  describe('Response Format Consistency', () => {
    it('should always return the same response structure on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data).toHaveProperty('total_hosts');
      expect(data).toHaveProperty('total_services');
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('services');
      expect(data).not.toHaveProperty('error');
      expect(data).not.toHaveProperty('details');
    });

    it('should always return the same response structure on error', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('total_hosts');
      expect(data).toHaveProperty('total_services');
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('services');
      
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
    });

    it('should return valid JSON in all cases', async () => {
      const testCases = [
        { env: {} }, // Missing credentials
        { env: { CENSYS_API_ID: 'test', CENSYS_API_SECRET: 'test' } } // Valid credentials
      ];

      for (const context of testCases) {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ result: { total: 0, buckets: [] } })
        });

        const response = await onRequest(context);
        const data = await response.json();

        // Should not throw when parsing
        expect(() => JSON.stringify(data)).not.toThrow();
        expect(typeof data).toBe('object');
      }
    });
  });
});