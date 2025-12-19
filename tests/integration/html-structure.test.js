/**
 * HTML structure validation tests
 * Validates the changes to HTML files for logo placeholders
 */

const { describe, test, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('HTML Logo Structure Validation', () => {
  const htmlFiles = [
    'docs/index.html',
    'docs/dashboard.html',
    'docs/api.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/versions.html'
  ];

  htmlFiles.forEach(filePath => {
    describe(`${filePath}`, () => {
      let htmlContent;

      beforeAll(() => {
        const fullPath = path.join(__dirname, '../..', filePath);
        if (fs.existsSync(fullPath)) {
          htmlContent = fs.readFileSync(fullPath, 'utf-8');
        }
      });

      test('should contain img tag with data-logo attribute in sidebar', () => {
        const sidebarMatch = htmlContent.match(/<aside[^>]*class="sidebar"[^>]*>[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          expect(sidebarMatch[0]).toContain('data-logo');
          expect(sidebarMatch[0]).toContain('<img');
        }
      });

      test('should contain img tag with data-logo attribute in header', () => {
        const headerMatch = htmlContent.match(/<header[^>]*>[\s\S]*?<\/header>/);
        if (headerMatch) {
          expect(headerMatch[0]).toContain('data-logo');
          expect(headerMatch[0]).toContain('<img');
        }
      });

      test('should reference logo.png file', () => {
        expect(htmlContent).toContain('logo.png');
      });

      test('should not contain old logo-placeholder div', () => {
        // Check that we're using img tags, not div with class logo-placeholder
        const sidebarMatch = htmlContent.match(/<aside[^>]*class="sidebar"[^>]*>[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          // Should have img, not div with logo-placeholder
          const hasOldPlaceholder = sidebarMatch[0].includes('<div class="logo-placeholder"');
          expect(hasOldPlaceholder).toBe(false);
        }
      });

      test('should not contain old logo-inline div in header', () => {
        const headerMatch = htmlContent.match(/<header[^>]*>[\s\S]*?<\/header>/);
        if (headerMatch) {
          const hasOldInline = headerMatch[0].includes('<div class="logo-inline"');
          expect(hasOldInline).toBe(false);
        }
      });

      test('should have proper alt text for logo images', () => {
        const imgMatches = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        if (imgMatches) {
          imgMatches.forEach(img => {
            expect(img).toContain('alt=');
          });
        }
      });

      test('should have semantic HTML structure', () => {
        expect(htmlContent).toContain('<aside');
        expect(htmlContent).toContain('<header');
        expect(htmlContent).toContain('<nav');
      });

      test('should have proper page attribute on body', () => {
        const bodyMatch = htmlContent.match(/<body[^>]*data-page="[^"]*"/);
        expect(bodyMatch).not.toBeNull();
      });
    });
  });
});

describe('HTML Accessibility Validation', () => {
  const htmlFiles = ['docs/index.html'];

  htmlFiles.forEach(filePath => {
    test(`${filePath} should have accessible logo images`, () => {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        const htmlContent = fs.readFileSync(fullPath, 'utf-8');
        const logoImages = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        
        if (logoImages) {
          logoImages.forEach(img => {
            // Should have alt attribute for accessibility
            expect(img).toContain('alt=');
            // Alt text should not be empty
            expect(img).toMatch(/alt="[^"]+"/);
          });
        }
      }
    });
  });
});

describe('HTML Script Reference Validation', () => {
  const htmlFiles = ['docs/index.html', 'docs/dashboard.html'];

  htmlFiles.forEach(filePath => {
    test(`${filePath} should reference script.js`, () => {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        const htmlContent = fs.readFileSync(fullPath, 'utf-8');
        expect(htmlContent).toContain('script.js');
      }
    });

    test(`${filePath} should reference style.css`, () => {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        const htmlContent = fs.readFileSync(fullPath, 'utf-8');
        expect(htmlContent).toContain('style.css');
      }
    });
  });
});