/**
 * Tests for README.md changes
 * Validates documentation structure and branding note placement
 */

const fs = require('fs');

describe('README.md Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync('./README.md', 'utf-8');
  });

  describe('Branding Note', () => {
    test('should contain branding note about logo.png', () => {
      expect(readmeContent).toMatch(/branding note/i);
    });

    test('should mention logo.png file location', () => {
      expect(readmeContent).toMatch(/logo\.png/);
    });

    test('should recommend 512×512 dimensions', () => {
      expect(readmeContent).toMatch(/512[×x]512/);
    });

    test('should mention transparency', () => {
      expect(readmeContent).toMatch(/transparency/i);
    });

    test('branding note should appear early in document', () => {
      const noteIndex = readmeContent.indexOf('Branding note');
      const featuresIndex = readmeContent.indexOf('## Features');
      expect(noteIndex).toBeLessThan(featuresIndex);
      expect(noteIndex).toBeGreaterThan(0);
    });

    test('should use blockquote format for branding note', () => {
      expect(readmeContent).toMatch(/>\s*\*\*Branding note:\*\*/);
    });
  });

  describe('Removed Content', () => {
    test('should not have separate Branding section', () => {
      expect(readmeContent).not.toMatch(/^## Branding$/m);
    });

    test('should not have old branding placeholder text', () => {
      expect(readmeContent).not.toMatch(/stylised textual logo placeholder/i);
    });

    test('should not have "drop a logo.png" in separate section', () => {
      const brandingSection = readmeContent.match(/^## Branding[\s\S]*?(?=^##|\n\n$)/m);
      expect(brandingSection).toBeNull();
    });
  });

  describe('Document Structure', () => {
    test('should have Directory Layout section', () => {
      expect(readmeContent).toMatch(/## Directory Layout/);
    });

    test('should have Features section', () => {
      expect(readmeContent).toMatch(/## Features/);
    });

    test('should have Running Locally section', () => {
      expect(readmeContent).toMatch(/## Running Locally/);
    });

    test('should have correct section order', () => {
      const directoryIndex = readmeContent.indexOf('## Directory Layout');
      const featuresIndex = readmeContent.indexOf('## Features');
      const runningIndex = readmeContent.indexOf('## Running Locally');
      
      expect(directoryIndex).toBeLessThan(featuresIndex);
      expect(featuresIndex).toBeLessThan(runningIndex);
    });
  });

  describe('Technical Accuracy', () => {
    test('should reference docs/ directory', () => {
      expect(readmeContent).toMatch(/docs\//);
    });

    test('should mention header and sidebar', () => {
      expect(readmeContent).toMatch(/header/i);
      expect(readmeContent).toMatch(/sidebar/i);
    });

    test('should explain automatic logo pickup', () => {
      const brandingNote = readmeContent.match(/>\s*\*\*Branding note:\*\*[^\n]*(?:\n[^\n]*)?/);
      expect(brandingNote).not.toBeNull();
      expect(brandingNote[0]).toMatch(/automatically/i);
    });
  });
});