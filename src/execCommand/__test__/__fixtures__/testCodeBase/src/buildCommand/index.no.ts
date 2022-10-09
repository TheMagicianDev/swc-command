import { Config } from '@swc/core';
import { docUrl } from '../constants/index';

export interface ICommandOptionsBase {
  src: string;
  filename?: string;
  configFile?: string;
  envName?: string;
  noSwcrc?: boolean;
  ignore?: string[];
  only?: string[];
  watch?: boolean;
  quiet?: boolean;
  sourceMaps?: true | false | 'true' | 'false' | 'inline' | 'both';
  sourceMapTarget?: string;
  sourceFileName?: string;
  sourceRoot?: string;
  copyFiles?: boolean;
  includeDotfiles?: boolean;
  config?: Config;
  sync?: boolean;
  logWatchCompilation?: boolean;
  extensions?: string[];
}

export interface IOutDirOption {
  outDir: string;
}

export interface IOutFileOption {
  outFile: string;
}

export type TCommandOptions = ICommandOptionsBase &
  (IOutDirOption | IOutFileOption);

type TConfigValues = Config[keyof Config];

export function isUpperCase(char: string) {
  return char < 'a';
}

export function optionPropToCommandArg(prop: string): string {
  let outStr = '--';
  for (let i = 0; i < prop.length; i++) {
    if (isUpperCase(prop[i])) {
      outStr += `-${prop[i].toLocaleLowerCase()}`;
    } else {
      outStr += prop[i];
    }
  }
  return outStr;
}

export function buildConfigOption(config: TCommandOptions['config']): string {
  let output = '';
  function traverseAndConstruct(
    configPart: Record<string, TConfigValues>,
    propAccessExpression: string
  ) {
    Object.keys(configPart).forEach((key) => {
      if (key === '$schema') return;

      if (
        !Array.isArray(configPart[key]) &&
        typeof configPart[key] === 'object'
      ) {
        traverseAndConstruct(
          configPart[key] as Record<string, TConfigValues>,
          propAccessExpression ? `${propAccessExpression}.${key}` : key
        );
        return;
      }

      /**
       * If no more an object write down the config
       */

      output += ` -C ${
        propAccessExpression ? `${propAccessExpression}.${key}=` : `${key}=`
      }`;

      output += `"${String(configPart[key])}"`; // > String(["0654564", 654654654,654654]) ==> '0654564,654654654,654654'
    });
    return output;
  }
  traverseAndConstruct(config as Record<string, TConfigValues>, '');
  return output.trim();
}

export function buildOption(
  optionName: keyof TCommandOptions,
  optionValue: string | string[] | boolean | Config | undefined
): string {
  if (typeof optionValue === 'undefined') {
    return '';
  }
  if (optionName === 'src') {
    return `"${optionValue}"`;
  }
  const cliOptionNamePart = optionPropToCommandArg(optionName);
  if (typeof optionValue === 'boolean') {
    return optionValue ? cliOptionNamePart : `${cliOptionNamePart}="false"`;
  }
  if (typeof optionValue === 'string') {
    return `${cliOptionNamePart}="${String(optionValue)}"`;
  }
  if (Array.isArray(optionValue)) {
    return `${cliOptionNamePart}="${String(optionValue)}"`;
  }

  if (optionName === 'config') {
    return buildConfigOption(optionValue);
  }

  throw new Error(
    `Wrong options value type for ${optionName}! Check the cli documentation at ${docUrl}`
  );
}

export function buildCommand(cliOptions: TCommandOptions): string {
  let command = 'swc';
  const optionsNames = Object.keys(cliOptions) as (keyof TCommandOptions)[];
  optionsNames.forEach((optionName) => {
    const optionValue = cliOptions[optionName];
    if (
      optionName === ('$schema' as string) ||
      typeof optionValue === 'undefined'
    ) {
      return;
    }
    command += ` ${buildOption(optionName, optionValue)}`;
  });
  return command;
}
