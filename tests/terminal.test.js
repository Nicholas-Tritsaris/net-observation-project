/**
 * Comprehensive tests for in-page terminal functionality
 * Tests: initTerminal, logTerminal, command execution, plugin system
 */

describe('Terminal Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="terminal">
        <div class="terminal-output"></div>
        <input type="text" />
        <button>Run</button>
      </div>
    `;
  });

  describe('initTerminal', () => {
    test('should find terminal container', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.terminal['"]\)/);
    });

    test('should return early if terminal not found', () => {
      document.body.innerHTML = '';
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/if \(!terminal\) return/);
    });

    test('should find output, input, and button elements', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.terminal-output['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]input['"]\)/);
      expect(funcMatch[0]).toMatch(/querySelector\(['"]button['"]\)/);
    });

    test('should wire run button click handler', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/runButton.*addEventListener\(['"]click['"]/);
    });

    test('should wire input Enter key handler', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/input.*addEventListener\(['"]keydown['"]/);
      expect(funcMatch[0]).toMatch(/event\.key === ['"]Enter['"]/);
    });

    test('should log welcome message on initialization', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Terminal online/);
    });
  });

  describe('Built-in Commands', () => {
    test('should provide help command', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/help\(\)/);
      expect(funcMatch[0]).toMatch(/Available commands/i);
    });

    test('should provide stats command that fetches Censys summary', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/stats\(\)/);
      expect(funcMatch[0]).toMatch(/fetchCensysSummary/);
    });

    test('should provide theme command with validation', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/theme\(arg\)/);
      expect(funcMatch[0]).toMatch(/auto.*dark.*light/);
    });

    test('should provide settings command', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/settings\(\)/);
      expect(funcMatch[0]).toMatch(/AppState\.settings/);
    });

    test('should provide plugins command', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/plugins\(\)/);
      expect(funcMatch[0]).toMatch(/AppPlugins\.list/);
    });
  });

  describe('Command Execution', () => {
    test('should parse command and arguments', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/input\.value\.trim\(\)\.split/);
    });

    test('should handle empty input gracefully', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/if \(!command\) return/);
    });

    test('should check built-in commands first', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/commands\[command\]/);
    });

    test('should check plugin commands if not built-in', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/AppPlugins\.getCommand/);
    });

    test('should handle unknown commands', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/Unknown command/i);
    });

    test('should handle command errors', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/catch.*err/);
      expect(funcMatch[0]).toMatch(/Error:/);
    });

    test('should handle async command results', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/result instanceof Promise/);
      expect(funcMatch[0]).toMatch(/\.then/);
    });

    test('should clear input after execution', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function initTerminal\(\)[\s\S]*?(?=\n  \/\*\*\n   \* Append)/);
      
      expect(funcMatch[0]).toMatch(/input\.value = ['"]['"];/);
    });
  });

  describe('logTerminal', () => {
    test('should append message to output', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function logTerminal\(message\)[\s\S]*?\n  \}/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/querySelector\(['"]\.terminal-output['"]\)/);
    });

    test('should return early if output not found', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function logTerminal\(message\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/if \(!output\) return/);
    });

    test('should include timestamp', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function logTerminal\(message\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/new Date\(\)\.toLocaleTimeString/);
    });

    test('should auto-scroll to bottom', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/function logTerminal\(message\)[\s\S]*?\n  \}/);
      
      expect(funcMatch[0]).toMatch(/scrollTop.*scrollHeight/);
    });
  });

  describe('Plugin System', () => {
    test('should provide AppPlugins registry', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/const AppPlugins = \(\(\)/);
      expect(scriptContent).toMatch(/registry = new Map/);
    });

    test('should provide register method', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/register\(plugin\)/);
    });

    test('should provide list method', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch[0]).toMatch(/list\(\)/);
    });

    test('should provide getCommand method', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch[0]).toMatch(/getCommand\(name\)/);
    });

    test('should validate plugin has name', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch[0]).toMatch(/if \(!plugin\?\.name\)/);
      expect(funcMatch[0]).toMatch(/throw.*Error.*requires a name/);
    });

    test('should call plugin init if provided', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch[0]).toMatch(/plugin\?\.init/);
    });

    test('should log plugin registration', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      const funcMatch = scriptContent.match(/const AppPlugins = \(\(\)[\s\S]*?\}\)\(\);/);
      
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Plugin registered/);
    });

    test('should expose global registerPlugin function', () => {
      const scriptContent = require('fs').readFileSync('./docs/script.js', 'utf-8');
      expect(scriptContent).toMatch(/window\.registerPlugin/);
    });
  });
});