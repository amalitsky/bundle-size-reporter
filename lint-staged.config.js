const config = {
  '**/*.{ts,js}': [
    'yarn eslint',
    () => 'yarn ts-compile-check', // to omit list of files matched
  ],
};

module.exports = config;
