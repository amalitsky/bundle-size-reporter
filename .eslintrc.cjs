const ignorePatterns = ['dist/', 'packages/*/e2e-tests/fixtures/'];

const config = {
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'packages/*/tsconfig.json',
      },
    },
  },
  root: true,
  extends: [
    'eslint:recommended',
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'amalitsky/recommended',
    'amalitsky/imports',
    'amalitsky/naming',
    'amalitsky/newlines',
    'prettier',
  ],
  ignorePatterns,
};

config.env = {
  es6: true,
  node: true,
};

config.parserOptions = {
  sourceType: 'module',
  ecmaFeatures: {
    ecmaVersion: 2020,
  },
};

module.exports = config;
