import type { IFile } from '@bundle-size-reporter/core';

/**
 * Returns a map of normalized file path to a printable name.
 * Which is a normalized name most of the time, unless there are duplicates for
 * files in different folders.
 * Then normalized _path_ is used instead of the name.
 *
 * Labels are computed over the union of the current build and the optional
 * comparison (previous) build, so files present only in the comparison build
 * (rendered as "deleted") still get a name, and name/path disambiguation stays
 * consistent across both builds.
 */
export function getPrintableFilenames(
  files: IFile[],
  comparisonFiles: IFile[] = [],
): Map<string, string> {
  const normalizedNames = new Map<string, Set<string>>(); // file name to normalized paths (to support dupes)
  const printableNames = new Map<string, string>(); // normalized path to printable name

  const register = (file: IFile, throwOnDuplicate: boolean): void => {
    const { normalizedPath, normalizedName } = file;

    if (printableNames.has(normalizedPath)) {
      // a path shared with the current build is expected when merging the
      // comparison build; a repeat within the current build is a real bug
      // (files sharing a normalized path should have been aggregated already)
      if (throwOnDuplicate) {
        throw Error(`Normalized path duplicates ('${normalizedPath}') aren't supported`);
      }

      return;
    }

    printableNames.set(normalizedPath, normalizedName);

    if (!normalizedNames.has(normalizedName)) {
      normalizedNames.set(normalizedName, new Set([normalizedPath]));
    } else {
      normalizedNames.get(normalizedName)!.add(normalizedPath);
    }
  };

  files.forEach((file) => register(file, true));
  comparisonFiles.forEach((file) => register(file, false));

  // go through duplicates by filename and use normalized path instead of the name as an override
  Array.from(normalizedNames.values())
    .filter((normalizedPaths) => normalizedPaths.size > 1)
    // @todo: strip common prefix within the duplicates group by normalized name
    .forEach((normalizedPaths) => {
      normalizedPaths.forEach((normalizedPath) => {
        printableNames.set(normalizedPath, normalizedPath);
      });
    });

  return printableNames;
}
