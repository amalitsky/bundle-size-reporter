import {
  promises as fsPromises,
  readFile as fsReadFile,
  writeFile as fsWriteFile,
} from 'fs';

import glob from 'glob';
import { IOptions } from 'glob';


import { file as gzipSizeFromFile } from 'gzip-size';
import { groupBy } from 'lodash';
import { fileNameHashRegex } from './constants';

const { Glob } = glob;

import {
  IBSRReport,
  IFile,
  IFileGroup,
} from './types';

/**
 * Reads file from the given path and return its content as a string.
 */
export function readFileAsString(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fsReadFile(filePath, (err, content) => {
      if (err) {
        reject(err);

        return;
      }

      resolve(content.toString());
    });
  });
}

/**
 * Returns file name with hash string replaced with "[hash]".
 */
function getFileNameWoRandomHash(name: string): string {
  return name.replace(fileNameHashRegex, '$1[hash].$2');
}

/** File name regex. */
const fileNameRegex = /^.*\/(.*)$/;

/**
 * Returns file name of the file path passed.
 */
function getFileName(path: string): string {
  const match = fileNameRegex.exec(path);

  if (!match) {
    throw new Error(`Filename not found in the path "${path}"`);
  }

  return match[1];
}

function getReportAsString(files: IFile[]): string {
  return JSON.stringify({ files }, null, 2);
}

export function saveContentToFile(
  content: string,
  path: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fsWriteFile(path, content, (err: Error | null) => {
      if (err) {
        reject(err);

        return;
      }

      resolve();
    });
  });
}

export function saveReportToFile(
  files: IFile[],
  path: string,
): Promise<void> {
  const reportStr = getReportAsString(files);

  return saveContentToFile(reportStr, path);
}

async function getFileSizeInKb(filePath: string): Promise<number> {
  const stats = await fsPromises.stat(filePath);

  return Math.round(stats.size / 1024);
}

async function getFileGzipSizeInKb(filePath: string): Promise<number> {
  const size = await gzipSizeFromFile(filePath);

  return Math.round(size / 1024);
}

export async function getFilesMetadata(filePaths: string[]): Promise<Partial<IFile>[]> {
  const contentSizePromises = filePaths.map(getFileSizeInKb);
  const gzipSizePromises = filePaths.map(getFileGzipSizeInKb);

  const contentSizes = await Promise.all(contentSizePromises);
  const gzipSizes = await Promise.all(gzipSizePromises);

  return filePaths.map((filePath, index) => {
    return {
      name: getFileNameWoRandomHash(getFileName(filePath)),
      path: filePath,
      size: contentSizes[index],
      gzipSize: gzipSizes[index],
    };
  });
}

function prefixTheGlob(glob: string, prefix: string): string {
  return `${ prefix }/${ glob }`;
}

/**
 * Performs multiple glob searches in parallel and returns a single promise to be resolved
 * with a flat list of files.
 */
export function resolveGlobs(
  buildPath: string,
  globs: string[],
  ignoreGlobs: string[] = [],
): Promise<string[]> {
  const globOptions: IOptions = {
    cwd: buildPath,
    ignore: ignoreGlobs.map(glob => prefixTheGlob(glob, buildPath)),
  };

  const searches = globs
    .map(glob => prefixTheGlob(glob, buildPath))
    .map(glob => new Glob(glob, globOptions))
    .map((globSearch) => {
      return new Promise<string[]>((resolve, reject) => {
        globSearch.once('end', (files) => {
          resolve(files);
        });

        globSearch.once('error', error => reject(error));
      });
    });

  return Promise.all(searches)
    .then(files => files.flat());
}

export function analyzeBuildFiles(
  groups: IFileGroup[],
  distPath: string,
): Promise<IBSRReport> {
  const groupFilesPromises = groups.map(async (fileGroup) => {
    const {
      globs,
      key,
      excludeGlobs,
    } = fileGroup;

    const filePaths = await resolveGlobs(distPath, globs, excludeGlobs);
    const files = await getFilesMetadata(filePaths);

    files.forEach((file: Partial<IFile>) => {
      file.group = key;
    });

    return files as IFile[];
  });

  return Promise.all(groupFilesPromises)
    .then(groupFiles => ({ files: groupFiles.flat() }));
}

