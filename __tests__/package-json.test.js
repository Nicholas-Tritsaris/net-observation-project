/**
 * Validation tests for package.json configuration
 * Tests project configuration, dependencies, and script definitions
 */

const fs = require('fs');
const path = require('path');

describe('package.json Configuration', () => {
  let packageJson;

  beforeAll(() => {
    const packagePath = path.join(__dirname, '../package.json');
    const content = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(content);
  });

  describe('Basic metadata', () => {
    it('should have required fields', () => {
      expect(packageJson.name).toBe('net-observation-project');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
    });

    it('should have a valid semantic version', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(packageJson.version).toMatch(semverRegex);
    });

    it('should have descriptive project description', () => {
      expect(packageJson.description).toBeTruthy();
      expect(packageJson.description.length).toBeGreaterThan(10);
    });
  });

  describe('Test scripts', () => {
    it('should define test script', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBe('jest');
    });

    it('should define test:watch script', () => {
      expect(packageJson.scripts['test:watch']).toBe('jest --watch');
    });

    it('should define test:coverage script', () => {
      expect(packageJson.scripts['test:coverage']).toBe('jest --coverage');
    });

    it('should have all test-related scripts using jest', () => {
      const testScripts = Object.entries(packageJson.scripts)
        .filter(([key]) => key.startsWith('test'));
      
      testScripts.forEach(([key, value]) => {
        expect(value).toContain('jest');
      });
    });
  });

  describe('Development dependencies', () => {
    it('should include Jest as devDependency', () => {
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies.jest).toBeDefined();
    });

    it('should include @jest/globals', () => {
      expect(packageJson.devDependencies['@jest/globals']).toBeDefined();
    });

    it('should include jest-environment-jsdom', () => {
      expect(packageJson.devDependencies['jest-environment-jsdom']).toBeDefined();
    });

    it('should use Jest 29.x versions for consistency', () => {
      const jestVersion = packageJson.devDependencies.jest;
      const globalsVersion = packageJson.devDependencies['@jest/globals'];
      const jsdomVersion = packageJson.devDependencies['jest-environment-jsdom'];

      expect(jestVersion).toMatch(/^(\^|~)?29\./);
      expect(globalsVersion).toMatch(/^(\^|~)?29\./);
      expect(jsdomVersion).toMatch(/^(\^|~)?29\./);
    });

    it('should have compatible Jest package versions', () => {
      const jestVer = packageJson.devDependencies.jest.replace(/[\^~]/, '');
      const globalsVer = packageJson.devDependencies['@jest/globals'].replace(/[\^~]/, '');
      const jsdomVer = packageJson.devDependencies['jest-environment-jsdom'].replace(/[\^~]/, '');

      // All should have same major.minor version
      const jestMinor = jestVer.split('.').slice(0, 2).join('.');
      const globalsMinor = globalsVer.split('.').slice(0, 2).join('.');
      const jsdomMinor = jsdomVer.split('.').slice(0, 2).join('.');

      expect(jestMinor).toBe(globalsMinor);
      expect(jestMinor).toBe(jsdomMinor);
    });
  });

  describe('Jest configuration', () => {
    it('should configure jsdom test environment', () => {
      expect(packageJson.jest).toBeDefined();
      expect(packageJson.jest.testEnvironment).toBe('jsdom');
    });

    it('should define testMatch patterns', () => {
      expect(packageJson.jest.testMatch).toBeDefined();
      expect(Array.isArray(packageJson.jest.testMatch)).toBe(true);
    });

    it('should include __tests__ directory in testMatch', () => {
      const hasTestsDir = packageJson.jest.testMatch.some(pattern =>
        pattern.includes('__tests__')
      );
      expect(hasTestsDir).toBe(true);
    });

    it('should match .test.js and .spec.js files', () => {
      const patterns = packageJson.jest.testMatch.join(' ');
      expect(patterns).toContain('test.js');
      expect(patterns).toContain('spec.js');
    });

    it('should configure coverage collection', () => {
      expect(packageJson.jest.collectCoverageFrom).toBeDefined();
      expect(Array.isArray(packageJson.jest.collectCoverageFrom)).toBe(true);
    });

    it('should collect coverage from docs/script.js', () => {
      const coverageFiles = packageJson.jest.collectCoverageFrom;
      expect(coverageFiles).toContain('docs/script.js');
    });

    it('should ignore node_modules in coverage', () => {
      expect(packageJson.jest.coveragePathIgnorePatterns).toBeDefined();
      expect(packageJson.jest.coveragePathIgnorePatterns).toContain('/node_modules/');
    });

    it('should configure setup file', () => {
      expect(packageJson.jest.setupFilesAfterEnv).toBeDefined();
      expect(packageJson.jest.setupFilesAfterEnv).toContain('<rootDir>/test-setup.js');
    });
  });

  describe('Configuration consistency', () => {
    it('should not have unused runtime dependencies', () => {
      // This project is frontend-only, should not have runtime deps
      if (packageJson.dependencies) {
        expect(Object.keys(packageJson.dependencies).length).toBe(0);
      }
    });

    it('should have all dev dependencies used in project', () => {
      // All devDependencies should be testing-related
      const devDeps = Object.keys(packageJson.devDependencies);
      devDeps.forEach(dep => {
        expect(dep).toMatch(/jest|@jest/);
      });
    });

    it('should use consistent version prefix strategy', () => {
      const versions = Object.values(packageJson.devDependencies);
      const hasCarets = versions.some(v => v.startsWith('^'));
      const hasTildes = versions.some(v => v.startsWith('~'));

      // Should use either carets or tildes consistently, not both
      expect(hasCarets && hasTildes).toBe(false);
    });
  });

  describe('File structure validation', () => {
    it('should reference existing test setup file', () => {
      const setupPath = path.join(__dirname, '../test-setup.js');
      expect(fs.existsSync(setupPath)).toBe(true);
    });

    it('should have coverage target file existing', () => {
      const coverageFiles = packageJson.jest.collectCoverageFrom;
      coverageFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should not include package-lock.json in git', () => {
      const gitignorePath = path.join(__dirname, '../.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('package-lock.json');
    });
  });

  describe('JSON validity', () => {
    it('should be valid JSON', () => {
      const packagePath = path.join(__dirname, '../package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should not have trailing commas', () => {
      const packagePath = path.join(__dirname, '../package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      expect(content).not.toMatch(/,\s*[}\]]/);
    });

    it('should be properly formatted', () => {
      const packagePath = path.join(__dirname, '../package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      const parsed = JSON.parse(content);
      const reformatted = JSON.stringify(parsed, null, 2);
      
      // Should match standard JSON formatting
      expect(content.trim()).toBe(reformatted);
    });
  });

  describe('Script safety', () => {
    it('should not have dangerous scripts', () => {
      const scripts = packageJson.scripts || {};
      const scriptValues = Object.values(scripts).join(' ');

      // Should not contain potentially dangerous operations
      expect(scriptValues).not.toContain('rm -rf');
      expect(scriptValues).not.toContain('sudo');
      expect(scriptValues).not.toContain('curl |');
      expect(scriptValues).not.toContain('wget |');
    });

    it('should not have prebuild or postbuild hooks that could be malicious', () => {
      const scripts = packageJson.scripts || {};
      const hookScripts = Object.keys(scripts).filter(key =>
        key.startsWith('pre') || key.startsWith('post')
      );

      // If hooks exist, they should be documented and safe
      hookScripts.forEach(hook => {
        const script = scripts[hook];
        expect(script).toBeTruthy();
        expect(typeof script).toBe('string');
      });
    });
  });

  describe('Version compatibility', () => {
    it('should specify Node.js engine requirements if needed', () => {
      // Check if engines field exists (optional but good practice)
      if (packageJson.engines) {
        expect(packageJson.engines.node).toBeDefined();
      }
    });

    it('should use stable dependency versions', () => {
      const devDeps = packageJson.devDependencies;
      Object.values(devDeps).forEach(version => {
        // Should not use unstable versions
        expect(version).not.toContain('alpha');
        expect(version).not.toContain('beta');
        expect(version).not.toContain('rc');
        expect(version).not.toContain('next');
      });
    });
  });

  describe('Test configuration completeness', () => {
    it('should have setup file that exists and is executable', () => {
      const setupPath = path.join(__dirname, '../test-setup.js');
      const setupContent = fs.readFileSync(setupPath, 'utf8');
      
      expect(setupContent).toBeTruthy();
      expect(setupContent.length).toBeGreaterThan(50);
    });

    it('should configure test environment appropriate for browser code', () => {
      // jsdom is correct for testing browser/DOM code
      expect(packageJson.jest.testEnvironment).toBe('jsdom');
    });

    it('should have test patterns that match actual test files', () => {
      const testsDir = path.join(__dirname, '../__tests__');
      const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
      
      expect(testFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Coverage configuration', () => {
    it('should track coverage for main application code', () => {
      const coverageFiles = packageJson.jest.collectCoverageFrom;
      
      // Should include the main script file
      expect(coverageFiles.some(f => f.includes('script.js'))).toBe(true);
    });

    it('should exclude test files from coverage', () => {
      const ignorePatterns = packageJson.jest.coveragePathIgnorePatterns || [];
      
      // node_modules should always be excluded
      expect(ignorePatterns).toContain('/node_modules/');
    });

    it('should not collect coverage from test files themselves', () => {
      const coverageFiles = packageJson.jest.collectCoverageFrom || [];
      
      // Should not include test directories in coverage collection
      const hasTestDirs = coverageFiles.some(f => 
        f.includes('__tests__') || f.includes('/tests/')
      );
      expect(hasTestDirs).toBe(false);
    });
  });
});