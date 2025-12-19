/**
 * README.md Validation Tests
 * Tests documentation changes for branding section update
 */

const fs = require('fs');
const path = require('path');

describe('README.md Documentation', () => {
  let readmeContent;
  
  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf-8');
  });

  describe('Branding Section', () => {
    test('should not contain old "Branding" heading', () => {
      expect(readmeContent).not.toMatch(/^##\s+Branding$/m);
    });

    test('should contain branding note about CSS-generated neon sigil', () => {
      expect(readmeContent).toMatch(/Branding note:/i);
    });

    test('should mention CSS-generated neon sigil', () => {
      expect(readmeContent).toMatch(/CSS-generated neon sigil/i);
    });

    test('should mention .logo-sigil styles', () => {
      expect(readmeContent).toMatch(/\.logo-sigil/);
    });

    test('should not reference logo.png file', () => {
      expect(readmeContent).not.toMatch(/logo\.png/);
    });

    test('should not mention 512×512 dimensions', () => {
      expect(readmeContent).not.toMatch(/512×512/);
    });

    test('should not mention automatic adoption of logo', () => {
      expect(readmeContent).not.toMatch(/layout will adopt it automatically/);
    });

    test('should indicate ability to add real imagery later', () => {
      expect(readmeContent).toMatch(/drop in real imagery later/i);
    });

    test('should mention adjusting styles or swapping assets', () => {
      expect(readmeContent).toMatch(/Adjust.*styles.*swap.*assets/is);
    });
  });

  describe('Document Structure', () => {
    test('should have main heading', () => {
      expect(readmeContent).toMatch(/^#\s+Net Observation Project/m);
    });

    test('should have Directory Layout section', () => {
      expect(readmeContent).toMatch(/^##\s+Directory Layout/m);
    });

    test('should have Features section', () => {
      expect(readmeContent).toMatch(/^##\s+Features/m);
    });

    test('should have Running Locally section', () => {
      expect(readmeContent).toMatch(/^##\s+Running Locally/m);
    });

    test('should have Deploying section', () => {
      expect(readmeContent).toMatch(/^##\s+Deploying to Cloudflare Pages/m);
    });

    test('should have Backend Function section', () => {
      expect(readmeContent).toMatch(/^##\s+Backend Function/m);
    });

    test('should have Auth0 Integration section', () => {
      expect(readmeContent).toMatch(/^##\s+Auth0 Integration/m);
    });

    test('should have Plugin System section', () => {
      expect(readmeContent).toMatch(/^##\s+Plugin System/m);
    });
  });

  describe('Code Examples', () => {
    test('should contain bash code blocks', () => {
      expect(readmeContent).toMatch(/```bash/);
    });

    test('should contain JSON code blocks', () => {
      expect(readmeContent).toMatch(/```json/);
    });

    test('should contain HTML code block', () => {
      expect(readmeContent).toMatch(/```html/);
    });

    test('should have properly closed code blocks', () => {
      const openBlocks = (readmeContent.match(/```/g) || []).length;
      expect(openBlocks % 2).toBe(0);
    });
  });

  describe('Feature List', () => {
    test('should mention cyber-neon theme', () => {
      expect(readmeContent).toMatch(/cyber-neon theme/i);
    });

    test('should mention collapsible sidebar', () => {
      expect(readmeContent).toMatch(/collapsible sidebar/i);
    });

    test('should mention Chart.js', () => {
      expect(readmeContent).toMatch(/Chart\.js/);
    });

    test('should mention D3 heatmap', () => {
      expect(readmeContent).toMatch(/D3.*heatmap/i);
    });

    test('should mention terminal-style command runner', () => {
      expect(readmeContent).toMatch(/terminal-style command runner/i);
    });

    test('should mention Auth0 integration', () => {
      expect(readmeContent).toMatch(/Auth0/);
    });

    test('should mention plugin system', () => {
      expect(readmeContent).toMatch(/plugin/i);
    });
  });

  describe('Installation Instructions', () => {
    test('should provide clone instructions', () => {
      expect(readmeContent).toMatch(/Clone the repository/i);
    });

    test('should mention http-server', () => {
      expect(readmeContent).toMatch(/http-server/);
    });

    test('should mention wrangler', () => {
      expect(readmeContent).toMatch(/wrangler/);
    });

    test('should provide environment variable setup', () => {
      expect(readmeContent).toMatch(/export CENSYS_API_ID/);
      expect(readmeContent).toMatch(/export CENSYS_API_SECRET/);
    });
  });

  describe('API Documentation', () => {
    test('should document API endpoint', () => {
      expect(readmeContent).toMatch(/\/api\/censys-summary/);
    });

    test('should show expected response format', () => {
      expect(readmeContent).toMatch(/total_hosts/);
      expect(readmeContent).toMatch(/total_services/);
      expect(readmeContent).toMatch(/last_sync/);
      expect(readmeContent).toMatch(/countries/);
      expect(readmeContent).toMatch(/services/);
    });

    test('should mention Censys API calls', () => {
      expect(readmeContent).toMatch(/\/hosts\/search/);
      expect(readmeContent).toMatch(/\/hosts\/stats\/services/);
      expect(readmeContent).toMatch(/\/hosts\/stats\/location/);
    });
  });

  describe('Links and References', () => {
    test('should not have broken internal links', () => {
      const internalLinks = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      internalLinks.forEach(link => {
        const url = link.match(/\(([^)]+)\)/)[1];
        if (!url.startsWith('http')) {
          // Should be a valid relative path or anchor
          expect(url).toMatch(/^[#./]/);
        }
      });
    });

    test('should have proper markdown formatting', () => {
      // Check for common markdown issues
      expect(readmeContent).not.toMatch(/\]\(/); // No space before link
      expect(readmeContent).not.toMatch(/\(\s+/); // No space after opening paren
    });
  });

  describe('Formatting and Style', () => {
    test('should use consistent heading levels', () => {
      const h1Count = (readmeContent.match(/^#\s+/gm) || []).length;
      expect(h1Count).toBe(1); // Only one main heading
    });

    test('should have consistent list formatting', () => {
      const lists = readmeContent.match(/^[-*]\s+/gm) || [];
      expect(lists.length).toBeGreaterThan(0);
    });

    test('should use inline code formatting', () => {
      expect(readmeContent).toMatch(/`[^`]+`/);
    });

    test('should not have trailing whitespace on lines', () => {
      const lines = readmeContent.split('\n');
      lines.forEach(line => {
        expect(line).not.toMatch(/\s+$/);
      });
    });
  });

  describe('Completeness', () => {
    test('should provide deployment instructions', () => {
      expect(readmeContent).toMatch(/deploy/i);
      expect(readmeContent).toMatch(/Cloudflare Pages/);
    });

    test('should document plugin registration', () => {
      expect(readmeContent).toMatch(/registerPlugin/);
    });

    test('should explain configuration options', () => {
      expect(readmeContent).toMatch(/Settings/i);
    });

    test('should mention authentication features', () => {
      expect(readmeContent).toMatch(/Login\/Logout/i);
    });
  });
});