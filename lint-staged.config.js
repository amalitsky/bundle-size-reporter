const config = {
  '**/*.{ts,js,mjs,mts,cjs}': [
    'npm run eslint --',
    'npm run prettier -- --write',
    () => 'npm run ts-compile-check', // to omit list of files matched
  ],
  '**/*.{yml,md}': ['npm run prettier -- --write'],
};

module.exports = config;
