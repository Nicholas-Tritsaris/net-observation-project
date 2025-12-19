/**
 * Integration tests for logo HTML changes across all pages
 * Validates that HTML files correctly reference logo.png with data-logo attribute
 */

const fs = require('fs');
const path = require('path');

describe('HTML Logo Integration', () => {
  const htmlFiles = [
    'docs/index.html',
    'docs/dashboard.html',
    'docs/api.html',
    'docs/data.html',
    'docs/docs.html',
    'docs/versions.html'
  ];

  htmlFiles.forEach(filePath => {
    describe(path.basename(filePath), () => {
      let htmlContent;

      beforeAll(() => {
        htmlContent = fs.readFileSync(filePath, 'utf-8');
      });

      test('should contain sidebar logo image', () => {
        expect(htmlContent).toMatch(/<aside[^>]*class="sidebar"[\s\S]*?<img[^>]*src="logo\.png"/);
      });

      test('should contain header logo image', () => {
        expect(htmlContent).toMatch(/<header[\s\S]*?<img[^>]*src="logo\.png"/);
      });

      test('should have data-logo attribute on sidebar image', () => {
        const sidebarSection = htmlContent.match(/<aside[^>]*class="sidebar"[\s\S]*?<\/aside>/);
        expect(sidebarSection).not.toBeNull();
        expect(sidebarSection[0]).toMatch(/<img[^>]*data-logo/);
      });

      test('should have data-logo attribute on header image', () => {
        const headerSection = htmlContent.match(/<header[\s\S]*?<\/header>/);
        expect(headerSection).not.toBeNull();
        expect(headerSection[0]).toMatch(/<img[^>]*data-logo/);
      });

      test('should have alt text on sidebar logo', () => {
        const sidebarSection = htmlContent.match(/<aside[^>]*class="sidebar"[\s\S]*?<\/aside>/);
        expect(sidebarSection).not.toBeNull();
        expect(sidebarSection[0]).toMatch(/<img[^>]*alt="[^"]*"/);
      });

      test('should have alt text on header logo', () => {
        const headerSection = htmlContent.match(/<header[\s\S]*?<\/header>/);
        expect(headerSection).not.toBeNull();
        expect(headerSection[0]).toMatch(/<img[^>]*alt="[^"]*"/);
      });

      test('should not contain old .logo-placeholder div in sidebar', () => {
        const sidebarSection = htmlContent.match(/<aside[^>]*class="sidebar"[\s\S]*?<\/aside>/);
        expect(sidebarSection).not.toBeNull();
        expect(sidebarSection[0]).not.toMatch(/<div[^>]*class="logo-placeholder"[^>]*>NOP<\/div>/);
      });

      test('should not contain old .logo-inline div in header', () => {
        const headerSection = htmlContent.match(/<header[\s\S]*?<\/header>/);
        expect(headerSection).not.toBeNull();
        expect(headerSection[0]).not.toMatch(/<div[^>]*class="logo-inline"[^>]*>NOP<\/div>/);
      });

      test('sidebar logo should have inline styles', () => {
        const sidebarSection = htmlContent.match(/<aside[^>]*class="sidebar"[\s\S]*?<\/aside>/);
        expect(sidebarSection).not.toBeNull();
        const imgTag = sidebarSection[0].match(/<img[^>]*data-logo[^>]*>/);
        expect(imgTag).not.toBeNull();
        expect(imgTag[0]).toMatch(/style="[^"]*width:\s*100%/);
        expect(imgTag[0]).toMatch(/border-radius:\s*14px/);
        expect(imgTag[0]).toMatch(/margin-bottom:\s*1rem/);
      });

      test('header logo should have CSS class', () => {
        const headerSection = htmlContent.match(/<header[\s\S]*?<\/header>/);
        expect(headerSection).not.toBeNull();
        const imgTag = headerSection[0].match(/<img[^>]*data-logo[^>]*>/);
        expect(imgTag).not.toBeNull();
        expect(imgTag[0]).toMatch(/class="logo"/);
      });
    });
  });

  describe('Consistency Across Pages', () => {
    test('all pages should use the same logo.png source', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const logoSrcs = content.match(/src="logo\.png"/g);
        expect(logoSrcs).not.toBeNull();
        expect(logoSrcs.length).toBeGreaterThanOrEqual(2); // At least sidebar and header
      });
    });

    test('all pages should include script.js', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<script[^>]*src="script\.js"/);
      });
    });

    test('all pages should include style.css', () => {
      htmlFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/<link[^>]*href="style\.css"/);
      });
    });
  });
});