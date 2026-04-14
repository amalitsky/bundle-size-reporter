import { strict as assert } from 'node:assert';

import { it, describe } from 'node:test';

import { aggregateFiles } from '../src/utils/aggregate-files.mts';

describe('aggregateFiles', () => {
  it('returns files as-is when there are no duplicates', () => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['src/app-3452345.js'],
        normalizedPath: 'src/app-[hash].js',
        size: 100,
        gzipSize: 30,
      },
      {
        normalizedName: 'styles-[hash].css',
        paths: ['src/styles-1234567.css'],
        normalizedPath: 'src/styles-[hash].css',
        size: 50,
        gzipSize: 15,
      },
    ];

    const result = aggregateFiles(files);

    assert.equal(result.length, 2);
    assert.deepStrictEqual(result[0], files[0]);
    assert.deepStrictEqual(result[1], files[1]);
  });

  it('aggregates two files with the same normalizedPath', () => {
    const files = [
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-abc12345.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 80,
        gzipSize: 25,
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-def67890.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 120,
        gzipSize: 35,
      },
    ];

    const result = aggregateFiles(files);

    assert.equal(result.length, 1);
    assert.deepStrictEqual(result[0], {
      normalizedName: 'chunk-[hash].js',
      paths: ['chunk-abc12345.js', 'chunk-def67890.js'],
      normalizedPath: 'chunk-[hash].js',
      size: 200,
      gzipSize: 60,
    });
  });

  it('aggregates three files with the same normalizedPath', () => {
    const files = [
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-aaa11111.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 10,
        gzipSize: 3,
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-bbb22222.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 20,
        gzipSize: 7,
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-ccc33333.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 30,
        gzipSize: 10,
      },
    ];

    const result = aggregateFiles(files);

    assert.equal(result.length, 1);
    assert.equal(result[0].size, 60);
    assert.equal(result[0].gzipSize, 20);
    assert.deepStrictEqual(result[0].paths, [
      'chunk-aaa11111.js',
      'chunk-bbb22222.js',
      'chunk-ccc33333.js',
    ]);
  });

  it('handles a mix of unique and duplicate normalizedPaths', () => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-3452345.js'],
        normalizedPath: 'app-[hash].js',
        size: 200,
        gzipSize: 70,
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-abc12345.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 80,
        gzipSize: 25,
      },
      {
        normalizedName: 'chunk-[hash].js',
        paths: ['chunk-def67890.js'],
        normalizedPath: 'chunk-[hash].js',
        size: 120,
        gzipSize: 35,
      },
      {
        normalizedName: 'styles-[hash].css',
        paths: ['styles-9876543.css'],
        normalizedPath: 'styles-[hash].css',
        size: 50,
        gzipSize: 15,
      },
    ];

    const result = aggregateFiles(files);

    assert.equal(result.length, 3);

    // app: unique, preserved as-is
    assert.equal(result[0].normalizedPath, 'app-[hash].js');
    assert.deepStrictEqual(result[0].paths, ['app-3452345.js']);
    assert.equal(result[0].size, 200);

    // chunks: aggregated
    assert.equal(result[1].normalizedPath, 'chunk-[hash].js');
    assert.deepStrictEqual(result[1].paths, ['chunk-abc12345.js', 'chunk-def67890.js']);
    assert.equal(result[1].size, 200);
    assert.equal(result[1].gzipSize, 60);

    // styles: unique, preserved as-is
    assert.equal(result[2].normalizedPath, 'styles-[hash].css');
    assert.deepStrictEqual(result[2].paths, ['styles-9876543.css']);
    assert.equal(result[2].size, 50);
  });
});
