import { Argv } from 'yargs';

import { configFileName, defaultReportFileName } from '../constants';

import { IBSRConfig, IBSRReport } from '../types';
import {
  printTextReport,
  readFileAsString,
  saveContentToFile,
} from '../utils';

export function print(yargs: Argv): Argv {
  return yargs.command(
    'print [input]',
    `Print bundle size report in text form:
  Example:
  print path/to/report.json bundle-size-report.txt --compare-with bundle-size-report-prev.json`,
    (yargs) => {
      return yargs
        .positional('input', {
          describe: 'path to JSON report file',
          alias: 'i',
          type: 'string',
          default: defaultReportFileName,
          async coerce(path: string): Promise<IBSRReport> {
            const reportJson = await readFileAsString(path);

            const report = JSON.parse(reportJson) as IBSRReport;

            if (!report.files?.length) {
              throw Error('Report file doesn\'t have files in it');
            }

            return report;
          },
        })
        .option('output', {
          describe: 'text report file path',
          alias: 'o',
          type: 'string',
        })
        .option('compare-with', {
          describe: 'path to JSON report file to compare original report with',
          type: 'string',
          async coerce(path: string): Promise<IBSRReport> {
            const reportJson = await readFileAsString(path);

            const report = JSON.parse(reportJson) as IBSRReport;

            if (!report.files?.length) {
              throw Error('Previous report file doesn\'t have files in it');
            }

            return report;
          },
        })
        .option('config', {
          describe: 'configuration file path',
          default: configFileName,
          alias: 'c',
          type: 'string',
          async coerce(path: string): Promise<IBSRConfig> {
            const configJson = await readFileAsString(path);

            const config = JSON.parse(configJson) as IBSRConfig;

            if (!config.analyze.groups?.length) {
              throw Error('File groups aren\'t defined in config file');
            }

            return config;
          },
        });
    },
    async (argv) => {
      const { files } = await argv.input;
      const reportToCompareWith = await argv['compare-with'] as unknown as IBSRReport;
      const {
        analyze: analyzeConfig,
        print: printConfig,
      } = await argv.config;

      const report = printTextReport(
        analyzeConfig.groups,
        files,
        reportToCompareWith?.files,
      );

      let { output: readableReportPath } = argv;

      readableReportPath = readableReportPath || printConfig?.output;

      if (readableReportPath) {
        await saveContentToFile(report, readableReportPath);

        console.log(`Bundle size text report saved to ${ readableReportPath }`);
      }

      console.log(`\n${ report }`);
    },
  );
}
