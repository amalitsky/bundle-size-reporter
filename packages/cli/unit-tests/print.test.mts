import { strict as assert } from 'node:assert';

import { it, describe, snapshot } from 'node:test';

import { printTextReport } from '../src/utils/print.mts';

// keep report snapshots as readable multi-line text instead of JSON-escaped strings
snapshot.setDefaultSnapshotSerializers([(value) => String(value)]);

const groups = [{ key: 'js', globs: ['*.js'], label: 'JS' }];

describe('printTextReport with aggregated files', () => {
  it('shows count suffix for aggregated files', () => {
    const files = [
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-aaa.js', 'chunk-bbb.js', 'chunk-ccc.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 200,
        gzipSize: 60,
        group: 'js',
      },
    ];

    const result = printTextReport(groups, files);

    assert.ok(result.includes('chunk-[hash].js (x3): 200KB / 60KB'));
  });

  it('does not show count suffix for single files', () => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-12345678.js'],
        normalizedPath: 'app-[hash].js',
        size: 100,
        gzipSize: 30,
        group: 'js',
      },
    ];

    const result = printTextReport(groups, files);

    assert.ok(result.includes('app-[hash].js: 100KB / 30KB'));
    assert.ok(!result.includes('(x'));
  });

  it('shows count and size diff when comparing aggregated files', () => {
    const files = [
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-aaa.js', 'chunk-bbb.js', 'chunk-ccc.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 200,
        gzipSize: 60,
        group: 'js',
      },
    ];

    const prevFiles = [
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-xxx.js', 'chunk-yyy.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 150,
        gzipSize: 45,
        group: 'js',
      },
    ];

    const result = printTextReport(groups, files, prevFiles);

    assert.ok(result.includes('chunk-[hash].js (x3): 200KB (+50KB) / 60KB (+15KB)'));
  });

  it('renders the name of a deleted (previous-only) file', () => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-12345678.js'],
        normalizedPath: 'app-[hash].js',
        size: 100,
        gzipSize: 30,
        group: 'js',
      },
    ];

    const prevFiles = [
      ...files,
      {
        normalizedName: 'legacy-[hash].js',
        paths: ['legacy-12345678.js'],
        normalizedPath: 'legacy-[hash].js',
        size: 50,
        gzipSize: 20,
        group: 'js',
      },
    ];

    const result = printTextReport(groups, files, prevFiles);

    assert.ok(result.includes('legacy-[hash].js: 50KB / 20KB (deleted)'));
  });

  it('mixes aggregated and single files correctly', (t) => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-12345678.js'],
        normalizedPath: 'app-[hash].js',
        size: 300,
        gzipSize: 90,
        group: 'js',
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-aaa.js', 'chunk-bbb.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 200,
        gzipSize: 60,
        group: 'js',
      },
    ];

    const result = printTextReport(groups, files);

    t.assert.snapshot(result);
  });
});

describe('printTextReport with a whole group removed', () => {
  // current build keeps the js group unchanged; the previous build also had a
  // separate group with two files that no longer exists in the current build
  const files = [
    {
      normalizedName: 'app-[hash].js',
      paths: ['app-12345678.js'],
      normalizedPath: 'app-[hash].js',
      size: 100,
      gzipSize: 30,
      group: 'js',
    },
  ];

  const prevFiles = [
    ...files,
    {
      normalizedName: 'legacy-a-[hash].js',
      paths: ['legacy-a-12345678.js'],
      normalizedPath: 'legacy-a-[hash].js',
      size: 50,
      gzipSize: 20,
      group: 'legacy',
    },
    {
      normalizedName: 'legacy-b-[hash].js',
      paths: ['legacy-b-12345678.js'],
      normalizedPath: 'legacy-b-[hash].js',
      size: 30,
      gzipSize: 10,
      group: 'legacy',
    },
  ];

  it('marks a group gone from the config as no longer tracked and excludes it from totals', (t) => {
    // legacy is absent from the config -> "no longer tracked": last known sizes,
    // no (deleted) marker, no group subtotal, and excluded from the total diff
    const groups = [{ key: 'js', globs: ['*.js'], label: 'JS' }];

    const result = printTextReport(groups, files, prevFiles);

    t.assert.snapshot(result);
  });

  it('uses the configured label and counts the removal when the group is still in the config', (t) => {
    // legacy is still configured but produced no files -> a real removal that is
    // marked (deleted) and folded into the totals
    const groups = [
      { key: 'js', globs: ['*.js'], label: 'JS' },
      { key: 'legacy', globs: ['legacy-*.js'], label: 'Legacy' },
    ];

    const result = printTextReport(groups, files, prevFiles);

    t.assert.snapshot(result);
  });
});
