import * as path from 'path';

import type { IBsrConfig } from '@bundle-size-reporter/core';

import type { Argv } from 'yargs';
import { defaultConfigFilename, defaultStatsFilename } from '../constants.mjs';

import { analyzeBuildFiles, readFileAsString, saveStatsToFile } from '../utils/file-system.mjs';

export function analyze(yargs: Argv): Argv {
  return yargs.command(
    'analyze [input]',
    `Generate bundle size stats and report files for the "input" provided:
  Example: analyze build/ --output path/to/stats.json`,
    (yargs) => {
      return yargs
        .positional('input', {
          describe: 'path to the build directory',
          alias: 'i',
          type: 'string',
        })
        .option('config', {
          describe: 'configuration file path',
          default: defaultConfigFilename,
          alias: 'c',
          type: 'string',
          async coerce(path: string): Promise<IBsrConfig> {
            const configJson = await readFileAsString(path);

            const config = JSON.parse(configJson) as IBsrConfig;

            if (!config.analyze.groups?.length) {
              throw Error('File groups are not defined in config file');
            }

            return config;
          },
        })
        .option('output', {
          describe: 'bundle size stats file path',
          alias: 'o',
          type: 'string',
        });
    },
    async (argv) => {
      const { analyze: analyzeConfig } = await argv.config;

      const buildPath = argv.input || analyzeConfig.input?.path;

      if (!buildPath) {
        throw Error("Path to the 'input' directory wasn't provided");
      }

      const distFolder = path.isAbsolute(buildPath)
        ? path.normalize(buildPath)
        : path.resolve(buildPath);

      const { files } = await analyzeBuildFiles(distFolder, analyzeConfig);

      if (!files.length) {
        throw Error(
          `No group files were found in "${distFolder}"` +
            'Make sure the build command was run and correct path is provided',
        );
      }

      const statsPath = argv.output || analyzeConfig.output?.path || defaultStatsFilename;

      await saveStatsToFile(statsPath, files);

      console.log(`Bundle size stats saved to ${statsPath}`);
    },
  );
}
