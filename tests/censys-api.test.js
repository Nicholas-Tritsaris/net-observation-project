/**
 * Comprehensive tests for Censys API function in functions/api/censys-summary.js
 * Tests onRequest handler and responseHeaders helper
 */

const fs = require('fs');

describe('Censys API Function', () => {
  let apiContent;

  beforeAll(() => {
    apiContent = fs.readFileSync('./functions/api/censys-summary.js', 'utf-8');
  });

  describe('Function Structure', () => {
    test('should export async function onRequest', () => {
      expect(apiContent).toMatch(/export\s+async\s+function\s+onRequest/);
    });

    test('should have comprehensive JSDoc for onRequest', () => {
      const jsdocMatch = apiContent.match(/\/\*\*[\s\S]*?@param \{object\} context[\s\S]*?@returns \{Response\}[\s\S]*?\*\/\s*export async function onRequest/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should document expected environment variables', () => {
      const jsdocMatch = apiContent.match(/\/\*\*[\s\S]*?CENSYS_API_ID[\s\S]*?CENSYS_API_SECRET[\s\S]*?\*\//);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should document success response shape', () => {
      const jsdocMatch = apiContent.match(/\/\*\*[\s\S]*?total_hosts[\s\S]*?total_services[\s\S]*?last_sync[\s\S]*?countries[\s\S]*?services[\s\S]*?\*\//);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should document error response shape', () => {
      const jsdocMatch = apiContent.match(/\/\*\*[\s\S]*?error[\s\S]*?details[\s\S]*?\*\//);
      expect(jsdocMatch).not.toBeNull();
    });
  });

  describe('Environment Variable Validation', () => {
    test('should extract id and secret from context.env', () => {
      expect(apiContent).toMatch(/const\s+\{\s*env\s*\}\s*=\s*context/);
      expect(apiContent).toMatch(/const\s+id\s*=\s*env\.CENSYS_API_ID/);
      expect(apiContent).toMatch(/const\s+secret\s*=\s*env\.CENSYS_API_SECRET/);
    });

    test('should check for missing credentials', () => {
      expect(apiContent).toMatch(/if\s*\(\s*!id\s*\|\|\s*!secret\s*\)/);
    });

    test('should return 500 error for missing credentials', () => {
      const errorBlock = apiContent.match(/if\s*\(\s*!id\s*\|\|\s*!secret\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(errorBlock).not.toBeNull();
      expect(errorBlock[0]).toMatch(/status:\s*500/);
    });

    test('should return JSON error message for missing credentials', () => {
      const errorBlock = apiContent.match(/if\s*\(\s*!id\s*\|\|\s*!secret\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(errorBlock).not.toBeNull();
      expect(errorBlock[0]).toMatch(/error:\s*['"]Missing CENSYS_API_ID or CENSYS_API_SECRET/);
    });
  });

  describe('Authentication', () => {
    test('should create Basic auth header with btoa', () => {
      expect(apiContent).toMatch(/const\s+authHeader\s*=\s*`Basic\s+\$\{btoa\(`\$\{id\}:\$\{secret\}`\)\}`/);
    });

    test('should define endpoint helper function', () => {
      expect(apiContent).toMatch(/const\s+endpoint\s*=\s*\(path\)\s*=>/);
      expect(apiContent).toMatch(/https:\/\/search\.censys\.io\/api\/v2/);
    });
  });

  describe('Censys API Requests', () => {
    test('should define fetchJSON helper function', () => {
      expect(apiContent).toMatch(/const\s+fetchJSON\s*=\s*async\s*\(path,\s*payload\)\s*=>/);
    });

    test('should use POST method for requests', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/method:\s*['"]POST['"]/);
    });

    test('should include Authorization header', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/['"]Authorization['"]\s*:\s*authHeader/);
    });

    test('should set Content-Type to application/json', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/['"]Content-Type['"]\s*:\s*['"]application\/json['"]/);
    });

    test('should set Accept header to application/json', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/['"]Accept['"]\s*:\s*['"]application\/json['"]/);
    });

    test('should stringify payload in request body', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/body:\s*JSON\.stringify\(payload\)/);
    });

    test('should check response.ok and throw on failure', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/if\s*\(\s*!res\.ok\s*\)/);
      expect(fetchBlock[0]).toMatch(/throw new Error/);
    });

    test('should include response status in error', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/Censys.*failed.*res\.status/);
    });

    test('should return parsed JSON on success', () => {
      const fetchBlock = apiContent.match(/const\s+fetchJSON[\s\S]*?(?=\n\s+try\s*\{)/);
      expect(fetchBlock).not.toBeNull();
      expect(fetchBlock[0]).toMatch(/return\s+res\.json\(\)/);
    });
  });

  describe('Parallel API Calls', () => {
    test('should use Promise.all for parallel requests', () => {
      expect(apiContent).toMatch(/await\s+Promise\.all\(\[/);
    });

    test('should fetch host summary with wildcard query', () => {
      expect(apiContent).toMatch(/fetchJSON\(['"]\/hosts\/search['"]/);
      expect(apiContent).toMatch(/q:\s*['"]\*['"]/);
    });

    test('should limit host search to 1 result', () => {
      const hostSearchMatch = apiContent.match(/fetchJSON\(['"]\/hosts\/search['"],[\s\S]*?\)/);
      expect(hostSearchMatch).not.toBeNull();
      expect(hostSearchMatch[0]).toMatch(/per_page:\s*1/);
    });

    test('should exclude virtual hosts from search', () => {
      const hostSearchMatch = apiContent.match(/fetchJSON\(['"]\/hosts\/search['"],[\s\S]*?\)/);
      expect(hostSearchMatch).not.toBeNull();
      expect(hostSearchMatch[0]).toMatch(/virtual_hosts:\s*['"]EXCLUDE['"]/);
    });

    test('should fetch service stats with service_name field', () => {
      expect(apiContent).toMatch(/fetchJSON\(['"]\/hosts\/stats\/services\.service_name['"]/);
    });

    test('should request 25 service buckets', () => {
      const serviceStatsMatch = apiContent.match(/fetchJSON\(['"]\/hosts\/stats\/services\.service_name['"],[\s\S]*?\)/);
      expect(serviceStatsMatch).not.toBeNull();
      expect(serviceStatsMatch[0]).toMatch(/num_buckets:\s*25/);
    });

    test('should fetch country stats with country_code field', () => {
      expect(apiContent).toMatch(/fetchJSON\(['"]\/hosts\/stats\/location\.country_code['"]/);
    });

    test('should request 50 country buckets', () => {
      const countryStatsMatch = apiContent.match(/fetchJSON\(['"]\/hosts\/stats\/location\.country_code['"],[\s\S]*?\)/);
      expect(countryStatsMatch).not.toBeNull();
      expect(countryStatsMatch[0]).toMatch(/num_buckets:\s*50/);
    });

    test('should destructure results into named variables', () => {
      expect(apiContent).toMatch(/const\s+\[\s*hostSummary,\s*serviceStats,\s*countryStats\s*\]\s*=\s*await\s+Promise\.all/);
    });
  });

  describe('Data Processing', () => {
    test('should extract total hosts with null coalescing', () => {
      expect(apiContent).toMatch(/const\s+totalHosts\s*=\s*hostSummary\?\.result\?\.total\s*\?\?\s*0/);
    });

    test('should initialize services object', () => {
      expect(apiContent).toMatch(/const\s+services\s*=\s*\{\}/);
    });

    test('should initialize totalServices counter', () => {
      expect(apiContent).toMatch(/let\s+totalServices\s*=\s*0/);
    });

    test('should iterate over service buckets', () => {
      expect(apiContent).toMatch(/const\s+serviceBuckets\s*=\s*serviceStats\?\.result\?\.buckets\s*\?\?\s*\[\]/);
      expect(apiContent).toMatch(/for\s*\(\s*const\s+bucket\s+of\s+serviceBuckets\s*\)/);
    });

    test('should skip buckets without key', () => {
      const serviceLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+serviceBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(serviceLoop).not.toBeNull();
      expect(serviceLoop[0]).toMatch(/if\s*\(\s*!bucket\?\.key\s*\)\s*continue/);
    });

    test('should map service name to count', () => {
      const serviceLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+serviceBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(serviceLoop).not.toBeNull();
      expect(serviceLoop[0]).toMatch(/services\[bucket\.key\]\s*=\s*bucket\.count/);
    });

    test('should accumulate total service count', () => {
      const serviceLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+serviceBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(serviceLoop).not.toBeNull();
      expect(serviceLoop[0]).toMatch(/totalServices\s*\+=\s*bucket\.count/);
    });

    test('should initialize countries object', () => {
      expect(apiContent).toMatch(/const\s+countries\s*=\s*\{\}/);
    });

    test('should iterate over country buckets', () => {
      expect(apiContent).toMatch(/const\s+countryBuckets\s*=\s*countryStats\?\.result\?\.buckets\s*\?\?\s*\[\]/);
      expect(apiContent).toMatch(/for\s*\(\s*const\s+bucket\s+of\s+countryBuckets\s*\)/);
    });

    test('should skip country buckets without key', () => {
      const countryLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+countryBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(countryLoop).not.toBeNull();
      expect(countryLoop[0]).toMatch(/if\s*\(\s*!bucket\?\.key\s*\)\s*continue/);
    });

    test('should uppercase country codes', () => {
      const countryLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+countryBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(countryLoop).not.toBeNull();
      expect(countryLoop[0]).toMatch(/const\s+countryCode\s*=\s*bucket\.key\.toUpperCase\(\)/);
    });

    test('should map country code to count', () => {
      const countryLoop = apiContent.match(/for\s*\(\s*const\s+bucket\s+of\s+countryBuckets\s*\)\s*\{[\s\S]*?\n\s+\}/);
      expect(countryLoop).not.toBeNull();
      expect(countryLoop[0]).toMatch(/countries\[countryCode\]\s*=\s*bucket\.count/);
    });
  });

  describe('Success Response', () => {
    test('should create response object with all required fields', () => {
      const responseMatch = apiContent.match(/const\s+response\s*=\s*\{[\s\S]*?\}/);
      expect(responseMatch).not.toBeNull();
      expect(responseMatch[0]).toMatch(/total_hosts:\s*totalHosts/);
      expect(responseMatch[0]).toMatch(/total_services:\s*totalServices/);
      expect(responseMatch[0]).toMatch(/last_sync:\s*new Date\(\)\.toISOString\(\)/);
      expect(responseMatch[0]).toMatch(/countries/);
      expect(responseMatch[0]).toMatch(/services/);
    });

    test('should return Response with 200 status', () => {
      const successReturn = apiContent.match(/return\s+new\s+Response\(JSON\.stringify\(response\),[\s\S]*?status:\s*200/);
      expect(successReturn).not.toBeNull();
    });

    test('should stringify response as JSON', () => {
      const successReturn = apiContent.match(/return\s+new\s+Response\(JSON\.stringify\(response\)/);
      expect(successReturn).not.toBeNull();
    });

    test('should include response headers in success', () => {
      const successReturn = apiContent.match(/return\s+new\s+Response[\s\S]*?headers:\s*responseHeaders\(\)/);
      expect(successReturn).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should have try-catch block', () => {
      expect(apiContent).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(error\)/);
    });

    test('should log error to console', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/console\.error\(['"]Censys summary error['"]/);
    });

    test('should return 502 status for API errors', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/status:\s*502/);
    });

    test('should include error message in response', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/error:\s*['"]Unable to retrieve Censys summary['"]/);
      expect(catchBlock[0]).toMatch(/details:\s*error\.message/);
    });

    test('should return zero values on error', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/total_hosts:\s*0/);
      expect(catchBlock[0]).toMatch(/total_services:\s*0/);
    });

    test('should return empty objects for countries and services on error', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/countries:\s*\{\}/);
      expect(catchBlock[0]).toMatch(/services:\s*\{\}/);
    });

    test('should include timestamp in error response', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/last_sync:\s*new Date\(\)\.toISOString\(\)/);
    });

    test('should include response headers in error', () => {
      const catchBlock = apiContent.match(/catch\s*\(error\)\s*\{[\s\S]*?\n\s+\}/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[0]).toMatch(/headers:\s*responseHeaders\(\)/);
    });
  });

  describe('responseHeaders Helper', () => {
    test('should be defined as a function', () => {
      expect(apiContent).toMatch(/function\s+responseHeaders\(\)/);
    });

    test('should have JSDoc documentation', () => {
      const jsdocMatch = apiContent.match(/\/\*\*[\s\S]*?@returns[\s\S]*?Content-Type[\s\S]*?Cache-Control[\s\S]*?\*\/\s*function responseHeaders/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should return object with Content-Type', () => {
      const funcMatch = apiContent.match(/function\s+responseHeaders[\s\S]*?\n\}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/['"]Content-Type['"]\s*:\s*['"]application\/json['"]/);
    });

    test('should set Cache-Control to prevent caching', () => {
      const funcMatch = apiContent.match(/function\s+responseHeaders[\s\S]*?\n\}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/['"]Cache-Control['"]\s*:\s*['"]no-store,\s*no-cache,\s*must-revalidate['"]/);
    });

    test('should return object literal', () => {
      const funcMatch = apiContent.match(/function\s+responseHeaders[\s\S]*?\n\}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/return\s+\{/);
    });
  });

  describe('Code Quality', () => {
    test('should not have trailing whitespace issues', () => {
      const lines = apiContent.split('\n');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toMatch(/\}$/);
    });

    test('should use ES6 module syntax', () => {
      expect(apiContent).toMatch(/export\s+async\s+function/);
    });

    test('should use const for immutable variables', () => {
      expect(apiContent).toMatch(/const\s+\{\s*env\s*\}/);
      expect(apiContent).toMatch(/const\s+id\s*=/);
      expect(apiContent).toMatch(/const\s+secret\s*=/);
    });

    test('should use optional chaining for safe property access', () => {
      expect(apiContent).toMatch(/\?\./);
    });

    test('should use nullish coalescing for default values', () => {
      expect(apiContent).toMatch(/\?\?/);
    });

    test('should use template literals for strings', () => {
      expect(apiContent).toMatch(/`.*\$\{.*\}`/);
    });

    test('should use arrow functions for helpers', () => {
      expect(apiContent).toMatch(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/);
    });
  });
});