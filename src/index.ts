export {
  buildCommand,
  buildCommandArgs,
  buildOption,
  buildConfigOption,
  optionPropToCommandArg
} from './buildCommand';

export type {
  ICommandOptionsBase,
  IOutDirOption,
  IOutFileOption,
  TCommandOptions
} from './buildCommand';

export { swc, cpSwc, swcSync } from './execCommand';

export type {
  TExecOptions,
  TExecSpawnOptions,
  TPswcExecOptions,
  IPwscExecReturn,
  TSwcSyncExecOptions
} from './execCommand';

export { isCompilationSuccessful } from './utils';
