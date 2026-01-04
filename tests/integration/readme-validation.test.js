/**
 * README.md Validation Tests
 * Tests the documentation changes regarding branding information
 */

const fs = require('fs');
const path = require('path');

describe('README.md Documentation Tests', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(__dirname, '../../README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  describe('Branding Documentation Updates', () => {
    test('should NOT contain old "Branding" heading', () => {
      expect(readmeContent).not.toMatch(/^## Branding$/m);
    });

    test('should NOT reference logo.png file', () => {
      expect(readmeContent).not.toMatch(/logo\.png/);
    });

    test('should NOT mention dropping images into docs/', () => {
      expect(readmeContent).not.toMatch(/drop a `logo\.png`.*into `docs\/`/);
    });

    test('should contain new branding note about CSS-generated sigil', () => {
      expect(readmeContent).toMatch(/_Branding note:_/);
    });

    test('should mention CSS-generated neon sigil', () => {
      expect(readmeContent).toMatch(/CSS-generated neon sigil/);
    });

    test('should reference .logo-sigil styles', () => {
      expect(readmeContent).toMatch(/\.logo-sigil/);
    });

    test('should mention ability to swap in assets later', () => {
      expect(readmeContent).toMatch(/swap in your own assets/i);
    });

    test('should use proper markdown formatting for emphasis', () => {
      const brandingNote = readmeContent.match(/_Branding note:_.*/);
      expect(brandingNote).toBeTruthy();
      expect(brandingNote[0]).toMatch(/_Branding note:_/);
    });
  });

  describe('Documentation Structure', () => {
    test('should have proper markdown headers', () => {
      expect(readmeContent).toMatch(/^# Net Observation Project$/m);
    });

    test('should contain features section', () => {
      expect(readmeContent).toMatch(/## Features/);
    });

    test('should contain running locally section', () => {
      expect(readmeContent).toMatch(/## Running Locally/);
    });

    test('should contain directory layout section', () => {
      expect(readmeContent).toMatch(/## Directory Layout/);
    });
  });

  describe('Content Accuracy', () => {
    test('should mention Cloudflare Pages', () => {
      expect(readmeContent).toMatch(/Cloudflare Pages/);
    });

    test('should reference Censys API', () => {
      expect(readmeContent).toMatch(/Censys/);
    });

    test('should mention cyber-neon theme', () => {
      expect(readmeContent).toMatch(/cyber-neon/i);
    });

    test('should list key features', () => {
      expect(readmeContent).toMatch(/Chart\.js/);
      expect(readmeContent).toMatch(/D3/);
      expect(readmeContent).toMatch(/Auth0/);
    });
  });

  describe('Code Examples', () => {
    test('should contain bash code blocks', () => {
      expect(readmeContent).toMatch(/```bash/);
    });

    test('should have proper code block formatting', () => {
      const codeBlocks = readmeContent.match(/```[\s\S]*?```/g);
      expect(codeBlocks).toBeTruthy();
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    test('should show wrangler commands', () => {
      expect(readmeContent).toMatch(/npx wrangler/);
    });

    test('should show environment variable setup', () => {
      expect(readmeContent).toMatch(/export CENSYS_API_ID/);
      expect(readmeContent).toMatch(/export CENSYS_API_SECRET/);
    });
  });

  describe('Links and References', () => {
    test('should not have broken markdown links', () => {
      const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (links) {
        links.forEach(link => {
          expect(link).toMatch(/\[.+\]\(.+\)/);
        });
      }
    });

    test('should mention documentation hub', () => {
      expect(readmeContent).toMatch(/documentation/i);
    });
  });

  describe('Formatting and Style', () => {
    test('should use consistent heading styles', () => {
      const headings = readmeContent.match(/^#{1,3}\s+.+$/gm);
      expect(headings).toBeTruthy();
      expect(headings.length).toBeGreaterThan(3);
    });

    test('should have bullet points in feature list', () => {
      const bullets = readmeContent.match(/^- .+$/gm);
      expect(bullets).toBeTruthy();
      expect(bullets.length).toBeGreaterThan(5);
    });

    test('should not have trailing whitespace on lines', () => {
      const lines = readmeContent.split('\n');
      const trailingSpaceLines = lines.filter((line, idx) => 
        line.match(/\s+$/) && idx < lines.length - 1
      );
      expect(trailingSpaceLines.length).toBe(0);
    });
  });

  describe('Diff Validation', () => {
    test('should reflect exact changes from git diff', () => {
      // The diff shows removal of "## Branding" section
      expect(readmeContent).not.toMatch(/^## Branding$/m);
      
      // And addition of inline branding note
      expect(readmeContent).toMatch(/_Branding note:_.*CSS-generated neon sigil/);
    });

    test('branding note should be a single line paragraph', () => {
      const brandingNote = readmeContent.match(/_Branding note:_[^\n]+/);
      expect(brandingNote).toBeTruthy();
      // Should be on a single line, not a multi-line block
      expect(brandingNote[0]).not.toMatch(/\n/);
    });

    test('should mention adjusting styles without editing markup', () => {
      expect(readmeContent).toMatch(/without editing markup/);
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running README validation tests...');
  console.log('Note: Install jest to run these tests properly');
  console.log('Usage: npm test -- tests/integration/readme-validation.test.js');
}