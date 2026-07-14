/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    }),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['src'],
    },
    watch: {
      ignored: ['**/dist/**'],
    },
  },
  optimizeDeps: {
    exclude: ['dist'],
    entries: ['src/**/*.ts', '!src/**/*.spec.ts'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setup-vitest.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/setup-vitest.ts', 'src/test.ts', 'src/app/testing/**'],
      // Documented target is >= 80%; branches were at 72.78% when thresholds were
      // introduced — raising that floor to 80 is tracked as follow-up work.
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 72,
      },
    },
    environmentOptions: {
      jsdom: {
        // Disable external resource loading to avoid undici compatibility issues with jsdom 27.4+
        resources: undefined,
      },
    },
  },
});
