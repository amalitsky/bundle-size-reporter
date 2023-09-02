import * as path from 'path';
import { EOL } from 'os';

import type { Argv } from 'yargs';
import type { IBsrConfig, IBsrReport } from '@bundle-size-reporter/core';

import { defaultConfigFilename, defaultStatsFilename } from '../constants.mjs';
import { printTextReport } from '../utils/print.mjs';

import {
  analyzeBuildFiles,
  readFileAsString,
  saveContentToFile,
  saveStatsToFile,
} from '../utils/file-system.mjs';

export function autorun(yargs: Argv): Argv {
  return yargs.command(
    'autorun [input]',
    `Analyze file sizes of an "input", save stats file and print text report into the terminal
  Example: autorun build/ --compare-with bundle-size-stats-prev.json -r report.txt`,
    (yargs) => {
      return yargs
        .positional('input', {
          describe: 'path to the build directory',
          alias: 'i',
          type: 'string',
        })
        .option('output', {
          describe: 'bundle size stats file path',
          alias: 'o',
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
              throw Error("File groups aren't defined in config file");
            }

            return config;
          },
        })
        .option('report', {
          describe: 'text report file path',
          alias: 'r',
          type: 'string',
        })
        .option('compare-with', {
          describe: 'path to stats file to compare this "input" with',
          type: 'string',
          async coerce(path: string): Promise<IBsrReport> {
            const statsFileContent = await readFileAsString(path);

            const stats = JSON.parse(statsFileContent) as IBsrReport;

            if (!stats.files?.length) {
              throw Error('Files are not found in comparison stats file');
            }

            return stats;
          },
        });
    },
    async (argv) => {
      const { analyze: analyzeConfig, print: printConfig } = await argv.config;

      const buildPath = argv.input || analyzeConfig.input?.path;

      if (!buildPath) {
        throw Error("Path to the build directory wasn't provided");
      }

      const distFolder = path.isAbsolute(buildPath)
        ? path.normalize(buildPath)
        : path.resolve(buildPath);

      const { files } = await analyzeBuildFiles(distFolder, analyzeConfig);

      if (!files.length) {
        throw Error('No files found. Make sure the build command had run');
      }

      const statsFilePath = argv.output || analyzeConfig.output?.path || defaultStatsFilename;

      await saveStatsToFile(statsFilePath, files);

      console.log(`Bundle size stats saved to ${statsFilePath}`);

      const reportToCompareWith = (await argv['compare-with']) as unknown as IBsrReport;

      const report = printTextReport(analyzeConfig.groups, files, reportToCompareWith?.files);

      const reportPath = argv.report || printConfig?.output?.path;

      if (reportPath) {
        await saveContentToFile(reportPath, report);

        console.log(`Bundle size report saved to ${reportPath}`);
      }

      console.log(`${EOL}${report}`);
    },
  );
}
