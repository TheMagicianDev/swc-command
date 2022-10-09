import { Config } from '@swc/core';
import { docUrl } from '../constants';

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

function addQuotesIfShould(part: string, useDoubleQuote: boolean) {
  if (useDoubleQuote) {
    return `"${part}"`;
  }
  return part.replace(/ /g, '\\ ');
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

export function buildConfigOption(
  config: TCommandOptions['config'],
  useDoubleQuote = true
): string {
  let output = '';
  function traverseAndConstruct(
    configPartObj: Record<string, TConfigValues>,
    propAccessExpression: string
  ) {
    Object.keys(configPartObj).forEach((key) => {
      if (key === '$schema') return;

      if (
        !Array.isArray(configPartObj[key]) &&
        typeof configPartObj[key] === 'object'
      ) {
        traverseAndConstruct(
          configPartObj[key] as Record<string, TConfigValues>,
          propAccessExpression ? `${propAccessExpression}.${key}` : key
        );
        return;
      }

      /**
       * If no more an object write down the config
       */
      const value = `${
        propAccessExpression ? `${propAccessExpression}.${key}=` : `${key}=`
      }${String(configPartObj[key])}`;

      output += ` -C ${addQuotesIfShould(value, useDoubleQuote)}`; // > String(["0654564", 654654654,654654]) ==> '0654564,654654654,654654'
    });
    return output;
  }
  traverseAndConstruct(config as Record<string, TConfigValues>, '');
  return output.trim();
}

export function buildOption(
  optionName: keyof TCommandOptions,
  optionValue: string | string[] | boolean | Config | undefined,
  useDoubleQuote = true
): string {
  if (typeof optionValue === 'undefined') {
    return '';
  }
  if (optionName === 'src') {
    return addQuotesIfShould(String(optionValue), useDoubleQuote);
  }
  const cliOptionNamePart = optionPropToCommandArg(optionName);
  if (typeof optionValue === 'boolean') {
    return optionValue
      ? cliOptionNamePart
      : `${cliOptionNamePart}=${String(false)}`;
  }
  if (typeof optionValue === 'string') {
    return `${cliOptionNamePart}=${addQuotesIfShould(
      optionValue,
      useDoubleQuote
    )}`;
  }
  if (Array.isArray(optionValue)) {
    return `${cliOptionNamePart}=${addQuotesIfShould(
      String(optionValue),
      useDoubleQuote
    )}`;
  }

  if (optionName === 'config') {
    return buildConfigOption(optionValue, useDoubleQuote);
  }

  throw new Error(
    `Wrong options value type for ${optionName}! Check the cli documentation at ${docUrl}`
  );
}

export function buildCommandArgs(
  cliOptions: TCommandOptions,
  optionsToIgnore: string[] = []
): string[] {
  const args: string[] = ['npx', 'swc', cliOptions.src];

  const optionsNames = (
    Object.keys(cliOptions) as (keyof TCommandOptions)[]
  ).filter(
    (optionName) => ![...optionsToIgnore, 'src', '$schema'].includes(optionName)
  );

  optionsNames.forEach((optionName) => {
    const optionValue = cliOptions[optionName];
    if (typeof optionValue === 'undefined') {
      return;
    }

    if (optionName === 'config') {
      const configOptionSplit = buildOption(
        optionName,
        optionValue,
        false
      ).split('-C ');

      for (let i = 1; i < configOptionSplit.length; i++) {
        const configOption = configOptionSplit[i].trim();
        args.push('-C');
        args.push(configOption);
      }

      return;
    }

    args.push(optionPropToCommandArg(optionName));
    args.push(String(optionValue));
  });
  return args;
}

export function buildCommand(
  cliOptions: TCommandOptions,
  optionsToIgnore: string[] = [],
  useDoubleQuote = true
): string {
  let command = `npx swc ${addQuotesIfShould(cliOptions.src, useDoubleQuote)}`;
  const optionsNames = (
    Object.keys(cliOptions) as (keyof TCommandOptions)[]
  ).filter((optionName) => ![...optionsToIgnore, 'src'].includes(optionName));
  optionsNames.forEach((optionName) => {
    const optionValue = cliOptions[optionName];
    if (
      optionName === ('$schema' as string) ||
      typeof optionValue === 'undefined'
    ) {
      return;
    }
    command += ` ${buildOption(optionName, optionValue, useDoubleQuote)}`;
  });
  return command;
}
