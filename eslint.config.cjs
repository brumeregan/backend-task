// Flat config. CommonJS on purpose so this file needs no default export.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

const noDefaultExportOrFunctionKeyword = [
  'error',
  {
    selector: 'ExportDefaultDeclaration',
    message: 'Use named exports only (export const ...).',
  },
  {
    selector: 'FunctionDeclaration',
    message: 'Use a named arrow function: const name = () => {}.',
  },
  {
    selector: 'FunctionExpression',
    message: 'Use an arrow function instead of a function expression.',
  },
];

module.exports = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/next-env.d.ts',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'func-style': ['error', 'expression'],
      curly: ['error', 'all'],
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': noDefaultExportOrFunctionKeyword,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Framework/tooling entry points that require a default export.
    files: [
      'applications/b2b-web/src/app/**/page.tsx',
      'applications/b2b-web/src/app/**/layout.tsx',
      '**/*.config.{ts,mts,js,mjs}',
    ],
    rules: {
      'no-restricted-syntax': noDefaultExportOrFunctionKeyword.filter(
        (entry) => typeof entry === 'string' || entry.selector !== 'ExportDefaultDeclaration',
      ),
    },
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
