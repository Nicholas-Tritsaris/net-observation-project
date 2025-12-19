#!/bin/bash

# Net Observation Project Test Runner
# Executes the complete test suite for changed files

set -e

echo "=========================================="
echo "Net Observation Project - Test Suite"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    echo ""
fi

echo "🧪 Running test suite..."
echo ""

# Run all tests with coverage
npm test -- --coverage --verbose

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "✅ All tests completed!"
echo ""
echo "📊 Coverage report generated in: coverage/"
echo "   Open coverage/index.html in a browser to view detailed coverage"
echo ""
echo "Test files executed:"
echo "  - tests/script.test.js (JavaScript functionality)"
echo "  - tests/style.test.js (CSS validation)"
echo "  - tests/html.test.js (HTML structure)"
echo "  - tests/readme.test.js (Documentation)"
echo "  - tests/integration.test.js (Integration tests)"
echo ""