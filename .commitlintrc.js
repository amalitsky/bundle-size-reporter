const NEVER = 'never';
const ALWAYS = 'always';

const OFF = 0;
const WARN = 1;
const ERROR = 2;

const scopes = [
  'release',
  'global',
  'cli',
  'deps', // dependabot
  'deps-dev',
];

// https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
const config = {
  extends: [
    '@commitlint/config-conventional',
  ],
  rules: {
    'scope-enum': [
      ERROR,
      ALWAYS,
      scopes,
    ]
  }
};

module.exports = config;
