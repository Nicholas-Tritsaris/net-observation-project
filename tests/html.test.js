/**
 * HTML Validation Tests
 * Tests markup changes for logo sigil implementation across all HTML files
 */

const fs = require('fs');
const path = require('path');

describe('HTML Files - Logo Sigil Markup', () => {
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
        htmlContent = fs.readFileSync(path.join(__dirname, '../docs', filename), 'utf-8');
      });

      test('should contain logo-sigil class in sidebar', () => {
        expect(htmlContent).toMatch(/<div\s+class="logo-sigil\s+logo-sigil--sidebar"/);
      });

      test('should contain logo-sigil class in header', () => {
        expect(htmlContent).toMatch(/<div\s+class="logo-sigil\s+logo-sigil--header"/);
      });

      test('should not contain old logo-placeholder class', () => {
        expect(htmlContent).not.toMatch(/logo-placeholder/);
      });

      test('should not contain old logo-inline class', () => {
        expect(htmlContent).not.toMatch(/logo-inline/);
      });

      test('should have proper ARIA label for logo', () => {
        expect(htmlContent).toMatch(/aria-label="Net Observation Project logo"/);
      });

      test('should have role="img" for logo elements', () => {
        const logoMatches = htmlContent.match(/<div\s+class="logo-sigil[^>]*role="img"/g);
        expect(logoMatches).toBeTruthy();
        expect(logoMatches.length).toBeGreaterThanOrEqual(2);
      });

      test('should have valid HTML5 doctype', () => {
        expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
      });

      test('should have lang attribute on html tag', () => {
        expect(htmlContent).toMatch(/<html[^>]*lang="en"/);
      });

      test('should have charset meta tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]*charset="UTF-8"/);
      });

      test('should have viewport meta tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]*name="viewport"/);
      });

      test('should link to style.css', () => {
        expect(htmlContent).toMatch(/<link[^>]*href="style\.css"/);
      });

      test('should link to script.js', () => {
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"/);
      });

      test('should have proper closing tags', () => {
        const openDivs = (htmlContent.match(/<div[^>]*>/g) || []).length;
        const closeDivs = (htmlContent.match(/<\/div>/g) || []).length;
        
        expect(openDivs).toBe(closeDivs);
      });

      test('should have balanced section tags', () => {
        const openSections = (htmlContent.match(/<section[^>]*>/g) || []).length;
        const closeSections = (htmlContent.match(/<\/section>/g) || []).length;
        
        expect(openSections).toBe(closeSections);
      });

      test('should have aside element for sidebar', () => {
        expect(htmlContent).toMatch(/<aside[^>]*class="sidebar"/);
      });

      test('should have header element', () => {
        expect(htmlContent).toMatch(/<header>/);
      });

      test('should have navigation elements', () => {
        expect(htmlContent).toMatch(/<nav>/);
      });

      test('should have data-page attribute on body', () => {
        expect(htmlContent).toMatch(/<body[^>]*data-page="[^"]+"/);
      });

      test('should not have empty logo elements', () => {
        const emptyLogoMatch = htmlContent.match(/<div\s+class="logo-sigil[^>]*>NOP<\/div>/);
        expect(emptyLogoMatch).toBeNull();
      });

      test('should have self-closing logo divs', () => {
        const logoMatches = htmlContent.match(/<div\s+class="logo-sigil[^>]*><\/div>/g);
        expect(logoMatches).toBeTruthy();
        expect(logoMatches.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Cross-file Consistency', () => {
    let allContent = {};
    
    beforeAll(() => {
      htmlFiles.forEach(filename => {
        allContent[filename] = fs.readFileSync(path.join(__dirname, '../docs', filename), 'utf-8');
      });
    });

    test('all files should use same logo-sigil structure', () => {
      const patterns = htmlFiles.map(filename => {
        return allContent[filename].match(/<div\s+class="logo-sigil\s+logo-sigil--sidebar"[^>]*><\/div>/);
      });
      
      expect(patterns.every(p => p !== null)).toBe(true);
    });

    test('all files should have consistent ARIA labels', () => {
      const labels = htmlFiles.map(filename => {
        const matches = allContent[filename].match(/aria-label="Net Observation Project logo"/g);
        return matches ? matches.length : 0;
      });
      
      expect(labels.every(count => count >= 2)).toBe(true);
    });

    test('all files should link to same CSS file', () => {
      const cssLinks = htmlFiles.map(filename => {
        return allContent[filename].match(/href="style\.css"/);
      });
      
      expect(cssLinks.every(link => link !== null)).toBe(true);
    });

    test('all files should link to same JS file', () => {
      const jsLinks = htmlFiles.map(filename => {
        return allContent[filename].match(/src="script\.js"/);
      });
      
      expect(jsLinks.every(link => link !== null)).toBe(true);
    });
  });

  describe('Accessibility Compliance', () => {
    htmlFiles.forEach(filename => {
      describe(`${filename} - A11y`, () => {
        let htmlContent;
        
        beforeAll(() => {
          htmlContent = fs.readFileSync(path.join(__dirname, '../docs', filename), 'utf-8');
        });

        test('should have descriptive title', () => {
          expect(htmlContent).toMatch(/<title>[^<]+<\/title>/);
        });

        test('should have semantic HTML5 elements', () => {
          const semanticTags = ['header', 'nav', 'main', 'aside', 'section'];
          const hasSemanticTags = semanticTags.some(tag => 
            htmlContent.includes(`<${tag}`)
          );
          
          expect(hasSemanticTags).toBe(true);
        });

        test('should have proper button labels', () => {
          const buttons = htmlContent.match(/<button[^>]*>/g) || [];
          buttons.forEach(button => {
            const hasLabel = button.includes('aria-label') || 
                           htmlContent.includes(button + '[^<]*[^>]*>[^<]+<');
            expect(hasLabel).toBeTruthy();
          });
        });

        test('should have aria-expanded on toggle buttons', () => {
          const toggleButtons = htmlContent.match(/<button[^>]*toggle[^>]*>/gi);
          if (toggleButtons) {
            toggleButtons.forEach(button => {
              expect(button).toMatch(/aria-expanded/);
            });
          }
        });
      });
    });
  });

  describe('Logo Element Structure', () => {
    htmlFiles.forEach(filename => {
      describe(`${filename} - Logo Structure`, () => {
        let htmlContent;
        
        beforeAll(() => {
          htmlContent = fs.readFileSync(path.join(__dirname, '../docs', filename), 'utf-8');
        });

        test('sidebar logo should have both base and modifier classes', () => {
          const sidebarLogo = htmlContent.match(/<div\s+class="logo-sigil\s+logo-sigil--sidebar"[^>]*>/);
          expect(sidebarLogo).toBeTruthy();
        });

        test('header logo should have both base and modifier classes', () => {
          const headerLogo = htmlContent.match(/<div\s+class="logo-sigil\s+logo-sigil--header"[^>]*>/);
          expect(headerLogo).toBeTruthy();
        });

        test('logos should be empty divs (content via CSS)', () => {
          const logos = htmlContent.match(/<div\s+class="logo-sigil[^>]*><\/div>/g);
          expect(logos).toBeTruthy();
          expect(logos.length).toBeGreaterThanOrEqual(2);
        });

        test('logos should not contain text content', () => {
          const logosWithText = htmlContent.match(/<div\s+class="logo-sigil[^>]*>[^<]+<\/div>/g);
          expect(logosWithText).toBeNull();
        });
      });
    });
  });
});