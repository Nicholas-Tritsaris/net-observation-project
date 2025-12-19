import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'happy-dom';

const HTML_FILES = [
  'docs/index.html',
  'docs/dashboard.html',
  'docs/api.html',
  'docs/data.html',
  'docs/docs.html',
  'docs/versions.html'
];

describe('HTML Logo Markup Validation', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let dom;
      let document;

      beforeAll(() => {
        const fullPath = resolve(process.cwd(), filePath);
        const htmlContent = readFileSync(fullPath, 'utf-8');
        dom = new JSDOM(htmlContent);
        document = dom.window.document;
      });

      it('should contain img elements with data-logo attribute', () => {
        const logoImages = document.querySelectorAll('img[data-logo]');
        expect(logoImages.length).toBeGreaterThan(0);
      });

      it('should have logo in sidebar', () => {
        const sidebarLogo = document.querySelector('aside.sidebar img[data-logo]');
        expect(sidebarLogo).toBeTruthy();
      });

      it('should have logo in header', () => {
        const headerLogo = document.querySelector('header img[data-logo], header img.logo');
        expect(headerLogo).toBeTruthy();
      });

      it('should have src attribute pointing to logo.png', () => {
        const logoImages = document.querySelectorAll('img[data-logo]');
        logoImages.forEach(img => {
          expect(img.getAttribute('src')).toBe('logo.png');
        });
      });

      it('should have alt text on logo images', () => {
        const logoImages = document.querySelectorAll('img[data-logo]');
        logoImages.forEach(img => {
          const alt = img.getAttribute('alt');
          expect(alt).toBeTruthy();
          expect(alt.length).toBeGreaterThan(0);
        });
      });

      it('should not contain old .logo-placeholder divs in markup', () => {
        const oldPlaceholders = document.querySelectorAll('.logo-placeholder');
        // Should be 0 since placeholders are created dynamically by JS
        expect(oldPlaceholders.length).toBe(0);
      });

      it('should not contain old .logo-inline divs in markup', () => {
        const oldInline = document.querySelectorAll('.logo-inline');
        expect(oldInline.length).toBe(0);
      });

      it('should have proper styling attributes on sidebar logo', () => {
        const sidebarLogo = document.querySelector('aside.sidebar img[data-logo]');
        if (sidebarLogo) {
          const style = sidebarLogo.getAttribute('style');
          expect(style).toBeTruthy();
          expect(style).toContain('width');
          expect(style).toContain('border-radius');
        }
      });

      it('should maintain semantic HTML structure', () => {
        const aside = document.querySelector('aside.sidebar');
        const header = document.querySelector('header');
        
        expect(aside).toBeTruthy();
        expect(header).toBeTruthy();
      });

      it('should have valid HTML5 doctype', () => {
        const htmlContent = readFileSync(resolve(process.cwd(), filePath), 'utf-8');
        expect(htmlContent.trim()).toMatch(/^<!DOCTYPE html>/i);
      });
    });
  });
});

describe('Cross-page Logo Consistency', () => {
  it('should use same logo filename across all pages', () => {
    const logoSources = new Set();
    
    HTML_FILES.forEach(filePath => {
      const fullPath = resolve(process.cwd(), filePath);
      const htmlContent = readFileSync(fullPath, 'utf-8');
      const dom = new JSDOM(htmlContent);
      const logoImages = dom.window.document.querySelectorAll('img[data-logo]');
      
      logoImages.forEach(img => {
        logoSources.add(img.getAttribute('src'));
      });
    });
    
    expect(logoSources.size).toBe(1);
    expect(logoSources.has('logo.png')).toBe(true);
  });

  it('should have consistent alt text patterns', () => {
    const altTexts = [];
    
    HTML_FILES.forEach(filePath => {
      const fullPath = resolve(process.cwd(), filePath);
      const htmlContent = readFileSync(fullPath, 'utf-8');
      const dom = new JSDOM(htmlContent);
      const logoImages = dom.window.document.querySelectorAll('img[data-logo]');
      
      logoImages.forEach(img => {
        altTexts.push(img.getAttribute('alt'));
      });
    });
    
    // All alt texts should contain "Net Observation"
    altTexts.forEach(alt => {
      expect(alt).toMatch(/Net Observation/i);
    });
  });
});