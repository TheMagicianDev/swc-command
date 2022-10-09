# SWC-COMMAND

![swc command cli node api banner](./imgs/banner_black.png)

<div align="center">
  <a href="https://github.com/TheMagicianDev/swc-command/actions?query=workflow%3ACI+branch%3Amain">
    <img src="https://img.shields.io/github/workflow/status/TheMagicianDev/swc-command/CI/main" alt="Build Status">
  </a>
  <a href='https://coveralls.io/github/TheMagicianDev/swc-command?branch=main'>
    <img src='https://coveralls.io/repos/github/TheMagicianDev/swc-command/badge.svg?branch=main' alt='Coverage Status' />
  </a>
</div>

<div align="center">
  <a href="">npm page</a>, 
  <a href="https://github.com/TheMagicianDev/swc-command">repo page</a>
</div>

<div align="center">
  <iframe src="https://ghbtns.com/github-btn.html?user=TheMagicianDev&repo=swc-command&type=star&count=true&size=large" frameborder="0" scrolling="0" width="170" height="30" title="GitHub"></iframe>
</div>

SWC nodejs api to run swc cli seamlessly from node. Intended for main usage with programmatic build scripts.

Many times we find ourselves needing to write a build script instead of just configuration.<br>For example, combining dev build with launching electron ....

Some also like that, for the flexibility of the programmatic side.

Whatever it is. This package and module is intended for this usage. It allow you to run `swc-cli` through a simple and concise api. **Typed with typescript**. **Autocompletion**. And the package provide 3 versions `swc` promise version, and the version you would mostly use.   `cpswc` child process version , `swcSync` a synchronous version.


## Installation

```sh
pnpm add swc-command -D
npm install swc-command -D
yarn add swc-command -D
```

## Usage

Let's suppose you are about to build a project. 

## swc()

Configuration

As by the following example. The configuration take the cli arguments as camel case equiv (`--out-dir` => `outDir`).

Check the list of all arguments in the [official doc]()

Along that we added `spawnOptions` prop to configure the spawn properties.

```ts
import { swc, isCompilationSuccessful } from 'swc-command'

(async () => {
  // Configuration
  const cliOptions = {
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
      module: {
        type: 'commonjs'
      },
      sourceMaps: true
    }
  };

  // Executing the cli
  const { data, exitCode, exitSignal } = await swc(cliOptions)

  if (isCompilationSuccessful(data.stdout)) {
    // Compilation successful
    console.log(data.stdout);
    startElectron();
  }

  // testing stdout content directly
  if (data.stdout.join('').includes('Successfully compiled:')) {
    // this is equivalent to the above. You can check in a similar manner for any specific case and cli output message.
  }
})()
```

With child process instance access

You can use that to print back to console. Or in cases of output-ing the compiled source to console. And you want to process the output in a stream based.

```ts
import { swc, isCompilationSuccessful } from 'swc-command'
const stdoutData: string[] = []

(async () => {
  await swc(cliOptions, (childProcess) => {
    // do something with the ChildProcess instance
    // check cpswc for an example

    childProcess.stdout.on('data', console.log)  // output to console
    childProcess.stderr.on('data', console.log) //

    childProcess.stdout.on('data', (data) => {
      console.log(data);
      // You can do whatever you want. Including printing back to the console.
    })
  })
})()
```

## Cli Options

```ts
export type TPswcExecOptions = TExecOptions & {
  resolveEvent?: 'close' | 'exit';
  data?: {
    stdout?: boolean;
    stderr?: boolean;
  };
};

export type TExecOptions = TCommandOptions & {
  spawnOptions?: TExecSpawnOptions;
};

// TCommandOptions the cli camel case equiv args (props)
```

### resolveEvents

```ts
resolveEvent?: 'close' | 'exit';
```

`close` or `exit`, default to `close`.

And it's used to precise at what event of the spawn process should the promise resolve. It can be the `close` event or the exit `event`. `exit` event happens before the `close` event. You can read more about that in the [spawn documentation](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options).

