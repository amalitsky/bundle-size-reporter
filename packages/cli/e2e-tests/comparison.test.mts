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

const scopeDir = `${artifactsPath}/comparison`;
const outDir = `${scopeDir}/out`;
const reportPath = `${outDir}/${reportFilename}`;
const statsPath = `${outDir}/${statsFilename}`;

// The basic config is shared across suites, so its per-suite output path is
// generated here. The group configs below are used only by this file, so they
// point at this suite's out dir directly in their fixtures — no copy needed.
const basicConfig = `${scopeDir}/basic.config.json`;
const sizeDiffPrevStatsPath = `${fixturesPath}/comparison/size-diff/prev.stats.json`;

const groupRemovedConfigPath = `${fixturesPath}/comparison/group-removed-from-config/bsr.config.json`;
const groupRemovedCurrentStatsPath = `${fixturesPath}/comparison/group-removed-from-config/current.stats.json`;
const groupRemovedPrevStatsPath = `${fixturesPath}/comparison/group-removed-from-config/prev.stats.json`;

const groupNoMatchingConfigPath = `${fixturesPath}/comparison/group-no-matching-files/bsr.config.json`;
const groupNoMatchingPrevStatsPath = `${fixturesPath}/comparison/group-no-matching-files/prev.stats.json`;

// Exercises the --compare-with diff rendering: changed sizes (+/-),
// an added file (current only) and a deleted file (previous build only).
// Current stats come from the shared basic build; only the previous build differs.
describe('--compare-with comparison', () => {
  before(() => writeScopedConfig(basicConfigPath, basicConfig, outDir));
  beforeEach(() => resetDir(outDir));

  it('print --compare-with renders the diff report', async (t) => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'print',
      basicStatsPath,
      `-c=${basicConfig}`,
      `--compare-with=${sizeDiffPrevStatsPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(reportPath, 'utf-8');

    // full report snapshot covers the size-change, added and deleted branches
    t.assert.snapshot(reportFile);

    // stdout echoes the saved-report message and the full report body
    assert.match(stdout, /Bundle size report saved to/);
    assert.ok(stdout.includes(reportFile));

    // print renders a report only; it never writes a stats file
    await assert.rejects(() => stat(statsPath));
  });

  it('autorun --compare-with produces the same diff report', async (t) => {
    const { code } = await executeNodeScript(bsrBinPath, [
      'autorun',
      basicBuildPath,
      `-c=${basicConfig}`,
      `--compare-with=${sizeDiffPrevStatsPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(reportPath, 'utf-8');

    t.assert.snapshot(reportFile);

    // autorun also writes the stats file for the current build
    const stats = JSON.parse(await readFile(statsPath, 'utf-8'));
    const statsExpectation = JSON.parse(await readFile(basicStatsPath, 'utf-8'));

    assert.deepEqual(stats, statsExpectation);
  });
});

// A whole group can be missing from the current build for two reasons, which
// differ in the rendered group header:
//  - removed from the config file        -> key header + "(no longer tracked)"
//  - still in config but no files matched -> label header + "(deleted)"
describe('--compare-with whole group removal', () => {
  beforeEach(() => resetDir(outDir));

  it('marks a group removed from the config as no longer tracked (replacement)', async (t) => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'print',
      groupRemovedCurrentStatsPath,
      `-c=${groupRemovedConfigPath}`,
      `--compare-with=${groupRemovedPrevStatsPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(reportPath, 'utf-8');

    // snapshot covers the "(no longer tracked)" key header, the marker-free last
    // known sizes, the added replacement group, and the total excluding the removal
    t.assert.snapshot(reportFile);

    assert.ok(stdout.includes(reportFile));
  });

  it('marks a still-configured group with no matching files as deleted', async (t) => {
    const { stdout, code } = await executeNodeScript(bsrBinPath, [
      'autorun',
      basicBuildPath,
      `-c=${groupNoMatchingConfigPath}`,
      `--compare-with=${groupNoMatchingPrevStatsPath}`,
    ]);

    assert.equal(code, 0);

    const reportFile = await readFile(reportPath, 'utf-8');

    // snapshot covers the label header with its "(deleted)" suffix
    t.assert.snapshot(reportFile);

    assert.ok(stdout.includes(reportFile));
  });
});
