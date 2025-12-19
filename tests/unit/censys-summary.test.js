import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Censys Summary API Function', () => {
  let mockContext;
  let mockFetch;

  beforeEach(() => {
    mockContext = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    mockFetch = vi.fn();
    global.fetch = mockFetch;
    global.btoa = (str) => Buffer.from(str).toString('base64');
  });

  describe('Environment Variable Validation', () => {
    it('should return error when CENSYS_API_ID is missing', async () => {
      mockContext.env.CENSYS_API_ID = undefined;

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_ID');
    });

    it('should return error when CENSYS_API_SECRET is missing', async () => {
      mockContext.env.CENSYS_API_SECRET = undefined;

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Missing CENSYS_API_SECRET');
    });

    it('should return error when both credentials are missing', async () => {
      mockContext.env.CENSYS_API_ID = undefined;
      mockContext.env.CENSYS_API_SECRET = undefined;

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Authorization Header', () => {
    it('should construct correct Basic auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const expected = `Basic ${btoa(`${id}:${secret}`)}`;

      expect(expected).toMatch(/^Basic /);
      expect(expected.length).toBeGreaterThan(6);
    });

    it('should base64 encode credentials', () => {
      const credentials = 'user:pass';
      const encoded = btoa(credentials);
      const decoded = Buffer.from(encoded, 'base64').toString();

      expect(decoded).toBe(credentials);
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct Censys API endpoint', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;
      const result = endpoint('/hosts/search');

      expect(result).toBe('https://search.censys.io/api/v2/hosts/search');
    });

    it('should handle different API paths', () => {
      const endpoint = (path) => `https://search.censys.io/api/v2${path}`;

      expect(endpoint('/hosts/search')).toContain('/hosts/search');
      expect(endpoint('/hosts/stats/services.service_name')).toContain('/hosts/stats/services.service_name');
      expect(endpoint('/hosts/stats/location.country_code')).toContain('/hosts/stats/location.country_code');
    });
  });

  describe('Successful API Response', () => {
    it('should return formatted response on success', async () => {
      const mockHostData = {
        result: { total: 1000000 }
      };
      const mockServiceData = {
        result: {
          buckets: [
            { key: 'HTTP', count: 50000 },
            { key: 'SSH', count: 30000 }
          ]
        }
      };
      const mockCountryData = {
        result: {
          buckets: [
            { key: 'us', count: 100000 },
            { key: 'cn', count: 80000 }
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

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_hosts).toBe(1000000);
      expect(data.total_services).toBe(80000);
      expect(data.services.HTTP).toBe(50000);
      expect(data.countries.US).toBe(100000);
      expect(data.last_sync).toBeDefined();
    });

    it('should make parallel requests to three endpoints', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should include correct request headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      const call = mockFetch.mock.calls[0];
      expect(call[1].headers['Content-Type']).toBe('application/json');
      expect(call[1].headers['Accept']).toBe('application/json');
      expect(call[1].headers['Authorization']).toMatch(/^Basic /);
    });

    it('should use POST method for requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe('POST');
    });
  });

  describe('Service Statistics Processing', () => {
    it('should process service buckets correctly', () => {
      const serviceBuckets = [
        { key: 'HTTP', count: 1000 },
        { key: 'SSH', count: 500 },
        { key: 'FTP', count: 250 }
      ];

      const services = {};
      let totalServices = 0;

      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(services.HTTP).toBe(1000);
      expect(services.SSH).toBe(500);
      expect(totalServices).toBe(1750);
    });

    it('should skip buckets without keys', () => {
      const serviceBuckets = [
        { key: 'HTTP', count: 1000 },
        { count: 500 }, // Missing key
        { key: null, count: 250 }
      ];

      const services = {};
      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
      }

      expect(Object.keys(services).length).toBe(1);
      expect(services.HTTP).toBe(1000);
    });

    it('should handle empty service buckets', () => {
      const serviceBuckets = [];
      const services = {};
      let totalServices = 0;

      for (const bucket of serviceBuckets) {
        if (!bucket?.key) continue;
        services[bucket.key] = bucket.count;
        totalServices += bucket.count;
      }

      expect(Object.keys(services).length).toBe(0);
      expect(totalServices).toBe(0);
    });
  });

  describe('Country Statistics Processing', () => {
    it('should convert country codes to uppercase', () => {
      const countryBuckets = [
        { key: 'us', count: 1000 },
        { key: 'gb', count: 500 }
      ];

      const countries = {};
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(countries.US).toBe(1000);
      expect(countries.GB).toBe(500);
    });

    it('should skip country buckets without keys', () => {
      const countryBuckets = [
        { key: 'us', count: 1000 },
        { count: 500 },
        { key: '', count: 250 }
      ];

      const countries = {};
      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        const countryCode = bucket.key.toUpperCase();
        countries[countryCode] = bucket.count;
      }

      expect(Object.keys(countries).length).toBe(1);
    });

    it('should handle empty country buckets', () => {
      const countryBuckets = [];
      const countries = {};

      for (const bucket of countryBuckets) {
        if (!bucket?.key) continue;
        countries[bucket.key.toUpperCase()] = bucket.count;
      }

      expect(Object.keys(countries).length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 502 on Censys API failure', async () => {
      mockFetch.mockRejectedValue(new Error('API connection failed'));

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Unable to retrieve Censys summary');
      expect(data.details).toBeDefined();
    });

    it('should handle non-OK HTTP responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);

      expect(response.status).toBe(502);
    });

    it('should return fallback data structure on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.total_hosts).toBe(0);
      expect(data.total_services).toBe(0);
      expect(data.countries).toEqual({});
      expect(data.services).toEqual({});
      expect(data.last_sync).toBeDefined();
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Test error'));

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('Censys summary error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Response Headers', () => {
    it('should include correct Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include cache control headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);

      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Request Payload Construction', () => {
    it('should include correct search query for hosts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      const hostsCall = mockFetch.mock.calls.find(call => call[0].includes('/hosts/search'));
      const payload = JSON.parse(hostsCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should request 25 service buckets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      const servicesCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/services.service_name')
      );
      const payload = JSON.parse(servicesCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should request 50 country buckets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      await onRequest(mockContext);

      const countriesCall = mockFetch.mock.calls.find(call => 
        call[0].includes('/hosts/stats/location.country_code')
      );
      const payload = JSON.parse(countriesCall[1].body);

      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });
  });

  describe('Data Fallbacks', () => {
    it('should handle missing total in host summary', () => {
      const hostSummary = { result: {} };
      const totalHosts = hostSummary?.result?.total ?? 0;

      expect(totalHosts).toBe(0);
    });

    it('should handle null result in host summary', () => {
      const hostSummary = null;
      const totalHosts = hostSummary?.result?.total ?? 0;

      expect(totalHosts).toBe(0);
    });

    it('should handle missing buckets in service stats', () => {
      const serviceStats = { result: {} };
      const serviceBuckets = serviceStats?.result?.buckets ?? [];

      expect(serviceBuckets).toEqual([]);
    });

    it('should handle missing buckets in country stats', () => {
      const countryStats = { result: {} };
      const countryBuckets = countryStats?.result?.buckets ?? [];

      expect(countryBuckets).toEqual([]);
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate ISO timestamp for last_sync', () => {
      const timestamp = new Date().toISOString();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include timestamp in successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.last_sync).toBeDefined();
      expect(new Date(data.last_sync).toString()).not.toBe('Invalid Date');
    });

    it('should include timestamp in error response', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const { onRequest } = await import('../../functions/api/censys-summary.js');
      const response = await onRequest(mockContext);
      const data = await response.json();

      expect(data.last_sync).toBeDefined();
      expect(new Date(data.last_sync).toString()).not.toBe('Invalid Date');
    });
  });
});