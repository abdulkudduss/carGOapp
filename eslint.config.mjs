import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Minimal root config: typescript-eslint "recommended" (non type-checked, so no
// per-package parserOptions.project wiring is needed across the monorepo).
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/generated/**',
      '**/dist/**',
      '**/build/**',
      '**/dev-dist/**',
      '**/storybook-static/**',
      '**/.expo/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    // Native tooling config files (Metro, Babel) are CommonJS and must use require().
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
