import * as process from 'process';
import { existsSync } from 'fs';
import { fork, ChildProcess } from 'node:child_process';
import { constants } from 'os';
import concat from 'concat-stream';

const { PATH } = process.env;

/**
 * Creates a child process with script path
 * @param {string} processPath Path of the process to execute
 * @param {Array} args Arguments to the command
 * @param {Object} env (optional) Environment variables
 */
export function createNodeProcess(
  processPath: string,
  args: string[] = [],
  env: Record<string, any> | null = null,
): ChildProcess {
  // Ensure that path exists
  if (!processPath || !existsSync(processPath)) {
    throw new Error('Invalid process path');
  }

  return fork(processPath, args, {
    env: {
      NODE_ENV: 'test',
      preventAutoStart: 'false', // not sure what this is for
      PATH, // this is needed in order to get all the binaries in your current terminal
      ...env,
    },
    stdio: [null, null, null, 'ipc'],
  });
}

export function executeNodeScript(scriptPath: string, args: string[] = []): Promise<string> {
  const child = createNodeProcess(scriptPath, args);

  return new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(
      // eslint-disable-next-line prefer-promise-reject-errors
      () => {
        child.kill(constants.signals.SIGTERM);
        reject('child process response timeout');
      },
      5000,
    );

    child.once('error', (code: number, signal: string) => {
      const message = `Failed to spawn a child, code: ${code}, signal: ${signal}`;

      console.error(message);

      reject(message);
    });

    child.stderr?.on('data', (err) => {
      const errorMessage = err.toString();

      reject(errorMessage);
    });

    child.stdout?.pipe(concat({ encoding: 'string' }, resolve));

    child.once('close', () => clearTimeout(timeoutId));
  });
}
