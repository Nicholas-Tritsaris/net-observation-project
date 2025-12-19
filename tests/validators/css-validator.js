/**
 * CSS Validation Tests for docs/style.css
 * Validates the new .logo-sigil styles and removed old styles
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../../docs/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('🎨 Validating CSS changes for logo-sigil refactoring...\n');

let passed = 0;
let failed = 0;

function test(description, assertion) {
  try {
    if (assertion) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    failed++;
  }
}

console.log('--- New Logo Sigil Styles ---\n');

test(
  '.logo-sigil base class exists',
  cssContent.includes('.logo-sigil {')
);

test(
  '.logo-sigil defines --sigil-size CSS variable',
  cssContent.includes('--sigil-size:') || cssContent.includes('--sigil-size :')
);

test(
  '.logo-sigil has border-radius',
  /\.logo-sigil\s*\{[^}]*border-radius:\s*\d+px/s.test(cssContent)
);

test(
  '.logo-sigil has radial-gradient background',
  /\.logo-sigil\s*\{[^}]*radial-gradient/s.test(cssContent)
);

test(
  '.logo-sigil has box-shadow with cyan neon (0, 255, 255)',
  /\.logo-sigil\s*\{[^}]*box-shadow:.*rgba?\(0,?\s*255,?\s*255/s.test(cssContent)
);

test(
  '.logo-sigil::before pseudo-element exists',
  cssContent.includes('.logo-sigil::before {')
);

test(
  '.logo-sigil::before has conic-gradient',
  /\.logo-sigil::before\s*\{[^}]*conic-gradient/s.test(cssContent)
);

test(
  '.logo-sigil::before has logoSweep animation',
  /\.logo-sigil::before\s*\{[^}]*animation:.*logoSweep/s.test(cssContent)
);

test(
  '.logo-sigil::after pseudo-element with NOP content exists',
  cssContent.includes('.logo-sigil::after {') && cssContent.includes("content: 'NOP'")
);

test(
  '.logo-sigil--sidebar modifier exists',
  cssContent.includes('.logo-sigil--sidebar {')
);

test(
  '.logo-sigil--sidebar sets --sigil-size to 120px',
  /\.logo-sigil--sidebar\s*\{[^}]*--sigil-size:\s*120px/s.test(cssContent)
);

test(
  '.logo-sigil--header modifier exists',
  cssContent.includes('.logo-sigil--header {')
);

test(
  '.logo-sigil--header sets --sigil-size to 48px',
  /\.logo-sigil--header\s*\{[^}]*--sigil-size:\s*48px/s.test(cssContent)
);

test(
  'Light theme variant exists for .logo-sigil',
  cssContent.includes('[data-theme="light"] .logo-sigil {')
);

test(
  'logoSweep animation keyframes defined',
  cssContent.includes('@keyframes logoSweep {')
);

test(
  'logoSweep rotates from 0deg to 360deg',
  /@keyframes logoSweep\s*\{[^}]*0%[^}]*rotate\(0deg\)[^}]*100%[^}]*rotate\(360deg\)/s.test(cssContent)
);

test(
  '.logo-sigil:hover has transform effect',
  /\.logo-sigil:hover\s*\{[^}]*transform:/s.test(cssContent)
);

test(
  '.logo-sigil uses width: var(--sigil-size)',
  /\.logo-sigil\s*\{[^}]*width:\s*var\(--sigil-size\)/s.test(cssContent)
);

test(
  '.logo-sigil uses height: var(--sigil-size)',
  /\.logo-sigil\s*\{[^}]*height:\s*var\(--sigil-size\)/s.test(cssContent)
);

test(
  '.logo-sigil has transition property',
  /\.logo-sigil\s*\{[^}]*transition:/s.test(cssContent)
);

test(
  '.logo-sigil uses flexbox (display: flex)',
  /\.logo-sigil\s*\{[^}]*display:\s*flex/s.test(cssContent)
);

test(
  '.logo-sigil has overflow: hidden',
  /\.logo-sigil\s*\{[^}]*overflow:\s*hidden/s.test(cssContent)
);

test(
  '.logo-sigil::before uses mix-blend-mode: screen',
  /\.logo-sigil::before\s*\{[^}]*mix-blend-mode:\s*screen/s.test(cssContent)
);

console.log('\n--- Old Styles Removed ---\n');

test(
  'Old .logo-placeholder class removed',
  !cssContent.includes('.logo-placeholder {')
);

test(
  'Old .logo-inline class removed',
  !cssContent.includes('.logo-inline {')
);

test(
  '.sidebar .logo-placeholder reference removed',
  !cssContent.includes('.sidebar .logo-placeholder')
);

console.log('\n--- Responsive Design ---\n');

test(
  'Media query for mobile adjustments exists',
  cssContent.includes('@media') && /max-width.*600px/s.test(cssContent)
);

console.log(`\n📊 CSS Validation Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('⚠️  Some CSS validations failed. Please review the styles.');
  process.exit(1);
} else {
  console.log('✨ All CSS validations passed!\n');
}