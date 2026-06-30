import { strict as assert } from 'node:assert';

import { it, describe } from 'node:test';

import { getPrintableFilenames } from '../src/utils/get-printable-filenames.mts';

describe('getPrintableFilenames method functionality', () => {
  it('returns normalized names when there are no duplicates', () => {
    const files = [
      {
        normalizedName: 'index-[hash].html',
        paths: ['index-3452345.html'],
        normalizedPath: 'index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'app-[hash].js',
        paths: ['src/app-3452345.js'],
        normalizedPath: 'src/app-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
      {
        normalizedName: 'styles-[hash].css',
        paths: ['src/styles-3452345.css'],
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
        paths: ['src/index-3452345.html'],
        normalizedPath: 'src/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'index-[hash].html',
        paths: ['src/index-3452345.html'],
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
        paths: ['src/index-7623489.html'],
        normalizedPath: 'src/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html2',
      },
      {
        normalizedName: 'index-[hash].html',
        paths: ['bar/index-3452345.html'],
        normalizedPath: 'bar/index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'smth else',
      },
      {
        normalizedName: 'index-[hash].html',
        paths: ['index-3452345.html'],
        normalizedPath: 'index-[hash].html',
        size: 1,
        gzipSize: 0,
        group: 'html',
      },
      {
        normalizedName: 'styles-[hash].css',
        paths: ['src/styles-3452345.css'],
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

  it('includes comparison-only (deleted) files and tolerates shared paths', () => {
    const files = [
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-3452345.js'],
        normalizedPath: 'app-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
    ];

    const comparisonFiles = [
      // same path as the current build - must not throw
      {
        normalizedName: 'app-[hash].js',
        paths: ['app-0000000.js'],
        normalizedPath: 'app-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
      // present only in the previous build (deleted)
      {
        normalizedName: 'legacy-[hash].js',
        paths: ['legacy-3452345.js'],
        normalizedPath: 'legacy-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
    ];

    const expectation = new Map([
      ['app-[hash].js', 'app-[hash].js'],
      ['legacy-[hash].js', 'legacy-[hash].js'],
    ]);

    const result = getPrintableFilenames(files, comparisonFiles);

    assert.deepStrictEqual(result, expectation);
  });

  it('disambiguates a name that collides only across builds', () => {
    const files = [
      {
        normalizedName: 'main-[hash].js',
        paths: ['a/main-7623489.js'],
        normalizedPath: 'a/main-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
    ];

    // moved folders between builds: same name, different path
    const comparisonFiles = [
      {
        normalizedName: 'main-[hash].js',
        paths: ['b/main-3452345.js'],
        normalizedPath: 'b/main-[hash].js',
        size: 1,
        gzipSize: 0,
        group: 'js',
      },
    ];

    const expectation = new Map([
      ['a/main-[hash].js', 'a/main-[hash].js'],
      ['b/main-[hash].js', 'b/main-[hash].js'],
    ]);

    const result = getPrintableFilenames(files, comparisonFiles);

    assert.deepStrictEqual(result, expectation);
  });
});
