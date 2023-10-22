import type { IFile } from '@bundle-size-reporter/core';

/**
 * Returns a map of normalized file path to a printable name.
 * Which is a normalized name (value is the same as a key) most of the time,
 * unless there are duplicates for files in different folders.
 * Then normalized _path_ is used instead of the name.
 */
export function getPrintableFilenames(files: IFile[]): Map<string, string> {
  const normalizedNames = new Map<string, string[]>(); // name to normalized paths
  const printableNames = new Map<string, string>(); // normalized path to printable name

  files.forEach((file) => {
    const { normalizedPath, normalizedName } = file;

    if (printableNames.has(normalizedPath)) {
      throw Error(`Normalized path duplicates ('${normalizedPath}') aren't supported`);
    }

    printableNames.set(normalizedPath, normalizedName);

    if (normalizedNames.has(normalizedName)) {
      normalizedNames.get(normalizedName)!.push(normalizedPath);
    } else {
      normalizedNames.set(normalizedName, [normalizedPath]);
    }
  });

  // go through duplicates and use normalized path instead of the name
  Array.from(normalizedNames.values())
    .filter((normalizedPaths) => normalizedPaths.length > 1)
    // @todo: strip common prefix within the duplicates group by normalized name
    .flat()
    .forEach((normalizedPath) => {
      printableNames.set(normalizedPath, normalizedPath);
    });

  return printableNames;
}
