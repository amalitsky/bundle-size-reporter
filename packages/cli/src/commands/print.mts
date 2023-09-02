import { EOL } from 'os';
import type { Argv } from 'yargs';
import type { IBsrConfig, IBsrReport } from '@bundle-size-reporter/core';

import { defaultConfigFilename } from '../constants.mjs';
import { printTextReport } from '../utils/print.mjs';
import { readFileAsString, saveContentToFile } from '../utils/file-system.mjs';

export function print(yargs: Argv): Argv {
  return yargs.command(
    'print [input]',
    `Read stats file and print bundle size report into the terminal and (optionally) a file:
  Example:
  print path/to/stats.json -o bundle-size-report.txt --compare-with bundle-size-stats-prev.json`,
    (yargs) => {
      return yargs
        .positional('input', {
          describe: 'build size stats file path',
          alias: 'i',
          type: 'string',
        })
        .option('output', {
          describe: 'text report file path',
          alias: 'o',
          type: 'string',
        })
        .option('compare-with', {
          describe: 'path to stats file to compare this "input" with',
          type: 'string',
          async coerce(path: string): Promise<IBsrReport> {
            const statsFileContent = await readFileAsString(path);

            const stats = JSON.parse(statsFileContent) as IBsrReport;

            if (!stats.files?.length) {
              throw Error("Comparison stats file doesn't have files in it");
            }

            return stats;
          },
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
        });
    },
    async (argv) => {
      const { analyze: analyzeConfig, print: printConfig } = await argv.config;

      const inputPath = argv.input || printConfig?.input?.path;

      if (!inputPath) {
        throw Error("Path to stats file wasn't provided");
      }

      const statsFileContent = await readFileAsString(inputPath);

      const stats = JSON.parse(statsFileContent) as IBsrReport;

      const { files } = stats;

      if (!files?.length) {
        throw Error("Stats file doesn't have files");
      }

      const reportToCompareWith = (await argv['compare-with']) as unknown as IBsrReport;

      const report = printTextReport(analyzeConfig.groups, files, reportToCompareWith?.files);

      const reportPath = argv.output || printConfig?.output?.path;

      if (reportPath) {
        await saveContentToFile(reportPath, report);

        console.log(`Bundle size report saved to ${reportPath}`);
      }

      console.log(`${EOL}${report}`);
    },
  );
}
