/**
 * HTML validation tests for changed HTML files
 * Tests focus on the logo markup changes from text placeholders to img tags
 */

const fs = require('fs');
const path = require('path');

describe('HTML Files - Logo Markup Changes', () => {
  const htmlFiles = [
    'docs/api.html',
    'docs/dashboard.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/index.html',
    'docs/versions.html'
  ];

  htmlFiles.forEach(filePath => {
    describe(filePath, () => {
      let content;

      beforeAll(() => {
        content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
      });

      it('should contain img tag with data-logo attribute in sidebar', () => {
        const sidebarLogoRegex = /<aside[^>]*class="sidebar"[^>]*>[\s\S]*?<img[^>]*data-logo[^>]*\/?>[\s\S]*?<\/aside>/;
        expect(content).toMatch(sidebarLogoRegex);
      });

      it('should have logo image with src="logo.png" in sidebar', () => {
        const logoSrcRegex = /<img[^>]*src="logo\.png"[^>]*data-logo/;
        expect(content).toMatch(logoSrcRegex);
      });

      it('should have logo image with proper alt text in sidebar', () => {
        const altTextRegex = /<img[^>]*alt="Net Observation Project"[^>]*data-logo/;
        expect(content).toMatch(altTextRegex);
      });

      it('should have logo image with inline styles in sidebar', () => {
        const styleRegex = /<img[^>]*style="[^"]*width:\s*100%[^"]*"[^>]*data-logo/;
        expect(content).toMatch(styleRegex);
      });

      it('should contain img tag with logo class in header', () => {
        const headerLogoRegex = /<header[\s\S]*?<img[^>]*class="logo"[^>]*data-logo[^>]*\/>[\s\S]*?<\/header>/;
        expect(content).toMatch(headerLogoRegex);
      });

      it('should NOT contain old logo-placeholder div in sidebar', () => {
        const oldPlaceholderRegex = /<div[^>]*class="logo-placeholder"[^>]*>NOP<\/div>/;
        expect(content).not.toMatch(oldPlaceholderRegex);
      });

      it('should NOT contain old logo-inline div in header', () => {
        const oldInlineRegex = /<div[^>]*class="logo-inline"[^>]*>NOP<\/div>/;
        expect(content).not.toMatch(oldInlineRegex);
      });

      it('should have valid HTML5 doctype', () => {
        expect(content).toMatch(/^\s*<!DOCTYPE html>/i);
      });

      it('should have proper lang attribute on html tag', () => {
        expect(content).toMatch(/<html[^>]*lang="en"/);
      });

      it('should have meta charset declaration', () => {
        expect(content).toMatch(/<meta[^>]*charset="UTF-8"/);
      });

      it('should have viewport meta tag', () => {
        expect(content).toMatch(/<meta[^>]*name="viewport"/);
      });

      it('should include script.js', () => {
        expect(content).toMatch(/<script[^>]*src="script\.js"/);
      });

      it('should include style.css', () => {
        expect(content).toMatch(/<link[^>]*href="style\.css"/);
      });

      it('should have theme toggle element with proper attributes', () => {
        expect(content).toMatch(/<div[^>]*data-role="theme-toggle"[^>]*role="button"[^>]*tabindex="0"/);
      });

      it('should have theme toggle with data-label element', () => {
        expect(content).toMatch(/<strong[^>]*data-label[^>]*>/);
      });

      it('should have navigation links in sidebar', () => {
        const navRegex = /<aside[^>]*class="sidebar"[\s\S]*?<nav>[\s\S]*?<\/nav>[\s\S]*?<\/aside>/;
        expect(content).toMatch(navRegex);
      });

      it('should have proper page data attribute on body', () => {
        const pageAttrRegex = /<body[^>]*data-page="[^"]+"/;
        expect(content).toMatch(pageAttrRegex);
      });

      it('should have accessible sidebar toggle button', () => {
        expect(content).toMatch(/<button[^>]*class="sidebar-toggle"[^>]*aria-label="Toggle navigation"/);
      });

      it('should have auth status indicator', () => {
        expect(content).toMatch(/<span[^>]*data-auth-status[^>]*>/);
      });

      it('should have login button with data-action attribute', () => {
        expect(content).toMatch(/<button[^>]*data-action="login"/);
      });

      it('should have logout button with data-action attribute', () => {
        expect(content).toMatch(/<button[^>]*data-action="logout"/);
      });

      it('should have proper semantic header structure', () => {
        expect(content).toMatch(/<header>/);
        expect(content).toMatch(/<\/header>/);
      });

      it('should have main content area', () => {
        expect(content).toMatch(/<main>/);
        expect(content).toMatch(/<\/main>/);
      });

      it('should not have duplicate IDs', () => {
        const idMatches = content.match(/\sid="([^"]+)"/g);
        if (idMatches) {
          const ids = idMatches.map(match => match.match(/id="([^"]+)"/)[1]);
          const uniqueIds = new Set(ids);
          expect(ids.length).toBe(uniqueIds.size);
        }
      });

      it('should have closing tags for all major elements', () => {
        const htmlOpen = (content.match(/<html[^>]*>/g) || []).length;
        const htmlClose = (content.match(/<\/html>/g) || []).length;
        expect(htmlOpen).toBe(htmlClose);

        const bodyOpen = (content.match(/<body[^>]*>/g) || []).length;
        const bodyClose = (content.match(/<\/body>/g) || []).length;
        expect(bodyOpen).toBe(bodyClose);

        const headOpen = (content.match(/<head[^>]*>/g) || []).length;
        const headClose = (content.match(/<\/head>/g) || []).length;
        expect(headOpen).toBe(headClose);
      });
    });
  });

  describe('HTML Consistency Across Files', () => {
    let allContents;

    beforeAll(() => {
      allContents = htmlFiles.map(file => ({
        name: file,
        content: fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
      }));
    });

    it('all files should use consistent logo markup in sidebar', () => {
      const sidebarLogoPattern = /<img src="logo\.png" alt="Net Observation Project" data-logo/;
      
      allContents.forEach(({ name, content }) => {
        expect(content).toMatch(sidebarLogoPattern);
      });
    });

    it('all files should use consistent logo markup in header', () => {
      const headerLogoPattern = /<img src="logo\.png" alt="Net Observation" class="logo" data-logo/;
      
      allContents.forEach(({ name, content }) => {
        expect(content).toMatch(headerLogoPattern);
      });
    });

    it('all files should have consistent theme toggle markup', () => {
      allContents.forEach(({ name, content }) => {
        expect(content).toMatch(/data-role="theme-toggle"/);
        expect(content).toContain('<strong data-label>AUTO</strong>');
      });
    });

    it('all files should link to the same CSS file', () => {
      allContents.forEach(({ name, content }) => {
        expect(content).toMatch(/<link[^>]*href="style\.css"/);
      });
    });

    it('all files should link to the same JavaScript file', () => {
      allContents.forEach(({ name, content }) => {
        expect(content).toMatch(/<script[^>]*src="script\.js"/);
      });
    });

    it('all files should have consistent navigation structure', () => {
      const navLinks = [
        'index.html',
        'dashboard.html',
        'docs.html',
        'api.html',
        'data.html',
        'versions.html'
      ];

      allContents.forEach(({ name, content }) => {
        navLinks.forEach(link => {
          expect(content).toContain(`href="${link}"`);
        });
      });
    });
  });

  describe('Accessibility Requirements', () => {
    htmlFiles.forEach(filePath => {
      describe(filePath, () => {
        let content;

        beforeAll(() => {
          content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
        });

        it('should have alt text for logo images', () => {
          const imgTags = content.match(/<img[^>]*data-logo[^>]*>/g) || [];
          imgTags.forEach(tag => {
            expect(tag).toMatch(/alt="[^"]+"/);
          });
        });

        it('should have proper ARIA labels on interactive elements', () => {
          expect(content).toMatch(/aria-label="Toggle navigation"/);
        });

        it('should have proper ARIA expanded state on toggle button', () => {
          expect(content).toMatch(/aria-expanded="true"/);
        });

        it('should have role attribute on theme toggle', () => {
          expect(content).toMatch(/role="button"/);
        });

        it('should have tabindex on focusable custom controls', () => {
          const themeToggleMatch = content.match(/<div[^>]*data-role="theme-toggle"[^>]*>/);
          if (themeToggleMatch) {
            expect(themeToggleMatch[0]).toMatch(/tabindex="0"/);
          }
        });
      });
    });
  });
});