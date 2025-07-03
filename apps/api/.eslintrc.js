/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'], // optional if using TypeScript
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // disable conflicting rules with prettier
  ],
  ignorePatterns: ['.eslintrc.js', 'dist/', 'build/', 'node_modules/'],
  rules: {
    // custom rules
  },
};
