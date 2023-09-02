import * as path from 'path';

import { readFile as fsReadFile, stat as fsStat, writeFile as fsWriteFile } from 'node:fs/promises';

import type { IFile, IAnalyzeConfig, IBsrReport } from '@bundle-size-reporter/core';

import { gzipSizeFromFile } from 'gzip-size';
import { glob, type GlobOptions } from 'glob';

import { normalizeFilename } from './normalize-filename.mjs';

/**
 * Reads file from the given path and return its content as a string.
 */
export function readFileAsString(filePath: string): Promise<string> {
  return fsReadFile(filePath, 'utf-8');
}

export function saveContentToFile(path: string, content: string): Promise<void> {
  return fsWriteFile(path, content, { encoding: 'utf-8' });
}

function statsStringify(files: IFile[]): string {
  return JSON.stringify({ files }, null, 2);
}

export function saveStatsToFile(path: string, files: IFile[]): Promise<void> {
  const reportStr = statsStringify(files);

  return saveContentToFile(path, reportStr);
}

async function getFileSizeInKb(filePath: string): Promise<number> {
  const stats = await fsStat(filePath);

  return Math.round(stats.size / 1024);
}

async function getFileGzipSizeInKb(filePath: string): Promise<number> {
  const size = await gzipSizeFromFile(filePath);

  return Math.round(size / 1024);
}

/**
 * Return all stats data required for the file.
 * @todo Add brotli size
 * @link https://www.npmjs.com/package/brotli-size
 */
async function getFilesMetadata(
  filePaths: string[],
  distPath: string,
  normalizeFilenameValue: IAnalyzeConfig['normalizeFilename'],
  filenameHashLabel?: string,
): Promise<Omit<IFile, 'group'>[]> {
  const contentSizePromises = filePaths.map((filePath) =>
    getFileSizeInKb(path.join(distPath, filePath)),
  );

  const gzipSizePromises = filePaths.map((filePath) =>
    getFileGzipSizeInKb(path.join(distPath, filePath)),
  );

  const contentSizes = await Promise.all(contentSizePromises);
  const gzipSizes = await Promise.all(gzipSizePromises);

  return filePaths.map((filePath, index) => {
    return {
      name: normalizeFilename(path.basename(filePath), normalizeFilenameValue, filenameHashLabel),
      path: filePath,
      size: contentSizes[index],
      gzipSize: gzipSizes[index],
    };
  });
}

/**
 * Resolve globs into a flat list of files.
 */
function resolveGlobs(
  buildPath: string,
  globs: string[],
  ignoreGlobs: string[] = [],
): Promise<string[]> {
  const globOptions: GlobOptions = {
    cwd: buildPath,
    ignore: ignoreGlobs,
  };

  return glob(globs, globOptions) as Promise<string[]>;
}

export function analyzeBuildFiles(distPath: string, config: IAnalyzeConfig): Promise<IBsrReport> {
  const { groups, normalizeFilename, filenameHashLabel } = config;

  const groupFilePromises = groups.map(async (fileGroup) => {
    const { globs, key, excludeGlobs } = fileGroup;

    const filePaths = await resolveGlobs(distPath, globs, excludeGlobs);

    const files = await getFilesMetadata(filePaths, distPath, normalizeFilename, filenameHashLabel);

    files.forEach((file: Partial<IFile>) => {
      file.group = key;
    });

    return files as IFile[];
  });

  return Promise.all(groupFilePromises).then((groupFiles) => ({ files: groupFiles.flat() }));
}
