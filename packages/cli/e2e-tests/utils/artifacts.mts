import { rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { statsFilename, reportFilename } from '../constants.mts';

/** Recreate a clean directory (removes it and its contents first). */
export async function resetDir(dir: string): Promise<void> {
  await rm(dir, {
    force: true,
    recursive: true,
  });

  await mkdir(dir, { recursive: true });
}

/**
 * Clones the base fixture config to `targetConfigPath`, overwriting its output
 * paths to point at `outDir`, so each test file writes into an isolated dir and
 * files can run in parallel. The base fixture on disk is left untouched. The
 * config is static per file, so this runs once in `before` (not per test).
 */
export async function writeScopedConfig(
  baseConfigPath: string,
  targetConfigPath: string,
  outDir: string,
): Promise<void> {
  const config = JSON.parse(await readFile(baseConfigPath, 'utf-8'));

  if (config.analyze?.output) config.analyze.output.path = `${outDir}/${statsFilename}`;
  if (config.print?.output) config.print.output.path = `${outDir}/${reportFilename}`;

  await mkdir(dirname(targetConfigPath), { recursive: true });
  await writeFile(targetConfigPath, JSON.stringify(config, null, 2));
}
