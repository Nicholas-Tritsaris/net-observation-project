import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

const htmlFiles = [
  'index.html',
  'dashboard.html',
  'api.html',
  'data.html',
  'docs.html',
  'versions.html'
];

htmlFiles.forEach(filename => {
  describe(`HTML Structure Tests - ${filename}`, () => {
    let dom;
    let document;

    beforeEach(() => {
      const htmlContent = readFileSync(resolve(__dirname, `../../docs/${filename}`), 'utf-8');
      dom = new JSDOM(htmlContent);
      document = dom.window.document;
    });

    describe('Logo Element Updates', () => {
      it('should contain logo-sigil elements', () => {
        const logoElements = document.querySelectorAll('.logo-sigil');
        expect(logoElements.length).toBeGreaterThan(0);
      });

      it('should have logo-sigil--sidebar in sidebar', () => {
        const sidebarLogo = document.querySelector('.sidebar .logo-sigil--sidebar');
        expect(sidebarLogo).toBeTruthy();
        expect(sidebarLogo.classList.contains('logo-sigil')).toBe(true);
      });

      it('should have logo-sigil--header in header', () => {
        const headerLogo = document.querySelector('header .logo-sigil--header');
        expect(headerLogo).toBeTruthy();
        expect(headerLogo.classList.contains('logo-sigil')).toBe(true);
      });

      it('should not use old logo-placeholder class', () => {
        const oldElements = document.querySelectorAll('.logo-placeholder');
        expect(oldElements.length).toBe(0);
      });

      it('should not use old logo-inline class', () => {
        const oldElements = document.querySelectorAll('.logo-inline');
        expect(oldElements.length).toBe(0);
      });

      it('should have proper role attribute on logo elements', () => {
        const logos = document.querySelectorAll('.logo-sigil');
        logos.forEach(logo => {
          expect(logo.getAttribute('role')).toBe('img');
        });
      });

      it('should have descriptive aria-label on logo elements', () => {
        const logos = document.querySelectorAll('.logo-sigil');
        logos.forEach(logo => {
          const ariaLabel = logo.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain('Net Observation Project');
        });
      });

      it('should have empty logo divs (content from CSS)', () => {
        const logos = document.querySelectorAll('.logo-sigil');
        logos.forEach(logo => {
          // Logo content should come from CSS ::after pseudo-element
          expect(logo.textContent.trim()).toBe('');
        });
      });
    });

    describe('Document Structure', () => {
      it('should have valid DOCTYPE', () => {
        const doctype = dom.window.document.doctype;
        expect(doctype).toBeTruthy();
        expect(doctype.name).toBe('html');
      });

      it('should have html lang attribute', () => {
        const html = document.documentElement;
        expect(html.getAttribute('lang')).toBeTruthy();
      });

      it('should have meta charset', () => {
        const charset = document.querySelector('meta[charset]');
        expect(charset).toBeTruthy();
      });

      it('should have viewport meta tag', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        expect(viewport).toBeTruthy();
      });

      it('should have title element', () => {
        const title = document.querySelector('title');
        expect(title).toBeTruthy();
        expect(title.textContent.length).toBeGreaterThan(0);
      });
    });

    describe('CSS References', () => {
      it('should link to style.css', () => {
        const styleLink = document.querySelector('link[href="style.css"]');
        expect(styleLink).toBeTruthy();
        expect(styleLink.getAttribute('rel')).toBe('stylesheet');
      });
    });

    describe('JavaScript References', () => {
      it('should include script.js', () => {
        const script = document.querySelector('script[src="script.js"]');
        expect(script).toBeTruthy();
      });
    });

    describe('Accessibility', () => {
      it('should have main landmark', () => {
        const main = document.querySelector('main');
        expect(main).toBeTruthy();
      });

      it('should have header landmark', () => {
        const header = document.querySelector('header');
        expect(header).toBeTruthy();
      });

      it('should have sidebar with aside element', () => {
        const aside = document.querySelector('aside.sidebar');
        expect(aside).toBeTruthy();
      });

      it('should have navigation element', () => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });
    });

    describe('Theme Toggle', () => {
      it('should have theme toggle element', () => {
        const toggle = document.querySelector('[data-role="theme-toggle"]');
        expect(toggle).toBeTruthy();
      });

      it('should have proper accessibility on theme toggle', () => {
        const toggle = document.querySelector('[data-role="theme-toggle"]');
        expect(toggle.getAttribute('role')).toBe('button');
        expect(toggle.getAttribute('tabindex')).toBe('0');
      });

      it('should have theme label element', () => {
        const label = document.querySelector('[data-role="theme-toggle"] [data-label]');
        expect(label).toBeTruthy();
      });
    });

    describe('Data Page Attribute', () => {
      it('should have data-page attribute on body', () => {
        const body = document.querySelector('body');
        expect(body.getAttribute('data-page')).toBeTruthy();
      });
    });
  });
});

describe('Cross-Page Consistency Tests', () => {
  const pages = htmlFiles.map(filename => {
    const content = readFileSync(resolve(__dirname, `../../docs/${filename}`), 'utf-8');
    return { filename, dom: new JSDOM(content) };
  });

  it('all pages should have consistent logo structure', () => {
    pages.forEach(({ filename, dom }) => {
      const sidebarLogo = dom.window.document.querySelector('.sidebar .logo-sigil--sidebar');
      const headerLogo = dom.window.document.querySelector('header .logo-sigil--header');
      
      expect(sidebarLogo, `${filename} should have sidebar logo`).toBeTruthy();
      expect(headerLogo, `${filename} should have header logo`).toBeTruthy();
    });
  });

  it('all pages should have consistent theme toggle', () => {
    pages.forEach(({ filename, dom }) => {
      const toggle = dom.window.document.querySelector('[data-role="theme-toggle"]');
      expect(toggle, `${filename} should have theme toggle`).toBeTruthy();
    });
  });

  it('all pages should load same CSS file', () => {
    pages.forEach(({ filename, dom }) => {
      const styleLink = dom.window.document.querySelector('link[href="style.css"]');
      expect(styleLink, `${filename} should link to style.css`).toBeTruthy();
    });
  });

  it('all pages should load same JavaScript file', () => {
    pages.forEach(({ filename, dom }) => {
      const script = dom.window.document.querySelector('script[src="script.js"]');
      expect(script, `${filename} should load script.js`).toBeTruthy();
    });
  });

  it('all logo elements should have consistent ARIA labels', () => {
    pages.forEach(({ filename, dom }) => {
      const logos = dom.window.document.querySelectorAll('.logo-sigil');
      logos.forEach((logo, index) => {
        expect(logo.getAttribute('aria-label'), 
          `${filename} logo ${index} should have aria-label`).toContain('Net Observation Project');
      });
    });
  });
});