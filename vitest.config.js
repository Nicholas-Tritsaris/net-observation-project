import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['docs/script.js', 'functions/**/*.js'],
      exclude: ['**/*.test.js', '**/*.spec.js', 'node_modules/**']
    },
    setupFiles: ['./tests/setup.js']
  }
});