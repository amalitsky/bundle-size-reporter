import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importXPlugin from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-config-prettier';

const OFF = 0;
const WARN = 1;
const ERROR = 2;

export default defineConfig([
  {
    ignores: ['**/dist/', 'packages/*/e2e-tests/fixtures/'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  importXPlugin.flatConfigs.recommended,
  importXPlugin.flatConfigs.typescript,

  {
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'packages/*/tsconfig.json',
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // TypeScript
      'no-undef': OFF, // TypeScript handles this
      '@typescript-eslint/no-explicit-any': WARN,
      '@typescript-eslint/ban-ts-comment': WARN,
      '@typescript-eslint/no-useless-constructor': ERROR,
      '@typescript-eslint/explicit-function-return-type': [ERROR, { allowExpressions: true }],
      '@typescript-eslint/explicit-member-accessibility': [
        ERROR,
        { overrides: { constructors: 'off' } },
      ],
      '@typescript-eslint/member-ordering': ERROR,
      '@typescript-eslint/prefer-for-of': ERROR,
      '@typescript-eslint/no-unused-vars': ERROR,

      // Naming conventions
      camelcase: OFF,
      '@typescript-eslint/naming-convention': [
        ERROR,
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: null,
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],

      // Import rules
      'import-x/no-default-export': ERROR,
      'import-x/order': ERROR,
      'import-x/no-dynamic-require': WARN,

      // Best practices (from google config)
      curly: [ERROR, 'multi-line'],
      'guard-for-in': ERROR,
      'no-caller': ERROR,
      'no-extend-native': ERROR,
      'no-extra-bind': ERROR,
      'no-invalid-this': ERROR,
      'no-multi-str': ERROR,
      'no-new-wrappers': ERROR,
      'no-throw-literal': ERROR,
      'no-with': ERROR,
      'no-var': ERROR,
      'prefer-const': [ERROR, { destructuring: 'all' }],
      'prefer-spread': ERROR,
      'new-cap': ERROR,
      'no-array-constructor': ERROR,
      'one-var': [ERROR, { var: 'never', let: 'never', const: 'never' }],

      // Best practices (from amalitsky config)
      'no-cond-assign': ERROR,
      'class-methods-use-this': ERROR,
      'no-unused-vars': OFF, // in favor of @typescript-eslint/no-unused-vars
      'no-useless-escape': ERROR,
      'prefer-rest-params': WARN,
      'no-use-before-define': [WARN, { classes: false }],
      'no-lonely-if': ERROR,
      'no-unused-expressions': OFF,
      '@typescript-eslint/no-unused-expressions': WARN,
      'no-nested-ternary': ERROR,
      eqeqeq: ERROR,
      'no-prototype-builtins': WARN,
      'array-callback-return': ERROR,
      'no-mixed-operators': ERROR,
      'no-return-assign': ERROR,
      'no-underscore-dangle': [
        ERROR,
        {
          allowAfterThis: true,
          allowAfterSuper: true,
          enforceInMethodNames: true,
        },
      ],
      'dot-notation': ERROR,
      'no-multi-assign': ERROR,
      'no-useless-return': ERROR,
      'no-loop-func': ERROR,
      'prefer-numeric-literals': ERROR,
      'prefer-destructuring': [
        ERROR,
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
        { enforceForRenamedProperties: false },
      ],
      'require-await': ERROR,
      'max-classes-per-file': [ERROR, 1],
      'prefer-template': ERROR,
      'object-shorthand': ERROR,
      'prefer-arrow-callback': ERROR,
      'prefer-promise-reject-errors': WARN,
    },
  },

  // Config files that require default exports
  {
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    rules: {
      'import-x/no-default-export': OFF,
    },
  },

  eslintConfigPrettier,
]);
