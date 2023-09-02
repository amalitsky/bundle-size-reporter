import { EOL } from 'os';

import { strict as assert } from 'node:assert';

import { it, describe, afterEach } from 'node:test';

import { readFile, rm, mkdir, stat } from 'node:fs/promises';

import { executeNodeScript } from './utils/child-node-process.mjs';

import {
  artifactsPath,
  bsrBinPath,
  fixturesPath,
  snapshotsPath,
  defaultReportFilePath,
  defaultStatsFilePath,
} from './constants.mjs';

const localBuildFolderPath = `${fixturesPath}/local-build`;
const localBuildConfigPath = `${fixturesPath}/local-build.bsr.config.json`;

describe('basic functionality', () => {
  afterEach(async () => {
    await rm(artifactsPath, {
      force: true,
      recursive: true,
    });

    await mkdir(artifactsPath);
  });

  it('analyze', async () => {
    const output = await executeNodeScript(bsrBinPath, [
      'analyze',
      localBuildFolderPath,
      `-c=${localBuildConfigPath}`,
    ]);

    assert.equal(output.trim(), `Bundle size stats saved to ${defaultStatsFilePath}`);

    const jsonReportExpectationFileContent = await readFile(
      `${snapshotsPath}/local-build.stats.json`,
      'utf-8',
    );

    const jsonReportExpectation = JSON.parse(jsonReportExpectationFileContent);

    const jsonReportContent = await readFile(defaultStatsFilePath, 'utf-8');

    const jsonReport = JSON.parse(jsonReportContent);

    assert.deepEqual(jsonReport, jsonReportExpectation);

    // doesn't create text report file
    await assert.rejects(() => stat(defaultReportFilePath));
  });

  it('print', async () => {
    const output = await executeNodeScript(bsrBinPath, [
      'print',
      `${snapshotsPath}/local-build.stats.json`,
      `-c=${localBuildConfigPath}`,
    ]);

    const outputExpectation = await readFile(
      `${snapshotsPath}/local-build.print.output.txt`,
      'utf-8',
    );

    assert.equal(output, outputExpectation);

    const reportFile = await readFile(defaultReportFilePath, 'utf-8');

    const reportFileExpectation = await readFile(
      `${snapshotsPath}/local-build.report.txt`,
      'utf-8',
    );

    assert.equal(`${reportFile}${EOL}`, reportFileExpectation);

    // doesn't create (or copy) json file
    await assert.rejects(() => stat(defaultStatsFilePath));
  });

  it('autorun', async () => {
    const output = await executeNodeScript(bsrBinPath, ['autorun', `-c=${localBuildConfigPath}`]);

    const outputExpectation = await readFile(
      `${snapshotsPath}/local-build.autorun.output.txt`,
      'utf-8',
    );

    assert.equal(output, outputExpectation);

    const reportFile = await readFile(defaultReportFilePath, 'utf-8');

    const reportExpectation = await readFile(`${snapshotsPath}/local-build.report.txt`, 'utf-8');

    assert.equal(`${reportFile}${EOL}`, reportExpectation);

    const jsonReportContent = await readFile(defaultStatsFilePath, 'utf-8');

    const jsonReport = JSON.parse(jsonReportContent);

    const jsonReportExpectationFileContent = await readFile(
      `${snapshotsPath}/local-build.stats.json`,
      'utf-8',
    );

    const jsonReportExpectation = JSON.parse(jsonReportExpectationFileContent);

    assert.deepEqual(jsonReport, jsonReportExpectation);
  });
});
