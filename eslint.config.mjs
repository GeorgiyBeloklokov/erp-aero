import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'eslint.config.js', 'jest.config.js', '**/express.d.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
];
