import * as process from 'process';
import { existsSync } from 'fs';
import { fork, ChildProcess } from 'node:child_process';
import { constants } from 'os';

const { PATH } = process.env;

export interface ICliResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
}

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

/**
 * Forks the CLI as a child process and resolves with its captured stdout,
 * stderr, exit code and signal once the process closes.
 * Unlike a plain stdout capture, this lets tests assert on error output and
 * non-zero exit codes instead of rejecting on the first stderr chunk.
 */
export function executeNodeScript(scriptPath: string, args: string[] = []): Promise<ICliResult> {
  const child = createNodeProcess(scriptPath, args);

  return new Promise<ICliResult>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const timeoutId = setTimeout(() => {
      child.kill(constants.signals.SIGTERM);
      reject(new Error('child process response timeout'));
    }, 5000);

    child.once('error', (error: Error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn a child: ${error.message}`));
    });

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.once('close', (code, signal) => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr, code, signal });
    });
  });
}
