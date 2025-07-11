import config from './packages/eslint-config/index.js';

export default [
  ...config,
  {
    ignores: ['dist/', 'build/', 'node_modules/', '.next/', '*.config.js'],
  },
];

