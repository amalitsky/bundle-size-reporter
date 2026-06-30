import { EOL } from 'os';
import { groupBy } from 'lodash-es';
import type { IFile, IFileGroup, IPrintConfigOptions } from '@bundle-size-reporter/core';
import { getPrintableFilenames } from './get-printable-filenames.mts';

// own-property check that, unlike `in`, ignores the prototype chain — group
// keys come from user config and could collide with Object.prototype members
const hasOwnKey = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

function getSizeInfoString(size: number, diff = 0, dimension = 'KB'): string {
  let result = `${Math.round(size)}${dimension}`;

  if (diff) {
    result += ' (';

    if (diff > 0) {
      result += '+';
    }

    result += `${Math.round(diff)}${dimension})`;
  }

  return result;
}

/**
 * Renders a text report, optionally diffed against a previous build.
 * Handles groups added and removed between builds: a group present only in the
 * comparison build is rendered with its files marked `(deleted)` and its size
 * folded into the report total delta.
 */
export function printTextReport(
  groups: IFileGroup[],
  files: IFile[],
  filesToCompareWith: IFile[] = [],
  printOptions?: IPrintConfigOptions,
): string {
  function getFileReportLine(file: IFile, fileToCompareWith?: IFile): string {
    const { normalizedPath, paths, size, gzipSize } = file;

    const sizeInfoStr = getSizeInfoString(
      size,
      fileToCompareWith ? size - fileToCompareWith.size : 0,
    );

    const gzipSizeInfoStr = getSizeInfoString(
      gzipSize,
      fileToCompareWith ? gzipSize - fileToCompareWith.gzipSize : 0,
    );

    const fileName = printableFileNames.get(normalizedPath);

    const countSuffix = paths.length > 1 ? ` (x${paths.length})` : '';

    return `${fileName}${countSuffix}: ${sizeInfoStr} / ${gzipSizeInfoStr}`;
  }

  const filesByGroup = groupBy(files, (file) => file.group);
  const previousFilesByGroup = groupBy(filesToCompareWith, (file) => file.group);
  const printableFileNames = getPrintableFilenames(files, filesToCompareWith);

  const withComparison = !!filesToCompareWith.length;

  const reportLines = [];

  let totalSize = 0;
  let totalGzipSize = 0;
  let totalSizeDiff = 0;
  let totalGzipSizeDiff = 0;

  // union of current and previous group keys, so groups removed in the current
  // build (only present in the comparison build) are still reported
  const groupIds = Array.from(
    new Set(Object.keys(filesByGroup).concat(Object.keys(previousFilesByGroup))),
  );

  groupIds.forEach((groupId) => {
    const group = groups.find((group) => group.key === groupId);
    const currentGroupFiles = hasOwnKey(filesByGroup, groupId) ? filesByGroup[groupId] : [];

    // a group with no files in the current build is either gone from the config
    // ("no longer tracked", kept out of the totals) or still configured with all
    // of its files removed ("deleted", counted as a removal)
    const noLongerTracked = !group && !currentGroupFiles.length;
    const allFilesRemoved = !!group && !currentGroupFiles.length;

    let groupNameSuffix = '';

    if (noLongerTracked) {
      groupNameSuffix = ' (no longer tracked)';
    } else if (allFilesRemoved) {
      groupNameSuffix = ' (deleted)';
    }

    reportLines.push(`${group?.label || groupId} files${groupNameSuffix}:`);

    const prevGroupFilesMap = new Map<string, IFile>();

    if (hasOwnKey(previousFilesByGroup, groupId)) {
      previousFilesByGroup[groupId].forEach((file) => {
        prevGroupFilesMap.set(file.normalizedPath, file);
      });
    }

    let groupSize = 0;
    let groupGzipSize = 0;

    let groupSizeDiff = 0;
    let groupGzipSizeDiff = 0;

    currentGroupFiles
      .sort(({ size: sizeA }, { size: sizeB }) => sizeB - sizeA)
      .forEach((file) => {
        const { normalizedPath, size, gzipSize } = file;

        groupSize += size;
        groupGzipSize += gzipSize;

        if (
          (!size && printOptions?.omitZeroSizeFiles) ||
          (!gzipSize && printOptions?.omitZeroGzipSizeFiles)
        ) {
          return;
        }

        const prevFile = prevGroupFilesMap.get(normalizedPath);

        if (prevFile) {
          // file update
          groupSizeDiff += size - prevFile.size;
          groupGzipSizeDiff += gzipSize - prevFile.gzipSize;

          reportLines.push(`- ${getFileReportLine(file, prevFile)}`);

          prevGroupFilesMap.delete(normalizedPath);
        } else {
          // new file added
          groupSizeDiff += size;
          groupGzipSizeDiff += gzipSize;

          reportLines.push(`- ${getFileReportLine(file)}${withComparison ? ' (added)' : ''}`);
        }
      });

    // files only present in the previous build
    prevGroupFilesMap.forEach((file) => {
      if (noLongerTracked) {
        // no longer tracked: show the last known size, not a counted deletion
        reportLines.push(`- ${getFileReportLine(file)}`);

        return;
      }

      groupSizeDiff -= file.size;
      groupGzipSizeDiff -= file.gzipSize;

      reportLines.push(`- ${getFileReportLine(file)} (deleted)`);
    });

    totalSize += groupSize;
    totalGzipSize += groupGzipSize;

    if (!noLongerTracked) {
      totalSizeDiff += groupSizeDiff;
      totalGzipSizeDiff += groupGzipSizeDiff;
    }

    const groupSizeInfoMsg = getSizeInfoString(groupSize, withComparison ? groupSizeDiff : 0);

    const groupGzipSizeInfoMsg = getSizeInfoString(
      groupGzipSize,
      withComparison ? groupGzipSizeDiff : 0,
    );

    // count current files plus any prev-only (deleted) files left in the map
    const groupFileCount = currentGroupFiles.length + prevGroupFilesMap.size;

    if (!noLongerTracked && groupFileCount > 1) {
      reportLines.push(`${EOL}Group: ${groupSizeInfoMsg} / ${groupGzipSizeInfoMsg}${EOL}`);
    } else {
      reportLines.push('');
    }
  });

  const totalSizeMsg = getSizeInfoString(totalSize, withComparison ? totalSizeDiff : 0);

  const totalGzipSizeMsg = getSizeInfoString(totalGzipSize, withComparison ? totalGzipSizeDiff : 0);

  reportLines.push(`TOTAL: ${totalSizeMsg} / ${totalGzipSizeMsg}`);

  return reportLines.join(EOL);
}
