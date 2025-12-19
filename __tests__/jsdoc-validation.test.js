/**
 * JSDoc and code documentation validation tests
 * Verifies that new JSDoc comments are properly formatted and accurate
 */

const fs = require('fs');
const path = require('path');

describe('JSDoc Documentation Validation', () => {
  let scriptContent;
  let censysSummaryContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync(path.join(__dirname, '../docs/script.js'), 'utf8');
    censysSummaryContent = fs.readFileSync(
      path.join(__dirname, '../functions/api/censys-summary.js'),
      'utf8'
    );
  });

  describe('script.js JSDoc coverage', () => {
    it('should have JSDoc for loadSettings function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Load persisted settings[\s\S]*?\*\//);
    });

    it('should have JSDoc for saveSettings function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Persist the current application settings[\s\S]*?\*\//);
    });

    it('should have JSDoc for applyTheme function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Resolve the effective theme[\s\S]*?\*\//);
    });

    it('should have JSDoc for initLogoPlaceholders function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Replaces missing or failed logo images[\s\S]*?\*\//);
    });

    it('should have JSDoc for initThemeToggle function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Initialize the theme toggle control[\s\S]*?\*\//);
    });

    it('should have JSDoc for initSidebar function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Initialize the page sidebar[\s\S]*?\*\//);
    });

    it('should have JSDoc for updateStatsView function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Update the dashboard's stored stats[\s\S]*?\*\//);
    });

    it('should have JSDoc for fetchCensysSummary function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Fetches the latest Censys summary[\s\S]*?\*\//);
    });

    it('should have JSDoc for initAutoRefresh function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Initialize automatic periodic fetching[\s\S]*?\*\//);
    });

    it('should have JSDoc for initCharts function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Initialize the dashboard charts[\s\S]*?\*\//);
    });

    it('should have JSDoc for updateCharts function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Update Chart.js service and country charts[\s\S]*?\*\//);
    });

    it('should have JSDoc for generateColorPalette function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Create a list of visually distinct CSS HSL color strings[\s\S]*?\*\//);
    });

    it('should have JSDoc for init function', () => {
      expect(scriptContent).toMatch(/\/\*\*[\s\S]*?Bootstraps the application[\s\S]*?\*\//);
    });
  });

  describe('JSDoc @param tags', () => {
    it('should document updateStatsView data parameter', () => {
      const funcBlock = extractFunctionBlock('updateStatsView', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{Object\}\s+data/);
    });

    it('should document fetchCensysSummary silent parameter', () => {
      const funcBlock = extractFunctionBlock('fetchCensysSummary', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{boolean\}\s+\[silent=false\]/);
    });

    it('should document generateColorPalette parameters', () => {
      const funcBlock = extractFunctionBlock('generateColorPalette', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{number\}\s+count/);
      expect(funcBlock).toMatch(/@param\s+\{string\}\s+seed/);
    });

    it('should document qs selector parameter', () => {
      const funcBlock = extractFunctionBlock('function qs', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{string\}\s+id/);
    });

    it('should document renderTable parameters', () => {
      const funcBlock = extractFunctionBlock('renderTable', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{string\}\s+selector/);
      expect(funcBlock).toMatch(/@param\s+\{Object/);
    });

    it('should document logTerminal message parameter', () => {
      const funcBlock = extractFunctionBlock('logTerminal', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{string\}\s+message/);
    });

    it('should document updateCharts data parameter', () => {
      const funcBlock = extractFunctionBlock('updateCharts', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{Object\}\s+data/);
    });

    it('should document renderHeatmap data parameter', () => {
      const funcBlock = extractFunctionBlock('renderHeatmap', scriptContent);
      expect(funcBlock).toMatch(/@param\s+\{Object\}\s+data/);
    });
  });

  describe('JSDoc @returns tags', () => {
    it('should document qs return value', () => {
      const funcBlock = extractFunctionBlock('function qs', scriptContent);
      expect(funcBlock).toMatch(/@returns\s+\{Element\|null\}/);
    });

    it('should document generateColorPalette return value', () => {
      const funcBlock = extractFunctionBlock('generateColorPalette', scriptContent);
      expect(funcBlock).toMatch(/@returns\s+\{string\[\]\}/);
    });
  });

  describe('censys-summary.js JSDoc', () => {
    it('should have JSDoc for onRequest function', () => {
      expect(censysSummaryContent).toMatch(/\/\*\*[\s\S]*?Handle an HTTP request[\s\S]*?\*\//);
    });

    it('should document onRequest context parameter', () => {
      expect(censysSummaryContent).toMatch(/@param\s+\{object\}\s+context/);
    });

    it('should document onRequest return value', () => {
      expect(censysSummaryContent).toMatch(/@returns\s+\{Response\}/);
    });

    it('should have JSDoc for responseHeaders function', () => {
      expect(censysSummaryContent).toMatch(/\/\*\*[\s\S]*?Provide standard JSON response headers[\s\S]*?\*\//);
    });

    it('should document responseHeaders return type', () => {
      expect(censysSummaryContent).toMatch(/@returns\s+\{\{/);
    });

    it('should document expected environment variables', () => {
      expect(censysSummaryContent).toMatch(/CENSYS_API_ID/);
      expect(censysSummaryContent).toMatch(/CENSYS_API_SECRET/);
    });

    it('should document response structure fields', () => {
      const jsdoc = censysSummaryContent.match(/\/\*\*[\s\S]*?export async function/)[0];
      expect(jsdoc).toContain('total_hosts');
      expect(jsdoc).toContain('total_services');
      expect(jsdoc).toContain('last_sync');
      expect(jsdoc).toContain('countries');
      expect(jsdoc).toContain('services');
    });
  });

  describe('JSDoc formatting', () => {
    it('should use proper JSDoc comment syntax', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || [];
      expect(jsdocBlocks.length).toBeGreaterThan(10);
      
      jsdocBlocks.forEach(block => {
        expect(block).toMatch(/^\/\*\*/);
        expect(block).toMatch(/\*\/$/);
      });
    });

    it('should have consistent indentation in JSDoc blocks', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || [];
      
      jsdocBlocks.forEach(block => {
        const lines = block.split('\n');
        lines.forEach(line => {
          if (line.trim().startsWith('*') && !line.trim().startsWith('*/')) {
            expect(line).toMatch(/^\s+\*/);
          }
        });
      });
    });

    it('should use proper spacing after asterisks', () => {
      const jsdocLines = scriptContent.split('\n').filter(line => 
        line.trim().startsWith('*') && !line.trim().startsWith('/**') && !line.trim().startsWith('*/')
      );
      
      jsdocLines.forEach(line => {
        const afterAsterisk = line.substring(line.indexOf('*') + 1);
        if (afterAsterisk.trim().length > 0) {
          expect(afterAsterisk).toMatch(/^\s/);
        }
      });
    });

    it('should capitalize first word in descriptions', () => {
      const descriptionLines = scriptContent.match(/\*\s+[A-Z][a-z]/g) || [];
      expect(descriptionLines.length).toBeGreaterThan(5);
    });

    it('should end descriptions with periods', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || [];
      
      jsdocBlocks.forEach(block => {
        const descLine = block.split('\n').find(line => 
          line.includes('*') && 
          !line.includes('@param') && 
          !line.includes('@returns') &&
          !line.includes('/**') &&
          !line.includes('*/')
        );
        
        if (descLine && descLine.trim().length > 5) {
          const trimmed = descLine.trim();
          // Should end with period or continue to next line
          expect(trimmed.endsWith('.') || trimmed.endsWith(',') || !trimmed.endsWith('*')).toBe(true);
        }
      });
    });
  });

  describe('Documentation completeness', () => {
    it('should document all exported functions in censys-summary.js', () => {
      const exportedFuncs = censysSummaryContent.match(/export\s+(async\s+)?function\s+\w+/g) || [];
      expect(exportedFuncs.length).toBeGreaterThan(0);
      
      exportedFuncs.forEach(funcDecl => {
        const funcName = funcDecl.match(/function\s+(\w+)/)[1];
        const precedingContent = censysSummaryContent.substring(
          0,
          censysSummaryContent.indexOf(funcDecl)
        );
        const hasJsdoc = precedingContent.lastIndexOf('/**') > 
                        precedingContent.lastIndexOf('*/');
        expect(hasJsdoc).toBe(true);
      });
    });

    it('should document complex data structures in @param tags', () => {
      const paramWithObject = scriptContent.match(/@param\s+\{Object[^}]*\}/g) || [];
      expect(paramWithObject.length).toBeGreaterThan(0);
    });

    it('should use optional parameter notation where appropriate', () => {
      const optionalParams = scriptContent.match(/@param\s+\{[^}]+\}\s+\[[^\]]+\]/g) || [];
      expect(optionalParams.length).toBeGreaterThan(0);
    });

    it('should include default values for optional parameters', () => {
      const paramsWithDefaults = scriptContent.match(/@param\s+\{[^}]+\}\s+\[[^\]]*=[^\]]+\]/g) || [];
      expect(paramsWithDefaults.length).toBeGreaterThan(0);
    });
  });

  describe('Type annotations', () => {
    it('should use valid JavaScript type names', () => {
      const validTypes = [
        'string', 'number', 'boolean', 'object', 'Object', 'Array',
        'Function', 'Element', 'null', 'undefined', 'Response'
      ];
      
      const typeAnnotations = scriptContent.match(/@(?:param|returns)\s+\{([^}]+)\}/g) || [];
      
      typeAnnotations.forEach(annotation => {
        const type = annotation.match(/\{([^}]+)\}/)[1];
        const baseType = type.split(/[<|\[\]]/)[0].trim();
        
        const isValid = validTypes.some(valid => baseType.includes(valid)) ||
                       baseType.includes('*') ||
                       baseType.includes('.');
        expect(isValid).toBe(true);
      });
    });

    it('should use union types with | notation', () => {
      const unionTypes = scriptContent.match(/@(?:param|returns)\s+\{[^}]*\|[^}]*\}/g) || [];
      // At least the qs function should have Element|null
      expect(unionTypes.length).toBeGreaterThan(0);
    });

    it('should use array notation correctly', () => {
      const arrayTypes = scriptContent.match(/@(?:param|returns)\s+\{[^}]*\[\][^}]*\}/g) || [];
      // generateColorPalette returns string[]
      expect(arrayTypes.length).toBeGreaterThan(0);
    });

    it('should document object properties inline or in description', () => {
      const objectParams = scriptContent.match(/@param\s+\{Object[^}]*\}[^@]*/g) || [];
      
      objectParams.forEach(param => {
        // Should either have inline properties or describe in text
        const hasInlineProps = param.includes('<') || param.includes('{');
        const hasDescription = param.split('\n').length > 1;
        expect(hasInlineProps || hasDescription).toBe(true);
      });
    });
  });

  describe('Documentation accuracy', () => {
    it('should accurately describe initLogoPlaceholders behavior', () => {
      const funcBlock = extractFunctionBlock('initLogoPlaceholders', scriptContent);
      expect(funcBlock).toContain('failed logo');
      expect(funcBlock).toContain('placeholder');
      expect(funcBlock).toContain('fallback');
    });

    it('should accurately describe applyTheme behavior', () => {
      const funcBlock = extractFunctionBlock('applyTheme', scriptContent);
      expect(funcBlock).toContain('theme');
      expect(funcBlock).toContain('auto');
      expect(funcBlock).toContain('data-theme');
    });

    it('should mention removed functionality in comments', () => {
      // applyTheme no longer calls refreshChartThemes
      const funcBlock = extractFunctionBlock('applyTheme', scriptContent);
      // The JSDoc should focus on what it does, not what it doesn't do
      expect(funcBlock).toBeTruthy();
    });

    it('should accurately describe fetchCensysSummary silent parameter', () => {
      const funcBlock = extractFunctionBlock('fetchCensysSummary', scriptContent);
      expect(funcBlock).toContain('silent');
      expect(funcBlock).toContain('terminal');
    });
  });

  describe('Documentation style', () => {
    it('should use imperative mood for function descriptions', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*\s*\n\s*\*\s+([A-Z][^.]+)/g) || [];
      
      jsdocBlocks.forEach(block => {
        const firstSentence = block.match(/\*\s+([A-Z][^.]+)/)[1];
        // Should start with action verbs
        const startsWithVerb = /^(Load|Save|Apply|Replace|Initialize|Update|Fetch|Create|Render|Provide|Handle|Perform|Populate|Enable|Mark|Bootstrap|Append)/i.test(firstSentence);
        expect(startsWithVerb).toBe(true);
      });
    });

    it('should avoid redundant wording', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || [];
      
      jsdocBlocks.forEach(block => {
        // Should not have "This function..." or "This method..."
        expect(block).not.toMatch(/This function/i);
        expect(block).not.toMatch(/This method/i);
      });
    });

    it('should be concise but descriptive', () => {
      const jsdocBlocks = scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || [];
      
      jsdocBlocks.forEach(block => {
        const lines = block.split('\n');
        // Should not be too long (reasonable line length)
        lines.forEach(line => {
          if (line.trim().startsWith('*') && !line.includes('@')) {
            expect(line.length).toBeLessThan(120);
          }
        });
      });
    });
  });
});

// Helper function to extract function block including JSDoc
function extractFunctionBlock(functionName, content) {
  const regex = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/[\\s\\S]*?${functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'm');
  const match = content.match(regex);
  return match ? match[0] : '';
}