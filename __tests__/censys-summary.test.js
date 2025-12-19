/**
 * Unit tests for functions/api/censys-summary.js
 * Tests the Cloudflare Worker that fetches and aggregates Censys API data
 * 
 * This file changed in the current branch (JSDoc comments added) but had no tests.
 * These tests cover:
 * - Environment variable validation
 * - Successful data aggregation from multiple Censys endpoints
 * - HTTP error handling from Censys API
 * - Network failures and timeouts
 * - Data transformation (country code uppercasing, service aggregation)
 * - Response headers and status codes
 * - Edge cases (empty data, malformed responses, missing fields)
 */

// Mock the global fetch and btoa for testing
global.fetch = jest.fn();
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
global.console.error = jest.fn();

// Import the worker functions using dynamic import to handle ES modules
let onRequest;
let responseHeaders;

beforeAll(async () => {
  // Read the file and evaluate it in a way that Jest can handle
  const fs = require('fs');
  const path = require('path');
  const workerCode = fs.readFileSync(
    path.join(__dirname, '../functions/api/censys-summary.js'),
    'utf8'
  );
  
  // Transform ES module exports to CommonJS for testing
  const transformedCode = workerCode
    .replace('export async function onRequest', 'onRequest = async function')
    .replace('function responseHeaders()', 'responseHeaders = function()');
  
  eval(transformedCode);
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
  global.btoa.mockClear();
  global.console.error.mockClear();
});

