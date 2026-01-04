#!/bin/bash

# Validation script for test suite completeness
echo "🔍 Validating Test Suite..."
echo ""

# Check test files exist
echo "📁 Checking test files..."
test_files=(
    "__tests__/script.test.js"
    "__tests__/style.test.js"
    "__tests__/html-structure.test.js"
    "__tests__/readme.test.js"
    "__tests__/integration.test.js"
    "__tests__/censys-summary.test.js"
)

all_present=true
for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
        all_present=false
    fi
done
echo ""

# Check configuration files
echo "⚙️  Checking configuration files..."
config_files=(
    "package.json"
    "jest.config.js"
    "__tests__/setup.js"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
        all_present=false
    fi
done
echo ""

# Check documentation
echo "📖 Checking documentation..."
doc_files=(
    "TEST_COVERAGE_REPORT.md"
    "TESTING_QUICKSTART.md"
    "TEST_SUITE_SUMMARY.md"
    "__tests__/README.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
        all_present=false
    fi
done
echo ""

# Count tests
echo "📊 Counting tests..."
total_tests=0
for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        count=$(grep -c "^\s*test\|^\s*it" "$file" 2>/dev/null || echo "0")
        echo "  $(basename $file): ~$count tests"
        total_tests=$((total_tests + count))
    fi
done
echo "  Total: ~$total_tests tests"
echo ""

# Calculate total lines
echo "📏 Counting lines..."
test_lines=$(find __tests__ -name "*.test.js" -exec cat {} + 2>/dev/null | wc -l)
doc_lines=$(cat TEST_*.md __tests__/README.md 2>/dev/null | wc -l)
echo "  Test code: $test_lines lines"
echo "  Documentation: $doc_lines lines"
echo "  Total: $((test_lines + doc_lines)) lines"
echo ""

# Final status
echo "🎯 Validation Result:"
if [ "$all_present" = true ]; then
    echo "  ✅ All files present"
    echo "  ✅ Test suite is complete"
    echo ""
    echo "Next steps:"
    echo "  1. npm install"
    echo "  2. npm test"
    echo "  3. npm run test:coverage"
    exit 0
else
    echo "  ❌ Some files are missing"
    echo "  Please review the output above"
    exit 1
fi