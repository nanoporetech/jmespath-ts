// src has additional rules at src/.eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  env: {
    browser: true,
    commonjs: true,
    node: true,
    mocha: true,
    es6: true,
  },
  rules: {
    curly: 'error',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
    ],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'prettier/prettier': 'error',
  },
};
