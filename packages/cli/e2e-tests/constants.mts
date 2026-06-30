export const bsrBinPath = 'dist/index.mjs';
export const artifactsPath = 'e2e-tests/artifacts';
export const fixturesPath = 'e2e-tests/fixtures';

// Default output filenames the CLI writes; shared between the scoped-config
// helper and the tests so both agree on where a run's output lands.
export const statsFilename = 'bundle-size-stats.json';
export const reportFilename = 'bundle-size-report.txt';

// Shared "basic" build fixture: the config, the build tree it points at, and the
// expected stats. expected.stats.json doubles as the current-build input for the
// print/comparison/cli-args suites.
export const basicBuildPath = `${fixturesPath}/basic/build`;
export const basicConfigPath = `${fixturesPath}/basic/bsr.config.json`;
export const basicStatsPath = `${fixturesPath}/basic/expected.stats.json`;
