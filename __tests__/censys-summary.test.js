/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Functions API endpoint that fetches Censys data
 * 
 * CRITICAL: This file had NO tests before - testing a production API endpoint!
 */

describe('Censys Summary API Function', () => {
  let onRequest, responseHeaders;
  let mockFetch;
  let mockConsoleError;

  beforeEach(async () => {
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock console.error to track error logging
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock btoa for Basic Auth encoding
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

    // Import the module - need to handle ES modules
    const module = await import('../functions/api/censys-summary.js');
    onRequest = module.onRequest;
    
    // Since responseHeaders is not exported, we'll test it indirectly through responses
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockRestore();
  });

  describe('Environment variable validation', () => {
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
      expect(data.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
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
      expect(data.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
    });

    it('should return 500 error when both credentials are missing', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing');
    });

    it('should return 500 error when credentials are null', async () => {
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

    it('should return 500 error when credentials are empty strings', async () => {
      const context = {
        env: {
          CENSYS_API_ID: '',
          CENSYS_API_SECRET: ''
        }
      };

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(500);
    });
  });

  describe('Successful data fetching', () => {
    it('should successfully fetch and aggregate Censys data', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const mockHostSummary = {
        result: {
          total: 12345
        }
      };

      const mockServiceStats = {
        result: {
          buckets: [
            { key: 'HTTP', count: 5000 },
            { key: 'HTTPS', count: 4500 },
            { key: 'SSH', count: 2000 }
          ]
        }
      };

      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 6000 },
            { key: 'gb', count: 3000 },
            { key: 'de', count: 2000 }
          ]
        }
      };

      // Mock fetch to return different responses for different endpoints
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHostSummary
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServiceStats
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountryStats
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(12345);
      expect(data.total_services).toBe(11500); // 5000 + 4500 + 2000
      expect(data.last_sync).toBeTruthy();
      expect(data.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
      expect(data.countries).toEqual({
        US: 6000,
        GB: 3000,
        DE: 2000
      });
      expect(data.services).toEqual({
        HTTP: 5000,
        HTTPS: 4500,
        SSH: 2000
      });
    });

    it('should use correct Authorization header with Base64 encoded credentials', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'my-api-id',
          CENSYS_API_SECRET: 'my-api-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      expect(global.btoa).toHaveBeenCalledWith('my-api-id:my-api-secret');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /)
          })
        })
      );
    });

    it('should make three parallel API calls to Censys', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/search',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/services.service_name',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/location.country_code',
        expect.any(Object)
      );
    });

    it('should use correct request parameters for host search', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      await onRequest(context);

      const hostSearchCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/search')
      );

      expect(hostSearchCall[1].method).toBe('POST');
      expect(hostSearchCall[1].headers['Content-Type']).toBe('application/json');
      expect(hostSearchCall[1].headers['Accept']).toBe('application/json');
      
      const body = JSON.parse(hostSearchCall[1].body);
      expect(body.q).toBe('*');
      expect(body.per_page).toBe(1);
      expect(body.virtual_hosts).toBe('EXCLUDE');
    });

    it('should use correct request parameters for service stats', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });

      await onRequest(context);

      const serviceStatsCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/services.service_name')
      );

      const body = JSON.parse(serviceStatsCall[1].body);
      expect(body.q).toBe('*');
      expect(body.num_buckets).toBe(25);
    });

    it('should use correct request parameters for country stats', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });

      await onRequest(context);

      const countryStatsCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/location.country_code')
      );

      const body = JSON.parse(countryStatsCall[1].body);
      expect(body.q).toBe('*');
      expect(body.num_buckets).toBe(50);
    });
  });

  describe('Data aggregation and transformation', () => {
    it('should handle missing total_hosts gracefully with fallback to 0', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} }) // No total field
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_hosts).toBe(0);
    });

    it('should calculate total_services by summing all service counts', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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
                { key: 'HTTP', count: 1000 },
                { key: 'HTTPS', count: 500 },
                { key: 'FTP', count: 250 },
                { key: 'SSH', count: 750 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_services).toBe(2500); // 1000 + 500 + 250 + 750
    });

    it('should uppercase country codes in the response', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
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
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 100 },
                { key: 'gb', count: 50 },
                { key: 'fr', count: 25 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.countries).toEqual({
        US: 100,
        GB: 50,
        FR: 25
      });
    });

    it('should skip service buckets without a key', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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
                { key: null, count: 25 }, // Null key
                { key: 'HTTPS', count: 75 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services).toEqual({
        HTTP: 100,
        HTTPS: 75
      });
      expect(data.total_services).toBe(175); // Only valid buckets counted
    });

    it('should skip country buckets without a key', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
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
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 100 },
                { count: 50 }, // Missing key
                { key: '', count: 25 }, // Empty key
                { key: 'gb', count: 75 }
              ]
            }
          })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.countries).toEqual({
        US: 100,
        GB: 75,
        '': 25 // Empty string is technically truthy and will be uppercased
      });
    });

    it('should handle empty buckets arrays', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 500, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_hosts).toBe(500);
      expect(data.total_services).toBe(0);
      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
    });

    it('should handle missing buckets property with fallback to empty array', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: {} }) // No buckets property
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services).toEqual({});
      expect(data.countries).toEqual({});
      expect(data.total_services).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 502 error when Censys API returns non-ok response', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toContain('Censys');
      expect(data.details).toContain('401');
      expect(data.last_sync).toBeTruthy();
      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
    });

    it('should return 502 error when host search fails', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should return 502 error when service stats fail', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('429');
      expect(data.details).toContain('Rate limit exceeded');
    });

    it('should return 502 error when country stats fail', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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
          status: 503,
          text: async () => 'Service unavailable'
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toContain('503');
    });

    it('should handle network errors gracefully', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toBe('Network connection failed');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Censys summary error:',
        expect.any(Error)
      );
    });

    it('should handle fetch timeout errors', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.details).toBe('Request timeout');
    });

    it('should handle JSON parsing errors from API', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
    });

    it('should log errors to console.error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const testError = new Error('Test error');
      mockFetch.mockRejectedValue(testError);

      await onRequest(context);

      expect(mockConsoleError).toHaveBeenCalledWith('Censys summary error:', testError);
    });
  });

  describe('Response headers', () => {
    it('should return correct Content-Type header on success', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return correct Cache-Control header on success', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);

      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('should return correct Content-Type header on error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return correct Cache-Control header on error', async () => {
      const context = {
        env: {}
      };

      const response = await onRequest(context);

      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very large host counts', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.total_hosts).toBe(999999999);
    });

    it('should handle maximum number of service buckets (25)', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const serviceBuckets = Array.from({ length: 25 }, (_, i) => ({
        key: `SERVICE_${i}`,
        count: (i + 1) * 100
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: serviceBuckets } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(Object.keys(data.services).length).toBe(25);
      expect(data.total_services).toBe(32500); // Sum of 100+200+...+2500
    });

    it('should handle maximum number of country buckets (50)', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      const countryBuckets = Array.from({ length: 50 }, (_, i) => ({
        key: `c${i.toString().padStart(2, '0')}`,
        count: (i + 1) * 10
      }));

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
          json: async () => ({ result: { buckets: countryBuckets } })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(Object.keys(data.countries).length).toBe(50);
    });

    it('should handle zero counts in buckets', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

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
                { key: 'HTTP', count: 0 },
                { key: 'HTTPS', count: 100 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.services.HTTP).toBe(0);
      expect(data.total_services).toBe(100);
    });

    it('should handle country codes with mixed case', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
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

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.countries).toEqual({
        US: 100,
        GB: 50,
        FR: 25
      });
    });

    it('should preserve ISO timestamp format in last_sync', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      // Check ISO 8601 format
      expect(data.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's a valid date
      const date = new Date(data.last_sync);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should include last_sync even on error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockRejectedValue(new Error('API Error'));

      const response = await onRequest(context);
      const data = await response.json();

      expect(data.last_sync).toBeTruthy();
      expect(data.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('API contract compliance', () => {
    it('should return all required fields on success', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 100, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(data).toHaveProperty('total_hosts');
      expect(data).toHaveProperty('total_services');
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('services');
    });

    it('should return all required fields on error', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockRejectedValue(new Error('Test error'));

      const response = await onRequest(context);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('total_hosts');
      expect(data).toHaveProperty('total_services');
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('services');
    });

    it('should return numbers for total fields', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 100, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(typeof data.total_hosts).toBe('number');
      expect(typeof data.total_services).toBe('number');
    });

    it('should return objects for countries and services', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(typeof data.countries).toBe('object');
      expect(typeof data.services).toBe('object');
      expect(Array.isArray(data.countries)).toBe(false);
      expect(Array.isArray(data.services)).toBe(false);
    });

    it('should return string for last_sync', async () => {
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const response = await onRequest(context);
      const data = await response.json();

      expect(typeof data.last_sync).toBe('string');
    });
  });
});