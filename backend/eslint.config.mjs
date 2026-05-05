// @ts-check
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // Ignorer certains fichiers
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.mjs',
    ],
  },

  // Configuration de base
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 🔥 TOUTES LES RÈGLES DÉSACTIVÉES 🔥
  {
    rules: {
      // ESLint
      'no-unused-vars': 'off',
      'no-console': 'off',

      // TypeScript ESLint
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Prettier (désactivé totalement)
      'prettier/prettier': 'off',
    },
  },
);
