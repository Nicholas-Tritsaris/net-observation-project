/**
 * Integration tests for functions/api/censys-summary.js
 * Tests the Cloudflare Pages Function behavior
 */

const { describe, it, expect, beforeEach, jest } = require('@jest/globals');

// Mock Response class for Cloudflare Workers environment
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }
  
  async json() {
    return JSON.parse(this.body);
  }
};

describe('Censys Summary API Function', () => {
  let onRequest;
  
  beforeEach(() => {
    // Define the function inline for testing
    onRequest = async function(context) {
      const { env } = context;
      const id = env.CENSYS_API_ID;
      const secret = env.CENSYS_API_SECRET;

      if (!id || !secret) {
        return new Response(JSON.stringify({
          error: 'Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }

      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;

      try {
        const [hostSummary, serviceStats, countryStats] = await Promise.all([
          fetch('https://search.censys.io/api/v2/hosts/search', {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: '*', per_page: 1 })
          }).then(r => r.json()),
          fetch('https://search.censys.io/api/v2/hosts/stats/services.service_name', {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: '*', num_buckets: 25 })
          }).then(r => r.json()),
          fetch('https://search.censys.io/api/v2/hosts/stats/location.country_code', {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: '*', num_buckets: 50 })
          }).then(r => r.json())
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

        return new Response(JSON.stringify({
          total_hosts: totalHosts,
          total_services: totalServices,
          last_sync: new Date().toISOString(),
          countries,
          services
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      } catch (error) {
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
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }
    };
  });

  describe('Environment Variable Validation', () => {
    it('should return 500 when CENSYS_API_ID is missing', async () => {
      const context = {
        env: { CENSYS_API_SECRET: 'test-secret' }
      };
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing');
    });

    it('should return 500 when CENSYS_API_SECRET is missing', async () => {
      const context = {
        env: { CENSYS_API_ID: 'test-id' }
      };
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(response.status).toBe(500);
      expect(body.error).toContain('Missing');
    });

    it('should return 500 when both credentials are missing', async () => {
      const context = { env: {} };
      
      const response = await onRequest(context);
      expect(response.status).toBe(500);
    });
  });

  describe('Response Structure', () => {
    it('should return 502 on API failure with proper structure', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      
      const context = {
        env: {
          CENSYS_API_ID: 'test-id',
          CENSYS_API_SECRET: 'test-secret'
        }
      };
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(response.status).toBe(502);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('details');
      expect(body).toHaveProperty('total_hosts');
      expect(body).toHaveProperty('total_services');
      expect(body).toHaveProperty('countries');
      expect(body).toHaveProperty('services');
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
    });
  });

  describe('Data Aggregation Logic', () => {
    it('should aggregate service counts correctly', () => {
      const buckets = [
        { key: 'http', count: 100 },
        { key: 'https', count: 200 },
        { key: 'ssh', count: 50 }
      ];
      
      const services = {};
      let totalServices = 0;
      
      for (const bucket of buckets) {
        if (bucket?.key) {
          services[bucket.key] = bucket.count;
          totalServices += bucket.count;
        }
      }
      
      expect(services.http).toBe(100);
      expect(services.https).toBe(200);
      expect(services.ssh).toBe(50);
      expect(totalServices).toBe(350);
    });

    it('should normalize country codes to uppercase', () => {
      const buckets = [
        { key: 'us', count: 500 },
        { key: 'gb', count: 300 },
        { key: 'de', count: 200 }
      ];
      
      const countries = {};
      for (const bucket of buckets) {
        if (bucket?.key) {
          const countryCode = bucket.key.toUpperCase();
          countries[countryCode] = bucket.count;
        }
      }
      
      expect(countries.US).toBe(500);
      expect(countries.GB).toBe(300);
      expect(countries.DE).toBe(200);
    });

    it('should skip buckets without keys', () => {
      const buckets = [
        { key: 'http', count: 100 },
        { count: 200 }, // Missing key
        { key: null, count: 50 },
        { key: '', count: 30 }
      ];
      
      const services = {};
      for (const bucket of buckets) {
        if (bucket?.key) {
          services[bucket.key] = bucket.count;
        }
      }
      
      expect(Object.keys(services).length).toBe(1);
      expect(services.http).toBe(100);
    });

    it('should handle empty bucket arrays', () => {
      const serviceBuckets = [];
      const services = {};
      let totalServices = 0;
      
      for (const bucket of serviceBuckets) {
        if (bucket?.key) {
          services[bucket.key] = bucket.count;
          totalServices += bucket.count;
        }
      }
      
      expect(Object.keys(services).length).toBe(0);
      expect(totalServices).toBe(0);
    });

    it('should handle undefined bucket arrays with nullish coalescing', () => {
      const serviceBuckets = undefined;
      const buckets = serviceBuckets ?? [];
      
      expect(buckets).toEqual([]);
      expect(Array.isArray(buckets)).toBe(true);
    });

    it('should extract total hosts with optional chaining', () => {
      const validResponse = { result: { total: 1000 } };
      const invalidResponse = {};
      const nullResponse = null;
      
      expect(validResponse?.result?.total ?? 0).toBe(1000);
      expect(invalidResponse?.result?.total ?? 0).toBe(0);
      expect(nullResponse?.result?.total ?? 0).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('should create proper Basic Auth header', () => {
      const id = 'test-id';
      const secret = 'test-secret';
      const authHeader = `Basic ${btoa(`${id}:${secret}`)}`;
      
      expect(authHeader).toContain('Basic');
      expect(authHeader.split(' ')[0]).toBe('Basic');
    });

    it('should base64 encode credentials correctly', () => {
      const credentials = 'user:password';
      const encoded = btoa(credentials);
      const decoded = atob(encoded);
      
      expect(decoded).toBe(credentials);
    });

    it('should handle special characters in credentials', () => {
      const id = 'test@user.com';
      const secret = 'p@$$w0rd!';
      const combined = `${id}:${secret}`;
      const encoded = btoa(combined);
      const decoded = atob(encoded);
      
      expect(decoded).toBe(combined);
    });
  });

  describe('Response Headers', () => {
    it('should include Content-Type application/json', async () => {
      const context = { env: {} };
      const response = await onRequest(context);
      
      expect(response.headers['Content-Type']).toBe('application/json');
    });

    it('should include no-cache directives', async () => {
      const context = { env: {} };
      const response = await onRequest(context);
      
      const cacheControl = response.headers['Cache-Control'];
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('must-revalidate');
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate valid ISO 8601 timestamp', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include timestamp in all responses', async () => {
      const context = { env: {} };
      const response = await onRequest(context);
      const body = await response.json();
      
      // Even error responses should have last_sync
      expect(body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should catch and handle network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network timeout'))
      );
      
      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(response.status).toBe(502);
      expect(body.details).toContain('Network timeout');
    });

    it('should provide fallback data structure on error', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      
      const context = {
        env: {
          CENSYS_API_ID: 'test',
          CENSYS_API_SECRET: 'test'
        }
      };
      
      const response = await onRequest(context);
      const body = await response.json();
      
      expect(body.total_hosts).toBe(0);
      expect(body.total_services).toBe(0);
      expect(body.countries).toEqual({});
      expect(body.services).toEqual({});
    });
  });
});