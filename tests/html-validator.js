/**
 * HTML validation tests
 * Validates HTML structure, attributes, and accessibility
 */

const fs = require('fs');
const path = require('path');

function validateHTML(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const warnings = [];

  // Check for logo image tags with data-logo attribute
  const logoImgRegex = /<img[^>]+data-logo[^>]*>/g;
  const logoMatches = content.match(logoImgRegex) || [];
  
  logoMatches.forEach(match => {
    if (!match.includes('alt=')) {
      errors.push(`Logo image missing alt attribute: ${match.substring(0, 50)}...`);
    }
    if (!match.includes('src=')) {
      errors.push(`Logo image missing src attribute: ${match.substring(0, 50)}...`);
    }
  });

  // Check for proper DOCTYPE
  if (!content.trim().startsWith('<!DOCTYPE html>') && !content.trim().startsWith('<!doctype html>')) {
    warnings.push('Missing or incorrect DOCTYPE declaration');
  }

  // Check for lang attribute
  if (!/<html[^>]+lang=/.test(content)) {
    warnings.push('Missing lang attribute on html element');
  }

  // Check for charset meta tag
  if (!/<meta[^>]+charset=/.test(content)) {
    errors.push('Missing charset meta tag');
  }

  // Check for viewport meta tag
  if (!/<meta[^>]+name=["']viewport["']/.test(content)) {
    warnings.push('Missing viewport meta tag');
  }

  // Check for title tag
  if (!/<title>[\s\S]*?<\/title>/.test(content)) {
    errors.push('Missing title tag');
  }

  // Check for data-page attribute on body
  if (!/<body[^>]+data-page=/.test(content)) {
    warnings.push('Missing data-page attribute on body element');
  }

  // Check for sidebar structure
  if (content.includes('class="sidebar"')) {
    if (!content.includes('data-logo')) {
      warnings.push('Sidebar present but missing logo image with data-logo');
    }
  }

  // Check for theme toggle
  if (content.includes('data-role="theme-toggle"')) {
    const themeToggle = content.match(/<[^>]+data-role="theme-toggle"[^>]*>/);
    if (themeToggle && !themeToggle[0].includes('role="button"')) {
      warnings.push('Theme toggle missing role="button" for accessibility');
    }
  }

  return { errors, warnings };
}

function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const htmlFiles = fs.readdirSync(docsDir)
    .filter(file => file.endsWith('.html'));

  console.log('HTML Validation Results\n' + '='.repeat(50));
  
  let totalErrors = 0;
  let totalWarnings = 0;

  htmlFiles.forEach(file => {
    const filePath = path.join(docsDir, file);
    const { errors, warnings } = validateHTML(filePath);
    
    console.log(`\n${file}:`);
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('  ✓ No issues found');
    } else {
      if (errors.length > 0) {
        console.log(`  ✗ ${errors.length} error(s):`);
        errors.forEach(err => console.log(`    - ${err}`));
        totalErrors += errors.length;
      }
      
      if (warnings.length > 0) {
        console.log(`  ⚠ ${warnings.length} warning(s):`);
        warnings.forEach(warn => console.log(`    - ${warn}`));
        totalWarnings += warnings.length;
      }
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
  
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();