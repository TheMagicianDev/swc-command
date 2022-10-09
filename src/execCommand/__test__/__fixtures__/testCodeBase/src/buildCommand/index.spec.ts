import { Config } from '@swc/core';
import {
  TCommandOptions,
  buildConfigOption,
  optionPropToCommandArg,
  buildOption,
  buildCommand
} from './index';

const buildConfigOptionTests: { config: Config; expected: string }[] = [
  {
    config: {
      ...{ $schema: '......' },
      env: {
        loose: true,
        dynamicImport: true,
        exclude: ['**/*.spec.ts']
      },
      module: {
        type: 'commonjs'
      },
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
          decorators: true,
          dynamicImport: true
        },
        minify: {
          compress: true,
          mangle: true
        }
      },
      sourceMaps: true
    },
    expected:
      '-C env.loose="true" -C env.dynamicImport="true" -C env.exclude="**/*.spec.ts" -C module.type="commonjs" -C jsc.parser.syntax="typescript" -C jsc.parser.tsx="false" -C jsc.parser.decorators="true" -C jsc.parser.dynamicImport="true" -C jsc.minify.compress="true" -C jsc.minify.mangle="true" -C sourceMaps="true"'
  },
  {
    config: {
      jsc: {
        parser: {
          syntax: 'ecmascript',
          jsx: false,
          dynamicImport: false,
          privateMethod: false,
          functionBind: false,
          exportDefaultFrom: false,
          exportNamespaceFrom: false,
          decorators: false,
          decoratorsBeforeExport: false,
          topLevelAwait: false,
          importMeta: false
        },
        target: 'es5',
        loose: false,
        externalHelpers: false,
        // Requires v1.2.50 or upper and requires target to be es2016 or upper.
        keepClassNames: false
      },
      minify: false
    },
    expected:
      '-C jsc.parser.syntax="ecmascript" -C jsc.parser.jsx="false" -C jsc.parser.dynamicImport="false" -C jsc.parser.privateMethod="false" -C jsc.parser.functionBind="false" -C jsc.parser.exportDefaultFrom="false" -C jsc.parser.exportNamespaceFrom="false" -C jsc.parser.decorators="false" -C jsc.parser.decoratorsBeforeExport="false" -C jsc.parser.topLevelAwait="false" -C jsc.parser.importMeta="false" -C jsc.target="es5" -C jsc.loose="false" -C jsc.externalHelpers="false" -C jsc.keepClassNames="false" -C minify="false"'
  }
];

const optionPropToCommandArgTests: {
  option: keyof TCommandOptions;
  expected: string;
}[] = [
  {
    option: 'only',
    expected: '--only'
  },
  {
    option: 'ignore',
    expected: '--ignore'
  },
  {
    option: 'configFile',
    expected: '--config-file'
  },
  {
    option: 'sourceMapTarget',
    expected: '--source-map-target'
  }
];

