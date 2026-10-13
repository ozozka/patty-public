import js from '@eslint/js';
import {
  coreRules,
  localPlugin,
  typedRules,
} from '@patty/config/eslint/base.mjs';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintComments from 'eslint-plugin-eslint-comments';
import jest from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tsEslint from 'typescript-eslint';

import { patiPlugin } from './eslint-local-rules.mjs';

export default [
  // 1. Global Ignores
  {
    ignores: [
      '.expo/',
      'web-build/',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'src/types/openapi-generated.d.ts',
      'scripts/',
      'app.json',
      '**/e2e/**',
    ],
  },

  // 2. Base Configurations
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  ...expoConfig,

  // 3. Shared Core Rules and Plugins
  {
    plugins: {
      'eslint-comments': eslintComments,
      local: localPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      '@tanstack/query': tanstackQuery,
      pati: patiPlugin,
    },
    settings: {},
    rules: {
      ...coreRules,
      'react/jsx-no-literals': [
        'error',
        { noStrings: true, ignoreProps: true },
      ],
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/no-array-index-key': 'error',
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
      'pati/screen-must-use-screen-container': 'error',
      'pati/no-standalone-app-header': 'error',
      'pati/no-theme-colors-in-styles': 'error',
      'pati/no-static-inline-styles': 'error',
      'pati/no-platform-inline-style': 'error',
      'pati/no-hardcoded-animation-values': 'error',
      'pati/no-nested-ternary-jsx': 'error',
      'pati/no-hardcoded-style-token': 'error',
      'pati/no-classname-prop': 'error',
      'pati/no-hardcoded-icon-size': 'error',
      'pati/no-opacity-on-text': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='Alert'][property.name='alert']",
          message:
            'Native Alert.alert is forbidden. Use useAlert() or useToast().',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Alert'],
              message: 'Native Alert is forbidden. Use useAlert().',
            },
            {
              name: 'lucide-react-native',
              message:
                'Import icons from src/lib/icons for centralized icon management.',
            },
            {
              name: '@tanstack/react-query',
              importNames: ['useMutation'],
              message: 'Use useApiMutation from src/hooks/api/useApiMutation.',
            },
            {
              name: 'src/theme/typography',
              message:
                'Legacy typography object is forbidden. Use text-variant-* classes.',
            },
            {
              name: 'src/theme',
              message: 'Legacy theme folder is forbidden.',
            },
            {
              name: 'src/utils/color',
              message: 'Legacy color utilities are forbidden.',
            },
            { name: 'src/component', message: 'Import directly.' },
            { name: 'src/component/common', message: 'Import directly.' },
            { name: 'src/hooks', message: 'Import directly.' },
            { name: 'src/hooks/api', message: 'Import directly.' },
            { name: 'src/service', message: 'Import directly.' },
            { name: 'src/store', message: 'Import directly.' },
            { name: 'src/types', message: 'Import directly.' },
            { name: 'src/utils', message: 'Import directly.' },
          ],
          patterns: [
            {
              group: ['../*', '..'],
              message: 'Relative parent imports are forbidden.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/hooks/api/useApiMutation.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'src/component', message: 'Import directly.' },
            { name: 'src/component/common', message: 'Import directly.' },
            { name: 'src/hooks', message: 'Import directly.' },
            { name: 'src/hooks/api', message: 'Import directly.' },
            { name: 'src/service', message: 'Import directly.' },
            { name: 'src/store', message: 'Import directly.' },
            { name: 'src/types', message: 'Import directly.' },
            { name: 'src/utils', message: 'Import directly.' },
          ],
          patterns: [
            {
              group: ['../*', '..'],
              message: 'Relative parent imports are forbidden.',
            },
          ],
        },
      ],
    },
  },

  // 4. Typed Rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: typedRules,
  },

  // 5. Source Code Constraints
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**/*', '**/*.test.{ts,tsx}', 'src/utils/logger.ts'],
    rules: {
      'import/no-default-export': 'error',
      'no-console': 'error',
      'pati/require-testid-on-interactive': 'error',
    },
  },

  // 6. Layered Architecture Rules
  {
    files: ['src/component/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'src/Api',
              message: 'UI Components MUST NOT use ApiRequest directly.',
            },
          ],
          patterns: [
            {
              group: ['src/service/*'],
              message:
                'UI Components MUST NOT import Service classes directly.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use Services via Hooks.' },
      ],
    },
  },

  // 7. Test File Rules
  {
    files: [
      '**/__tests__/**/*',
      '**/*.test.tsx',
      '**/*.test.ts',
      'jest.setup*.ts',
    ],
    plugins: { jest },
    rules: {
      'react/jsx-no-literals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'import/no-default-export': 'off',
      'no-restricted-imports': 'off',
      'no-restricted-globals': 'off',
      'local/no-type-assertion': 'off',
      'no-console': ['error', { allow: ['warn', 'log'] }],
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'error',
      'jest/expect-expect': 'error',
      'jest/consistent-test-it': ['error', { fn: 'it' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // 8. Icons registry exception — must import from lucide-react-native directly
  {
    files: ['src/lib/icons.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // 9. Custom Architectural Rules
  {
    files: ['src/screens/**/*.tsx'],
    ignores: ['src/screens/**/__tests__/**/*.tsx', 'src/screens/**/*.test.tsx'],
    rules: {
      'pati/screen-must-use-screen-container': 'error',
    },
  },
];
