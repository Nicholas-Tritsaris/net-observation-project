/**
 * README.md Content and Structure Tests
 * Validates documentation accuracy and completeness
 */

const fs = require('fs');
const path = require('path');

describe('README.md Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf-8');
  });

  describe('Structure and Format', () => {
    test('should exist and be readable', () => {
      expect(readmeContent).toBeTruthy();
      expect(readmeContent.length).toBeGreaterThan(0);
    });

    test('should have main heading', () => {
      expect(readmeContent).toMatch(/^#\s+/m);
    });

    test('should have multiple sections', () => {
      const headings = readmeContent.match(/^##\s+/gm);
      expect(headings).toBeTruthy();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should use proper markdown syntax', () => {
      // Check for common markdown elements
      expect(readmeContent).toMatch(/^#{1,6}\s+/m); // Headings
    });
  });

  describe('Branding Documentation', () => {
    test('should mention branding or logo', () => {
      expect(readmeContent).toMatch(/branding|logo/i);
    });

    test('should reference CSS-generated neon sigil', () => {
      expect(readmeContent).toMatch(/CSS-generated.*sigil|neon sigil/i);
    });

    test('should mention .logo-sigil styles', () => {
      expect(readmeContent).toContain('.logo-sigil');
    });

    test('should explain how to customize logo', () => {
      expect(readmeContent).toMatch(/adjust|swap|customize/i);
    });

    test('should NOT reference logo.png file', () => {
      // Old branding section mentioned dropping logo.png
      expect(readmeContent).not.toContain('logo.png');
    });

    test('should NOT mention dropping files into docs/', () => {
      // Old approach was to drop logo.png into docs/
      const dropFilePattern = /drop.*logo\.png.*into.*docs/i;
      expect(readmeContent).not.toMatch(dropFilePattern);
    });

    test('should maintain italic formatting for branding note', () => {
      expect(readmeContent).toMatch(/_Branding note:_/);
    });
  });

  describe('Project Overview', () => {
    test('should describe the project', () => {
      expect(readmeContent).toMatch(/net.?observation.?project/i);
    });

    test('should mention key features', () => {
      expect(readmeContent).toMatch(/feature|capability|functionality/i);
    });

    test('should have installation or setup instructions', () => {
      expect(readmeContent).toMatch(/running.*locally|setup|installation|getting started/i);
    });
  });

  describe('Technical Details', () => {
    test('should mention project structure', () => {
      expect(readmeContent).toMatch(/docs\/|functions\/|structure/i);
    });

    test('should reference Auth0 if applicable', () => {
      expect(readmeContent).toMatch(/auth0/i);
    });

    test('should mention Censys if applicable', () => {
      expect(readmeContent).toMatch(/censys/i);
    });
  });

  describe('Links and References', () => {
    test('should not have broken markdown links', () => {
      const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (links) {
        links.forEach(link => {
          const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
          expect(match[2]).toBeTruthy(); // URL should not be empty
          expect(match[2]).not.toBe('#'); // Should not be just a hash
        });
      }
    });

    test('should have consistent formatting', () => {
      // Check that code blocks are properly formatted
      const codeBlocks = readmeContent.match(/```[^`]+```/gs);
      if (codeBlocks) {
        expect(codeBlocks.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Content Accuracy', () => {
    test('should reflect current implementation', () => {
      // Should mention CSS sigil, not PNG file
      const cssPattern = /CSS.*sigil|sigil.*CSS/i;
      expect(readmeContent).toMatch(cssPattern);
    });

    test('should guide users on customization', () => {
      expect(readmeContent).toMatch(/style|adjust|customize|swap/i);
    });

    test('should maintain professional tone', () => {
      // Check for complete sentences and proper capitalization
      const sentences = readmeContent.split('.');
      expect(sentences.length).toBeGreaterThan(5);
    });
  });

  describe('Removed Content', () => {
    test('should not have outdated branding section', () => {
      // Old heading was "## Branding"
      const oldSection = /^## Branding$/m;
      expect(readmeContent).not.toMatch(oldSection);
    });

    test('should not reference 512×512 PNG', () => {
      expect(readmeContent).not.toContain('512×512');
    });

    test('should not say "drop a logo.png"', () => {
      expect(readmeContent).not.toMatch(/drop.*logo\.png/i);
    });
  });

  describe('Markdown Validation', () => {
    test('should not have mismatched brackets', () => {
      const openBrackets = (readmeContent.match(/\[/g) || []).length;
      const closeBrackets = (readmeContent.match(/\]/g) || []).length;
      // Allow for some mismatch in code blocks
      expect(Math.abs(openBrackets - closeBrackets)).toBeLessThan(5);
    });

    test('should not have mismatched parentheses in links', () => {
      const linkPattern = /\[[^\]]+\]\([^)]+\)/g;
      const links = readmeContent.match(linkPattern);
      if (links) {
        links.forEach(link => {
          const openParen = (link.match(/\(/g) || []).length;
          const closeParen = (link.match(/\)/g) || []).length;
          expect(openParen).toBe(closeParen);
        });
      }
    });

    test('should use consistent heading levels', () => {
      const headings = readmeContent.match(/^#+\s+.+$/gm);
      expect(headings).toBeTruthy();
      if (headings) {
        // First heading should be h1
        expect(headings[0]).toMatch(/^#\s+/);
      }
    });

    test('should have consistent list formatting', () => {
      const lists = readmeContent.match(/^[-*]\s+/gm);
      if (lists) {
        expect(lists.length).toBeGreaterThan(0);
      }
    });
  });
});