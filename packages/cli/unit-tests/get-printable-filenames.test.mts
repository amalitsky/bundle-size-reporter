import { strict as assert } from 'node:assert';

import { it, describe } from 'node:test';

import { getPrintableFilenames } from '../src/utils/get-printable-filenames.mjs';

describe('getPrintableFilenames method functionality', () => {
  it('returns normalized names when there are no duplicates', () => {
    const files = [
      {
        normalizedName: 'index-[hash].html',
        path: 'index-3452345.html',
        normalizedPath: 'index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'app-[hash].js',
        path: 'src/app-3452345.js',
        normalizedPath: 'src/app-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
      {
        normalizedName: 'styles-[hash].css',
        path: 'src/styles-3452345.css',
        normalizedPath: 'src/styles-[hash].css',
        size: 1,
        gzipSize: 0,
        group: 'css',
      },
    ];

    const expectation = new Map([
      ['index-[hash].html', 'index-[hash].html'],
      ['src/app-[hash].js', 'app-[hash].js'],
      ['src/styles-[hash].css', 'styles-[hash].css'],
    ]);

    const result = getPrintableFilenames(files);

    assert.deepStrictEqual(result, expectation);
  });

  it('throws if there are duplicates by normalized path', () => {
    const files = [
      {
        normalizedName: 'index-[hash].html',
        path: 'src/index-3452345.html',
        normalizedPath: 'src/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'index-[hash].html',
        path: 'src/index-3452345.html',
        normalizedPath: 'src/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'smth esle',
      },
    ];

    assert.throws(
      () => {
        getPrintableFilenames(files);
      },
      { message: "Normalized path duplicates ('src/index-[hash].html') aren't supported" },
    );
  });

  it('returns normalized paths for duplicates and names for the rest', () => {
    const files = [
      {
        normalizedName: 'index-[hash].html',
        path: 'src/index-7623489.html',
        normalizedPath: 'src/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html2',
      },
      {
        normalizedName: 'index-[hash].html',
        path: 'bar/index-3452345.html',
        normalizedPath: 'bar/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'smth else',
      },
      {
        normalizedName: 'index-[hash].html',
        path: 'index-3452345.html',
        normalizedPath: 'index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'styles-[hash].css',
        path: 'src/styles-3452345.css',
        normalizedPath: 'src/styles-[hash].css',
        size: 1,
        gzipSize: 0,
        group: 'css',
      },
    ];

    const expectation = new Map([
      ['index-[hash].html', 'index-[hash].html'],
      ['src/index-[hash].html', 'src/index-[hash].html'],
      ['bar/index-[hash].html', 'bar/index-[hash].html'],
      ['src/styles-[hash].css', 'styles-[hash].css'],
    ]);

    const result = getPrintableFilenames(files);

    assert.deepStrictEqual(result, expectation);
  });
});
