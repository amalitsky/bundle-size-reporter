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
  basicBuildPath,
  basicConfigPath,
  basicStatsPath,
  statsFilename,
  reportFilename,
} from './constants.mts';

const scopeDir = `${artifactsPath}/basic`;
const outDir = `${scopeDir}/out`;
const configPath = `${scopeDir}/basic.config.json`;
const statsPath = `${outDir}/${statsFilename}`;
const reportPath = `${outDir}/${reportFilename}`;

describe('basic functionality', () => {
  before(() => writeScopedConfig(basicConfigPath, configPath, outDir));
  beforeEach(() => resetDir(outDir));

  it('analyze', async () => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'analyze',
      basicBuildPath,
      `-c=${configPath}`,
    ]);

    assert.equal(code, 0);
    assert.equal(stdout.trim(), `Bundle size stats saved to ${statsPath}`);

    const jsonReport = JSON.parse(await readFile(statsPath, 'utf-8'));
    const jsonReportExpectation = JSON.parse(await readFile(basicStatsPath, 'utf-8'));

    assert.deepEqual(jsonReport, jsonReportExpectation);

    // doesn't create text report file
    await assert.rejects(() => stat(reportPath));
  });

  it('print', async (t) => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'print',
      basicStatsPath,
      `-c=${configPath}`,
    ]);

    assert.equal(code, 0);
    t.assert.snapshot(stdout);

    const reportFile = await readFile(reportPath, 'utf-8');

    t.assert.snapshot(`${reportFile}${EOL}`);

    // doesn't create (or copy) json file
    await assert.rejects(() => stat(statsPath));
  });

  it('autorun', async (t) => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, ['autorun', `-c=${configPath}`]);

    assert.equal(code, 0);
    t.assert.snapshot(stdout);

    const reportFile = await readFile(reportPath, 'utf-8');

    t.assert.snapshot(`${reportFile}${EOL}`);

    const jsonReport = JSON.parse(await readFile(statsPath, 'utf-8'));
    const jsonReportExpectation = JSON.parse(await readFile(basicStatsPath, 'utf-8'));

    assert.deepEqual(jsonReport, jsonReportExpectation);
  });
});
