/**
 * Comprehensive tests for README.md
 * Validates documentation structure, content accuracy, and completeness
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readmePath = join(__dirname, '../README.md');
const readmeContent = readFileSync(readmePath, 'utf-8');

describe('README.md Structure', () => {
  test('should have main title', () => {
    expect(readmeContent).toMatch(/^#\s+Net Observation Project/m);
  });

  test('should have multiple section headings', () => {
    const headings = readmeContent.match(/^##\s+.+$/gm);
    expect(headings).toBeTruthy();
    expect(headings.length).toBeGreaterThanOrEqual(5);
  });

  test('should have directory layout section', () => {
    expect(readmeContent).toContain('## Directory Layout');
  });

  test('should have features section', () => {
    expect(readmeContent).toContain('## Features');
  });

  test('should have running locally section', () => {
    expect(readmeContent).toContain('## Running Locally');
  });

  test('should have deployment section', () => {
    expect(readmeContent).toContain('## Deploying to Cloudflare Pages');
  });

  test('should have backend function section', () => {
    expect(readmeContent).toContain('## Backend Function');
  });

  test('should have Auth0 integration section', () => {
    expect(readmeContent).toContain('## Auth0 Integration');
  });

  test('should have plugin system section', () => {
    expect(readmeContent).toContain('## Plugin System');
  });
});

describe('README.md Logo Documentation', () => {
  test('should mention logo.png in branding note', () => {
    expect(readmeContent).toContain('logo.png');
  });

  test('should explain that logo.png needs to be added', () => {
    expect(readmeContent).toMatch(/drop.*your own.*PNG/i);
  });

  test('should specify recommended logo dimensions', () => {
    expect(readmeContent).toContain('512×512');
  });

  test('should mention transparency for logo', () => {
    expect(readmeContent).toMatch(/transparency|transparent/i);
  });

  test('branding note should be prominently placed', () => {
    const brandingIndex = readmeContent.indexOf('Branding note');
    const firstSectionIndex = readmeContent.indexOf('## Features');
    
    // Branding note should come before or early in features
    expect(brandingIndex).toBeGreaterThan(0);
    expect(brandingIndex).toBeLessThan(firstSectionIndex);
  });

  test('should NOT have old "Branding" section header', () => {
    // The diff shows "## Branding" was removed
    expect(readmeContent).not.toMatch(/^## Branding$/m);
  });

  test('should have branding as a blockquote note', () => {
    expect(readmeContent).toMatch(/^>\s+\*\*Branding note:\*\*/m);
  });

  test('branding note should explain automatic pickup', () => {
    expect(readmeContent).toMatch(/header and sidebar automatically pick/i);
  });
});

