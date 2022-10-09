import { spawn, sync as spawnSync } from 'cross-spawn';
import { ChildProcess, SpawnOptions, SpawnSyncOptions } from 'child_process';
import { Readable } from 'stream';
import { buildCommand, TCommandOptions } from '../buildCommand/index';

export type TExecSpawnOptions = SpawnOptions & {
  encoding?: BufferEncoding;
};

export type TExecOptions = TCommandOptions & {
  spawnOptions?: TExecSpawnOptions;
};

/**
 * Build the cli command from the cli options and execute it using spawn.
 * @param {TExecOptions} cliOptions - cli options to exec the command with.
 * Equivalent to the official cli where --out-dir <=> outDir (camelCase mapping).
 * Check the official cli documentation https://swc.rs/docs/usage/cli for the arguments details.
 * And as extra spawnOptions was added. To configure the spawn options if you need.
 * @example
 * @param {TExecSpawnOptions} spawnOptions - spawnOptions that can override default spawn options.
 * As per
 * ```ts
 * spawn(swcCommand, args, cliOptions.spawnOptions);
 * ```
 * @param {TExecSpawnOptions} spawnOptions.encoding - That property was added by swc-command
 * (spawn doesn't have it). It set the encoding for childProcess.stdout, childProcess.stderr.
 * By default if not provided, it gonna be of buffer type (no encoding).
 * @returns {ChildProcess} - ChildProcess instance of the spawn command. You can listen to the
 * `close`, `exit` events. And stdout, stderr `data` event (`stdout.on('data', (data) => ...)`).
 */
export function swc(cliOptions: TExecOptions): ChildProcess {
  const command = buildCommand(cliOptions);
  const [swcCommand, ...args] = command.split(' ');

  const childProcess = spawn(
    swcCommand,
    args,
    cliOptions.spawnOptions as SpawnOptions
  );

  if (cliOptions.spawnOptions?.encoding) {
    childProcess.stdout?.setEncoding(cliOptions.spawnOptions.encoding);
    childProcess.stderr?.setEncoding(cliOptions.spawnOptions.encoding);
  }

  return childProcess;
}

export type TPswcExecOptions = TExecOptions & {
  resolveEvent?: 'close' | 'exit';
  data?: {
    stdout?: boolean;
    stderr?: boolean;
  };
};

export interface IPwscExecReturn {
  exitCode: number | null;
  exitSignal: NodeJS.Signals | null;
  data: {
    stdout?: string[] | Buffer[];
    stderr?: string[] | Buffer[];
  };
}

/**
 * The swc promise version
 * Build the cli command from the cli options and execute it using spawn and return a promise.
 * @param {TExecOptions} cliOptions - cli options to exec the command with.
 * Equivalent to the official cli where --out-dir <=> outDir (camelCase mapping).
 * Check the official cli documentation https://swc.rs/docs/usage/cli for the arguments details.
 * @param {SpawnOptions} spawnOptions - spawnOptions that can override default spawn options.
 * @param {TExecSpawnOptions} spawnOptions.encoding - That property was added by swc-command
 * (spawn doesn't have it). It set the encoding for childProcess.stdout, childProcess.stderr.
 * By default if not provided, it gonna be of buffer type (no encoding).
 * @param {TExecOptions} cliOptions.resolveEvent - choose what event the promise resolve on 'close'
 * or 'exit'. It default to 'close'
 * @param {TExecOptions} cliOptions.data - an object provide which output streams you want to catch
 * and collect them. If any value i set. When the promise resolve. You'll find the collected data
 * populated at pswcExecReturn.data ex: pswcExecReturn.data.stdout as an string or Buffer array.
 * @param {(childProcess: ChildProcess) => void} childProcessCallback - Optional, a callback that
 * allow you to access the childProcess object. In case you want to listen to any event ...
 * @returns {Promise<IPwscExecReturn>} - Promise that resolve to an object containing the exitCode,
 * exitSignal, and the data object. If cliOptions.data was provided. To include one of the outputs
 * of stdout or stderr. Those outputs gonna be string or Buffer Array.
 * The promise will reject if an error occurs (fail to spawn, kill failed).
 * @example
 */
export function pswc(
  cliOptions: TPswcExecOptions,
  childProcessCallback?: (childProcess: ChildProcess) => void
): Promise<IPwscExecReturn> {
  return new Promise((resolve, reject) => {
    const childProcess: ChildProcess = swc(cliOptions);

    if (childProcessCallback) {
      childProcessCallback(childProcess);
    }

    const dataToInclude = cliOptions.data || {};

    const collectedData: IPwscExecReturn['data'] = {
      stderr: undefined,
      stdout: undefined
    };

    (['stdout', 'stderr'] as ('stdout' | 'stderr')[]).forEach((stdType) => {
      if (dataToInclude[stdType]) {
        collectedData[stdType] = [];
        if (childProcess[stdType]) {
          (childProcess[stdType] as Readable).on('data', (data) => {
            // TODO: test if it works with inherit or only with pipe {if only with pipe,
            // TODO: that mean we will need to set the settings before spawning}
            (collectedData[stdType] as string[] | Buffer[]).push(data);
          });
        }
      }
    });

    let isErrorTriggered = false;
    childProcess
      .on('close', (exitCode, exitSignal) => {
        if (!isErrorTriggered && cliOptions.resolveEvent === 'close') {
          resolve({
            exitCode,
            exitSignal,
            data: collectedData
          });
        }
      })
      .on('exit', (exitCode, exitSignal) => {
        if (!isErrorTriggered && cliOptions.resolveEvent === 'exit') {
          resolve({
            exitCode,
            exitSignal,
            data: collectedData
          });
        }
      })
      .on('error', (err) => {
        isErrorTriggered = true;
        reject(err);
      });
  });
}

export type TSwcSyncExecOptions = TExecOptions & {
  spawnOptions?: SpawnSyncOptions;
};

/**
 * swc sync version. Which will run the swc command in a synchronous way.
 * The function block until the command finish running.
 * Build the cli command from the cli options and execute it using spawnSync.
 * @param {TSwcSyncExecOptions} cliOptions - cli options to exec the command with.
 * Equivalent to the official cli where --out-dir <=> outDir (camelCase mapping).
 * Check the official cli documentation https://swc.rs/docs/usage/cli for the arguments details.
 * And as extra spawnOptions was added. To configure the spawn options if you need.
 * @param {SpawnSyncOptionsWithBufferEncoding} spawnOptions - sync spawn options that can override
 * default spawn options. You can provide the encoding value to select what kind of output type u
 * want to get (String, Buffer)
 * @param {SpawnSyncOptionsWithBufferEncoding} spawnOptions.encoding - the default is 'buffer'
 * (no encoding).
 * You can use 'utf8' if you want to get output as string.
 * @returns {ChildProcess} - ChildProcess instance of the spawn command. You can listen to the
 * `close`, `exit` events. And stdout, stderr `data` event (`stdout.on('data', (data) => ...)`).
 * @example
 * ```ts
 * const out = swcSync({
 *    spawnOption: {
 *       encoding: 'utf8'
 *    }
 * })
 * ```
 */
export function swcSync(cliOptions: TSwcSyncExecOptions) {
  const command = buildCommand(cliOptions);
  const [swcCommand, ...args] = command.split(' ');
  return spawnSync(swcCommand, args, cliOptions.spawnOptions);
}
