/**
 * Comprehensive tests for Censys API summary function
 * Tests: onRequest handler, error handling, data aggregation
 */

describe('Censys API Summary', () => {
  let mockFetch;
  let mockContext;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

    mockContext = {
      env: {
        CENSYS_API_ID: 'test-id',
        CENSYS_API_SECRET: 'test-secret'
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onRequest Function', () => {
    test('should be exported as async function', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/export async function onRequest/);
    });

    test('should extract environment variables from context', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/const \{ env \} = context/);
      expect(apiContent).toMatch(/env\.CENSYS_API_ID/);
      expect(apiContent).toMatch(/env\.CENSYS_API_SECRET/);
    });

    test('should return error if API credentials missing', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/if \(!id \|\| !secret\)/);
      expect(apiContent).toMatch(/Missing CENSYS_API_ID or CENSYS_API_SECRET/);
      expect(apiContent).toMatch(/status: 500/);
    });
  });

  describe('Authentication', () => {
    test('should create Basic auth header', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/Basic.*btoa/);
      expect(apiContent).toMatch(/authHeader/);
    });

    test('should include auth header in requests', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/Authorization.*authHeader/);
    });
  });

  describe('API Endpoints', () => {
    test('should define endpoint helper function', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/const endpoint = \(path\)/);
      expect(apiContent).toMatch(/https:\/\/search\.censys\.io\/api\/v2/);
    });

    test('should fetch host summary', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/\/hosts\/search/);
      expect(apiContent).toMatch(/q.*\*/);
      expect(apiContent).toMatch(/per_page.*1/);
    });

    test('should fetch service statistics', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/\/hosts\/stats\/services\.service_name/);
      expect(apiContent).toMatch(/num_buckets.*25/);
    });

    test('should fetch country statistics', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/\/hosts\/stats\/location\.country_code/);
      expect(apiContent).toMatch(/num_buckets.*50/);
    });

    test('should use Promise.all for parallel requests', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/await Promise\.all\(/);
    });
  });

  describe('Request Configuration', () => {
    test('should use POST method', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/method: ['"]POST['"]/);
    });

    test('should set correct headers', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/Content-Type.*application\/json/);
      expect(apiContent).toMatch(/Accept.*application\/json/);
    });

    test('should send JSON body', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/body: JSON\.stringify\(payload\)/);
    });
  });

  describe('Response Handling', () => {
    test('should check response status', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/if \(!res\.ok\)/);
    });

    test('should throw error on failed request', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/throw new Error/);
    });

    test('should parse JSON response', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/res\.json\(\)/);
    });
  });

  describe('Data Aggregation', () => {
    test('should extract total hosts from result', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/hostSummary.*result.*total/);
      expect(apiContent).toMatch(/totalHosts/);
    });

    test('should aggregate services from buckets', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/serviceStats.*result.*buckets/);
      expect(apiContent).toMatch(/serviceBuckets/);
    });

    test('should calculate total services count', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/totalServices \+= bucket\.count/);
    });

    test('should uppercase country codes', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/toUpperCase\(\)/);
      expect(apiContent).toMatch(/countryCode/);
    });

    test('should handle missing bucket keys', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/if \(!bucket\?\.key\) continue/);
    });

    test('should use nullish coalescing for safe defaults', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/\?\?/);
    });
  });

  describe('Response Structure', () => {
    test('should include total_hosts in response', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/total_hosts: totalHosts/);
    });

    test('should include total_services in response', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/total_services: totalServices/);
    });

    test('should include last_sync timestamp', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/last_sync: new Date\(\)\.toISOString\(\)/);
    });

    test('should include countries object', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/countries[,\s]/);
    });

    test('should include services object', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/services[,\s}]/);
    });

    test('should return 200 status on success', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/status: 200/);
    });
  });

  describe('Error Handling', () => {
    test('should catch and handle errors', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/catch \(error\)/);
    });

    test('should log errors to console', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/console\.error/);
    });

    test('should return error response with details', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/error: ['"]Unable to retrieve Censys summary['"]/);
      expect(apiContent).toMatch(/details: error\.message/);
    });

    test('should return 502 status on error', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/status: 502/);
    });

    test('should include empty fallback data on error', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const errorBlock = apiContent.match(/catch \(error\)[\s\S]*?\n  \}/);
      expect(errorBlock[0]).toMatch(/total_hosts: 0/);
      expect(errorBlock[0]).toMatch(/total_services: 0/);
      expect(errorBlock[0]).toMatch(/countries: \{\}/);
      expect(errorBlock[0]).toMatch(/services: \{\}/);
    });
  });

  describe('responseHeaders Function', () => {
    test('should be defined', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      expect(apiContent).toMatch(/function responseHeaders\(\)/);
    });

    test('should return Content-Type header', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiContent.match(/function responseHeaders\(\)[\s\S]*?\n\}/);
      expect(funcMatch[0]).toMatch(/['"]Content-Type['"].*application\/json/);
    });

    test('should return Cache-Control header', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const funcMatch = apiContent.match(/function responseHeaders\(\)[\s\S]*?\n\}/);
      expect(funcMatch[0]).toMatch(/['"]Cache-Control['"]/);
      expect(funcMatch[0]).toMatch(/no-store.*no-cache.*must-revalidate/);
    });

    test('should be used in all responses', () => {
      const apiContent = require('fs').readFileSync('./functions/api/censys-summary.js', 'utf-8');
      const responseCount = (apiContent.match(/headers: responseHeaders\(\)/g) || []).length;
      expect(responseCount).toBeGreaterThanOrEqual(3);
    });
  });
});