/**
 * README.md Validation Tests
 * Testing changes: Updated branding documentation
 */

const fs = require('fs');
const path = require('path');

describe('README.md - Content Validation', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');
  });

  test('should exist and be readable', () => {
    expect(readmeContent).toBeTruthy();
    expect(readmeContent.length).toBeGreaterThan(0);
  });

  test('should have main title', () => {
    expect(readmeContent).toMatch(/^#\s+Net Observation Project/m);
  });

  test('should have updated branding note', () => {
    expect(readmeContent).toContain('_Branding note:_');
  });

  test('should mention CSS-generated neon sigil', () => {
    expect(readmeContent).toContain('CSS-generated neon sigil');
  });

  test('should reference .logo-sigil styles', () => {
    expect(readmeContent).toContain('.logo-sigil');
  });

  test('should NOT reference old logo.png approach', () => {
    expect(readmeContent).not.toContain('logo.png');
    expect(readmeContent).not.toContain('512×512');
  });

  test('should NOT have old "## Branding" header', () => {
    expect(readmeContent).not.toMatch(/^##\s+Branding$/m);
  });

  test('should mention dropping in real imagery later', () => {
    expect(readmeContent).toContain('drop in real imagery later');
  });
});

describe('README.md - Structure', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');
  });

  test('should have proper markdown headers hierarchy', () => {
    const headers = readmeContent.match(/^#{1,6}\s+.+$/gm);
    expect(headers).toBeTruthy();
    expect(headers.length).toBeGreaterThan(0);
  });

  test('should have "Running Locally" section', () => {
    expect(readmeContent).toMatch(/^##\s+Running Locally/m);
  });

  test('should have project structure section', () => {
    expect(readmeContent).toContain('net-observation-project/');
  });

  test('should describe features', () => {
    expect(readmeContent).toContain('Optional Auth0 login');
    expect(readmeContent).toContain('Versions hub');
  });
});

describe('README.md - Markdown Syntax', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');
  });

  test('should have balanced markdown formatting', () => {
    // Count bold markers
    const boldMarkers = (readmeContent.match(/\*\*/g) || []).length;
    expect(boldMarkers % 2).toBe(0);

    // Count italic markers (excluding bold)
    const italicMarkers = (readmeContent.match(/(?<!\*)\*(?!\*)/g) || []).length;
    expect(italicMarkers % 2).toBe(0);
  });

  test('should have proper code block formatting', () => {
    const codeBlocks = readmeContent.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      expect(codeBlocks.length).toBeGreaterThan(0);
    }
  });

  test('should not have trailing whitespace on lines', () => {
    const lines = readmeContent.split('\n');
    const trailingWhitespace = lines.filter(line => line.match(/\s+$/));
    expect(trailingWhitespace.length).toBe(0);
  });

  test('should have consistent list formatting', () => {
    const listItems = readmeContent.match(/^[-*]\s+/gm);
    if (listItems) {
      // All list items should use the same marker (- or *)
      const markers = listItems.map(item => item.trim()[0]);
      const uniqueMarkers = [...new Set(markers)];
      expect(uniqueMarkers.length).toBeLessThanOrEqual(1);
    }
  });
});

describe('README.md - Links Validation', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');
  });

  test('markdown links should have proper format', () => {
    const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (links) {
      links.forEach(link => {
        expect(link).toMatch(/\[.+\]\(.+\)/);
      });
    }
  });

  test('should not have broken reference-style links', () => {
    const refLinks = readmeContent.match(/\[([^\]]+)\]\[([^\]]*)\]/g);
    if (refLinks) {
      refLinks.forEach(refLink => {
        const refId = refLink.match(/\]\[([^\]]*)\]/)[1];
        const refDefinition = new RegExp(`^\\[${refId}\\]:\\s+`, 'm');
        expect(readmeContent).toMatch(refDefinition);
      });
    }
  });
});

describe('README.md - Branding Documentation Accuracy', () => {
  let readmeContent;
  let cssContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');
    cssContent = fs.readFileSync(path.join(__dirname, '../../docs/style.css'), 'utf8');
  });

  test('branding note should accurately reference CSS class', () => {
    expect(readmeContent).toContain('.logo-sigil');
    expect(cssContent).toMatch(/\.logo-sigil\s*{/);
  });

  test('should advise adjusting styles or swapping assets', () => {
    expect(readmeContent).toContain('Adjust the');
    expect(readmeContent).toContain('swap in your own assets');
  });

  test('branding guidance should be concise and actionable', () => {
    const brandingNote = readmeContent.match(/_Branding note:_[^\n]+/);
    expect(brandingNote).toBeTruthy();
    expect(brandingNote[0].length).toBeLessThan(300);
  });
});