# Testing Guide

## Overview
Comprehensive test suite covering frontend JavaScript, CSS, backend API, and visual UI components.

## Quick Start

### Installation
```bash
npm install
```

### Running Tests
```bash
# All unit/integration tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Test Organization

### Unit Tests (tests/unit/)
- **script.test.js**: 400+ tests for JavaScript logic
- **style.test.js**: 60+ tests for CSS structure

### Integration Tests (tests/integration/)
- **censys-api.test.js**: 50+ tests for backend API

### E2E Tests (tests/e2e/)
- **logo-sigil.spec.js**: 30+ tests for visual UI

## Coverage
- Total Tests: 540+
- Coverage Target: >80%
- Execution Time: ~30s (unit) + ~2min (E2E)

See tests/README.md for detailed documentation.