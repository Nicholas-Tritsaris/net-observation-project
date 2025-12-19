/**
 * Comprehensive tests for terminal, data visualizer, and plugin system
 * Tests initTerminal, logTerminal, initDataVisualizer, AppPlugins
 */

const fs = require('fs');

describe('Terminal, Data Visualizer, and Plugin System', () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = fs.readFileSync('./docs/script.js', 'utf-8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('initTerminal', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initTerminal\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should return early if terminal element not found', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!terminal\s*\)\s*return/);
    });

    test('should find terminal output, input, and button elements', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\.querySelector\(['"]\.terminal-output['"]\)/);
      expect(funcMatch[0]).toMatch(/\.querySelector\(['"]input['"]\)/);
      expect(funcMatch[0]).toMatch(/\.querySelector\(['"]button['"]\)/);
    });

    test('should define help command', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/help\(\)\s*\{/);
      expect(funcMatch[0]).toMatch(/Available commands/);
    });

    test('should define stats command', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/stats\(\)\s*\{/);
      expect(funcMatch[0]).toMatch(/fetchCensysSummary\(\)/);
    });

    test('should define theme command with argument', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/theme\(arg\)\s*\{/);
    });

    test('should validate theme command arguments', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\['auto',\s*'dark',\s*'light'\]\.includes\(arg\)/);
    });

    test('should define settings command', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/settings\(\)\s*\{/);
      expect(funcMatch[0]).toMatch(/JSON\.stringify\(AppState\.settings/);
    });

    test('should define plugins command', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/plugins\(\)\s*\{/);
      expect(funcMatch[0]).toMatch(/AppPlugins\.list\(\)/);
    });

    test('should check for plugin commands when built-in command not found', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/AppPlugins\.getCommand\(command\)/);
    });

    test('should handle command execution errors with try-catch', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should handle async command results with Promise.then', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/result instanceof Promise/);
      expect(funcMatch[0]).toMatch(/\.then\(/);
    });

    test('should bind click event to run button', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/runButton\?\.addEventListener\(['"]click['"]/);
    });

    test('should bind Enter key event to input', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/input\?\.addEventListener\(['"]keydown['"]/);
      expect(funcMatch[0]).toMatch(/evt\.key\s*===\s*['"]Enter['"]/);
    });

    test('should log startup message', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Terminal online/);
    });

    test('should clear input after command execution', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/input\.value\s*=\s*['"]['"];/);
    });

    test('should split command and arguments', () => {
      const funcMatch = scriptContent.match(/function initTerminal[\s\S]*?(?=\n  function|\n  async function|\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\.split\(\/\\s\+\/\)/);
    });
  });

  describe('logTerminal', () => {
    test('should accept message parameter', () => {
      const funcMatch = scriptContent.match(/function logTerminal\(message\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should have JSDoc describing parameters', () => {
      const jsdocMatch = scriptContent.match(/\/\*\*[\s\S]*?@param \{string\} message[\s\S]*?\*\/\s*function logTerminal/);
      expect(jsdocMatch).not.toBeNull();
    });

    test('should return early if output element not found', () => {
      const funcMatch = scriptContent.match(/function logTerminal[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!output\s*\)\s*return/);
    });

    test('should create div element for log line', () => {
      const funcMatch = scriptContent.match(/function logTerminal[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/document\.createElement\(['"]div['"]\)/);
    });

    test('should add timestamp to log messages', () => {
      const funcMatch = scriptContent.match(/function logTerminal[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/new Date\(\)\.toLocaleTimeString\(\)/);
    });

    test('should append line to output', () => {
      const funcMatch = scriptContent.match(/function logTerminal[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/output\.appendChild\(line\)/);
    });

    test('should auto-scroll to bottom', () => {
      const funcMatch = scriptContent.match(/function logTerminal[\s\S]*?\n  \}/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/output\.scrollTop\s*=\s*output\.scrollHeight/);
    });
  });

  describe('initDataVisualizer', () => {
    test('should be defined as a function', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer\(\)/);
      expect(funcMatch).not.toBeNull();
    });

    test('should find input, file input, button, and output elements', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getElementById\(['"]dataInput['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]fileInput['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]renderData['"]\)/);
      expect(funcMatch[0]).toMatch(/getElementById\(['"]dataOutput['"]\)/);
    });

    test('should define parseCSV function', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/const parseCSV\s*=\s*\(text\)\s*=>/);
    });

    test('should split CSV by newlines', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/\.split\(\/\\r\?\\n\/\)/);
    });

    test('should parse CSV headers from first line', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/headerLine\.split\(['"],['"]?\)/);
    });

    test('should define renderData function', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/const renderData\s*=\s*\(data\)\s*=>/);
    });

    test('should render JSON with pretty printing', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/JSON\.stringify\(data,\s*null,\s*2\)/);
    });

    test('should detect JSON by checking for { or [ at start', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/trimmed\.startsWith\(['"]\{['"]\)\s*\|\|\s*trimmed\.startsWith\(['"]\[['"]\)/);
    });

    test('should handle JSON parse errors with try-catch', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?JSON\.parse[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should log success messages to terminal', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Data visualizer rendered/);
    });

    test('should log error messages to terminal', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Data visualizer error/);
    });

    test('should bind click event to render button', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/renderBtn\?\.addEventListener\(['"]click['"]/);
    });

    test('should bind change event to file input', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/fileInput\?\.addEventListener\(['"]change['"]/);
    });

    test('should use FileReader for file uploads', () => {
      const funcMatch = scriptContent.match(/function initDataVisualizer[\s\S]*?(?=\n  const AppPlugins)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/new FileReader\(\)/);
      expect(funcMatch[0]).toMatch(/reader\.readAsText\(file\)/);
    });
  });

  describe('AppPlugins System', () => {
    test('should be defined as an IIFE returning an object', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=\s*\(\(\)\s*=>\s*\{/);
      expect(funcMatch).not.toBeNull();
    });

    test('should use a Map for plugin registry', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/new Map\(\)/);
    });

    test('should expose register method', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/register\(plugin\)\s*\{/);
    });

    test('should expose list method', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/list\(\)\s*\{/);
    });

    test('should expose getCommand method', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/getCommand\(name\)\s*\{/);
    });

    test('should require plugin name', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*!plugin\?\.name\s*\)/);
      expect(funcMatch[0]).toMatch(/throw new Error\([^)]*Plugin requires a name/);
    });

    test('should call plugin init method if present', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/plugin\?\.init\?\./);
    });

    test('should pass state and log to plugin init', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/state:\s*AppState/);
      expect(funcMatch[0]).toMatch(/log:\s*logTerminal/);
    });

    test('should register plugin commands', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*plugin\.command\s*\)/);
      expect(funcMatch[0]).toMatch(/registry\.set\(plugin\.command/);
    });

    test('should log plugin registration', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Plugin registered/);
    });

    test('should return unique plugin names from list', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/Array\.from\(new Set\(/);
    });

    test('should return plugin run function from getCommand', () => {
      const funcMatch = scriptContent.match(/const AppPlugins\s*=[\s\S]*?(?=\n  window\.registerPlugin)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/if\s*\(\s*plugin\s*&&\s*plugin\.run\s*\)/);
      expect(funcMatch[0]).toMatch(/return\s*\([^)]*\)\s*=>\s*plugin\.run/);
    });
  });

  describe('window.registerPlugin', () => {
    test('should be exposed globally', () => {
      const funcMatch = scriptContent.match(/window\.registerPlugin\s*=/);
      expect(funcMatch).not.toBeNull();
    });

    test('should wrap AppPlugins.register with error handling', () => {
      const funcMatch = scriptContent.match(/window\.registerPlugin\s*=[\s\S]*?;(?=\n)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/try\s*\{[\s\S]*?AppPlugins\.register\(plugin\)[\s\S]*?\}\s*catch\s*\(err\)/);
    });

    test('should log registration failures to terminal', () => {
      const funcMatch = scriptContent.match(/window\.registerPlugin\s*=[\s\S]*?;(?=\n)/);
      expect(funcMatch).not.toBeNull();
      expect(funcMatch[0]).toMatch(/logTerminal\([^)]*Plugin registration failed/);
    });
  });
});