const buildOptionTests: {
  optionName: keyof TCommandOptions;
  optionValue: boolean | string | string[] | Config | undefined;
  expected: string;
}[] = [
  // array (list)
  {
    optionName: 'ignore',
    optionValue: ['**/*.spec.ts', '**/*.test.ts'],
    expected: '--ignore="**/*.spec.ts,**/*.test.ts"'
  },
  // boolean
  {
    optionName: 'watch',
    optionValue: true,
    expected: '--watch'
  },
  {
    optionName: 'sync',
    optionValue: false,
    expected: '--sync="false"'
  },
  {
    optionName: 'sourceMaps',
    optionValue: false,
    expected: '--source-maps="false"'
  },
  {
    optionName: 'sourceMaps',
    optionValue: 'inline',
    expected: '--source-maps="inline"'
  },
  {
    optionName: 'logWatchCompilation',
    optionValue: true,
    expected: '--log-watch-compilation'
  },
  {
    optionName: 'logWatchCompilation',
    optionValue: false,
    expected: '--log-watch-compilation="false"'
  },
  // string
  {
    optionName: 'sourceMapTarget',
    optionValue: 'dist/input.map.js',
    expected: '--source-map-target="dist/input.map.js"'
  },
  // config obj
  {
    optionName: 'config',
    optionValue: {
      jsc: {
        minify: {
          compress: true,
          mangle: true
        },
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
          tsx: true
        },
        loose: true
      },
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      sourceMaps: true,
      minify: true,
      module: {
        type: 'commonjs'
      }
    } as Config,
    expected:
      '-C jsc.minify.compress="true" -C jsc.minify.mangle="true" -C jsc.parser.syntax="typescript" -C jsc.parser.decorators="true" -C jsc.parser.dynamicImport="true" -C jsc.parser.tsx="true" -C jsc.loose="true" -C exclude="**/*.spec.ts,**/*.test.ts" -C sourceMaps="true" -C minify="true" -C module.type="commonjs"'
  },
  // src prop
  {
    optionName: 'src',
    optionValue: 'src/index.ts',
    expected: '"src/index.ts"'
  },
  {
    optionName: 'src',
    optionValue: 'some src dir',
    expected: '"some src dir"'
  },
  // undefined value
  {
    optionName: 'configFile',
    optionValue: undefined,
    expected: ''
  }
];

const buildCommandTests: {
  cmdOptions: TCommandOptions;
  expected: string;
}[] = [
  {
    cmdOptions: {
      src: 'src',
      outDir: 'dist',
      configFile: undefined, // to test undefined values
      ignore: ['**/*.spec.ts', '**/*.test.ts'],
      watch: true,
      sync: false,
      sourceMaps: false,
      logWatchCompilation: true,
      filename: undefined, // to test undefined values
      sourceMapTarget: 'dist/input.map.js',
      config: {
        jsc: {
          minify: { compress: true, mangle: true },
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
            tsx: true
          },
          loose: true
        },
        exclude: ['**/*.spec.ts', '**/*.test.ts'],
        sourceMaps: true,
        minify: true,
        module: { type: 'commonjs' }
      }
    },
    expected:
      'swc "src" --out-dir="dist" --ignore="**/*.spec.ts,**/*.test.ts" --watch --sync="false" --source-maps="false" --log-watch-compilation --source-map-target="dist/input.map.js" -C jsc.minify.compress="true" -C jsc.minify.mangle="true" -C jsc.parser.syntax="typescript" -C jsc.parser.decorators="true" -C jsc.parser.dynamicImport="true" -C jsc.parser.tsx="true" -C jsc.loose="true" -C exclude="**/*.spec.ts,**/*.test.ts" -C sourceMaps="true" -C minify="true" -C module.type="commonjs"'
  }
];

describe('Testing utils', () => {
  test('buildConfigOption resolve and build correctly', () => {
    buildConfigOptionTests.forEach((configTestObj) => {
      const configBuiltOptionsArgs = buildConfigOption(configTestObj.config);
      expect(configBuiltOptionsArgs).toBe(configTestObj.expected);
    });
  });

  test('optionPropToCommandArg work correctly', () => {
    optionPropToCommandArgTests.forEach((configTestObj) => {
      const cliOption = optionPropToCommandArg(configTestObj.option);
      expect(cliOption).toBe(configTestObj.expected);
    });
  });

  test('buildOption resolve and build correctly', () => {
    buildOptionTests.forEach((buildTest) => {
      const optionBuildStr = buildOption(
        buildTest.optionName,
        buildTest.optionValue
      );
      expect(optionBuildStr).toBe(buildTest.expected);
    });
  });

  test('buildCommand resolve and build correctly', () => {
    buildCommandTests.forEach((buildTest) => {
      const command = buildCommand(buildTest.cmdOptions as TCommandOptions);
      expect(command).toBe(buildTest.expected);
    });
  });

  // test('commands args are tested correctly', () => {
  //   // expect(typeof defaultSchemaContent).toBe('string');
  //   // expect(typeof tsConfigInterfaceFromJsonSchema).toBe('object');
  // });
});
