import js from '@eslint/js';
import eslintComments from 'eslint-plugin-eslint-comments';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/**
 * Bans `as SomeType` type assertions. `as const` is exempt — it is a safe
 * const assertion, not a type bypass.
 */
const noTypeAssertionRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid `as` type assertions. Use type guards or Zod parse instead. `as const` is allowed.',
    },
    messages: {
      noAssertion:
        'Type assertion (`as`) is forbidden. Use a type guard or Zod schema instead of casting. `as const` is the only allowed form.',
    },
    schema: [],
  },
  create(context) {
    return {
      TSAsExpression(node) {
        const t = node.typeAnnotation;
        // Allow `as const`
        if (
          t.type === 'TSTypeReference' &&
          t.typeName.type === 'Identifier' &&
          t.typeName.name === 'const'
        )
          return;
        context.report({ node, messageId: 'noAssertion' });
      },
    };
  },
};

export const localPlugin = { rules: { 'no-type-assertion': noTypeAssertionRule } };

export const coreRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-require-imports': 'off',
  'import/no-unresolved': 'off',

  // --- Strict AI Safety Rules ---

  // 1. Ban ALL Suppressions (Absolute Ban)
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': true,
      'ts-ignore': true,
      'ts-nocheck': true,
      'ts-check': false,
    },
  ],
  'eslint-comments/no-use': ['error', { allow: [] }],
  'no-warning-comments': [
    'error',
    { terms: ['prettier-ignore'], location: 'anywhere' },
  ],

  // 2. Strict Sorting & Cleanup
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  'unused-imports/no-unused-imports': 'error',

  // 3. Type Safety
  '@typescript-eslint/no-non-null-assertion': 'error',
  'local/no-type-assertion': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports' },
  ],
};

// Rules that require type information
export const typedRules = {
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': [
    'error',
    { ignorePrimitives: { boolean: true } },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
};

/** Rules for production source files (not tests, not config). */
export const sourceRules = {
  'no-console': 'error',
  'import/no-default-export': 'error',
};

export const baseConfig = [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '*.json'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      'eslint-comments': eslintComments,
      local: localPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parser: tsEslint.parser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: coreRules,
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: typedRules,
  },
];
