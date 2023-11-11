import { EOL } from 'os';
import { groupBy } from 'lodash-es';
import type { IFile, IFileGroup } from '@bundle-size-reporter/core';
import { getPrintableFilenames } from './get-printable-filenames.mjs';

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
 * TODO: Consider adding support for groups being added and removed
 */
export function printTextReport(
  groups: IFileGroup[],
  files: IFile[],
  filesToCompareWith: IFile[] = [],
): string {
  function getFileReportLine(file: IFile, fileToCompareWith?: IFile): string {
    const { normalizedPath, size, gzipSize } = file;

    const sizeInfoStr = getSizeInfoString(
      size,
      fileToCompareWith ? size - fileToCompareWith.size : 0,
    );

    const gzipSizeInfoStr = getSizeInfoString(
      gzipSize,
      fileToCompareWith ? gzipSize - fileToCompareWith.gzipSize : 0,
    );

    const fileName = printableFileNames.get(normalizedPath);

    return `${fileName}: ${sizeInfoStr} / ${gzipSizeInfoStr}`;
  }

  const filesByGroup = groupBy(files, (file) => file.group);
  const previousFilesByGroup = groupBy(filesToCompareWith, (file) => file.group);
  const printableFileNames = getPrintableFilenames(files);

  const withComparison = !!filesToCompareWith.length;

  const reportLines = [];

  let totalSize = 0;
  let totalGzipSize = 0;
  let totalSizeDiff = 0;
  let totalGzipSizeDiff = 0;

  Object.keys(filesByGroup).forEach((groupId) => {
    const group = groups.find((group) => group.key === groupId);

    reportLines.push(`${group?.label || groupId} files:`);

    const prevGroupFilesMap = new Map<string, IFile>();

    if (groupId in previousFilesByGroup) {
      previousFilesByGroup[groupId].forEach((file) => {
        prevGroupFilesMap.set(file.normalizedPath, file);
      });
    }

    let groupSize = 0;
    let groupGzipSize = 0;

    let groupSizeDiff = 0;
    let groupGzipSizeDiff = 0;

    filesByGroup[groupId]
      .sort(({ size: sizeA }, { size: sizeB }) => sizeB - sizeA)
      .forEach((file) => {
        const { normalizedPath, size, gzipSize } = file;

        groupSize += size;
        groupGzipSize += gzipSize;

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

    // files removed from the group in the new (current) build
    prevGroupFilesMap.forEach((file) => {
      groupSizeDiff -= file.size;
      groupGzipSizeDiff -= file.gzipSize;

      reportLines.push(`- ${getFileReportLine(file)} (deleted)`);
    });

    totalSize += groupSize;
    totalGzipSize += groupGzipSize;
    totalSizeDiff += groupSizeDiff;
    totalGzipSizeDiff += groupGzipSizeDiff;

    const groupSizeInfoMsg = getSizeInfoString(groupSize, withComparison ? groupSizeDiff : 0);

    const groupGzipSizeInfoMsg = getSizeInfoString(
      groupGzipSize,
      withComparison ? groupGzipSizeDiff : 0,
    );

    if (filesByGroup[groupId].length > 1) {
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
