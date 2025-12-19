#!/bin/bash

echo "🧪 Verifying Test Suite Installation..."
echo ""

errors=0

# Check test files
test_files=(
  "tests/setup.js"
  "tests/unit/script.test.js"
  "tests/unit/edge-cases.test.js"
  "tests/integration/application.test.js"
  "tests/integration/ui-rendering.test.js"
  "tests/validation/css.test.js"
  "tests/validation/html.test.js"
  "tests/validation/readme.test.js"
)

for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    echo "✅ $file ($lines lines)"
  else
    echo "❌ $file (MISSING)"
    ((errors++))
  fi
done

echo ""

# Check config files
config_files=(
  "package.json"
  "jest.config.js"
  ".gitignore"
)

for file in "${config_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (MISSING)"
    ((errors++))
  fi
done

echo ""

# Check documentation
doc_files=(
  "tests/README.md"
  "TEST_SUMMARY.md"
)

for file in "${doc_files[@]}"; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    echo "✅ $file ($lines lines)"
  else
    echo "❌ $file (MISSING)"
    ((errors++))
  fi
done

echo ""
echo "📊 Test Suite Statistics:"
echo "------------------------"
total_lines=$(find tests -name "*.test.js" -exec wc -l {} + | tail -1 | awk '{print $1}')
test_files_count=$(find tests -name "*.test.js" | wc -l)
echo "Test files: $test_files_count"
echo "Test code lines: $total_lines"
echo "Configuration files: ${#config_files[@]}"
echo "Documentation files: ${#doc_files[@]}"

echo ""
if [ $errors -eq 0 ]; then
  echo "✅ All test files verified successfully!"
  echo ""
  echo "To run tests:"
  echo "  npm install"
  echo "  npm test"
  exit 0
else
  echo "❌ $errors file(s) missing"
  exit 1
fi