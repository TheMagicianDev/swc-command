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

export { swc, pswc, swcSync } from './execCommand';

export type {
  TExecOptions,
  TExecSpawnOptions,
  TPswcExecOptions,
  IPwscExecReturn,
  TSwcSyncExecOptions
} from './execCommand';
