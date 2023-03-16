import path from 'path';

import { Argv } from 'yargs';
import { configFileName, defaultReportFileName } from '../constants';

import { IBSRConfig } from '../types';

import {
  analyzeBuildFiles,
  readFileAsString,
  saveReportToFile,
} from '../utils';

export function analyze(yargs: Argv): Argv {
  return yargs.command(
    'analyze [build]',
    `Generate bundle size report for files of the build:
  Example: analyze build/ --output path/to/report.json`,
    (yargs) => {
      return yargs
        .positional('build', {
          describe: 'path to the build directory',
          alias: 'b',
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
        .option('output', {
          describe: 'bundle size report JSON file path',
          alias: 'o',
          type: 'string',
        });
    },
    async (argv) => {
      const { analyze: analyzeConfig } = await argv.config;

      const buildPath = argv.build || analyzeConfig.build?.location;

      if (!buildPath) {
        throw Error('Path to the build directory wasn\'t provided');
      }

      const distFolder = path.isAbsolute(buildPath) ?
        path.normalize(buildPath) : path.resolve(buildPath);

      const { groups } = analyzeConfig;

      const { files } = await analyzeBuildFiles(groups, distFolder);

      if (!files.length) {
        throw Error(
          `No group files were found in "${ distFolder }"` +
          'Make sure the your website build command had run and correct path is passed to bsr',
        );
      }

      let { output: reportPath } = argv;

      reportPath = reportPath || analyzeConfig.output || defaultReportFileName;

      await saveReportToFile(reportPath, files);

      console.log(`Bundle size report saved to ${ reportPath }`);
    },
  );
}