### data

```ts
data?: {
  stdout?: boolean;
  stderr?: boolean;
};
```

Optional.

Default to `{ stdout: true, stderr: true }`.

If any set to false. The according output wouldn't be included in the `data` prop of the result object.

```ts
const { data, exitCode, exitSignal } = await swc(cliOptions);
data.stdout // will contain stdout output as an array. Undefined if not included.
data.stderr // will contain stderr output as an array. Undefined if not included.
```

### Spawn options

It follow [Nodejs child_process spawn option type](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)

Plus we added encoding property.

```ts
export type TExecSpawnOptions = SpawnOptions & {
  encoding?: BufferEncoding;
};
```

Default value for encoding is `utf8`. You don't need to include it.

```ts
const cliOptions = {
  // ...
  spawnOptions: {
    encoding: 'utf8'
  },
  // ...  
};
```

And `stdio` default to `pipe`.

## swcSync() [Sync version]

```ts
const {
  output, // array // total output mixing both stdout and stderr and in an array format. Use join('') to process it as a string.
  stdout, // string or buffer (default: string)  //
  stderr, // string or buffer (default: string) // depends on encoding
  signal,
  status // exit code
} = swcSync(cliOptions);
```

result output is of this type:

```ts
interface SpawnSyncReturns<T> {
  pid: number;
  output: Array<T | null>;
  stdout: T;
  stderr: T;
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error | undefined;
}
```

Worth noting for the `cliOptions`. `spawnOptions` is the same. And `encoding` default to `'utf8'`. And `stdio` to `'pipe'`.

## cpswc() [promise version]

You may want to use this version if you don't want to buffer. In a wide repo. Where you compile and output to console. And you use that to process it on a stream based nature.

```ts
import { cpswc, isCompilationSuccessful } from 'swc-command'

const childProcess = cpswc(cliOptions)
  .on('close', (code, signal) => {
    // command finished executing.
    startElectron();
  })
  .on('error', (/* err */) => {
    // some unexpected execution for the spawning process
  });


childProcess.stdout?.on('data', (data) => {
  // process chunks on the go
});

childProcess.stderr?.on('data', (data) => {
  // some std error data
});
```

## CliOptions and properties Warning

Make sure you pass an object that hold the exact supported properties of the cli.

If any one is missing from the typescript declarations. Please fill a [pull request](https://github.com/TheMagicianDev/swc-command/pulls), or [issue](https://github.com/TheMagicianDev/swc-command/issues) to add it.

And for flexibility reason. You can add any prop. Even if it's not in the typescript declarations. And because of that choice. We do have a requirement!

Requirement:

- **The cli options object. Should contain only the cli args props. And the one that are part of the typescript declaration.**<br>
So if you constructed an object that contains all the necessary props for the cli execution. Furthermore you add **some extra no cli props**. **You need to extract that out.** Otherwise the **command would fail**. As **it will take the prop as a cli arg**. And that would make the cli to **fail**.

## utils

#### isCompilationSuccessful

`isCompilationSuccessful` is a helper that take `stdout` output and check for `Successfully compiled` as per this `return _stdout.join('').includes('Successfully compiled');` which is expected when the compilation is successful.

> It's a helper to simplify that. If for some reason that change. Or your use case is different. That take that in mind. You may need to figure out the way you want to check with.<br>
> You can fill a [pull request](https://github.com/TheMagicianDev/swc-command/pulls), or [issue](https://github.com/TheMagicianDev/swc-command/issues) if that ever change in the future.

If you need something else. You can recover `data.stdout` and use `return _stdout.join('').includes('Something to check with');` or anything else.

```ts
const { data, exitCode, exitSignal } = await swc(cliOptions)

if (isCompilationSuccessful(data.stdout)) {
  // Compilation successful
  console.log(data.stdout);
  startElectron();
}
```
