/**
 * Tests for README.md
 * Validates documentation quality, link integrity, and content accuracy
 */

const fs = require('fs');
const path = require('path');

describe('README.md Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    readmeContent = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
  });

  describe('Document structure', () => {
    it('should have a title heading', () => {
      expect(readmeContent).toMatch(/^#\s+Net Observation Project/m);
    });

    it('should have main sections', () => {
      expect(readmeContent).toMatch(/##\s+Directory Layout/);
      expect(readmeContent).toMatch(/##\s+Features/);
      expect(readmeContent).toMatch(/##\s+Running Locally/);
      expect(readmeContent).toMatch(/##\s+Deploying to Cloudflare Pages/);
      expect(readmeContent).toMatch(/##\s+Backend Function/);
      expect(readmeContent).toMatch(/##\s+Auth0 Integration/);
      expect(readmeContent).toMatch(/##\s+Plugin System/);
    });

    it('should have proper heading hierarchy', () => {
      const headings = readmeContent.match(/^#{1,6}\s+.+$/gm) || [];
      expect(headings.length).toBeGreaterThan(5);
      
      // First heading should be h1
      expect(headings[0]).toMatch(/^#\s+/);
    });

    it('should have code blocks with proper formatting', () => {
      expect(readmeContent).toMatch(/```[\s\S]*?```/);
    });
  });

  describe('Branding note section - NEW/MODIFIED', () => {
    it('should have branding note as blockquote after Directory Layout', () => {
      expect(readmeContent).toMatch(/>\s*\*\*Branding note:\*\*/);
    });

    it('should mention logo.png in the branding note', () => {
      const brandingNote = readmeContent.match(/>\s*\*\*Branding note:\*\*[^\n]+/);
      expect(brandingNote).toBeTruthy();
      expect(brandingNote[0]).toContain('logo.png');
    });

    it('should specify recommended logo dimensions', () => {
      expect(readmeContent).toMatch(/512×512/);
    });

    it('should mention transparency requirement', () => {
      const brandingSection = readmeContent.match(/>\s*\*\*Branding note:\*\*[\s\S]*?##/);
      expect(brandingSection[0]).toMatch(/transparency/);
    });

    it('should be positioned before Features section', () => {
      const brandingIndex = readmeContent.indexOf('**Branding note:**');
      const featuresIndex = readmeContent.indexOf('## Features');
      expect(brandingIndex).toBeGreaterThan(0);
      expect(brandingIndex).toBeLessThan(featuresIndex);
    });

    it('should NOT have old "## Branding" section heading', () => {
      expect(readmeContent).not.toMatch(/^##\s+Branding$/m);
    });

    it('should mention that layouts reference docs/logo.png', () => {
      expect(readmeContent).toMatch(/layouts reference.*docs\/logo\.png/);
    });

    it('should mention that the repository intentionally leaves the asset out', () => {
      const brandingSection = readmeContent.match(/>\s*\*\*Branding note:\*\*[^\n]+/);
      expect(brandingSection[0]).toMatch(/intentionally leaves that asset out/);
    });

    it('should instruct users to drop in their own PNG', () => {
      expect(readmeContent).toMatch(/drop in your own PNG/);
    });
  });

  describe('Directory layout', () => {
    it('should document docs/ directory', () => {
      expect(readmeContent).toMatch(/docs\/.*Frontend assets/);
    });

    it('should document functions/ directory', () => {
      expect(readmeContent).toMatch(/functions\/api\/.*Pages Functions/);
    });

    it('should document README.md file', () => {
      expect(readmeContent).toMatch(/README\.md.*documentation/);
    });

    it('should document .gitignore file', () => {
      expect(readmeContent).toMatch(/\.gitignore.*ignores/);
    });

    it('should use proper code block formatting for directory tree', () => {
      const directoryBlock = readmeContent.match(/```[\s\S]*?net-observation-project\/[\s\S]*?```/);
      expect(directoryBlock).toBeTruthy();
    });
  });

  describe('Features list', () => {
    it('should list cyber-neon theme feature', () => {
      expect(readmeContent).toMatch(/cyber-neon theme/i);
    });

    it('should list sidebar navigation feature', () => {
      expect(readmeContent).toMatch(/sidebar navigation/i);
    });

    it('should list chart and visualization features', () => {
      expect(readmeContent).toMatch(/Chart\.js/);
      expect(readmeContent).toMatch(/D3.*heatmap/);
    });

    it('should list terminal feature', () => {
      expect(readmeContent).toMatch(/terminal/i);
    });

    it('should list data visualizer feature', () => {
      expect(readmeContent).toMatch(/JSON\/CSV.*visuali[sz]er/i);
    });

    it('should list Auth0 integration feature', () => {
      expect(readmeContent).toMatch(/Auth0/);
    });

    it('should list versions hub feature', () => {
      expect(readmeContent).toMatch(/versions hub/i);
    });

    it('should use bullet points for features', () => {
      const featuresSection = readmeContent.match(/## Features[\s\S]*?##/);
      expect(featuresSection[0]).toMatch(/^- /m);
    });
  });

  describe('Running locally instructions', () => {
    it('should have numbered steps', () => {
      const runningSection = readmeContent.match(/## Running Locally[\s\S]*?##/);
      expect(runningSection[0]).toMatch(/1\.\s+\*\*Clone/);
      expect(runningSection[0]).toMatch(/2\.\s+\*\*Serve/);
      expect(runningSection[0]).toMatch(/3\.\s+\*\*Configure/);
      expect(runningSection[0]).toMatch(/4\.\s+\*\*Run/);
    });

    it('should include http-server command', () => {
      expect(readmeContent).toMatch(/npx http-server docs/);
    });

    it('should include wrangler pages dev command', () => {
      expect(readmeContent).toMatch(/npx wrangler pages dev/);
    });

    it('should document environment variables', () => {
      expect(readmeContent).toMatch(/CENSYS_API_ID/);
      expect(readmeContent).toMatch(/CENSYS_API_SECRET/);
    });

    it('should provide localhost URL for function', () => {
      expect(readmeContent).toMatch(/localhost:8788\/api\/censys-summary/);
    });

    it('should use code blocks for commands', () => {
      const runningSection = readmeContent.match(/## Running Locally[\s\S]*?##/);
      const codeBlocks = runningSection[0].match(/```bash[\s\S]*?```/g);
      expect(codeBlocks).toBeTruthy();
      expect(codeBlocks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Deployment instructions', () => {
    it('should have numbered deployment steps', () => {
      const deploySection = readmeContent.match(/## Deploying to Cloudflare Pages[\s\S]*?##/);
      expect(deploySection[0]).toMatch(/1\.\s+\*\*Create/);
      expect(deploySection[0]).toMatch(/2\.\s+\*\*Set/);
      expect(deploySection[0]).toMatch(/3\.\s+\*\*Add/);
      expect(deploySection[0]).toMatch(/4\.\s+\*\*Deploy/);
    });

    it('should specify build output directory', () => {
      expect(readmeContent).toMatch(/build output directory.*docs/i);
    });

    it('should list required environment variables', () => {
      const deploySection = readmeContent.match(/## Deploying to Cloudflare Pages[\s\S]*?##/);
      expect(deploySection[0]).toContain('CENSYS_API_ID');
      expect(deploySection[0]).toContain('CENSYS_API_SECRET');
    });

    it('should mention Pages Functions', () => {
      expect(readmeContent).toMatch(/Pages Function/);
    });
  });

  describe('Backend function documentation', () => {
    it('should describe API endpoints called', () => {
      expect(readmeContent).toMatch(/\/hosts\/search/);
      expect(readmeContent).toMatch(/\/hosts\/stats\/services/);
      expect(readmeContent).toMatch(/\/hosts\/stats\/location/);
    });

    it('should provide example JSON response', () => {
      const backendSection = readmeContent.match(/## Backend Function[\s\S]*?##/);
      expect(backendSection[0]).toMatch(/```json[\s\S]*?```/);
    });

    it('should document response schema fields', () => {
      expect(readmeContent).toMatch(/total_hosts/);
      expect(readmeContent).toMatch(/total_services/);
      expect(readmeContent).toMatch(/last_sync/);
      expect(readmeContent).toMatch(/countries/);
      expect(readmeContent).toMatch(/services/);
    });

    it('should mention error handling', () => {
      expect(readmeContent).toMatch(/error/i);
      expect(readmeContent).toMatch(/502/);
    });

    it('should describe parallel API calls', () => {
      expect(readmeContent).toMatch(/parallel/i);
    });
  });

  describe('Auth0 integration', () => {
    it('should explain where to configure Auth0', () => {
      expect(readmeContent).toMatch(/settings panel/i);
    });

    it('should mention Auth0 domain and client ID', () => {
      expect(readmeContent).toMatch(/Auth0 domain/);
      expect(readmeContent).toMatch(/client ID/);
    });

    it('should mention Login/Logout functionality', () => {
      expect(readmeContent).toMatch(/Login.*Logout/);
    });

    it('should reference Auth0 SPA SDK', () => {
      expect(readmeContent).toMatch(/Auth0 SPA SDK/i);
    });
  });

  describe('Plugin system', () => {
    it('should provide code example for plugin registration', () => {
      const pluginSection = readmeContent.match(/## Plugin System[\s\S]*$/);
      expect(pluginSection[0]).toMatch(/```html[\s\S]*?registerPlugin[\s\S]*?```/);
    });

    it('should document plugin structure', () => {
      expect(readmeContent).toMatch(/name:/);
      expect(readmeContent).toMatch(/command:/);
      expect(readmeContent).toMatch(/run/);
    });

    it('should mention terminal commands', () => {
      const pluginSection = readmeContent.match(/## Plugin System[\s\S]*$/);
      expect(pluginSection[0]).toMatch(/terminal command/i);
    });

    it('should mention app state access', () => {
      const pluginSection = readmeContent.match(/## Plugin System[\s\S]*$/);
      expect(pluginSection[0]).toMatch(/state/);
    });

    it('should mention log helper', () => {
      const pluginSection = readmeContent.match(/## Plugin System[\s\S]*$/);
      expect(pluginSection[0]).toMatch(/log.*helper/i);
    });
  });

  describe('Code quality', () => {
    it('should not have broken markdown links', () => {
      const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      links.forEach(link => {
        const url = link.match(/\(([^)]+)\)/)[1];
        // Internal links should not start with http
        if (!url.startsWith('http')) {
          expect(url).not.toContain(' '); // No spaces in paths
        }
      });
    });

    it('should use consistent code block language tags', () => {
      const codeBlocks = readmeContent.match(/```(\w+)/g) || [];
      const languages = codeBlocks.map(block => block.replace('```', ''));
      
      // Should use standard language identifiers
      languages.forEach(lang => {
        expect(['bash', 'json', 'html', 'javascript', '']).toContain(lang);
      });
    });

    it('should have consistent bullet point formatting', () => {
      const bullets = readmeContent.match(/^-\s+/gm) || [];
      expect(bullets.length).toBeGreaterThan(5);
      
      // All should have space after dash
      bullets.forEach(bullet => {
        expect(bullet).toBe('- ');
      });
    });

    it('should not have trailing whitespace on lines', () => {
      const lines = readmeContent.split('\n');
      lines.forEach((line, index) => {
        if (line.endsWith(' ') || line.endsWith('\t')) {
          // Allow trailing spaces for markdown line breaks (2+ spaces)
          if (!/\s{2,}$/.test(line)) {
            expect(line.trimEnd()).toBe(line);
          }
        }
      });
    });

    it('should not have multiple consecutive blank lines', () => {
      expect(readmeContent).not.toMatch(/\n{4,}/);
    });

    it('should end with a newline', () => {
      expect(readmeContent.endsWith('\n')).toBe(true);
    });
  });

  describe('Technical accuracy', () => {
    it('should reference correct file paths', () => {
      expect(readmeContent).toMatch(/docs\//);
      expect(readmeContent).toMatch(/functions\/api\//);
    });

    it('should reference correct function file name', () => {
      expect(readmeContent).toMatch(/censys-summary\.js/);
    });

    it('should reference correct API endpoint path', () => {
      expect(readmeContent).toMatch(/\/api\/censys-summary/);
    });

    it('should specify correct Pages Functions location', () => {
      expect(readmeContent).toMatch(/functions\/api\/censys-summary\.js/);
    });

    it('should have valid JSON in examples', () => {
      const jsonBlocks = readmeContent.match(/```json\s*([\s\S]*?)```/g) || [];
      jsonBlocks.forEach(block => {
        const json = block.replace(/```json\s*/, '').replace(/```$/, '').trim();
        expect(() => JSON.parse(json)).not.toThrow();
      });
    });
  });

  describe('Completeness', () => {
    it('should describe project purpose', () => {
      const firstParagraph = readmeContent.split('\n\n')[1];
      expect(firstParagraph).toMatch(/observability/i);
      expect(firstParagraph).toMatch(/Cloudflare Pages/);
      expect(firstParagraph).toMatch(/Censys/);
    });

    it('should provide all necessary setup information', () => {
      expect(readmeContent).toMatch(/clone/i);
      expect(readmeContent).toMatch(/install/i);
      expect(readmeContent).toMatch(/serve/i);
      expect(readmeContent).toMatch(/configure/i);
    });

    it('should document all major features', () => {
      expect(readmeContent).toMatch(/theme/i);
      expect(readmeContent).toMatch(/chart/i);
      expect(readmeContent).toMatch(/terminal/i);
      expect(readmeContent).toMatch(/auth/i);
      expect(readmeContent).toMatch(/plugin/i);
    });

    it('should explain deployment process', () => {
      const deploySection = readmeContent.match(/## Deploying[\s\S]*?##/);
      expect(deploySection).toBeTruthy();
      expect(deploySection[0].length).toBeGreaterThan(200);
    });
  });

  describe('User experience', () => {
    it('should have clear section headers', () => {
      const headers = readmeContent.match(/^##\s+[A-Z].+$/gm) || [];
      headers.forEach(header => {
        // Headers should be capitalized and descriptive
        expect(header.length).toBeGreaterThan(5);
        expect(header).toMatch(/^##\s+[A-Z]/);
      });
    });

    it('should use bold for emphasis on key terms', () => {
      expect(readmeContent).toMatch(/\*\*[^*]+\*\*/);
    });

    it('should provide context before code examples', () => {
      const codeBlocks = readmeContent.match(/[^\n]*\n```/g) || [];
      codeBlocks.forEach(block => {
        // Line before code block should not be empty
        const lineBefore = block.split('\n')[0];
        expect(lineBefore.trim().length).toBeGreaterThan(0);
      });
    });

    it('should use consistent terminology', () => {
      // Check that we consistently refer to the same concepts
      expect(readmeContent).toMatch(/Pages Function/);
      expect(readmeContent).toMatch(/Cloudflare Pages/);
      
      // Should not mix different terms for the same thing
      const pagesCount = (readmeContent.match(/Cloudflare Pages/g) || []).length;
      expect(pagesCount).toBeGreaterThan(2);
    });
  });

  describe('Branding section changes - Detailed validation', () => {
    it('should have branding note moved from section to blockquote', () => {
      // Old location check
      const oldSectionIndex = readmeContent.indexOf('## Branding');
      expect(oldSectionIndex).toBe(-1);
      
      // New location check - should be after Directory Layout
      const directoryLayoutIndex = readmeContent.indexOf('## Directory Layout');
      const featuresIndex = readmeContent.indexOf('## Features');
      const brandingNoteIndex = readmeContent.indexOf('**Branding note:**');
      
      expect(brandingNoteIndex).toBeGreaterThan(directoryLayoutIndex);
      expect(brandingNoteIndex).toBeLessThan(featuresIndex);
    });

    it('should use blockquote formatting for branding note', () => {
      const lines = readmeContent.split('\n');
      let foundBrandingNote = false;
      
      lines.forEach(line => {
        if (line.includes('**Branding note:**')) {
          expect(line).toMatch(/^>\s+\*\*Branding note:\*\*/);
          foundBrandingNote = true;
        }
      });
      
      expect(foundBrandingNote).toBe(true);
    });

    it('should contain the complete branding note in one blockquote', () => {
      const brandingNoteMatch = readmeContent.match(/>\s+\*\*Branding note:\*\*[^\n]+/);
      expect(brandingNoteMatch).toBeTruthy();
      
      const note = brandingNoteMatch[0];
      expect(note).toContain('logo.png');
      expect(note).toContain('512×512');
      expect(note).toContain('transparency');
      expect(note).toContain('header');
      expect(note).toContain('sidebar');
    });

    it('should not mention stylised textual logo placeholder', () => {
      // Old content should be removed
      expect(readmeContent).not.toMatch(/stylised textual logo placeholder/i);
      expect(readmeContent).not.toMatch(/textual logo/i);
    });

    it('should not mention "to add your own branding"', () => {
      // Old phrasing should be replaced
      expect(readmeContent).not.toMatch(/to add your own branding/i);
    });
  });
});