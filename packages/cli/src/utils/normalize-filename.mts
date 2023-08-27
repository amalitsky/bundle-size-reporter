import type { IAnalyzeConfig } from '@bundle-size-reporter/core';

/**
 * Returns file name with hash string replaced with string provided.
 */
export function normalizeFilename(
  fileName: string,
  normalize?: IAnalyzeConfig['normalizeFilename'],
  filenameHashLabel = '',
): string {
  if (!normalize) {
    return fileName;
  }

  if (typeof normalize === 'function') {
    try {
      const transformedFileName = normalize(fileName);

      if (typeof transformedFileName !== 'string') {
        const message =
          `non string value was returned by the provided ` +
          `normalization function for "${fileName}" string`;

        throw Error(message);
      }

      return transformedFileName;
    } catch (e) {
      console.error(e);

      return fileName;
    }
  }

  const regex = typeof normalize === 'string' ? new RegExp(normalize) : normalize;

  const regexMatch = regex.exec(fileName);

  if (!regexMatch) {
    return fileName;
  }

  const [, hashToReplace] = regexMatch;

  // if there is a match, we expect a group to be there
  if (!hashToReplace) {
    throw Error(`regexp '${regex}'needs to have a capturing group for hash to be removed`);
  }

  return fileName.replace(hashToReplace, filenameHashLabel);
}
