/**
 * Integration Tests
 * Tests for cross-file consistency and overall system behavior
 */

const fs = require('fs');
const path = require('path');

describe('Integration Tests - Logo Sigil System', () => {
  const htmlFiles = [
    'index.html',
    'dashboard.html',
    'api.html',
    'data.html',
    'docs.html',
    'versions.html'
  ];

  let cssContent, scriptContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '..', 'docs', 'style.css');
    const scriptPath = path.join(__dirname, '..', 'docs', 'script.js');
    
    cssContent = fs.readFileSync(cssPath, 'utf-8');
    scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  });

  describe('HTML-CSS Integration', () => {
    test('all logo-sigil classes in HTML should have CSS definitions', () => {
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        const classes = htmlContent.match(/class="[^"]*logo-sigil[^"]*"/g);
        expect(classes).toBeTruthy();
        
        if (classes) {
          classes.forEach(classAttr => {
            const classList = classAttr.match(/class="([^"]*)"/)[1].split(' ');
            classList.forEach(cls => {
              if (cls.includes('logo-sigil')) {
                expect(cssContent).toContain(`.${cls}`);
              }
            });
          });
        }
      });
    });

    test('CSS animations should be properly referenced', () => {
      // logoSweep animation should be defined and used
      expect(cssContent).toContain('@keyframes logoSweep');
      expect(cssContent).toMatch(/animation:.*logoSweep/);
    });

    test('CSS variables should be used consistently', () => {
      const varDefinitions = cssContent.match(/--sigil-size:\s*\d+px/g);
      const varUsages = cssContent.match(/var\(--sigil-size\)/g);
      
      expect(varDefinitions).toBeTruthy();
      expect(varUsages).toBeTruthy();
      expect(varUsages.length).toBeGreaterThanOrEqual(varDefinitions.length);
    });
  });

  describe('Theme System Integration', () => {
    test('CSS should define theme-specific styles', () => {
      expect(cssContent).toContain('[data-theme="light"]');
      expect(cssContent).toContain('.logo-sigil');
    });

    test('JavaScript should manipulate theme attributes', () => {
      expect(scriptContent).toContain('data-theme');
      expect(scriptContent).toMatch(/setAttribute.*data-theme/);
    });

    test('theme values should be consistent between JS and CSS', () => {
      // JS uses 'auto', 'dark', 'light'
      expect(scriptContent).toContain("'auto'");
      expect(scriptContent).toContain("'dark'");
      expect(scriptContent).toContain("'light'");
      
      // CSS should handle light theme
      expect(cssContent).toContain('[data-theme="light"]');
    });
  });

  describe('Accessibility Integration', () => {
    test('ARIA labels in HTML should be meaningful', () => {
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        const ariaLabels = htmlContent.match(/aria-label="[^"]+"/g);
        expect(ariaLabels).toBeTruthy();
        
        if (ariaLabels) {
          ariaLabels.forEach(label => {
            // Should not be empty or generic
            expect(label).not.toBe('aria-label=""');
            expect(label.length).toBeGreaterThan(15);
          });
        }
      });
    });

    test('decorative elements should have proper roles', () => {
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        const logoSigils = htmlContent.match(/<div class="logo-sigil[^>]*>/g);
        expect(logoSigils).toBeTruthy();
        
        if (logoSigils) {
          logoSigils.forEach(logo => {
            expect(logo).toContain('role="img"');
          });
        }
      });
    });
  });

  describe('Responsive Design Integration', () => {
    test('CSS media queries should match HTML viewport settings', () => {
      const hasMediaQueries = cssContent.match(/@media[^{]+{/g);
      expect(hasMediaQueries).toBeTruthy();
      
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        expect(htmlContent).toMatch(/<meta name="viewport"/);
      });
    });

    test('mobile and desktop logo sizes should be defined', () => {
      expect(cssContent).toContain('--sigil-size: 52px');
      expect(cssContent).toContain('--sigil-size: 120px');
      expect(cssContent).toContain('--sigil-size: 48px');
    });
  });

  describe('Animation Performance', () => {
    test('animations should use transform for GPU acceleration', () => {
      const animations = cssContent.match(/@keyframes[^}]+}/gs);
      expect(animations).toBeTruthy();
      
      if (animations) {
        animations.forEach(anim => {
          if (anim.includes('logoSweep')) {
            expect(anim).toContain('transform');
            expect(anim).toContain('rotate');
          }
        });
      }
    });

    test('transitions should use appropriate properties', () => {
      const transitions = cssContent.match(/transition:[^;]+;/g);
      expect(transitions).toBeTruthy();
      
      if (transitions) {
        transitions.forEach(trans => {
          // Should use transform, opacity, or box-shadow
          expect(trans).toMatch(/transform|opacity|box-shadow/);
        });
      }
    });
  });

  describe('Browser Compatibility', () => {
    test('CSS should use widely-supported properties', () => {
      // Modern properties that should have good support
      expect(cssContent).toMatch(/flex|grid|transform/);
    });

    test('JavaScript should handle browser differences', () => {
      // Check for matchMedia handling
      expect(scriptContent).toContain('matchMedia');
      expect(scriptContent).toMatch(/addEventListener|addListener/);
    });

    test('should provide fallbacks where needed', () => {
      // Check for optional chaining and nullish coalescing
      expect(scriptContent).toMatch(/\?\./);
      expect(scriptContent).toMatch(/\?\?/);
    });
  });

  describe('File Structure Consistency', () => {
    test('all HTML files should reference same CSS', () => {
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        expect(htmlContent).toMatch(/<link[^>]*href="style\.css"/i);
      });
    });

    test('all HTML files should reference same JS', () => {
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        expect(htmlContent).toMatch(/<script[^>]*src="script\.js"/i);
      });
    });

    test('script.js should be loaded correctly', () => {
      // Should be wrapped in IIFE
      expect(scriptContent).toMatch(/^\(\(\) => {/);
      expect(scriptContent).toMatch(/}\)\(\);?\s*$/);
    });
  });

  describe('Visual Consistency', () => {
    test('color schemes should be consistent', () => {
      // Cyan and magenta theme colors
      const cyanPattern = /rgba?\(0,?\s*255,?\s*255/gi;
      const magentaPattern = /rgba?\(255,?\s*0,?\s*255/gi;
      
      const cyanMatches = cssContent.match(cyanPattern);
      const magentaMatches = cssContent.match(magentaPattern);
      
      expect(cyanMatches).toBeTruthy();
      expect(magentaMatches).toBeTruthy();
    });

    test('should maintain cyber-neon aesthetic', () => {
      expect(cssContent).toMatch(/neon|glow|shadow/i);
      expect(cssContent).toContain('box-shadow');
      expect(cssContent).toContain('text-shadow');
    });

    test('should use consistent border radius', () => {
      const borderRadii = cssContent.match(/border-radius:\s*\d+px/g);
      expect(borderRadii).toBeTruthy();
    });
  });

  describe('Migration Completeness', () => {
    test('old logo classes should be completely removed', () => {
      // Check CSS
      expect(cssContent).not.toMatch(/\.logo-placeholder\s*{/);
      expect(cssContent).not.toMatch(/\.logo-inline\s*{/);
      
      // Check all HTML files
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        expect(htmlContent).not.toContain('logo-placeholder');
        expect(htmlContent).not.toContain('logo-inline');
        expect(htmlContent).not.toContain('>NOP<');
      });
    });

    test('new logo implementation should be complete', () => {
      // Check CSS has all required classes
      expect(cssContent).toContain('.logo-sigil {');
      expect(cssContent).toContain('.logo-sigil--sidebar');
      expect(cssContent).toContain('.logo-sigil--header');
      expect(cssContent).toContain('.logo-sigil::before');
      expect(cssContent).toContain('.logo-sigil::after');
      
      // Check HTML files have new classes
      htmlFiles.forEach(filename => {
        const htmlPath = path.join(__dirname, '..', 'docs', filename);
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        
        expect(htmlContent).toMatch(/class="logo-sigil logo-sigil--sidebar"/);
        expect(htmlContent).toMatch(/class="logo-sigil logo-sigil--header"/);
      });
    });
  });

  describe('Documentation Alignment', () => {
    test('README should reflect implementation', () => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');
      
      expect(readmeContent).toContain('.logo-sigil');
      expect(readmeContent).not.toContain('logo.png');
    });

    test('implementation should match described behavior', () => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');
      
      if (readmeContent.includes('CSS-generated')) {
        // Should use CSS pseudo-elements, not images
        expect(cssContent).toContain('::after');
        expect(cssContent).toContain('content:');
      }
    });
  });
});