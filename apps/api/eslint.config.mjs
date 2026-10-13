import { baseConfig, sourceRules } from '@patty/config/eslint/base.mjs';
import importPlugin from 'eslint-plugin-import';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/__tests__/**/*', '**/*.test.ts'],
    plugins: {
      import: importPlugin,
    },
    rules: sourceRules,
  },
  {
    files: ['src/**/__tests__/**/*.ts', 'src/**/*.test.ts'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-console': 'off',
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['*.config.ts', 'src/index.ts', 'drizzle.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    // CLI scripts are allowed to use process.stdout/stderr directly.
    files: ['src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
