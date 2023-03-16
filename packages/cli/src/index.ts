import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { analyze } from './commands/analyze';
import { print } from './commands/print';
import { autorun } from './commands/autorun';

const commands: Array<(yargs: Argv) => Argv> = [
  analyze,
  print,
  autorun,
  (yargs): Argv => yargs
    .strict()
    .showHelpOnFail(false)
    .demandCommand(1),
];

// eslint-disable-next-line no-unused-expressions
commands.reduce(
  (all, current) => current(all), yargs(hideBin(process.argv)),
).argv;