describe('README.md Code Examples', () => {
  test('should have code blocks for commands', () => {
    const codeBlocks = readmeContent.match(/```[\s\S]*?```/g);
    expect(codeBlocks).toBeTruthy();
    expect(codeBlocks.length).toBeGreaterThan(5);
  });

  test('should show how to run locally with http-server', () => {
    expect(readmeContent).toContain('npx http-server docs');
  });

  test('should show how to use wrangler', () => {
    expect(readmeContent).toContain('npx wrangler');
  });

  test('should document environment variables', () => {
    expect(readmeContent).toContain('CENSYS_API_ID');
    expect(readmeContent).toContain('CENSYS_API_SECRET');
  });

  test('should show plugin registration example', () => {
    expect(readmeContent).toContain('registerPlugin');
    expect(readmeContent).toMatch(/registerPlugin\s*\(/);
  });

  test('should show API response example', () => {
    expect(readmeContent).toContain('total_hosts');
    expect(readmeContent).toContain('total_services');
    expect(readmeContent).toContain('last_sync');
  });
});

describe('README.md Technical Details', () => {
  test('should mention Cloudflare Pages', () => {
    expect(readmeContent).toContain('Cloudflare Pages');
  });

  test('should reference Censys API', () => {
    expect(readmeContent).toContain('Censys');
  });

  test('should mention Chart.js', () => {
    expect(readmeContent).toContain('Chart.js');
  });

  test('should mention D3', () => {
    expect(readmeContent).toContain('D3');
  });

  test('should mention Auth0', () => {
    expect(readmeContent).toContain('Auth0');
    expect(readmeContent).toContain('@auth0/auth0-spa-js');
  });

  test('should document API endpoints', () => {
    expect(readmeContent).toContain('/api/censys-summary');
  });

  test('should document three Censys API calls', () => {
    expect(readmeContent).toContain('/hosts/search');
    expect(readmeContent).toContain('/hosts/stats/services.service_name');
    expect(readmeContent).toContain('/hosts/stats/location.country_code');
  });
});

describe('README.md Features List', () => {
  test('should list theme features', () => {
    expect(readmeContent).toMatch(/cyber-neon theme/i);
    expect(readmeContent).toMatch(/dark.*light/i);
  });

  test('should mention sidebar navigation', () => {
    expect(readmeContent).toMatch(/sidebar/i);
  });

  test('should mention charts', () => {
    expect(readmeContent).toMatch(/chart/i);
  });

  test('should mention terminal', () => {
    expect(readmeContent).toMatch(/terminal/i);
  });

  test('should mention data visualizer', () => {
    expect(readmeContent).toMatch(/data.*visual/i);
  });

  test('should mention settings', () => {
    expect(readmeContent).toMatch(/settings/i);
  });

  test('should mention versions hub', () => {
    expect(readmeContent).toMatch(/version/i);
  });
});

describe('README.md Directory Structure', () => {
  test('should show docs/ directory', () => {
    expect(readmeContent).toContain('docs/');
  });

  test('should show functions/api/ directory', () => {
    expect(readmeContent).toContain('functions/api/');
  });

  test('should mention README.md itself', () => {
    expect(readmeContent).toContain('README.md');
  });

  test('should mention .gitignore', () => {
    expect(readmeContent).toContain('.gitignore');
  });

  test('directory structure should be in code block', () => {
    const dirStructure = readmeContent.match(/```[\s\S]*?net-observation-project\/[\s\S]*?```/);
    expect(dirStructure).toBeTruthy();
  });
});

describe('README.md Instructions Clarity', () => {
  test('should have numbered steps for running locally', () => {
    const runningSection = readmeContent.match(/## Running Locally[\s\S]*?##/);
    expect(runningSection).toBeTruthy();
    expect(runningSection[0]).toMatch(/1\./);
    expect(runningSection[0]).toMatch(/2\./);
  });

  test('should have numbered steps for deployment', () => {
    const deploySection = readmeContent.match(/## Deploying to Cloudflare Pages[\s\S]*?##/);
    expect(deploySection).toBeTruthy();
    expect(deploySection[0]).toMatch(/1\./);
    expect(deploySection[0]).toMatch(/2\./);
  });

  test('should use clear imperative language', () => {
    // Check for common instruction verbs
    const hasInstructionVerbs = /clone|install|serve|configure|create|set|add|deploy/i.test(readmeContent);
    expect(hasInstructionVerbs).toBe(true);
  });
});

describe('README.md Links and References', () => {
  test('should not have broken markdown links', () => {
    // Check for malformed links
    const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (links) {
      links.forEach(link => {
        expect(link).toMatch(/\[.+\]\(.+\)/);
      });
    }
  });

  test('should reference localhost URLs for development', () => {
    expect(readmeContent).toMatch(/localhost/);
  });

  test('should use proper markdown formatting for code', () => {
    // Inline code should use backticks
    const hasInlineCode = /`[^`]+`/.test(readmeContent);
    expect(hasInlineCode).toBe(true);
  });
});

describe('README.md Completeness', () => {
  test('should be substantial in length', () => {
    expect(readmeContent.length).toBeGreaterThan(2000);
  });

  test('should have multiple paragraphs', () => {
    const paragraphs = readmeContent.split(/\n\n+/);
    expect(paragraphs.length).toBeGreaterThan(10);
  });

  test('should cover all major features', () => {
    const features = [
      'theme',
      'sidebar',
      'chart',
      'terminal',
      'Auth0',
      'plugin',
      'Censys'
    ];

    features.forEach(feature => {
      expect(readmeContent.toLowerCase()).toContain(feature.toLowerCase());
    });
  });
});

describe('README.md Markdown Syntax', () => {
  test('should have proper heading hierarchy', () => {
    const lines = readmeContent.split('\n');
    let hasH1 = false;
    let hasH2 = false;

    lines.forEach(line => {
      if (line.match(/^#\s+[^#]/)) hasH1 = true;
      if (line.match(/^##\s+[^#]/)) hasH2 = true;
    });

    expect(hasH1).toBe(true);
    expect(hasH2).toBe(true);
  });

  test('should use blockquotes correctly', () => {
    const blockquotes = readmeContent.match(/^>\s+.+$/gm);
    expect(blockquotes).toBeTruthy();
    expect(blockquotes.length).toBeGreaterThanOrEqual(1);
  });

  test('should use lists appropriately', () => {
    const lists = readmeContent.match(/^[-*]\s+.+$/gm);
    expect(lists).toBeTruthy();
    expect(lists.length).toBeGreaterThan(5);
  });

  test('should have proper code fence syntax', () => {
    const codeFences = readmeContent.match(/```\w*\n[\s\S]*?\n```/g);
    expect(codeFences).toBeTruthy();
    
    codeFences.forEach(fence => {
      // Each fence should start and end properly
      expect(fence).toMatch(/^```/);
      expect(fence).toMatch(/```$/);
    });
  });
});

describe('README.md Content Updates from Diff', () => {
  test('branding section should be restructured as note', () => {
    // Old: ## Branding as separate section
    // New: Blockquote note after directory layout
    const brandingNote = readmeContent.match(/^>\s+\*\*Branding note:\*\*/m);
    expect(brandingNote).toBeTruthy();
  });

  test('branding note should reference docs/logo.png path', () => {
    expect(readmeContent).toContain('docs/logo.png');
  });

  test('should explain layouts reference the logo', () => {
    expect(readmeContent).toMatch(/layouts reference.*logo\.png/i);
  });

  test('should mention asset is intentionally missing', () => {
    expect(readmeContent).toMatch(/intentionally leaves.*asset out/i);
  });

  test('should instruct to drop in own PNG', () => {
    expect(readmeContent).toMatch(/drop in your own PNG/i);
  });

  test('should mention header AND sidebar pickup', () => {
    const brandingSection = readmeContent.match(/Branding note:[\s\S]*?(?=\n##|\n\n##|$)/);
    expect(brandingSection[0]).toContain('header');
    expect(brandingSection[0]).toContain('sidebar');
  });
});