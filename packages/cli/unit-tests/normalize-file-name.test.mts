import { strict as assert } from 'node:assert';

import {
  it,
  describe,
} from 'node:test';

import { normalizeFileName } from '../src/utils/normalize-file-name.mjs';

describe('filters out hash from file names', () => {
  describe('removes the hash found by default', () => {
    const regexNoLabel = /^.+?(\W+[\d\w]{8,32})\.[\d\w]{2,5}$/;
    const regexNoLabelStr = '^.+?(\\W+[\\d\\w]{8,32})\\.[\\d\\w]{2,5}$';

    const noLabelTests = [
      {
        filename: 'index.html',
      }, {
        filename: 'app-3dd79831.js',
        expectation: 'app.js',
      }, {
        filename: 'app.vendor.3dd79831.js',
        expectation: 'app.vendor.js',
      }, {
        filename: 'app.3dd79831.js',
        expectation: 'app.js',
      }, {
        filename: 'appabcd34dq.js',
      }, {
        filename: 'migration-github-actions-set-output-migration-mdx.423ef505e1ba7b8480a4.css',
        expectation: 'migration-github-actions-set-output-migration-mdx.css',
      },
    ];

    noLabelTests.forEach(({ filename, expectation = filename }, index) => {
      it(`when regexp passed - ${ index }`, () => {
        assert.equal(normalizeFileName(filename, regexNoLabel), expectation);
      });

      it(`when regexp passed as a string - ${ index }`, () => {
        assert.equal(normalizeFileName(filename, regexNoLabelStr), expectation);
      });
    });
  });

  describe('replaces the hash with a label', () => {
    const regexWLabel = /^.+?\W+([\d\w]{8,32})\.[\d\w]{2,5}$/;
    const regexWLabelStr = '^.+?\\W+([\\d\\w]{8,32})\\.[\\d\\w]{2,5}$';
    const hashLabel = '[hash]';

    const wLabelTests = [
      {
        filename: 'index.html',
      }, {
        filename: 'app-3dd79831.js',
        expectation: 'app-[hash].js',
      }, {
        filename: 'app.vendor.3dd79831.js',
        expectation: 'app.vendor.[hash].js',
      }, {
        filename: 'app.3dd79831.js',
        expectation: 'app.[hash].js',
      }, {
        filename: 'appabcd34dq.js',
      }, {
        filename: 'migration-github-actions-set-output-migration-mdx.423ef505e1ba7b8480a4.css',
        expectation: 'migration-github-actions-set-output-migration-mdx.[hash].css',
      },
    ];

    wLabelTests.forEach(({ filename, expectation = filename }, index) => {
      it(`when regexp passed - ${ index }`, () => {
        assert.equal(normalizeFileName(filename, regexWLabel, hashLabel), expectation);
      });

      it(`when regexp passed as a string - ${ index }`, () => {
        assert.equal(normalizeFileName(filename, regexWLabelStr, hashLabel), expectation);
      });
    });
  });

  it('supports a function instead of regexp', () => {
    function replaceString(fileName: string): string {
      const needle = 'migration-github-';

      if (fileName.startsWith(needle)) {
        return fileName.slice(needle.length);
      }

      return fileName;
    }

    assert.equal(normalizeFileName('index.html', replaceString), 'index.html');
    assert.equal(normalizeFileName('migration-github-foo.css', replaceString), 'foo.css');
  });
});
