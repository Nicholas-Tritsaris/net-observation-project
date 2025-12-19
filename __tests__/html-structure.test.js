/**
 * HTML Structure and Accessibility Tests
 * Tests for logo-sigil implementation across all HTML files
 */

const fs = require('fs');
const path = require('path');

describe('HTML Structure - Logo Sigil Implementation', () => {
  const htmlFiles = [
    'index.html',
    'dashboard.html',
    'api.html',
    'data.html',
    'docs.html',
    'versions.html'
  ];

  htmlFiles.forEach(filename => {
    describe(`${filename}`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        htmlContent = fs.readFileSync(filePath, 'utf-8');
      });

      test('should exist and be readable', () => {
        expect(htmlContent).toBeTruthy();
        expect(htmlContent.length).toBeGreaterThan(0);
      });

      test('should have valid HTML structure', () => {
        expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
        expect(htmlContent).toMatch(/<html[^>]*>/i);
        expect(htmlContent).toMatch(/<head>/i);
        expect(htmlContent).toMatch(/<body/i);
      });

      test('should contain logo-sigil in sidebar', () => {
        expect(htmlContent).toMatch(/class="logo-sigil logo-sigil--sidebar"/);
      });

      test('should contain logo-sigil in header', () => {
        expect(htmlContent).toMatch(/class="logo-sigil logo-sigil--header"/);
      });

      test('should NOT contain old logo-placeholder class', () => {
        expect(htmlContent).not.toContain('class="logo-placeholder"');
      });

      test('should NOT contain old logo-inline class', () => {
        expect(htmlContent).not.toContain('class="logo-inline"');
      });

      test('sidebar logo should have proper aria-label', () => {
        const sidebarLogo = htmlContent.match(/<div class="logo-sigil logo-sigil--sidebar"[^>]*>/);
        expect(sidebarLogo).toBeTruthy();
        if (sidebarLogo) {
          expect(sidebarLogo[0]).toContain('role="img"');
          expect(sidebarLogo[0]).toContain('aria-label');
          expect(sidebarLogo[0]).toContain('Net Observation Project logo');
        }
      });

      test('header logo should have proper aria-label', () => {
        const headerLogo = htmlContent.match(/<div class="logo-sigil logo-sigil--header"[^>]*>/);
        expect(headerLogo).toBeTruthy();
        if (headerLogo) {
          expect(headerLogo[0]).toContain('role="img"');
          expect(headerLogo[0]).toContain('aria-label');
          expect(headerLogo[0]).toContain('Net Observation Project logo');
        }
      });

      test('should have consistent aria-label text', () => {
        const ariaLabels = htmlContent.match(/aria-label="[^"]*logo[^"]*"/gi);
        expect(ariaLabels).toBeTruthy();
        if (ariaLabels && ariaLabels.length > 0) {
          ariaLabels.forEach(label => {
            expect(label).toMatch(/Net Observation Project/i);
          });
        }
      });

      test('logo divs should be self-closing or empty', () => {
        const logoSigils = htmlContent.match(/<div class="logo-sigil[^>]*>.*?<\/div>/gs);
        expect(logoSigils).toBeTruthy();
        if (logoSigils) {
          logoSigils.forEach(sigil => {
            // Should not contain NOP text directly in HTML
            const innerContent = sigil.replace(/<[^>]*>/g, '').trim();
            expect(innerContent).toBe('');
          });
        }
      });

      test('should maintain sidebar structure', () => {
        expect(htmlContent).toMatch(/<aside class="sidebar">/);
        expect(htmlContent).toContain('theme-toggle');
        expect(htmlContent).toMatch(/<nav[^>]*>/i);
      });

      test('should maintain header structure', () => {
        expect(htmlContent).toMatch(/<header>/i);
      });

      test('should link to style.css', () => {
        expect(htmlContent).toMatch(/<link[^>]*href="style\.css"/i);
      });

      test('should link to script.js', () => {
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"/i);
      });

      test('should have proper charset', () => {
        expect(htmlContent).toMatch(/<meta charset="utf-8"/i);
      });

      test('should have viewport meta tag', () => {
        expect(htmlContent).toMatch(/<meta name="viewport"/i);
      });

      test('should have page-specific data attribute', () => {
        expect(htmlContent).toMatch(/<body[^>]*data-page="[^"]+"/);
      });
    });
  });

  describe('Cross-file Consistency', () => {
    let allHtmlContents;

    beforeAll(() => {
      allHtmlContents = htmlFiles.map(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        return {
          filename,
          content: fs.readFileSync(filePath, 'utf-8')
        };
      });
    });

    test('all files should use same logo-sigil classes', () => {
      allHtmlContents.forEach(({ filename, content }) => {
        expect(content).toContain('logo-sigil logo-sigil--sidebar');
        expect(content).toContain('logo-sigil logo-sigil--header');
      });
    });

    test('all files should have consistent aria-labels', () => {
      const labels = allHtmlContents.map(({ content }) => {
        const matches = content.match(/aria-label="Net Observation Project logo"/g);
        return matches ? matches.length : 0;
      });
      
      // Each file should have at least 2 instances (sidebar + header)
      labels.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(2);
      });
    });

    test('no files should contain old logo classes', () => {
      allHtmlContents.forEach(({ filename, content }) => {
        expect(content).not.toContain('logo-placeholder');
        expect(content).not.toContain('logo-inline');
      });
    });

    test('all logos should have role="img"', () => {
      allHtmlContents.forEach(({ filename, content }) => {
        const logoCount = (content.match(/class="logo-sigil/g) || []).length;
        const roleCount = (content.match(/role="img"/g) || []).length;
        
        // Should have at least as many role="img" as logo-sigils
        expect(roleCount).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('logos should be properly labeled for screen readers', () => {
      htmlFiles.forEach(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const logos = content.match(/<div class="logo-sigil[^>]*>/g);
        expect(logos).toBeTruthy();
        
        if (logos) {
          logos.forEach(logo => {
            expect(logo).toContain('role="img"');
            expect(logo).toContain('aria-label');
          });
        }
      });
    });

    test('should not have empty alt or aria-label attributes', () => {
      htmlFiles.forEach(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).not.toMatch(/aria-label=""\s/);
        expect(content).not.toMatch(/alt=""\s/);
      });
    });
  });

  describe('Semantic HTML', () => {
    test('should use semantic aside for sidebar', () => {
      htmlFiles.forEach(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<aside class="sidebar"/);
      });
    });

    test('should use semantic header element', () => {
      htmlFiles.forEach(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<header>/i);
      });
    });

    test('should use semantic nav element', () => {
      htmlFiles.forEach(filename => {
        const filePath = path.join(__dirname, '..', 'docs', filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<nav/i);
      });
    });
  });
});