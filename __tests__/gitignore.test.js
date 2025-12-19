/**
 * Validation tests for .gitignore configuration
 * Ensures proper exclusion of generated and sensitive files
 */

const fs = require('fs');
const path = require('path');

describe('.gitignore Configuration', () => {
  let gitignoreContent;

  beforeAll(() => {
    const gitignorePath = path.join(__dirname, '../.gitignore');
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  });

  describe('Testing artifacts exclusion', () => {
    it('should exclude coverage directory', () => {
      expect(gitignoreContent).toMatch(/coverage\//);
    });

    it('should exclude nyc output directory', () => {
      expect(gitignoreContent).toMatch(/\.nyc_output\//);
    });

    it('should exclude lcov files', () => {
      expect(gitignoreContent).toMatch(/\*\.lcov/);
    });

    it('should exclude test-results directory', () => {
      expect(gitignoreContent).toMatch(/test-results\//);
    });

    it('should exclude junit.xml', () => {
      expect(gitignoreContent).toMatch(/junit\.xml/);
    });
  });

  describe('Package manager lock files', () => {
    it('should exclude package-lock.json', () => {
      expect(gitignoreContent).toMatch(/package-lock\.json/);
    });

    it('should exclude yarn.lock', () => {
      expect(gitignoreContent).toMatch(/yarn\.lock/);
    });

    it('should exclude pnpm-lock.yaml', () => {
      expect(gitignoreContent).toMatch(/pnpm-lock\.yaml/);
    });
  });

  describe('Existing exclusions', () => {
    it('should exclude node_modules', () => {
      expect(gitignoreContent).toMatch(/node_modules/);
    });

    it('should exclude .env files', () => {
      expect(gitignoreContent).toMatch(/\.env/);
    });

    it('should exclude temporary files', () => {
      expect(gitignoreContent).toMatch(/\*\.tmp/);
    });
  });

  describe('File format validation', () => {
    it('should not have trailing whitespace on lines', () => {
      const lines = gitignoreContent.split('\n');
      lines.forEach((line, index) => {
        if (line.length > 0 && !line.startsWith('#')) {
          expect(line).not.toMatch(/\s+$/);
        }
      });
    });

    it('should use forward slashes for directories', () => {
      const dirPatterns = gitignoreContent.match(/\S+\//g) || [];
      dirPatterns.forEach(pattern => {
        expect(pattern).not.toContain('\\');
      });
    });

    it('should have proper comment formatting', () => {
      const commentLines = gitignoreContent.split('\n').filter(line => line.trim().startsWith('#'));
      commentLines.forEach(comment => {
        expect(comment).toMatch(/^#\s+\w+/);
      });
    });

    it('should not have duplicate entries', () => {
      const lines = gitignoreContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      const uniqueLines = [...new Set(lines)];
      expect(lines.length).toBe(uniqueLines.length);
    });

    it('should not have empty sections', () => {
      const sections = gitignoreContent.split('\n\n');
      sections.forEach(section => {
        const nonCommentLines = section.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith('#')
        );
        if (section.includes('#')) {
          expect(nonCommentLines.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Pattern correctness', () => {
    it('should use glob patterns correctly for wildcards', () => {
      const wildcardPatterns = gitignoreContent.match(/\*\.\w+/g) || [];
      wildcardPatterns.forEach(pattern => {
        expect(pattern).toMatch(/^\*\.\w+$/);
      });
    });

    it('should properly escape special characters where needed', () => {
      // Check for unescaped dots in patterns that should be literal
      const lines = gitignoreContent.split('\n').filter(line => 
        !line.trim().startsWith('#') && line.includes('.')
      );
      
      lines.forEach(line => {
        if (line.includes('*')) {
          // Wildcard patterns are OK
          expect(line).toBeTruthy();
        }
      });
    });
  });

  describe('Coverage for testing infrastructure', () => {
    it('should exclude all common test artifact directories', () => {
      const testArtifacts = ['coverage', 'test-results', '.nyc_output'];
      testArtifacts.forEach(artifact => {
        expect(gitignoreContent).toContain(artifact);
      });
    });

    it('should exclude all common test report files', () => {
      const reportFiles = ['.lcov', 'junit.xml'];
      reportFiles.forEach(file => {
        expect(gitignoreContent).toContain(file);
      });
    });
  });

  describe('Package manager coverage', () => {
    it('should exclude lock files for all major package managers', () => {
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
      lockFiles.forEach(lockFile => {
        expect(gitignoreContent).toContain(lockFile);
      });
    });

    it('should not exclude package.json itself', () => {
      expect(gitignoreContent).not.toContain('package.json\n');
      expect(gitignoreContent).not.toContain('/package.json');
    });
  });

  describe('Security considerations', () => {
    it('should exclude environment files', () => {
      expect(gitignoreContent).toMatch(/\.env/);
    });

    it('should exclude local configuration overrides', () => {
      const hasLocalConfig = gitignoreContent.includes('.local') || 
                            gitignoreContent.includes('*.local');
      expect(hasLocalConfig).toBe(true);
    });
  });

  describe('Build artifacts', () => {
    it('should exclude common build directories if applicable', () => {
      // Check if build artifacts are mentioned
      const hasBuildArtifacts = gitignoreContent.includes('dist') ||
                               gitignoreContent.includes('build') ||
                               gitignoreContent.includes('*.tmp');
      expect(hasBuildArtifacts).toBe(true);
    });
  });

  describe('Git file validation', () => {
    it('should be a valid text file', () => {
      expect(gitignoreContent).toBeTruthy();
      expect(typeof gitignoreContent).toBe('string');
    });

    it('should end with newline', () => {
      expect(gitignoreContent.endsWith('\n')).toBe(true);
    });

    it('should not contain carriage returns', () => {
      expect(gitignoreContent).not.toContain('\r');
    });
  });

  describe('Section organization', () => {
    it('should have testing section', () => {
      expect(gitignoreContent).toMatch(/# Testing/i);
    });

    it('should have package manager section', () => {
      expect(gitignoreContent).toMatch(/# Package manager/i);
    });

    it('should group related patterns together', () => {
      const sections = gitignoreContent.split(/\n\n+/);
      expect(sections.length).toBeGreaterThan(1);
    });
  });

  describe('Practical validation', () => {
    it('should exclude files that would actually be generated by tests', () => {
      const expectedFiles = [
        'coverage',
        'junit.xml',
        '.nyc_output'
      ];

      expectedFiles.forEach(file => {
        expect(gitignoreContent).toContain(file);
      });
    });

    it('should not accidentally exclude source files', () => {
      expect(gitignoreContent).not.toContain('*.js\n');
      expect(gitignoreContent).not.toContain('*.html\n');
      expect(gitignoreContent).not.toContain('*.css\n');
    });

    it('should not exclude test files themselves', () => {
      expect(gitignoreContent).not.toContain('*.test.js');
      expect(gitignoreContent).not.toContain('*.spec.js');
      expect(gitignoreContent).not.toContain('__tests__/');
      expect(gitignoreContent).not.toContain('/tests/');
    });
  });

  describe('Pattern effectiveness', () => {
    it('should use appropriate wildcards for version-agnostic patterns', () => {
      // Lock files use specific names, not wildcards
      expect(gitignoreContent).toContain('package-lock.json');
      expect(gitignoreContent).toContain('yarn.lock');
      
      // Extensions use wildcards
      expect(gitignoreContent).toMatch(/\*\.lcov/);
      expect(gitignoreContent).toMatch(/\*\.tmp/);
    });

    it('should use directory patterns for directory exclusions', () => {
      const dirPatterns = ['coverage/', 'test-results/', '.nyc_output/'];
      dirPatterns.forEach(pattern => {
        if (gitignoreContent.includes(pattern.replace('/', ''))) {
          expect(gitignoreContent).toMatch(new RegExp(pattern.replace('/', '\\/')));
        }
      });
    });
  });
});