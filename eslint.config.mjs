import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default [
  { ignores: ['build/**', 'public/**', '**/node_modules/**', 'data.local/**'] },
  js.configs.recommended,
  stylistic.configs.customize({ indent: 2, quotes: 'single', semi: false, commaDangle: 'always-multiline' }),
  {
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/spaced-comment': 'off',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-restricted-properties': ['error', { property: 'substr', message: 'Use String#slice instead.' }],
      radix: ['error', 'always'],
    },
  },
  { files: ['**/*.mjs'], languageOptions: { sourceType: 'module' } },
  { files: ['src/js/**/*.js'], languageOptions: { globals: globals.browser } },
]
