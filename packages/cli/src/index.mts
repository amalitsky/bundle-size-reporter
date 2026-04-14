import yargs, { type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { analyze } from './commands/analyze.mts';
import { print } from './commands/print.mts';
import { autorun } from './commands/autorun.mts';

const commands: Array<(yargs: Argv) => Argv> = [
  analyze,
  print,
  autorun,
  (yargs): Argv => yargs.strict().showHelpOnFail(false).demandCommand(1),
];

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
commands.reduce((all, current) => current(all), yargs(hideBin(process.argv))).argv;
