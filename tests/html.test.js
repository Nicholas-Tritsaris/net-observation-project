/**
 * Comprehensive tests for HTML files in docs/
 * Validates logo implementation, structure, and accessibility
 */

import { jest } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const docsPath = join(__dirname, '../docs');

// Get all HTML files that were changed in the diff
const htmlFiles = ['api.html', 'dashboard.html', 'data.html', 'docs.html', 'index.html', 'versions.html'];

describe('HTML Logo Implementation', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename}`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should contain img tag with data-logo attribute in sidebar', () => {
        expect(htmlContent).toContain('data-logo');
        expect(htmlContent).toMatch(/<img[^>]*data-logo[^>]*>/);
      });

      test('should reference logo.png as image source', () => {
        expect(htmlContent).toContain('src="logo.png"');
      });

      test('should have proper alt text on logo images', () => {
        const imgTags = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        expect(imgTags).toBeTruthy();
        
        imgTags.forEach(tag => {
          expect(tag).toMatch(/alt="[^"]+"/);
        });
      });

      test('should NOT contain old logo-placeholder div in sidebar', () => {
        // The old implementation had a div with class logo-placeholder and role="img"
        const oldPattern = /<div class="logo-placeholder" role="img"[^>]*>NOP<\/div>/;
        expect(htmlContent).not.toMatch(oldPattern);
      });

      test('should NOT contain old logo-inline div in header', () => {
        // The old implementation had a div with class logo-inline
        const oldPattern = /<div class="logo-inline"[^>]*>NOP<\/div>/;
        expect(htmlContent).not.toMatch(oldPattern);
      });

      test('sidebar logo should have proper styling attributes', () => {
        const sidebarImg = htmlContent.match(/<aside class="sidebar">[\s\S]*?<img[^>]*data-logo[^>]*>/);
        expect(sidebarImg).toBeTruthy();
        
        const imgTag = sidebarImg[0].match(/<img[^>]*>/)[0];
        expect(imgTag).toContain('width:100%');
        expect(imgTag).toContain('border-radius:14px');
        expect(imgTag).toContain('margin-bottom:1rem');
      });

      test('header logo should have logo class', () => {
        const headerImg = htmlContent.match(/<header>[\s\S]*?<img[^>]*data-logo[^>]*>/);
        expect(headerImg).toBeTruthy();
        
        const imgTag = headerImg[0].match(/<img[^>]*>/)[0];
        expect(imgTag).toContain('class="logo"');
      });

      test('should have two logo instances (sidebar and header)', () => {
        const logoInstances = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        expect(logoInstances).toHaveLength(2);
      });

      test('logo images should have descriptive alt text', () => {
        const logoInstances = htmlContent.match(/<img[^>]*data-logo[^>]*>/g);
        
        logoInstances.forEach(img => {
          const altMatch = img.match(/alt="([^"]*)"/);
          expect(altMatch).toBeTruthy();
          expect(altMatch[1].length).toBeGreaterThan(0);
          expect(altMatch[1]).not.toBe('');
        });
      });
    });
  });
});

describe('HTML Structure Validation', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} structure`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should have valid HTML5 doctype', () => {
        expect(htmlContent.trim()).toMatch(/^<!DOCTYPE html>/i);
      });

      test('should have html, head, and body tags', () => {
        expect(htmlContent).toContain('<html');
        expect(htmlContent).toContain('<head>');
        expect(htmlContent).toContain('<body');
        expect(htmlContent).toContain('</body>');
        expect(htmlContent).toContain('</html>');
      });

      test('should have proper charset declaration', () => {
        expect(htmlContent).toMatch(/<meta[^>]*charset[^>]*>/i);
      });

      test('should have viewport meta tag for responsive design', () => {
        expect(htmlContent).toMatch(/<meta[^>]*name="viewport"[^>]*>/i);
      });

      test('should have title tag', () => {
        expect(htmlContent).toMatch(/<title>[^<]+<\/title>/);
      });

      test('should link to style.css', () => {
        expect(htmlContent).toContain('href="style.css"');
      });

      test('should link to script.js', () => {
        expect(htmlContent).toContain('src="script.js"');
      });

      test('should have sidebar element', () => {
        expect(htmlContent).toContain('<aside class="sidebar">');
      });

      test('should have header element', () => {
        expect(htmlContent).toContain('<header>');
      });

      test('should have main element', () => {
        expect(htmlContent).toContain('<main>');
      });

      test('should have data-page attribute on body', () => {
        expect(htmlContent).toMatch(/<body[^>]*data-page="[^"]*"[^>]*>/);
      });
    });
  });
});

