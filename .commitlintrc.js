const NEVER = 'never';
const ALWAYS = 'always';

const OFF = 0;
const WARN = 1;
const ERROR = 2;

// https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
const config = {
  extends: [
    '@commitlint/config-conventional',
    '@commitlint/config-lerna-scopes',
  ],
};

module.exports = config;
