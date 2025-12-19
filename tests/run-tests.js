#!/usr/bin/env node

/**
 * Simple test runner for manual execution without Jest
 * This allows validation of test logic even without full Jest setup
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('Net Observation Project - Test Suite Validator');
console.log('='.repeat(70));
console.log('');

// Validate test file structure
const testFiles = [
  'tests/unit/script.test.js',
  'tests/integration/html-validation.test.js',
  'tests/integration/readme-validation.test.js',
  'tests/visual/css-validation.test.js',
  'tests/setup.js',
  'tests/README.md'
];

console.log('Checking test file structure...');
let allFilesExist = true;

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  console.log(`  ${status} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('');

if (!allFilesExist) {
  console.log('❌ Some test files are missing!');
  process.exit(1);
}

console.log('✅ All test files present');
console.log('');

// Validate source files exist
console.log('Checking source files...');
const sourceFiles = [
  'docs/script.js',
  'docs/style.css',
  'docs/index.html',
  'docs/dashboard.html',
  'docs/api.html',
  'docs/data.html',
  'docs/docs.html',
  'docs/versions.html',
  'README.md'
];

let allSourcesExist = true;

sourceFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  console.log(`  ${status} ${file}`);
  if (!exists) allSourcesExist = false;
});

console.log('');

if (!allSourcesExist) {
  console.log('❌ Some source files are missing!');
  process.exit(1);
}

console.log('✅ All source files present');
console.log('');

// Count test cases
console.log('Analyzing test coverage...');

testFiles.forEach(file => {
  if (!file.endsWith('.js') || file.includes('setup.js') || file.includes('run-tests.js')) return;
  
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const describes = (content.match(/describe\(/g) || []).length;
  const tests = (content.match(/test\(/g) || []).length;
  
  console.log(`  ${path.basename(file)}: ${describes} suites, ${tests} tests`);
});

console.log('');

// Validate package.json
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json configured');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`  Test script: ${pkg.scripts.test || 'not configured'}`);
} else {
  console.log('⚠️  package.json not found (run npm init or use provided package.json)');
}

console.log('');
console.log('='.repeat(70));
console.log('Test suite validation complete!');
console.log('='.repeat(70));
console.log('');
console.log('To run tests:');
console.log('  1. npm install');
console.log('  2. npm test');
console.log('');
console.log('To run specific suites:');
console.log('  npm test tests/unit           # JavaScript tests');
console.log('  npm test tests/integration    # HTML/README tests');
console.log('  npm test tests/visual         # CSS tests');
console.log('');