import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('README.md Validation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = resolve(process.cwd(), 'README.md');
    readmeContent = readFileSync(readmePath, 'utf-8');
  });

  describe('Branding Documentation', () => {
    it('should contain branding note about logo.png', () => {
      expect(readmeContent).toContain('logo.png');
    });

    it('should mention recommended logo dimensions', () => {
      expect(readmeContent).toMatch(/512.*512/);
    });

    it('should mention transparency recommendation', () => {
      expect(readmeContent).toMatch(/transparency/i);
    });

    it('should explain logo is intentionally not included', () => {
      expect(readmeContent).toMatch(/intentionally.*leave|leave.*intentionally/i);
    });

    it('should mention both header and sidebar will use logo', () => {
      expect(readmeContent).toMatch(/header.*sidebar|sidebar.*header/i);
    });
  });

  describe('Section Organization', () => {
    it('should have branding note near top of file', () => {
      const brandingIndex = readmeContent.indexOf('Branding');
      const featuresIndex = readmeContent.indexOf('## Features');
      
      // Branding note should appear before or near Features section
      expect(brandingIndex).toBeGreaterThan(0);
      expect(featuresIndex).toBeGreaterThan(0);
    });

    it('should not have deprecated standalone Branding section', () => {
      // The old "## Branding" section should be removed
      const lines = readmeContent.split('\n');
      const brandingHeaders = lines.filter(line => 
        line.trim() === '## Branding'
      );
      
      expect(brandingHeaders.length).toBe(0);
    });
  });

  describe('Documentation Structure', () => {
    it('should have proper markdown heading hierarchy', () => {
      const h1Count = (readmeContent.match(/^# [^#]/gm) || []).length;
      expect(h1Count).toBe(1); // Only one H1
    });

    it('should contain all major sections', () => {
      expect(readmeContent).toContain('## Features');
      expect(readmeContent).toContain('## Running Locally');
      expect(readmeContent).toContain('## Deploying');
    });

    it('should have valid markdown code blocks', () => {
      const codeBlockStarts = (readmeContent.match(/```/g) || []).length;
      expect(codeBlockStarts % 2).toBe(0); // Should be even (open and close)
    });
  });

  describe('Technical Accuracy', () => {
    it('should reference correct directory structure', () => {
      expect(readmeContent).toContain('docs/');
      expect(readmeContent).toContain('functions/');
    });

    it('should mention PNG format', () => {
      expect(readmeContent).toMatch(/\.png/i);
    });

    it('should use blockquote for branding note', () => {
      const lines = readmeContent.split('\n');
      const brandingLines = lines.filter(line => 
        line.includes('logo.png') && line.startsWith('>')
      );
      
      expect(brandingLines.length).toBeGreaterThan(0);
    });
  });

  describe('Link Validation', () => {
    it('should not have broken internal links', () => {
      const internalLinks = readmeContent.match(/\[([^\]]+)\]\(#([^)]+)\)/g);
      
      if (internalLinks) {
        internalLinks.forEach(link => {
          const anchorMatch = link.match(/#([^)]+)/);
          if (anchorMatch) {
            const anchor = anchorMatch[1];
            // Check if the anchor exists as a heading
            const headingPattern = new RegExp(`^#+.*${anchor.replace(/-/g, '[ -]')}`, 'im');
            expect(readmeContent).toMatch(headingPattern);
          }
        });
      }
    });
  });
});