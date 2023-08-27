import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { analyze } from './commands/analyze.mjs';
import { print } from './commands/print.mjs';
import { autorun } from './commands/autorun.mjs';

const commands: Array<(yargs: Argv) => Argv> = [
  analyze,
  print,
  autorun,
  (yargs): Argv => yargs.strict().showHelpOnFail(false).demandCommand(1),
];

// eslint-disable-next-line no-unused-expressions
commands.reduce((all, current) => current(all), yargs(hideBin(process.argv))).argv;
