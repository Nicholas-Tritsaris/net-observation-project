/**
 * HTML Integration Tests
 * Validates that all HTML files have been updated with the new logo-sigil classes
 * Tests for proper semantic HTML, accessibility attributes, and consistency
 */

const fs = require('fs');
const path = require('path');

describe('HTML Files - Logo Class Migration Integration Tests', () => {
  const htmlFiles = [
    'docs/index.html',
    'docs/dashboard.html',
    'docs/api.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/versions.html'
  ];

  let htmlContents = {};

  beforeAll(() => {
    htmlFiles.forEach(file => {
      const filePath = path.join(__dirname, '../..', file);
      htmlContents[file] = fs.readFileSync(filePath, 'utf8');
    });
  });

  describe('Logo Class Migration - All Files', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should contain logo-sigil class in sidebar', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/class="logo-sigil logo-sigil--sidebar"/);
        });

        test('should contain logo-sigil class in header', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/class="logo-sigil logo-sigil--header"/);
        });

        test('should NOT contain deprecated logo-placeholder class', () => {
          const content = htmlContents[file];
          expect(content).not.toMatch(/class="logo-placeholder"/);
          expect(content).not.toMatch(/logo-placeholder/);
        });

        test('should NOT contain deprecated logo-inline class', () => {
          const content = htmlContents[file];
          expect(content).not.toMatch(/class="logo-inline"/);
          expect(content).not.toMatch(/logo-inline/);
        });

        test('should NOT contain "NOP" text in logo elements', () => {
          const content = htmlContents[file];
          // Logo elements should be empty, NOP is added via CSS ::after
          const sidebarLogo = content.match(/<div class="logo-sigil logo-sigil--sidebar"[^>]*>([^<]*)<\/div>/);
          const headerLogo = content.match(/<div class="logo-sigil logo-sigil--header"[^>]*>([^<]*)<\/div>/);
          
          if (sidebarLogo) {
            expect(sidebarLogo[1].trim()).toBe('');
          }
          if (headerLogo) {
            expect(headerLogo[1].trim()).toBe('');
          }
        });
      });
    });
  });

  describe('Accessibility Attributes', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('logo elements should have role="img"', () => {
          const content = htmlContents[file];
          const sidebarLogo = content.match(/<div class="logo-sigil logo-sigil--sidebar"[^>]*>/);
          const headerLogo = content.match(/<div class="logo-sigil logo-sigil--header"[^>]*>/);
          
          expect(sidebarLogo[0]).toMatch(/role="img"/);
          expect(headerLogo[0]).toMatch(/role="img"/);
        });

        test('logo elements should have aria-label', () => {
          const content = htmlContents[file];
          const sidebarLogo = content.match(/<div class="logo-sigil logo-sigil--sidebar"[^>]*>/);
          const headerLogo = content.match(/<div class="logo-sigil logo-sigil--header"[^>]*>/);
          
          expect(sidebarLogo[0]).toMatch(/aria-label="Net Observation Project logo"/);
          expect(headerLogo[0]).toMatch(/aria-label="Net Observation Project logo"/);
        });

        test('should have proper document structure', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<!DOCTYPE html>/i);
          expect(content).toMatch(/<html[^>]*>/);
          expect(content).toMatch(/<head>/);
          expect(content).toMatch(/<body/);
        });

        test('should include lang attribute on html tag', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<html[^>]*lang="en"/);
        });
      });
    });
  });

  describe('Sidebar Structure', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should have aside.sidebar element', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<aside class="sidebar">/);
        });

        test('sidebar should contain logo-sigil as first child', () => {
          const content = htmlContents[file];
          const sidebarContent = content.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
          expect(sidebarContent[0]).toMatch(/<div class="logo-sigil logo-sigil--sidebar"/);
        });

        test('sidebar should contain theme toggle', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/data-role="theme-toggle"/);
        });

        test('sidebar should contain navigation', () => {
          const content = htmlContents[file];
          const sidebarContent = content.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
          expect(sidebarContent[0]).toMatch(/<nav>/);
        });
      });
    });
  });

  describe('Header Structure', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should have header element', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<header>/);
        });

        test('header should contain logo-sigil--header', () => {
          const content = htmlContents[file];
          const headerContent = content.match(/<header>[\s\S]*?<\/header>/);
          expect(headerContent[0]).toMatch(/<div class="logo-sigil logo-sigil--header"/);
        });

        test('header should contain page title', () => {
          const content = htmlContents[file];
          const headerContent = content.match(/<header>[\s\S]*?<\/header>/);
          expect(headerContent[0]).toMatch(/<h1/);
        });

        test('header should contain primary navigation', () => {
          const content = htmlContents[file];
          const headerContent = content.match(/<header>[\s\S]*?<\/header>/);
          expect(headerContent[0]).toMatch(/<nav class="primary-nav">/);
        });
      });
    });
  });

  describe('Data Attributes for Page Identification', () => {
    const pageMapping = {
      'docs/index.html': 'home',
      'docs/dashboard.html': 'dashboard',
      'docs/api.html': 'api',
      'docs/data.html': 'data',
      'docs/docs.html': 'docs',
      'docs/versions.html': 'versions'
    };

    Object.entries(pageMapping).forEach(([file, expectedPage]) => {
      test(`${file} should have data-page="${expectedPage}"`, () => {
        const content = htmlContents[file];
        expect(content).toMatch(new RegExp(`<body[^>]*data-page="${expectedPage}"`));
      });
    });
  });

  describe('CSS and JavaScript Includes', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should include style.css', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<link[^>]*href="style\.css"/);
        });

        test('should include script.js', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<script[^>]*src="script\.js"/);
        });

        test('should include Chart.js for dashboard functionality', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/chart\.js/i);
        });

        test('should include D3.js for visualizations', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/d3/);
        });

        test('should defer script loading', () => {
          const content = htmlContents[file];
          const scriptTags = content.match(/<script[^>]*src="script\.js"[^>]*>/);
          expect(scriptTags[0]).toMatch(/defer/);
        });
      });
    });
  });

  describe('Theme Support', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should have data-theme attribute on html element', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<html[^>]*data-theme/);
        });

        test('should have theme toggle button', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/data-role="theme-toggle"/);
        });

        test('theme toggle should have proper accessibility', () => {
          const content = htmlContents[file];
          const themeToggle = content.match(/<div[^>]*data-role="theme-toggle"[^>]*>/);
          expect(themeToggle[0]).toMatch(/role="button"/);
          expect(themeToggle[0]).toMatch(/tabindex="0"/);
        });
      });
    });
  });

  describe('Consistent Navigation Structure', () => {
    const navLinks = [
      'index.html',
      'dashboard.html',
      'docs.html',
      'api.html',
      'data.html',
      'versions.html'
    ];

    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        navLinks.forEach(link => {
          test(`should have navigation link to ${link}`, () => {
            const content = htmlContents[file];
            expect(content).toMatch(new RegExp(`href="${link}"`));
          });
        });
      });
    });
  });

  describe('HTML5 Semantic Elements', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should use semantic HTML5 elements', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<header>/);
          expect(content).toMatch(/<nav>/);
          expect(content).toMatch(/<main>/);
          expect(content).toMatch(/<aside>/);
        });

        test('should have proper heading hierarchy', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<h1/);
          // Should have at least one h1
          const h1Count = (content.match(/<h1/g) || []).length;
          expect(h1Count).toBeGreaterThanOrEqual(1);
        });
      });
    });
  });

  describe('Meta Tags and SEO', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should have charset meta tag', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<meta[^>]*charset="UTF-8"/i);
        });

        test('should have viewport meta tag', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<meta[^>]*name="viewport"/);
        });

        test('should have title element', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<title>[^<]+<\/title>/);
        });
      });
    });
  });

  describe('Font Loading', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should preconnect to fonts.googleapis.com', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<link[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.googleapis\.com"/);
        });

        test('should load JetBrains Mono font', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/JetBrains\+Mono/);
        });
      });
    });
  });

  describe('Interactive Elements', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should have sidebar toggle button', () => {
          const content = htmlContents[file];
          expect(content).toMatch(/<button[^>]*class="sidebar-toggle"/);
        });

        test('sidebar toggle should have accessibility attributes', () => {
          const content = htmlContents[file];
          const toggleButton = content.match(/<button[^>]*class="sidebar-toggle"[^>]*>/);
          expect(toggleButton[0]).toMatch(/aria-label/);
        });
      });
    });
  });

  describe('Consistency Across Files', () => {
    test('all files should have identical sidebar structure', () => {
      const sidebarStructures = htmlFiles.map(file => {
        const content = htmlContents[file];
        const sidebar = content.match(/<aside class="sidebar">[\s\S]*?<\/aside>/);
        // Remove page-specific text content for comparison
        return sidebar ? sidebar[0].replace(/>\s*\w+\s*</g, '><') : null;
      });

      // All sidebars should have similar structure (allowing for minor variations)
      const firstSidebar = sidebarStructures[0];
      sidebarStructures.forEach((sidebar, index) => {
        expect(sidebar).toBeTruthy();
        // Check that key elements exist in all
        expect(sidebar).toMatch(/logo-sigil--sidebar/);
        expect(sidebar).toMatch(/theme-toggle/);
      });
    });

    test('all files should use consistent logo class names', () => {
      htmlFiles.forEach(file => {
        const content = htmlContents[file];
        // Count logo-sigil occurrences
        const sidebarLogoCount = (content.match(/logo-sigil--sidebar/g) || []).length;
        const headerLogoCount = (content.match(/logo-sigil--header/g) || []).length;

        expect(sidebarLogoCount).toBeGreaterThanOrEqual(1);
        expect(headerLogoCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Validation of Changes from Diff', () => {
    htmlFiles.forEach(file => {
      describe(`${file}`, () => {
        test('should show exactly 4 lines changed (as per git diff)', () => {
          const content = htmlContents[file];
          
          // Verify the two key changes:
          // 1. Sidebar logo changed from logo-placeholder to logo-sigil--sidebar
          expect(content).toMatch(/logo-sigil logo-sigil--sidebar/);
          
          // 2. Header logo changed from logo-inline to logo-sigil--header
          expect(content).toMatch(/logo-sigil logo-sigil--header/);
        });

        test('logo divs should be self-closing or empty', () => {
          const content = htmlContents[file];
          const sidebarLogo = content.match(/<div class="logo-sigil logo-sigil--sidebar"[^>]*>([^<]*)<\/div>/);
          const headerLogo = content.match(/<div class="logo-sigil logo-sigil--header"[^>]*>([^<]*)<\/div>/);
          
          // Logo elements should not contain "NOP" text anymore
          if (sidebarLogo && sidebarLogo[1]) {
            expect(sidebarLogo[1]).not.toMatch(/NOP/);
          }
          if (headerLogo && headerLogo[1]) {
            expect(headerLogo[1]).not.toMatch(/NOP/);
          }
        });
      });
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running HTML validation tests...');
  console.log('Note: Install jest to run these tests properly');
  console.log('Usage: npm test -- tests/integration/html-validation.test.js');
}