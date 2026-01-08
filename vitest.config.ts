import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test files location
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'out', '.vite', 'dist'],

    // Environment
    environment: 'happy-dom', // For renderer tests

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'out/',
        '.vite/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        'scripts/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    },

    // Timeouts
    testTimeout: 10000, // 10s for integration tests

    // Globals (optional, Jest-like API)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.ts'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