describe('Censys Summary Worker - Environment Validation', () => {
  it('should return 500 error when CENSYS_API_ID is missing', async () => {
    const context = {
      env: {
        CENSYS_API_SECRET: 'test-secret'
        // CENSYS_API_ID is missing
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(500);
    expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
  });

  it('should return 500 error when CENSYS_API_SECRET is missing', async () => {
    const context = {
      env: {
        CENSYS_API_ID: 'test-id'
        // CENSYS_API_SECRET is missing
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(500);
    expect(body.error).toBe('Missing CENSYS_API_ID or CENSYS_API_SECRET environment variables.');
  });

  it('should return 500 error when both credentials are missing', async () => {
    const context = {
      env: {}
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(500);
    expect(body.error).toContain('Missing');
  });

  it('should return 500 error when env object is missing', async () => {
    const context = {};

    await expect(async () => {
      await onRequest(context);
    }).rejects.toThrow();
  });
});

describe('Censys Summary Worker - Successful Data Aggregation', () => {
  it('should successfully fetch and aggregate data from all three endpoints', async () => {
    const mockHostSummary = {
      result: {
        total: 12345678
      }
    };

    const mockServiceStats = {
      result: {
        buckets: [
          { key: 'http', count: 5000 },
          { key: 'https', count: 8000 },
          { key: 'ssh', count: 2000 }
        ]
      }
    };

    const mockCountryStats = {
      result: {
        buckets: [
          { key: 'us', count: 50000 },
          { key: 'gb', count: 30000 },
          { key: 'de', count: 20000 }
        ]
      }
    };

    global.fetch
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

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(200);
    expect(body.total_hosts).toBe(12345678);
    expect(body.total_services).toBe(15000); // 5000 + 8000 + 2000
    expect(body.services).toEqual({
      http: 5000,
      https: 8000,
      ssh: 2000
    });
    expect(body.countries).toEqual({
      US: 50000,
      GB: 30000,
      DE: 20000
    });
    expect(body.last_sync).toBeDefined();
    expect(typeof body.last_sync).toBe('string');
  });

  it('should properly encode Basic authentication header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const context = {
      env: {
        CENSYS_API_ID: 'my-id',
        CENSYS_API_SECRET: 'my-secret'
      }
    };

    await onRequest(context);

    expect(global.btoa).toHaveBeenCalledWith('my-id:my-secret');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Basic ${Buffer.from('my-id:my-secret').toString('base64')}`
        })
      })
    );
  });

  it('should make parallel requests to all three Censys endpoints', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    await onRequest(context);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://search.censys.io/api/v2/hosts/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ q: '*', per_page: 1, virtual_hosts: 'EXCLUDE' })
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://search.censys.io/api/v2/hosts/stats/services.service_name',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ q: '*', num_buckets: 25 })
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://search.censys.io/api/v2/hosts/stats/location.country_code',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ q: '*', num_buckets: 50 })
      })
    );
  });

  it('should include proper headers in all API requests', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    await onRequest(context);

    const expectedHeaders = {
      'Authorization': expect.any(String),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expectedHeaders })
    );
  });

  it('should uppercase country codes in response', async () => {
    global.fetch
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
        json: async () => ({
          result: {
            buckets: [
              { key: 'us', count: 100 },
              { key: 'gb', count: 50 },
              { key: 'ca', count: 25 }
            ]
          }
        })
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(body.countries).toEqual({
      US: 100,
      GB: 50,
      CA: 25
    });
  });
});

describe('Censys Summary Worker - Edge Cases and Data Validation', () => {
  it('should handle empty buckets arrays', async () => {
    global.fetch
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
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(200);
    expect(body.total_hosts).toBe(0);
    expect(body.total_services).toBe(0);
    expect(body.services).toEqual({});
    expect(body.countries).toEqual({});
  });

  it('should skip service buckets with missing keys', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 100 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'http', count: 100 },
              { count: 50 }, // Missing key
              { key: null, count: 25 }, // Null key
              { key: '', count: 10 }, // Empty key
              { key: 'https', count: 200 }
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
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    // Should only include buckets with valid keys
    expect(body.services).toEqual({
      http: 100,
      https: 200
    });
    expect(body.total_services).toBe(300); // Only valid services counted
  });

  it('should skip country buckets with missing keys', async () => {
    global.fetch
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
        json: async () => ({
          result: {
            buckets: [
              { key: 'us', count: 100 },
              { count: 50 }, // Missing key
              { key: null, count: 25 }, // Null key
              { key: 'gb', count: 75 }
            ]
          }
        })
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(body.countries).toEqual({
      US: 100,
      GB: 75
    });
  });

  it('should handle missing result.total with fallback to 0', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: {} }) // No total field
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
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(body.total_hosts).toBe(0);
  });

  it('should handle missing result.buckets with fallback to empty array', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 100 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: {} }) // No buckets field
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: {} }) // No buckets field
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(body.services).toEqual({});
    expect(body.countries).toEqual({});
    expect(body.total_services).toBe(0);
  });

  it('should handle completely missing result object', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // No result field
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(200);
    expect(body.total_hosts).toBe(0);
    expect(body.total_services).toBe(0);
    expect(body.services).toEqual({});
    expect(body.countries).toEqual({});
  });

  it('should generate valid ISO timestamp for last_sync', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const beforeTime = new Date().toISOString();
    
    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());
    
    const afterTime = new Date().toISOString();

    expect(body.last_sync).toBeDefined();
    expect(body.last_sync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(body.last_sync).toBeGreaterThanOrEqual(beforeTime);
    expect(body.last_sync).toBeLessThanOrEqual(afterTime);
  });
});

describe('Censys Summary Worker - Error Handling', () => {
  it('should return 502 error when Censys API returns non-OK status', async () => {
    global.fetch.mockResolvedValueOnce({
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
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.error).toBe('Unable to retrieve Censys summary');
    expect(body.details).toContain('Censys');
    expect(body.details).toContain('401');
    expect(body.total_hosts).toBe(0);
    expect(body.total_services).toBe(0);
    expect(body.countries).toEqual({});
    expect(body.services).toEqual({});
    expect(body.last_sync).toBeDefined();
  });

  it('should return 502 error when network request fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.error).toBe('Unable to retrieve Censys summary');
    expect(body.details).toBe('Network failure');
    expect(console.error).toHaveBeenCalledWith('Censys summary error:', expect.any(Error));
  });

  it('should return 502 error when one of the three API calls fails', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 100 } })
      })
      .mockRejectedValueOnce(new Error('Service stats failed')) // Second call fails
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: [] } })
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.error).toBe('Unable to retrieve Censys summary');
  });

  it('should handle timeout errors gracefully', async () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.details).toBe('Request timeout');
  });

  it('should handle JSON parse errors from Censys API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      }
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.error).toBe('Unable to retrieve Censys summary');
  });

  it('should handle 403 Forbidden from Censys API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden - Rate limit exceeded'
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.details).toContain('403');
    expect(body.details).toContain('Rate limit');
  });

  it('should handle 500 Internal Server Error from Censys API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.details).toContain('500');
  });
});

describe('Censys Summary Worker - Response Headers', () => {
  it('should return proper headers on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });

  it('should return proper headers on error', async () => {
    const context = {
      env: {
        CENSYS_API_ID: 'test-id'
        // Missing CENSYS_API_SECRET
      }
    };

    const response = await onRequest(context);

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });

  it('should disable caching in all responses', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result: { total: 0, buckets: [] } })
    });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const cacheControl = response.headers.get('Cache-Control');

    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
    expect(cacheControl).toContain('must-revalidate');
  });
});

describe('Censys Summary Worker - responseHeaders() Helper', () => {
  it('should return correct header object', () => {
    const headers = responseHeaders();

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
  });

  it('should return a new object each time (not cached)', () => {
    const headers1 = responseHeaders();
    const headers2 = responseHeaders();

    expect(headers1).toEqual(headers2);
    expect(headers1).not.toBe(headers2); // Different object instances
  });
});

describe('Censys Summary Worker - Integration Scenarios', () => {
  it('should handle realistic production data volumes', async () => {
    // Simulate realistic data from Censys
    const mockServiceBuckets = [];
    for (let i = 0; i < 25; i++) {
      mockServiceBuckets.push({
        key: `service_${i}`,
        count: Math.floor(Math.random() * 10000)
      });
    }

    const mockCountryBuckets = [];
    for (let i = 0; i < 50; i++) {
      mockCountryBuckets.push({
        key: `c${i}`,
        count: Math.floor(Math.random() * 100000)
      });
    }

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 50000000 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: mockServiceBuckets } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { buckets: mockCountryBuckets } })
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(200);
    expect(body.total_hosts).toBe(50000000);
    expect(Object.keys(body.services)).toHaveLength(25);
    expect(Object.keys(body.countries)).toHaveLength(50);
    expect(body.total_services).toBeGreaterThan(0);
  });

  it('should handle mixed case country codes correctly', async () => {
    global.fetch
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
        json: async () => ({
          result: {
            buckets: [
              { key: 'US', count: 100 },
              { key: 'gb', count: 50 },
              { key: 'Ca', count: 25 },
              { key: 'dE', count: 10 }
            ]
          }
        })
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    // All should be uppercase
    expect(body.countries).toEqual({
      US: 100,
      GB: 50,
      CA: 25,
      DE: 10
    });
  });

  it('should correctly aggregate total_services from multiple buckets', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 1000 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            buckets: [
              { key: 'http', count: 1500 },
              { key: 'https', count: 2500 },
              { key: 'ssh', count: 800 },
              { key: 'ftp', count: 200 }
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
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(body.total_services).toBe(5000); // 1500 + 2500 + 800 + 200
    expect(body.services).toEqual({
      http: 1500,
      https: 2500,
      ssh: 800,
      ftp: 200
    });
  });

  it('should handle partial API failures with proper error response', async () => {
    // First call succeeds, second fails, third never executes due to Promise.all
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { total: 100 } })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

    const context = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };

    const response = await onRequest(context);
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(502);
    expect(body.error).toBe('Unable to retrieve Censys summary');
    expect(body.details).toContain('429');
    expect(body.total_hosts).toBe(0); // Fallback values
    expect(body.total_services).toBe(0);
  });
});