function getSizeInfoString(
  size: number,
  diff = 0,
  dimension = 'KB',
): string {
  let result = `${ Math.round(size) }${ dimension }`;

  if (diff) {
    result += ' (';

    if (diff > 0) {
      result += '+';
    }

    result += `${ Math.round(diff) }${ dimension })`;
  }

  return result;
}

function getFileReportLine(
  file: IFile,
  fileToCompareWith?: IFile,
): string {
  const { name, size, gzipSize } = file;

  const sizeInfoStr = getSizeInfoString(
    size,
    fileToCompareWith ? size - fileToCompareWith.size : 0,
  );

  const gzipSizeInfoStr = getSizeInfoString(
    gzipSize,
    fileToCompareWith ? gzipSize - fileToCompareWith.gzipSize : 0,
  );

  return `${ name }: ${ sizeInfoStr } / ${ gzipSizeInfoStr }`;
}

/**
 * TODO: Consider adding support for groups being added and removed
 */
export function printTextReport(
  groups: IFileGroup[],
  files: IFile[],
  filesToCompareWith: IFile[] = [],
): string {
  const filesByGroup = groupBy(files, file => file.group);
  const previousFilesByGroup = groupBy(filesToCompareWith, file => file.group);

  const withComparison = !!filesToCompareWith.length;

  const reportLines = [];

  let totalSize = 0;
  let totalGzipSize = 0;
  let totalSizeDiff = 0;
  let totalGzipSizeDiff = 0;

  Object.keys(filesByGroup)
    .forEach((groupId) => {
      const group = groups.find(group => group.key === groupId);

      reportLines.push(`${ group?.label || groupId } files:`);

      const prevGroupFilesMap = new Map<string, IFile>();

      if (groupId in previousFilesByGroup) {
        previousFilesByGroup[groupId].forEach((file) => {
          prevGroupFilesMap.set(file.name, file);
        });
      }

      let groupSize = 0;
      let groupGzipSize = 0;

      let groupSizeDiff = 0;
      let groupGzipSizeDiff = 0;

      filesByGroup[groupId]
        .sort(({ size: sizeA }, { size: sizeB }) => sizeB - sizeA)
        .forEach((file) => {
          const { name, size, gzipSize } = file;

          groupSize += size;
          groupGzipSize += gzipSize;

          const prevFile = prevGroupFilesMap.get(name);

          if (prevFile) { // file update
            groupSizeDiff += size - prevFile.size;
            groupGzipSizeDiff += gzipSize - prevFile.gzipSize;

            reportLines.push(`- ${ getFileReportLine(file, prevFile) }`);

            prevGroupFilesMap.delete(name);
          } else { // new file added
            groupSizeDiff += size;
            groupGzipSizeDiff += gzipSize;

            reportLines.push(`- ${ getFileReportLine(file) } ${ withComparison ? '(added)' : '' }`);
          }
        });

      // files removed from the group in the new (current) build
      prevGroupFilesMap.forEach((file) => {
        groupSizeDiff -= file.size;
        groupGzipSizeDiff -= file.gzipSize;

        reportLines.push(`- ${ getFileReportLine(file) } (deleted)`);
      });

      totalSize += groupSize;
      totalGzipSize += groupGzipSize;
      totalSizeDiff += groupSizeDiff;
      totalGzipSizeDiff += groupGzipSizeDiff;

      const groupSizeInfoMsg = getSizeInfoString(
        groupSize,
        withComparison ? groupSizeDiff : 0,
      );

      const groupGzipSizeInfoMsg = getSizeInfoString(
        groupGzipSize,
        withComparison ? groupGzipSizeDiff : 0,
      );

      if (filesByGroup[groupId].length > 1) {
        reportLines.push(
          `\nGroup total: ${ groupSizeInfoMsg } / ${ groupGzipSizeInfoMsg }\n`,
        );
      }
    });

  const totalSizeMsg = getSizeInfoString(
    totalSize,
    withComparison ? totalSizeDiff : 0,
  );

  const totalGzipSizeMsg = getSizeInfoString(
    totalGzipSize,
    withComparison ? totalGzipSizeDiff : 0,
  );

  reportLines.push(`TOTAL: ${ totalSizeMsg } / ${ totalGzipSizeMsg }`);

  return reportLines.join('\n');
}
