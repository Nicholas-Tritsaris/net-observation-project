/**
 * HTML Validation Tests for docs/*.html
 * Testing changes: logo-placeholder/logo-inline -> logo-sigil class changes
 */

const fs = require('fs');
const path = require('path');

const HTML_FILES = [
  'docs/index.html',
  'docs/dashboard.html',
  'docs/api.html',
  'docs/data.html',
  'docs/docs.html',
  'docs/versions.html'
];

describe('HTML - Logo Sigil Class Usage', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8');
      });

      test('should use logo-sigil--sidebar in sidebar', () => {
        expect(htmlContent).toMatch(/<div[^>]*class="logo-sigil logo-sigil--sidebar"/);
      });

      test('should use logo-sigil--header in header', () => {
        expect(htmlContent).toMatch(/<div[^>]*class="logo-sigil logo-sigil--header"/);
      });

      test('should NOT use old logo-placeholder class', () => {
        expect(htmlContent).not.toContain('logo-placeholder');
      });

      test('should NOT use old logo-inline class', () => {
        expect(htmlContent).not.toContain('logo-inline');
      });

      test('logo-sigil elements should have role="img"', () => {
        const sigilMatches = htmlContent.match(/<div[^>]*class="logo-sigil[^"]*"[^>]*>/g);
        expect(sigilMatches).toBeTruthy();
        
        sigilMatches.forEach(match => {
          expect(match).toContain('role="img"');
        });
      });

      test('logo-sigil elements should have aria-label', () => {
        const sigilMatches = htmlContent.match(/<div[^>]*class="logo-sigil[^"]*"[^>]*>/g);
        expect(sigilMatches).toBeTruthy();
        
        sigilMatches.forEach(match => {
          expect(match).toContain('aria-label=');
          expect(match).toContain('Net Observation Project logo');
        });
      });
    });
  });
});

describe('HTML - Structure Validation', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8');
      });

      test('should have valid DOCTYPE', () => {
        expect(htmlContent).toMatch(/^<!DOCTYPE html>/i);
      });

      test('should have html lang attribute', () => {
        expect(htmlContent).toMatch(/<html[^>]*lang="en"/);
      });

      test('should have data-theme attribute on html', () => {
        expect(htmlContent).toMatch(/<html[^>]*data-theme="dark"/);
      });

      test('should have charset meta tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]*charset="UTF-8"/);
      });

      test('should have viewport meta tag', () => {
        expect(htmlContent).toMatch(/<meta[^>]*name="viewport"/);
      });

      test('should load style.css', () => {
        expect(htmlContent).toContain('<link rel="stylesheet" href="style.css"');
      });

      test('should load script.js', () => {
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"/);
      });

      test('should have data-page attribute on body', () => {
        expect(htmlContent).toMatch(/<body[^>]*data-page="/);
      });

      test('should have sidebar element', () => {
        expect(htmlContent).toMatch(/<aside[^>]*class="sidebar"/);
      });

      test('should have sidebar-toggle button', () => {
        expect(htmlContent).toContain('class="sidebar-toggle"');
      });

      test('should have header element', () => {
        expect(htmlContent).toMatch(/<header>/);
      });

      test('should have main element', () => {
        expect(htmlContent).toMatch(/<main>/);
      });

      test('should have theme-toggle control', () => {
        expect(htmlContent).toContain('data-role="theme-toggle"');
      });
    });
  });
});

