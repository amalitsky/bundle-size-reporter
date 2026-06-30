import { strict as assert } from 'node:assert';

import { it, describe } from 'node:test';

import { executeNodeScript } from './utils/child-node-process.mts';

import { bsrBinPath, fixturesPath, basicBuildPath, basicConfigPath } from './constants.mts';

const errorsFixturesPath = `${fixturesPath}/errors`;

// Error paths must exit non-zero and print a helpful message to stderr.
// These assertions are only possible because the test harness captures
// stderr + exit code instead of rejecting on the first stderr chunk.
describe('error handling', () => {
  it('fails when the config has no file groups', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${errorsFixturesPath}/no-groups.bsr.config.json`,
    ]);

    assert.notEqual(code, 0);
    assert.match(stderr, /File groups/);
  });

  it('fails when no files match the group globs', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${errorsFixturesPath}/no-matching-globs.bsr.config.json`,
    ]);

    assert.notEqual(code, 0);
    assert.match(stderr, /No group files were found/);
  });

  it('fails when no input path is provided', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, [
      'analyze',
      `-c=${errorsFixturesPath}/no-input.bsr.config.json`,
    ]);

    assert.notEqual(code, 0);
    assert.match(stderr, /Path to the .* directory wasn't provided/);
  });

  it('fails on an invalid (non-JSON) config file', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${errorsFixturesPath}/invalid-json.bsr.config.json`,
    ]);

    assert.notEqual(code, 0);
    assert.match(stderr, /not valid JSON|SyntaxError/);
  });

  it('fails when the stats file has no files', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, [
      'print',
      `${errorsFixturesPath}/no-files.stats.json`,
      `-c=${basicConfigPath}`,
    ]);

    assert.notEqual(code, 0);
    assert.match(stderr, /Stats file doesn't have files/);
  });

  it('fails on an unknown command', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, ['bogus']);

    assert.notEqual(code, 0);
    assert.match(stderr, /Unknown argument: bogus/);
  });

  it('fails when no command is given', async () => {
    const { code, stderr } = await executeNodeScript(bsrBinPath, []);

    assert.notEqual(code, 0);
    assert.match(stderr, /Not enough non-option arguments/);
  });
});
