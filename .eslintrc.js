const OFF = 0;

const config = {
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

config.rules = {
  'no-unused-vars': OFF, // in favour of @typescript-eslint/no-unused-vars
  'no-extra-parens': OFF,
};

module.exports = config;
