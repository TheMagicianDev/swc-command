/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { ChildProcess } from 'child_process';
import {
  swc,
  cpSwc,
  swcSync,
  TExecOptions,
  IPwscExecReturn,
  TPswcExecOptions,
  TSwcSyncExecOptions
} from '..';

const rootDir = path.join(__dirname, './__fixtures__/testCodeBase');

type TCodeSignal = {
  code: number;
  signal: null | string;
};

const execConfigTests: {
  cliOptions: TExecOptions | TPswcExecOptions | TSwcSyncExecOptions;
  expected: {
    stdout: { includes: string };
    exit: TCodeSignal;
    close: TCodeSignal;
  };
}[] = [
  {
    cliOptions: {
      outDir: path.join(rootDir, 'dist'),
      src: path.join(rootDir, 'src'),
      noSwcrc: true,
      spawnOptions: {
        encoding: 'utf8'
      },
      config: {
        jsc: {
          parser: {
            decorators: true,
            syntax: 'typescript',
            dynamicImport: true
          },
          externalHelpers: true,
          target: 'es5'
        },
        minify: true,
        // exclude: ['**/*.spec.ts'],
        module: {
          type: 'commonjs'
        },
        sourceMaps: true
      }
    },
    expected: {
      stdout: {
        includes: 'Successfully compiled'
      },
      exit: {
        code: 0,
        signal: null
      },
      close: {
        code: 0,
        signal: null
      }
    }
  }
];

describe('swc', () => {
  async function testSwc(
    cliOptionsOverride?: (cliOptions: TPswcExecOptions) => TPswcExecOptions
  ) {
    const promises: Promise<IPwscExecReturn>[] = [];
    const _cliOptionsOverride =
      cliOptionsOverride || ((cliOptions: TPswcExecOptions) => cliOptions);

    execConfigTests.forEach(({ cliOptions }) => {
      promises.push(
        // command call:
        swc(_cliOptionsOverride(cliOptions), (childProcess) => {
          expect(!!childProcess).toBeTruthy();
          expect(childProcess).toBeInstanceOf(ChildProcess);
        }).catch((error: Error) => {
          fail(
            `Command rejected for the following error:\n${JSON.stringify(
              error,
              null,
              4
            )}\nNo error are expected!`
          );
        })
      );
    });

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      const { expected } = execConfigTests[index];
      const cliOptions = execConfigTests[index].cliOptions as TPswcExecOptions;

      const dataToInclude: TPswcExecOptions['data'] = cliOptions.data || {
        stdout: true,
        stderr: true
      };

      expect(result.exitCode).toBe(expected.exit.code);
      expect(result.exitSignal).toBe(expected.exit.signal);

      if (dataToInclude.stdout) {
        expect(!!result.data.stdout).toBeTruthy();
        expect(Array.isArray(result.data.stdout)).toBeTruthy();
        expect(result.data.stdout?.join('')).toContain(
          expected.stdout.includes
        );
      } else {
        expect(!!result.data.stdout).toBeFalsy();
      }

      if (dataToInclude.stderr) {
        expect(Array.isArray(result.data.stderr)).toBeTruthy();
        if (result.data.stderr) {
          expect(result.data.stderr.length > 0).toBeFalsy();
        } else {
          fail('stderr should exist and be an array!');
        }
      } else {
        expect(!!result.data.stderr).toBeFalsy();
      }
    });
  }
  test('promise spawn version successfully compile', async () => testSwc());
  test('promise spawn version successfully compile with exit as resolveEvent', async () =>
    testSwc((cliOptions) => ({
      ...cliOptions,
      resolveEvent: 'exit'
    })));

  test('child process spawn for a compilation that should happen correctly', () =>
    new Promise((resolve) => {
      execConfigTests.forEach(({ cliOptions, expected }) => {
        const closeData: any = { code: null, signal: null };
        const exitData: any = { code: null, signal: null };
        // let errorData: any;
        const events: string[] = [];
        const stdoutData: string[] = [];
        const stderrData: string[] = [];

        function evaluate() {
          if (events.includes('error')) {
            fail('Spawn Error happened!');
            return;
          }

          if (events.includes('close')) {
            /**
             * Testing exit event
             */
            if (!events.includes('exit')) {
              fail('No exit events happened!');
            }
            expect(exitData.code).toBe(expected.exit.code);
            expect(exitData.signal).toBe(expected.exit.signal);

            /**
             * Testing close event
             */
            expect(closeData.code).toBe(expected.close.code);
            expect(closeData.signal).toBe(expected.close.signal);

            /**
             * Testing stdout data
             */
            expect(events.includes('stdoutData')).toBeTruthy();
            expect(stdoutData.length > 0).toBeTruthy();
            expect(typeof stdoutData[0]).toBe('string');
            expect(
              stdoutData.join('').includes(expected.stdout.includes)
            ).toBeTruthy();

            /**
             * Testing stderr data
             */
            expect(events.includes('stderrData')).toBeFalsy();
            expect(stderrData.length > 0).toBeFalsy();
            resolve(0);
            return;
          }

          fail('No close event!');
        }

        // command call:
        const childProcess = cpSwc(cliOptions)
          .on('close', (code, signal) => {
            events.push('close');
            closeData.code = code;
            closeData.signal = signal;
            evaluate();
          })
          .on('exit', (code, signal) => {
            events.push('exit');
            exitData.code = code;
            exitData.signal = signal;
          })
          .on('error', (/* err */) => {
            // errorData = err;
            events.push('error');
            evaluate();
          });

        childProcess.stdout?.on('data', (data) => {
          events.push('stdoutData');
          stdoutData.push(data);
        });

        childProcess.stderr?.on('data', (data) => {
          events.push('stderrData');
          stderrData.push(data);
        });
      });
    }));

  test('sync version compile and work correctly', () => {
    execConfigTests.forEach(({ cliOptions, expected }) => {
      const encoding = cliOptions.spawnOptions?.encoding || 'utf8';
      const result = swcSync(cliOptions);
      const output: string[] =
        encoding === 'binary'
          ? (result.output as any).map((o: any) => o.toString('utf8'))
          : result.output;

      expect(output.length > 0).toBeTruthy();
      expect(typeof result.stdout === 'string').toBeTruthy();
      expect(output.join('')).toContain(expected.stdout.includes);
      expect(result.stdout).toContain(expected.stdout.includes);
      expect(result.signal).toBe(expected.exit.signal);
      expect(result.status).toBe(expected.exit.code);
    });
  });
});
