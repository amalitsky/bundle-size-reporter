import { EOL } from 'os';

import { strict as assert } from 'node:assert';

import { it, describe, before, beforeEach } from 'node:test';

import { readFile, stat } from 'node:fs/promises';

import './utils/snapshot-setup.mts';
import { executeNodeScript } from './utils/child-node-process.mts';
import { resetDir, writeScopedConfig } from './utils/artifacts.mts';

import {
  artifactsPath,
  bsrBinPath,
  fixturesPath,
  basicBuildPath,
  basicConfigPath,
  basicStatsPath,
  statsFilename,
  reportFilename,
} from './constants.mts';

const scopeDir = `${artifactsPath}/cli-args`;
const outDir = `${scopeDir}/out`;

// The basic config is shared across suites, so its per-suite output path is
// generated here. wrong-input is used only by this file, so it points at this
// suite's out dir directly in its fixture — no copy needed.
const configPath = `${scopeDir}/basic.config.json`;
const wrongInputConfigPath = `${fixturesPath}/cli-args/wrong-input.bsr.config.json`;

// the paths the config resolves to when no output flag is given
const statsPath = `${outDir}/${statsFilename}`;
const reportPath = `${outDir}/${reportFilename}`;

const customStatsPath = `${outDir}/custom-stats.json`;
const customReportPath = `${outDir}/custom-report.txt`;

// Verifies CLI flag handling and input precedence over the config file.
describe('CLI arguments', () => {
  before(() => writeScopedConfig(basicConfigPath, configPath, outDir));
  beforeEach(() => resetDir(outDir));

  it('analyze writes stats to the --output path and not the default', async () => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${configPath}`,
      `-o=${customStatsPath}`,
    ]);

    assert.equal(code, 0);
    assert.equal(stdout.trim(), `Bundle size stats saved to ${customStatsPath}`);

    const stats = JSON.parse(await readFile(customStatsPath, 'utf-8'));
    const statsExpectation = JSON.parse(await readFile(basicStatsPath, 'utf-8'));

    assert.deepEqual(stats, statsExpectation);

    // the config's default stats path is not used when --output is provided
    await assert.rejects(() => stat(statsPath));
  });

  it('autorun writes the report to the --report path', async (t) => {
    const { code } = await executeNodeScript(bsrBinPath, [
      'autorun',
      basicBuildPath,
      `-c=${configPath}`,
      `-r=${customReportPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(customReportPath, 'utf-8');

    t.assert.snapshot(`${reportFile}${EOL}`);
  });

  it('print writes the report to the --output path', async (t) => {
    const { code } = await executeNodeScript(bsrBinPath, [
      'print',
      basicStatsPath,
      `-c=${configPath}`,
      `-o=${customReportPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(customReportPath, 'utf-8');

    t.assert.snapshot(`${reportFile}${EOL}`);

    // the config's default report path is not used when --output is provided
    await assert.rejects(() => stat(reportPath));
  });

  it('positional input overrides the config input path', async () => {
    // config points input at a non-existent dir; the positional must win
    const { code } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${wrongInputConfigPath}`,
    ]);

    assert.equal(code, 0);

    const stats = JSON.parse(await readFile(statsPath, 'utf-8'));
    const statsExpectation = JSON.parse(await readFile(basicStatsPath, 'utf-8'));

    assert.deepEqual(stats, statsExpectation);
  });
});
