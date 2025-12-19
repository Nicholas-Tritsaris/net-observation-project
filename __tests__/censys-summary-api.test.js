/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Worker function that fetches Censys data
 */

const fs = require('fs');
const path = require('path');

describe('Censys Summary API - functions/api/censys-summary.js', () => {
  let apiModule;
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    // Reset mocks
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.btoa = (str) => Buffer.from(str).toString('base64');
    global.Response = class {
      constructor(body, options) {
        this.body = body;
        this.status = options.status;
        this.headers = options.headers;
      }
    };

    // Load the API module code
    const apiCode = fs.readFileSync(
      path.join(__dirname, '../functions/api/censys-summary.js'),
      'utf8'
    );

    // Parse and execute the module
    const moduleExports = {};
    const moduleCode = apiCode.replace('export async function', 'moduleExports.onRequest = async function');
    eval(moduleCode.replace('export ', ''));
    apiModule = moduleExports;

    // Setup default mock context
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-id-123',
        CENSYS_API_SECRET: 'test-secret-456'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment validation', () => {
    it('should return 500 error when CENSYS_API_ID is missing', async () => {
      mockContext.env.CENSYS_API_ID = undefined;

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
      mockContext.env.CENSYS_API_SECRET = undefined;

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing CENSYS_API_SECRET');
    });

    it('should return 500 error when both credentials are missing', async () => {
      mockContext.env.CENSYS_API_ID = null;
      mockContext.env.CENSYS_API_SECRET = null;

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should include correct headers in error response', async () => {
      mockContext.env.CENSYS_API_ID = undefined;

      const response = await apiModule.onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toContain('no-store');
    });
  });

  describe('Successful data aggregation', () => {
    beforeEach(() => {
      // Mock successful Censys API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              total: 1500000
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'HTTP', count: 50000 },
                { key: 'HTTPS', count: 45000 },
                { key: 'SSH', count: 30000 },
                { key: 'FTP', count: 5000 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'us', count: 500000 },
                { key: 'cn', count: 300000 },
                { key: 'gb', count: 150000 }
              ]
            }
          })
        });
    });

    it('should successfully aggregate all Censys data', async () => {
      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(1500000);
      expect(body.total_services).toBe(130000);
      expect(body.services).toEqual({
        HTTP: 50000,
        HTTPS: 45000,
        SSH: 30000,
        FTP: 5000
      });
      expect(body.countries).toEqual({
        US: 500000,
        CN: 300000,
        GB: 150000
      });
      expect(body.last_sync).toBeDefined();
      expect(new Date(body.last_sync)).toBeInstanceOf(Date);
    });

    it('should make three parallel API calls to Censys', async () => {
      await apiModule.onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Verify host search call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );

      // Verify service stats call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/services.service_name',
        expect.any(Object)
      );

      // Verify country stats call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://search.censys.io/api/v2/hosts/stats/location.country_code',
        expect.any(Object)
      );
    });

    it('should use correct authentication header', async () => {
      await apiModule.onRequest(mockContext);

      const expectedAuth = `Basic ${Buffer.from('test-id-123:test-secret-456').toString('base64')}`;
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth
          })
        })
      );
    });

    it('should include cache-control headers in success response', async () => {
      const response = await apiModule.onRequest(mockContext);

      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    it('should uppercase country codes', async () => {
      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.countries.US).toBeDefined();
      expect(body.countries.CN).toBeDefined();
      expect(body.countries.GB).toBeDefined();
      expect(body.countries.us).toBeUndefined();
      expect(body.countries.cn).toBeUndefined();
    });
  });

  describe('Edge cases and data handling', () => {
    it('should handle empty service buckets', async () => {
      mockFetch
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

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
    });

    it('should handle missing result object in API response', async () => {
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

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
    });

    it('should skip buckets with missing keys', async () => {
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
                { key: 'HTTP', count: 10 },
                { count: 20 }, // Missing key
                { key: null, count: 15 }, // Null key
                { key: 'HTTPS', count: 25 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.services).toEqual({
        HTTP: 10,
        HTTPS: 25
      });
      expect(body.total_services).toBe(35);
    });

    it('should handle null or undefined bucket arrays', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 50 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: null } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: {} })
        });

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.services).toEqual({});
      expect(body.countries).toEqual({});
      expect(response.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should handle Censys API HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(502);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Censys');
      expect(body.details).toContain('401');
    });

    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(502);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Network timeout');
    });

    it('should include fallback data structure in error response', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
      expect(body.last_sync).toBeDefined();
    });

    it('should include proper headers in error response', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failure'));

      const response = await apiModule.onRequest(mockContext);

      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
    });

    it('should handle partial API failures gracefully', async () => {
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

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(502);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const response = await apiModule.onRequest(mockContext);

      expect(response.status).toBe(502);
    });
  });

  describe('Data transformation', () => {
    it('should correctly sum total services from all buckets', async () => {
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
                { key: 'A', count: 100 },
                { key: 'B', count: 250 },
                { key: 'C', count: 50 },
                { key: 'D', count: 600 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.total_services).toBe(1000);
    });

    it('should preserve service names exactly as returned', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 10 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: {
              buckets: [
                { key: 'MySQL/MariaDB', count: 10 },
                { key: 'PostgreSQL', count: 15 },
                { key: 'Redis', count: 5 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { buckets: [] } })
        });

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.services['MySQL/MariaDB']).toBe(10);
      expect(body.services['PostgreSQL']).toBe(15);
      expect(body.services['Redis']).toBe(5);
    });

    it('should handle mixed case country codes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: { total: 10 } })
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
                { key: 'GB', count: 50 },
                { key: 'De', count: 75 }
              ]
            }
          })
        });

      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body.countries.US).toBe(100);
      expect(body.countries.GB).toBe(50);
      expect(body.countries.DE).toBe(75);
    });
  });

  describe('Response format', () => {
    beforeEach(() => {
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
    });

    it('should return valid JSON response', async () => {
      const response = await apiModule.onRequest(mockContext);

      expect(() => JSON.parse(response.body)).not.toThrow();
    });

    it('should include all required fields in success response', async () => {
      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('last_sync');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
    });

    it('should use ISO 8601 format for last_sync', async () => {
      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(body.last_sync).toMatch(isoRegex);
    });

    it('should return objects for countries and services', async () => {
      const response = await apiModule.onRequest(mockContext);
      const body = JSON.parse(response.body);

      expect(typeof body.countries).toBe('object');
      expect(typeof body.services).toBe('object');
      expect(Array.isArray(body.countries)).toBe(false);
      expect(Array.isArray(body.services)).toBe(false);
    });
  });
});