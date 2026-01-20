import nextPlugin from '@next/eslint-plugin-next';
import config from '../../packages/eslint-config/index.js';
import reactInternal from '../../packages/eslint-config/react-internal.js';

export default [
  ...config,
  ...reactInternal,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json', './.next/tsconfig.json'],
        },
      },
    },
  },
];
