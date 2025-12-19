/**
 * CSS validation tests
 * Validates CSS structure, logo placeholder styles, and theme variables
 */

const fs = require('fs');
const path = require('path');

function validateCSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const warnings = [];
  const info = [];

  // Check for logo-placeholder class definition
  if (!content.includes('.logo-placeholder')) {
    errors.push('Missing .logo-placeholder class definition');
  } else {
    info.push('✓ .logo-placeholder class defined');
    
    // Check for key properties in logo-placeholder
    const logoPlaceholderMatch = content.match(/\.logo-placeholder\s*{[^}]*}/);
    if (logoPlaceholderMatch) {
      const block = logoPlaceholderMatch[0];
      
      if (!block.includes('display:') && !block.includes('display :')) {
        warnings.push('.logo-placeholder missing display property');
      }
      if (!block.includes('border-radius:') && !block.includes('border-radius :')) {
        warnings.push('.logo-placeholder missing border-radius property');
      }
      if (!block.includes('background:') && !block.includes('background :') && 
          !block.includes('background-color:') && !block.includes('background-color :')) {
        warnings.push('.logo-placeholder missing background property');
      }
    }
  }

  // Check for header img.logo class
  if (!content.includes('header img.logo') && !content.includes('header .logo')) {
    warnings.push('Missing header logo image styles');
  } else {
    info.push('✓ Header logo styles defined');
  }

  // Check for CSS custom properties (variables)
  const cssVarRegex = /--[\w-]+:/g;
  const variables = content.match(cssVarRegex) || [];
  
  const requiredVars = [
    '--bg',
    '--text',
    '--accent'
  ];

  requiredVars.forEach(varName => {
    if (!variables.some(v => v.startsWith(varName))) {
      warnings.push(`Missing CSS variable: ${varName}`);
    } else {
      info.push(`✓ CSS variable ${varName} defined`);
    }
  });

  // Check for theme-specific styles
  if (!content.includes('[data-theme="light"]')) {
    warnings.push('Missing light theme styles');
  } else {
    info.push('✓ Light theme styles defined');
  }

  // Check for dark theme (default or explicit)
  if (!content.includes('[data-theme="dark"]') && !content.includes(':root')) {
    warnings.push('Missing dark theme or root styles');
  }

  // Check for responsive styles
  if (!content.includes('@media') && !content.includes('@MEDIA')) {
    warnings.push('No responsive media queries found');
  }

  // Check for animations
  if (content.includes('@keyframes') || content.includes('@KEYFRAMES')) {
    info.push('✓ CSS animations defined');
  }

  // Check for removed old logo classes
  if (content.includes('.logo-inline')) {
    errors.push('Old .logo-inline class still present - should be removed');
  }

  // Validate basic CSS syntax
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  return { errors, warnings, info };
}

function main() {
  const cssFile = path.join(__dirname, '..', 'docs', 'style.css');
  
  if (!fs.existsSync(cssFile)) {
    console.error('CSS file not found:', cssFile);
    process.exit(1);
  }

  console.log('CSS Validation Results\n' + '='.repeat(50));
  
  const { errors, warnings, info } = validateCSS(cssFile);
  
  console.log('\nstyle.css:');
  
  if (info.length > 0) {
    console.log('\n  Info:');
    info.forEach(msg => console.log(`    ${msg}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n  ✓ No errors or warnings');
  } else {
    if (errors.length > 0) {
      console.log(`\n  ✗ ${errors.length} error(s):`);
      errors.forEach(err => console.log(`    - ${err}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\n  ⚠ ${warnings.length} warning(s):`);
      warnings.forEach(warn => console.log(`    - ${warn}`));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: ${errors.length} errors, ${warnings.length} warnings`);
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();