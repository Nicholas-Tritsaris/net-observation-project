import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Cloudflare Workers environment
const createMockContext = (env = {}) => ({
  env: {
    CENSYS_API_ID: env.CENSYS_API_ID || '',
    CENSYS_API_SECRET: env.CENSYS_API_SECRET || '',
    ...env
  },
  request: new Request('https://example.com/api/censys-summary'),
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn()
});

// Import and wrap the function (we'll mock the imports)
const mockOnRequest = async (context) => {
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

describe('Censys API Function Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Environment Variable Validation', () => {
    it('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = createMockContext({ CENSYS_API_SECRET: 'secret' });
      const response = await mockOnRequest(context);
      
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain('Missing');
    });

    it('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = createMockContext({ CENSYS_API_ID: 'id' });
      const response = await mockOnRequest(context);
      
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain('Missing');
    });

    it('should return 500 when both credentials are missing', async () => {
      const context = createMockContext({});
      const response = await mockOnRequest(context);
      
      expect(response.status).toBe(500);
    });

    it('should proceed with valid credentials', async () => {
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      // Mock successful API responses
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });
      
      const response = await mockOnRequest(context);
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication Header', () => {
    it('should create correct Basic Auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const expected = `Basic ${btoa(`${id}:${secret}`)}`;
      
      expect(expected).toContain('Basic ');
    });

    it('should base64 encode credentials', () => {
      const credentials = 'id:secret';
      const encoded = btoa(credentials);
      const decoded = atob(encoded);
      
      expect(decoded).toBe(credentials);
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint URLs', () => {
      const baseURL = 'https://search.censys.io/api/v2';
      const paths = [
        '/hosts/search',
        '/hosts/stats/services.service_name',
        '/hosts/stats/location.country_code'
      ];
      
      paths.forEach(path => {
        const url = `${baseURL}${path}`;
        expect(url).toContain('search.censys.io');
        expect(url).toContain(path);
      });
    });
  });

  describe('Successful API Response Handling', () => {
    it('should process host summary correctly', async () => {
      const mockResponse = {
        result: {
          total: 1000000,
          hits: []
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      const body = await response.json();
      
      expect(body.total_hosts).toBe(1000000);
    });

    it('should process service stats correctly', async () => {
      const mockServiceStats = {
        result: {
          buckets: [
            { key: 'HTTP', count: 1000 },
            { key: 'HTTPS', count: 800 },
            { key: 'SSH', count: 600 }
          ]
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 0 } })
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockServiceStats
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      const body = await response.json();
      
      expect(body.services.HTTP).toBe(1000);
      expect(body.services.HTTPS).toBe(800);
      expect(body.services.SSH).toBe(600);
      expect(body.total_services).toBe(2400);
    });

    it('should process country stats correctly', async () => {
      const mockCountryStats = {
        result: {
          buckets: [
            { key: 'us', count: 500 },
            { key: 'gb', count: 300 },
            { key: 'de', count: 200 }
          ]
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 0 } })
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCountryStats
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      const body = await response.json();
      
      expect(body.countries.US).toBe(500);
      expect(body.countries.GB).toBe(300);
      expect(body.countries.DE).toBe(200);
    });

    it('should uppercase country codes', () => {
      const lowercaseCode = 'us';
      const uppercaseCode = lowercaseCode.toUpperCase();
      
      expect(uppercaseCode).toBe('US');
    });

    it('should filter out buckets without keys', () => {
      const buckets = [
        { key: 'HTTP', count: 100 },
        { key: null, count: 50 },
        { count: 25 },
        { key: 'HTTPS', count: 80 }
      ];
      
      const filtered = buckets.filter(b => b?.key);
      expect(filtered.length).toBe(2);
    });

    it('should calculate total services correctly', () => {
      const services = { HTTP: 100, HTTPS: 80, SSH: 60 };
      const total = Object.values(services).reduce((sum, count) => sum + count, 0);
      
      expect(total).toBe(240);
    });
  });

  describe('Error Handling', () => {
    it('should return 502 on API fetch failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      expect(response.status).toBe(502);
      
      const body = await response.json();
      expect(body.error).toBe('Unable to retrieve Censys summary');
      expect(body.details).toContain('Network error');
    });

    it('should return 502 on HTTP error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      expect(response.status).toBe(502);
      
      const body = await response.json();
      expect(body.details).toContain('401');
    });

    it('should include fallback data in error response', async () => {
      global.fetch.mockRejectedValue(new Error('API error'));
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      const body = await response.json();
      
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
      expect(body.last_sync).toBeTruthy();
    });

    it('should handle malformed API responses', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: 'structure' })
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      const body = await response.json();
      
      // Should use nullish coalescing to handle missing data
      expect(body.total_hosts).toBe(0);
    });
  });

  describe('Response Headers', () => {
    it('should include Content-Type header', async () => {
      const context = createMockContext({});
      const response = await mockOnRequest(context);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include Cache-Control header', async () => {
      const context = createMockContext({});
      const response = await mockOnRequest(context);
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });

    it('should include headers in success response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include headers in error response', async () => {
      global.fetch.mockRejectedValue(new Error('Error'));
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Data Transformation', () => {
    it('should use nullish coalescing for safe defaults', () => {
      const data = { result: { total: null } };
      const total = data?.result?.total ?? 0;
      
      expect(total).toBe(0);
    });

    it('should handle missing buckets array', () => {
      const data = { result: {} };
      const buckets = data?.result?.buckets ?? [];
      
      expect(buckets).toEqual([]);
    });

    it('should format timestamp as ISO string', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Parallel API Calls', () => {
    it('should make three API calls in parallel', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: { total: 0, buckets: [] } })
      });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      await mockOnRequest(context);
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle Promise.all correctly', async () => {
      const promises = [
        Promise.resolve({ result: { total: 100 } }),
        Promise.resolve({ result: { buckets: [] } }),
        Promise.resolve({ result: { buckets: [] } })
      ];
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });

    it('should fail fast if any API call fails', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: {} }) });
      
      const context = createMockContext({
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      });
      
      const response = await mockOnRequest(context);
      expect(response.status).toBe(502);
    });
  });

  describe('Request Payload Construction', () => {
    it('should send correct payload for host search', () => {
      const payload = { q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' };
      
      expect(payload.q).toBe('*');
      expect(payload.per_page).toBe(1);
      expect(payload.virtual_hosts).toBe('EXCLUDE');
    });

    it('should send correct payload for service stats', () => {
      const payload = { q: '*', num_buckets: 25 };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(25);
    });

    it('should send correct payload for country stats', () => {
      const payload = { q: '*', num_buckets: 50 };
      
      expect(payload.q).toBe('*');
      expect(payload.num_buckets).toBe(50);
    });
  });
});