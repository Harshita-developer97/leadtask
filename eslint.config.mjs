import nextConfig from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextConfig,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn', 'info'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // react-hook-form's watch() and TanStack Table's useReactTable() are
      // well-established, widely used hooks that intentionally return fresh
      // function references on every render; this is documented behavior,
      // not a bug, so the React Compiler's "incompatible library" advisory
      // is a false positive for both here.
      'react-hooks/incompatible-library': 'off',
      // The one-time "read the DOM class Next.js's blocking theme script set
      // before hydration, then sync it into React state" pattern in
      // components/providers.tsx is the standard, hydration-safe way to pick
      // up external browser state — it intentionally can't be done outside
      // an effect without risking a hydration mismatch.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: ['tests/e2e/**', 'node_modules/**', '.next/**', 'coverage/**', 'playwright-report/**'],
  },
];

export default config;
