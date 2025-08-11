import globals from 'globals';
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        jest: true
      },
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
