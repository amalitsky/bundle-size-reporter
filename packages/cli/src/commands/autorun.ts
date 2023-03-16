import path from 'path';
import { EOL } from 'os';

import { Argv } from 'yargs';
import { configFileName, defaultReportFileName } from '../constants';
import { IBSRConfig, IBSRReport } from '../types';

import {
  analyzeBuildFiles,
  printTextReport,
  readFileAsString,
  saveContentToFile,
  saveReportToFile,
} from '../utils';

export function autorun(yargs: Argv): Argv {
  return yargs.command(
    'autorun [build]',
    `Run analyze for the build and print text format of the report to console
  Example: autorun build/ --compare-with prev-build-bundle-size-report.json -r report.txt`,
    (yargs) => {
      return yargs
        .positional('build', {
          describe: 'path to the build directory to be analyzed',
          alias: 'b',
          type: 'string',
        })
        .option('output', {
          describe: 'JSON report file path',
          alias: 'o',
          type: 'string',
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
        })
        .option('text-output', {
          describe: 'text report file path',
          alias: 'r',
          type: 'string',
        })
        .option('compare-with', {
          describe: 'path to JSON report file to compare current build with',
          type: 'string',
          async coerce(path: string): Promise<IBSRReport> {
            const reportJson = await readFileAsString(path);

            const report = JSON.parse(reportJson) as IBSRReport;

            if (!report.files?.length) {
              throw Error('List of files is not found in the report');
            }

            return report;
          },
        });
    },
    async (argv) => {
      const {
        analyze: analyzeConfig,
        print: printConfig,
      }= await argv.config;

      const buildPath = argv.build || analyzeConfig.build?.location;

      if (!buildPath) {
        throw Error('Path to the build directory wasn\'t provided');
      }

      const distFolder = path.isAbsolute(buildPath) ?
        path.normalize(buildPath) : path.resolve(buildPath);

      const { groups } = analyzeConfig;

      const { files } = await analyzeBuildFiles(groups, distFolder);

      if (!files.length) {
        throw Error('No files found. Make sure the build command had run.');
      }

      let { output: reportPath } = argv;

      reportPath = reportPath || analyzeConfig.output || defaultReportFileName;

      await saveReportToFile(reportPath, files);

      console.log(`Bundle size report saved to ${ reportPath }`);

      const reportToCompareWith = await argv['compare-with'] as unknown as IBSRReport;

      const report = printTextReport(groups, files, reportToCompareWith?.files);

      const textReportPath = argv['text-output'] || printConfig?.output;

      if (textReportPath) {
        await saveContentToFile(textReportPath, report);

        console.log(`Bundle size text report saved to ${ textReportPath }`);
      }

      console.log(`${ EOL }${ report }`);
    },
  );
}
