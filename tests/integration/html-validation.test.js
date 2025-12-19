/**
 * HTML Structure Validation Tests
 * Validates HTML structure and attributes for changed files
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const htmlFiles = [
  'docs/index.html',
  'docs/dashboard.html',
  'docs/api.html',
  'docs/data.html',
  'docs/docs.html',
  'docs/versions.html'
];

describe('HTML Logo Image Structure', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have img tag with data-logo attribute in sidebar', () => {
        expect(htmlContent).toContain('<aside class="sidebar">');
        expect(htmlContent).toContain('data-logo');
        
        // Check sidebar has logo img
        const sidebarMatch = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          expect(sidebarMatch[0]).toContain('img');
          expect(sidebarMatch[0]).toContain('data-logo');
        }
      });

      test('should have img src pointing to logo.png in sidebar', () => {
        const sidebarMatch = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          expect(sidebarMatch[0]).toContain('src="logo.png"');
        }
      });

      test('should have alt attribute on sidebar logo', () => {
        const sidebarMatch = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          const imgMatch = sidebarMatch[0].match(/<img[^>]+>/);
          if (imgMatch) {
            expect(imgMatch[0]).toContain('alt=');
          }
        }
      });

      test('should have img tag with data-logo attribute in header', () => {
        expect(htmlContent).toContain('<header>');
        
        const headerMatch = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        if (headerMatch) {
          expect(headerMatch[0]).toContain('img');
          expect(headerMatch[0]).toContain('data-logo');
        }
      });

      test('should have img src pointing to logo.png in header', () => {
        const headerMatch = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        if (headerMatch) {
          expect(headerMatch[0]).toContain('src="logo.png"');
        }
      });

      test('should have class="logo" on header img', () => {
        const headerMatch = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        if (headerMatch) {
          const imgMatch = headerMatch[0].match(/<img[^>]+data-logo[^>]*>/);
          if (imgMatch) {
            expect(imgMatch[0]).toContain('class="logo"');
          }
        }
      });

      test('should NOT have .logo-placeholder div elements', () => {
        // Placeholders should be created by JS, not in HTML
        expect(htmlContent).not.toContain('class="logo-placeholder"');
      });

      test('should NOT have .logo-inline div elements', () => {
        // Old logo implementation should be removed
        expect(htmlContent).not.toContain('class="logo-inline"');
        expect(htmlContent).not.toContain('logo-inline');
      });

      test('should NOT have NOP text placeholders', () => {
        // Check that old "NOP" text logo is removed
        const sidebarMatch = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          expect(sidebarMatch[0]).not.toContain('>NOP<');
        }
      });
    });
  });
});

describe('HTML Structure Validation', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have valid HTML5 doctype', () => {
        expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
      });

      test('should have html tag', () => {
        expect(htmlContent).toContain('<html');
      });

      test('should have head section', () => {
        expect(htmlContent).toContain('<head>');
        expect(htmlContent).toContain('</head>');
      });

      test('should have body tag', () => {
        expect(htmlContent).toContain('<body');
        expect(htmlContent).toContain('</body>');
      });

      test('should have meta charset', () => {
        expect(htmlContent).toMatch(/<meta[^>]+charset[^>]*>/i);
      });

      test('should have viewport meta tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]+viewport[^>]*>/i);
      });

      test('should have title tag', () => {
        expect(htmlContent).toContain('<title>');
      });

      test('should link to style.css', () => {
        expect(htmlContent).toContain('style.css');
      });

      test('should link to script.js', () => {
        expect(htmlContent).toContain('script.js');
      });

      test('should have sidebar element', () => {
        expect(htmlContent).toContain('<aside class="sidebar">');
      });

      test('should have header element', () => {
        expect(htmlContent).toContain('<header>');
      });

      test('should have navigation', () => {
        expect(htmlContent).toContain('<nav');
      });

      test('should have data-page attribute on body', () => {
        const bodyMatch = htmlContent.match(/<body[^>]*>/);
        if (bodyMatch) {
          expect(bodyMatch[0]).toContain('data-page=');
        }
      });
    });
  });
});

describe('HTML Accessibility', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have alt attributes on all images', () => {
        const images = htmlContent.match(/<img[^>]+>/g) || [];
        
        images.forEach(img => {
          expect(img).toContain('alt=');
        });
      });

      test('should have lang attribute on html tag', () => {
        const htmlTag = htmlContent.match(/<html[^>]*>/);
        if (htmlTag) {
          expect(htmlTag[0]).toContain('lang=');
        }
      });

      test('should have semantic HTML5 elements', () => {
        const semanticElements = ['header', 'nav', 'main', 'aside'];
        const hasSemantic = semanticElements.some(el => htmlContent.includes(`<${el}`));
        
        expect(hasSemantic).toBe(true);
      });

      test('should have proper heading hierarchy', () => {
        expect(htmlContent).toContain('<h1');
      });
    });
  });
});

describe('HTML Script Loading', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should load script.js', () => {
        expect(htmlContent).toContain('script.js');
      });

      test('should load scripts at appropriate location', () => {
        // Script should be at the end or use defer/async
        const scriptTag = htmlContent.match(/<script[^>]*src="script\.js"[^>]*>/);
        if (scriptTag) {
          const isDeferred = scriptTag[0].includes('defer') || scriptTag[0].includes('async');
          const scriptIndex = htmlContent.indexOf(scriptTag[0]);
          const bodyEndIndex = htmlContent.indexOf('</body>');
          const isAtEnd = scriptIndex > bodyEndIndex - 1000;
          
          expect(isDeferred || isAtEnd).toBe(true);
        }
      });
    });
  });
});

describe('HTML Theme Support', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have theme toggle element', () => {
        expect(htmlContent).toContain('data-role="theme-toggle"');
      });

      test('should have theme label element', () => {
        expect(htmlContent).toContain('data-label');
      });
    });
  });
});

describe('HTML Navigation Structure', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have navigation links', () => {
        const navMatch = htmlContent.match(/<nav[^>]*>[\s\S]*?<\/nav>/);
        if (navMatch) {
          expect(navMatch[0]).toContain('<a');
        }
      });

      test('should have sidebar toggle button', () => {
        expect(htmlContent).toContain('sidebar-toggle');
      });
    });
  });
});

describe('HTML Inline Styles', () => {
  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = readFileSync(join(process.cwd(), filePath), 'utf-8');
      });

      test('should have inline styles for logo in sidebar', () => {
        const sidebarMatch = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        if (sidebarMatch) {
          const imgMatch = sidebarMatch[0].match(/<img[^>]+data-logo[^>]*>/);
          if (imgMatch) {
            expect(imgMatch[0]).toContain('style=');
            expect(imgMatch[0]).toContain('width:100%');
            expect(imgMatch[0]).toContain('border-radius:14px');
          }
        }
      });
    });
  });
});

describe('HTML Consistency', () => {
  test('all pages should have similar structure', () => {
    const structures = htmlFiles.map(filePath => {
      const content = readFileSync(join(process.cwd(), filePath), 'utf-8');
      return {
        file: filePath,
        hasSidebar: content.includes('sidebar'),
        hasHeader: content.includes('<header>'),
        hasNav: content.includes('<nav'),
        hasThemeToggle: content.includes('theme-toggle'),
        hasLogo: content.includes('data-logo')
      };
    });

    // All should have these common elements
    structures.forEach(struct => {
      expect(struct.hasSidebar).toBe(true);
      expect(struct.hasHeader).toBe(true);
      expect(struct.hasNav).toBe(true);
      expect(struct.hasThemeToggle).toBe(true);
      expect(struct.hasLogo).toBe(true);
    });
  });
});