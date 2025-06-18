import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'index.html'
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    // Test files
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    'src/**/__tests__/**',
    
    // Build and config files
    'vite.config.ts',
    'playwright.config.ts',
    'vitest.config.ts',
    
    // Type definition files
    '**/*.d.ts'
  ],
  ignoreDependencies: [
    // Used in Tailwind CSS configuration
    'tailwindcss',
    
    // Used by LocalForage internally
    '@types/localforage'
  ],
  playwright: {
    entry: ['e2e/**/*.spec.ts']
  },
  vitest: {
    entry: ['src/**/*.test.{ts,tsx}']
  }
};

export default config;