import { EOL } from 'os';

import { strict as assert } from 'node:assert';

import {
  it,
  describe,
  afterEach,
} from 'node:test';

import {
  readFile,
  rm,
  mkdir,
  stat,
} from 'node:fs/promises';

import { executeNodeScript } from './utils/child-node-process.mjs';

import {
  artifactsPath,
  bsrBinPath,
  fixturesPath,
  snapshotsPath,
  defaultFileReportPath,
  defaultJsonFileReportPath,
} from './constants.mjs';

const localBuildFolderPath = `${ fixturesPath }/local-build`;
const localBuildConfigPath = `${ fixturesPath }/local-build.bsr.config.json`;

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
      `-c=${ localBuildConfigPath }`,
    ]);

    assert.equal(output.trim(), `Bundle size report saved to ${ defaultJsonFileReportPath }`);

    const jsonReportExpectationFileContent =
      await readFile(`${ snapshotsPath }/local-build.report.json`, 'utf-8');

    const jsonReportExpectation = JSON.parse(jsonReportExpectationFileContent);

    const jsonReportContent = await readFile(defaultJsonFileReportPath, 'utf-8');

    const jsonReport = JSON.parse(jsonReportContent);

    assert.deepEqual(jsonReport, jsonReportExpectation);

    // doesn't create report file
    await assert.rejects(() => stat(defaultFileReportPath));
  });

  it('print', async () => {
    const output = await executeNodeScript(bsrBinPath, [
      'print',
      `${ snapshotsPath }/local-build.report.json`,
      `-c=${ localBuildConfigPath }`,
    ]);

    const outputExpectation = await readFile(
      `${ snapshotsPath }/local-build.print.output.txt`,
      'utf-8',
    );

    assert.equal(output, outputExpectation);

    const reportFile = await readFile(defaultFileReportPath, 'utf-8');

    const reportFileExpectation = await readFile(
      `${ snapshotsPath }/local-build.report.txt`,
      'utf-8',
    );

    assert.equal(`${ reportFile }${ EOL }`, reportFileExpectation);

    // doesn't create (or copy) json file
    await assert.rejects(() => stat(defaultJsonFileReportPath));
  });

  it('autorun', async () => {
    const output = await executeNodeScript(bsrBinPath, [
      'autorun',
      localBuildFolderPath,
      `-c=${ localBuildConfigPath }`,
    ]);

    const outputExpectation = await readFile(
      `${ snapshotsPath }/local-build.autorun.output.txt`,
      'utf-8',
    );

    assert.equal(output, outputExpectation);

    const reportFile = await readFile(defaultFileReportPath, 'utf-8');

    const reportExpectation = await readFile(`${ snapshotsPath }/local-build.report.txt`, 'utf-8');

    assert.equal(`${ reportFile }${ EOL }`, reportExpectation);

    const jsonReportContent = await readFile(defaultJsonFileReportPath, 'utf-8');

    const jsonReport = JSON.parse(jsonReportContent);

    const jsonReportExpectationFileContent =
      await readFile(`${ snapshotsPath }/local-build.report.json`, 'utf-8');

    const jsonReportExpectation = JSON.parse(jsonReportExpectationFileContent);

    assert.deepEqual(jsonReport, jsonReportExpectation);
  });
});
