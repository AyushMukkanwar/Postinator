import config from '../../packages/eslint-config/index.js';
import reactInternal from '../../packages/eslint-config/react-internal.js';
import pkg from '@next/eslint-plugin-next';
const { flatConfig: pluginNext } = pkg;

export default [
  ...config,
  ...reactInternal,
  pluginNext.coreWebVitals,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json', './.next/tsconfig.json'],
        },
      },
    },
    rules: {
      'import/no-unresolved': 'error',
    },
  },
];
