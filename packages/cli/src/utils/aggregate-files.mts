import type { IFile } from '@bundle-size-reporter/core';

type FileWithoutGroup = Omit<IFile, 'group'>;

/**
 * Aggregates files that share the same normalizedPath into a single entry
 * with summed sizes and merged paths.
 * Single-file entries are returned as-is.
 */
export function aggregateFiles(files: FileWithoutGroup[]): FileWithoutGroup[] {
  const map = new Map<string, FileWithoutGroup>();

  for (const file of files) {
    const existing = map.get(file.normalizedPath);

    if (existing) {
      existing.size += file.size;
      existing.gzipSize += file.gzipSize;
      existing.paths.push(...file.paths);
    } else {
      map.set(file.normalizedPath, { ...file });
    }
  }

  return Array.from(map.values());
}
