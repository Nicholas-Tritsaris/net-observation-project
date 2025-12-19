/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('HTML Files - Logo Implementation Validation', () => {
  const htmlFiles = [
    'docs/index.html',
    'docs/dashboard.html',
    'docs/api.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/versions.html'
  ];

  htmlFiles.forEach((filePath) => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should contain img element with data-logo attribute in sidebar', () => {
        expect(htmlContent).toMatch(/<img[^>]*data-logo[^>]*>/);
      });

      test('should have logo image with correct alt text', () => {
        expect(htmlContent).toMatch(/<img[^>]*alt="Net Observation[^"]*"[^>]*data-logo/);
      });

      test('should reference logo.png as image source', () => {
        expect(htmlContent).toMatch(/<img[^>]*src="logo\.png"[^>]*data-logo/);
      });

      test('should have logo with border-radius styling in sidebar', () => {
        const sidebarLogoMatch = htmlContent.match(/<aside[^>]*class="sidebar"[^>]*>[\s\S]*?<img[^>]*data-logo[^>]*style="[^"]*border-radius[^"]*"[^>]*>/);
        expect(sidebarLogoMatch).not.toBeNull();
      });

      test('should have two logo references (sidebar and header)', () => {
        const logoMatches = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        expect(logoMatches).not.toBeNull();
        expect(logoMatches.length).toBe(2);
      });

      test('should not contain old logo-placeholder div elements', () => {
        const oldPlaceholderMatch = htmlContent.match(/<div[^>]*class="logo-placeholder"[^>]*role="img"[^>]*>NOP<\/div>/);
        expect(oldPlaceholderMatch).toBeNull();
      });

      test('should not contain old logo-inline div elements', () => {
        const oldInlineMatch = htmlContent.match(/<div[^>]*class="logo-inline"[^>]*role="img"[^>]*>NOP<\/div>/);
        expect(oldInlineMatch).toBeNull();
      });

      test('should have header logo with class="logo"', () => {
        const headerLogoMatch = htmlContent.match(/<header[\s\S]*?<img[^>]*class="logo"[^>]*data-logo[^>]*>/);
        expect(headerLogoMatch).not.toBeNull();
      });

      test('should include script.js reference', () => {
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"[^>]*>/);
      });

      test('should have valid HTML5 doctype', () => {
        expect(htmlContent).toMatch(/^\s*<!DOCTYPE html>/i);
      });

      test('should have proper lang attribute', () => {
        expect(htmlContent).toMatch(/<html[^>]*lang="en"[^>]*>/);
      });

      test('should include style.css reference', () => {
        expect(htmlContent).toMatch(/<link[^>]*href="style\.css"[^>]*>/);
      });

      test('should have sidebar with navigation', () => {
        expect(htmlContent).toMatch(/<aside[^>]*class="sidebar"[^>]*>/);
        expect(htmlContent).toMatch(/<nav[^>]*>/);
      });

      test('should have theme toggle element', () => {
        expect(htmlContent).toMatch(/data-role="theme-toggle"/);
      });

      test('should have proper meta viewport tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]*name="viewport"[^>]*content="width=device-width[^"]*"/);
      });
    });
  });

  describe('Cross-file consistency', () => {
    test('all files should use consistent logo implementation', () => {
      const logoPatterns = htmlFiles.map(filePath => {
        const content = readFileSync(filePath, 'utf-8');
        const matches = content.match(/<img[^>]*src="logo\.png"[^>]*data-logo[^>]*>/g);
        return matches ? matches.length : 0;
      });

      // All files should have exactly 2 logo references
      logoPatterns.forEach(count => {
        expect(count).toBe(2);
      });
    });

    test('all files should have removed old placeholder divs', () => {
      htmlFiles.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8');
        const oldPattern = /<div[^>]*class="logo-(placeholder|inline)"[^>]*>NOP<\/div>/;
        expect(content).not.toMatch(oldPattern);
      });
    });

    test('all files should link to same stylesheet', () => {
      htmlFiles.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<link[^>]*href="style\.css"[^>]*>/);
      });
    });

    test('all files should link to same script file', () => {
      htmlFiles.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<script[^>]*src="script\.js"[^>]*>/);
      });
    });
  });
});