describe('HTML - Accessibility', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8');
      });

      test('sidebar-toggle should have aria-label', () => {
        const toggleMatch = htmlContent.match(/<button[^>]*class="sidebar-toggle"[^>]*>/);
        expect(toggleMatch).toBeTruthy();
        expect(toggleMatch[0]).toContain('aria-label');
      });

      test('sidebar-toggle should have aria-expanded', () => {
        const toggleMatch = htmlContent.match(/<button[^>]*class="sidebar-toggle"[^>]*>/);
        expect(toggleMatch).toBeTruthy();
        expect(toggleMatch[0]).toContain('aria-expanded');
      });

      test('theme-toggle should have role and tabindex', () => {
        const themeToggle = htmlContent.match(/<div[^>]*data-role="theme-toggle"[^>]*>/);
        expect(themeToggle).toBeTruthy();
        expect(themeToggle[0]).toContain('role="button"');
        expect(themeToggle[0]).toContain('tabindex="0"');
      });

      test('navigation links should have descriptive text', () => {
        const navLinks = htmlContent.match(/<nav[^>]*>[\s\S]*?<\/nav>/g);
        expect(navLinks).toBeTruthy();
        expect(navLinks.length).toBeGreaterThan(0);
      });

      test('should not have empty alt attributes', () => {
        const emptyAlts = htmlContent.match(/alt=""\s/g);
        // Logo sigils use role="img" with aria-label, so no img alt needed
        expect(emptyAlts).toBeFalsy();
      });
    });
  });
});

describe('HTML - Logo Sigil Content', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8');
      });

      test('logo-sigil elements should be self-closing or empty divs', () => {
        // Logo sigils use CSS ::after for content, so HTML should be empty
        const sigilMatches = htmlContent.match(/<div[^>]*class="logo-sigil[^"]*"[^>]*>[^<]*<\/div>/g);
        expect(sigilMatches).toBeTruthy();
        
        sigilMatches.forEach(match => {
          // Should not contain text content between tags (content comes from CSS)
          const innerContent = match.replace(/<div[^>]*>/, '').replace(/<\/div>$/, '');
          expect(innerContent.trim()).toBe('');
        });
      });

      test('should have exactly 2 logo-sigil elements per page', () => {
        const sigilCount = (htmlContent.match(/class="logo-sigil/g) || []).length;
        expect(sigilCount).toBe(2); // One in sidebar, one in header
      });
    });
  });
});

describe('HTML - Page-Specific Data Attributes', () => {
  test('index.html should have data-page="home"', () => {
    const html = fs.readFileSync('docs/index.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="home"/);
  });

  test('dashboard.html should have data-page="dashboard"', () => {
    const html = fs.readFileSync('docs/dashboard.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="dashboard"/);
  });

  test('api.html should have data-page="api"', () => {
    const html = fs.readFileSync('docs/api.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="api"/);
  });

  test('data.html should have data-page="data"', () => {
    const html = fs.readFileSync('docs/data.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="data"/);
  });

  test('docs.html should have data-page="docs"', () => {
    const html = fs.readFileSync('docs/docs.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="docs"/);
  });

  test('versions.html should have data-page="versions"', () => {
    const html = fs.readFileSync('docs/versions.html', 'utf8');
    expect(html).toMatch(/<body[^>]*data-page="versions"/);
  });
});

describe('HTML - External Dependencies', () => {
  HTML_FILES.forEach(filePath => {
    describe(filePath, () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(path.join(__dirname, '../..', filePath), 'utf8');
      });

      test('should load Chart.js', () => {
        expect(htmlContent).toContain('chart.js');
      });

      test('should load D3.js', () => {
        expect(htmlContent).toContain('d3@7');
      });

      test('should load TopoJSON', () => {
        expect(htmlContent).toContain('topojson-client');
      });

      test('should load Auth0 SPA SDK', () => {
        expect(htmlContent).toContain('auth0-spa-js');
      });

      test('should load Google Fonts (JetBrains Mono)', () => {
        expect(htmlContent).toContain('fonts.googleapis.com');
        expect(htmlContent).toContain('JetBrains+Mono');
      });

      test('scripts should be deferred', () => {
        const scriptTags = htmlContent.match(/<script[^>]*src=[^>]*>/g) || [];
        scriptTags.forEach(tag => {
          if (!tag.includes('inline')) {
            expect(tag).toContain('defer');
          }
        });
      });
    });
  });
});