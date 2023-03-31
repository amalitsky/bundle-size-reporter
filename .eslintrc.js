
const ignorePatterns = [
  'dist/',
  'e2e-tests-fixtures/',
];

const config = {
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
    ecmaVersion: 2019,
  },
};

module.exports = config;
