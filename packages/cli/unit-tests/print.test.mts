import { strict as assert } from 'node:assert';
import { EOL } from 'os';

import { it, describe } from 'node:test';

import { printTextReport } from '../src/utils/print.mts';

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

  it('mixes aggregated and single files correctly', () => {
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
    const lines = result.split(EOL);

    const appLine = lines.find((l) => l.includes('app-[hash].js'));
    const chunkLine = lines.find((l) => l.includes('chunk-[hash].js'));

    assert.ok(appLine);
    assert.ok(!appLine.includes('(x'));
    assert.ok(chunkLine);
    assert.ok(chunkLine.includes('(x2)'));
  });
});
