#!/bin/bash

set -e

echo "==================================="
echo "Net Observation Project Test Suite"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Run unit tests
echo -e "${GREEN}Running Unit Tests...${NC}"
echo "-----------------------------------"
npm run test
echo ""

# Check if we should run E2E tests
if [ "$1" == "--e2e" ] || [ "$1" == "--all" ]; then
    echo -e "${GREEN}Running E2E Tests...${NC}"
    echo "-----------------------------------"
    echo "Note: This requires Wrangler to serve the site"
    npm run test:e2e
    echo ""
fi

# Run with coverage if requested
if [ "$1" == "--coverage" ] || [ "$1" == "--all" ]; then
    echo -e "${GREEN}Running Tests with Coverage...${NC}"
    echo "-----------------------------------"
    npm run test:coverage
    echo ""
fi

echo -e "${GREEN}✓ All tests completed${NC}"