describe('HTML Accessibility Features', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} accessibility`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('all images should have alt attributes', () => {
        const imgTags = htmlContent.match(/<img[^>]*>/g);
        if (imgTags) {
          imgTags.forEach(tag => {
            expect(tag).toMatch(/alt="[^"]*"/);
          });
        }
      });

      test('should have lang attribute on html tag', () => {
        const htmlTag = htmlContent.match(/<html[^>]*>/);
        if (htmlTag) {
          expect(htmlTag[0]).toMatch(/lang="[^"]*"/);
        }
      });

      test('interactive elements should have proper roles or semantic tags', () => {
        // Check that buttons and interactive elements exist
        const hasButtons = htmlContent.includes('<button') || 
                          htmlContent.includes('role="button"');
        const hasNav = htmlContent.includes('<nav');
        
        expect(hasButtons || hasNav).toBe(true);
      });

      test('theme toggle should have proper accessibility attributes', () => {
        if (htmlContent.includes('data-role="theme-toggle"')) {
          const themeToggle = htmlContent.match(/<div[^>]*data-role="theme-toggle"[^>]*>/);
          expect(themeToggle).toBeTruthy();
          expect(themeToggle[0]).toMatch(/role="button"/);
          expect(themeToggle[0]).toMatch(/tabindex="0"/);
        }
      });
    });
  });
});

describe('HTML Navigation Consistency', () => {
  test('all HTML files should have consistent navigation structure', () => {
    const navStructures = htmlFiles.map(filename => {
      const filePath = join(docsPath, filename);
      const content = readFileSync(filePath, 'utf-8');
      const navMatch = content.match(/<nav[^>]*>[\s\S]*?<\/nav>/);
      return navMatch ? navMatch[0] : null;
    });

    // All should have navigation
    navStructures.forEach(nav => {
      expect(nav).toBeTruthy();
    });
  });

  test('all HTML files should link to the same core pages', () => {
    const corePages = ['index.html', 'dashboard.html', 'api.html', 'data.html', 'docs.html', 'versions.html'];
    
    htmlFiles.forEach(filename => {
      const filePath = join(docsPath, filename);
      const content = readFileSync(filePath, 'utf-8');
      
      // Each page should link to most other pages (at least 3)
      const linkedPages = corePages.filter(page => content.includes(`href="${page}"`));
      expect(linkedPages.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('HTML Theme Support', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} theme support`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should have theme toggle element', () => {
        expect(htmlContent).toContain('data-role="theme-toggle"');
      });

      test('theme toggle should have label element', () => {
        const themeSection = htmlContent.match(/data-role="theme-toggle"[\s\S]*?<\/div>/);
        if (themeSection) {
          expect(themeSection[0]).toContain('data-label');
        }
      });
    });
  });
});

describe('HTML Script and Style Loading', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} resource loading`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should load script.js', () => {
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"[^>]*>/);
      });

      test('should load style.css', () => {
        expect(htmlContent).toMatch(/<link[^>]*href="style\.css"[^>]*>/);
      });

      test('script tag should be at end of body or have defer/async', () => {
        const scriptTags = htmlContent.match(/<script[^>]*src="script\.js"[^>]*>/g);
        if (scriptTags) {
          scriptTags.forEach(tag => {
            const hasDefer = tag.includes('defer');
            const hasAsync = tag.includes('async');
            const isAtEnd = htmlContent.indexOf(tag) > htmlContent.indexOf('</body>') - 200;
            
            expect(hasDefer || hasAsync || isAtEnd).toBe(true);
          });
        }
      });
    });
  });
});

describe('HTML Page-Specific Content', () => {
  test('index.html should have home page identifier', () => {
    const filePath = join(docsPath, 'index.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="home"/);
  });

  test('dashboard.html should have dashboard page identifier', () => {
    const filePath = join(docsPath, 'dashboard.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="dashboard"/);
  });

  test('api.html should have api page identifier', () => {
    const filePath = join(docsPath, 'api.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="api"/);
  });

  test('data.html should have data page identifier', () => {
    const filePath = join(docsPath, 'data.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="data"/);
  });

  test('docs.html should have docs page identifier', () => {
    const filePath = join(docsPath, 'docs.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="docs"/);
  });

  test('versions.html should have versions page identifier', () => {
    const filePath = join(docsPath, 'versions.html');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/data-page="versions"/);
  });
});

describe('HTML Sidebar Content', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} sidebar`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('sidebar should contain navigation links', () => {
        const sidebarContent = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        expect(sidebarContent).toBeTruthy();
        expect(sidebarContent[0]).toContain('<nav');
      });

      test('sidebar should have logo at the top', () => {
        const sidebarContent = htmlContent.match(/<aside class="sidebar">([\s\S]*?)<nav/);
        expect(sidebarContent).toBeTruthy();
        expect(sidebarContent[1]).toContain('data-logo');
      });

      test('sidebar should have theme toggle', () => {
        const sidebarContent = htmlContent.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        expect(sidebarContent[0]).toContain('data-role="theme-toggle"');
      });
    });
  });
});

describe('HTML Header Content', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} header`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('header should contain logo', () => {
        const headerContent = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        expect(headerContent).toBeTruthy();
        expect(headerContent[0]).toContain('data-logo');
      });

      test('header should have page title', () => {
        const headerContent = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        expect(headerContent[0]).toMatch(/<h1[^>]*>/);
      });

      test('header should have page description', () => {
        const headerContent = htmlContent.match(/<header>[\s\S]*?<\/header>/);
        // Look for description paragraph
        expect(headerContent[0]).toContain('<p');
      });
    });
  });
});

describe('HTML Semantic Structure', () => {
  htmlFiles.forEach(filename => {
    describe(`${filename} semantics`, () => {
      let htmlContent;

      beforeAll(() => {
        const filePath = join(docsPath, filename);
        htmlContent = readFileSync(filePath, 'utf-8');
      });

      test('should use semantic HTML5 elements', () => {
        const semanticElements = ['<header', '<nav', '<main', '<aside', '<section', '<article'];
        const usedElements = semanticElements.filter(el => htmlContent.includes(el));
        
        expect(usedElements.length).toBeGreaterThanOrEqual(4);
      });

      test('should have proper heading hierarchy', () => {
        const hasH1 = htmlContent.includes('<h1');
        expect(hasH1).toBe(true);
      });
    });
  });
});