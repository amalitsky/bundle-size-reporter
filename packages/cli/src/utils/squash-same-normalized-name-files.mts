import type { IFile } from '@bundle-size-reporter/core';

type FileWithoutGroup = Omit<IFile, 'group'>;

/**
 * Aggregates files that share the same normalizedPath into a single entry with summed sizes and multiple paths.
 * Single-file entries are returned as-is.
 * This is needed for normalized names duplicates.
 */
export function squashSameNormalizedNameFiles(files: FileWithoutGroup[]): FileWithoutGroup[] {
  const fileByNormalizedPath = new Map<string, FileWithoutGroup>();

  for (const file of files) {
    const existing = fileByNormalizedPath.get(file.normalizedPath);

    if (existing) {
      existing.size += file.size;
      existing.gzipSize += file.gzipSize;
      existing.paths.push(...file.paths);
    } else {
      fileByNormalizedPath.set(file.normalizedPath, { ...file });
    }
  }

  return Array.from(fileByNormalizedPath.values());
}
