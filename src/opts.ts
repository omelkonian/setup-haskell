import * as core from '@actions/core';
import {readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {join} from 'path';
import * as supported_versions from './versions.json';

export type OS = 'linux' | 'darwin' | 'win32';
export type Tool = 'cabal' | 'ghc' | 'stack';

export interface ProgramOpt {
  enable: boolean;
  raw: string;
  resolved: string;
}

export interface Options {
  ghc: ProgramOpt;
  cabal: ProgramOpt;
  stack: ProgramOpt & {setup: boolean};
}

type Version = {version: string; supported: string[]};
export type Defaults = Record<Tool, Version>;

export const yamlInputs: Record<string, {default: string}> = safeLoad(
  readFileSync(join(__dirname, '..', 'action.yml'), 'utf8')
).inputs;

export function getDefaults(): Defaults {
  const mkVersion = (v: string, vs: string[]): Version => ({
    version: resolve(yamlInputs[v].default, vs),
    supported: vs
  });

  return {
    ghc: mkVersion('ghc-version', supported_versions.ghc),
    cabal: mkVersion('cabal-version', supported_versions.cabal),
    stack: mkVersion('stack-version', supported_versions.stack)
  };
}

function resolve(version: string, supported: string[]): string {
  return version === 'latest'
    ? supported[0]
    : supported.find(v => v.startsWith(version)) ?? version;
}

export function getOpts(
  {ghc, cabal, stack}: Defaults,
  inputs: Record<string, string>
): Options {
  const stackNoGlobal = inputs['stack-no-global'] === 'true';
  const stackSetupGhc = inputs['stack-setup-ghc'] === 'true';
  const stackEnable = inputs['enable-stack'] === 'true';
  const verInpt = {
    ghc: inputs['ghc-version'] || ghc.version,
    cabal: inputs['cabal-version'] || cabal.version,
    stack: inputs['stack-version'] || stack.version
  };

  const errors = [];
  if (stackNoGlobal && !stackEnable) {
    errors.push('enable-stack is required if stack-no-global is set');
  }

  if (stackSetupGhc && !stackEnable) {
    errors.push('enable-stack is required if stack-setup-ghc is set');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const opts: Options = {
    ghc: {
      raw: verInpt.ghc,
      resolved: resolve(verInpt.ghc, ghc.supported),
      enable: !stackNoGlobal
    },
    cabal: {
      raw: verInpt.cabal,
      resolved: resolve(verInpt.cabal, cabal.supported),
      enable: !stackNoGlobal
    },
    stack: {
      raw: verInpt.stack,
      resolved: resolve(verInpt.stack, stack.supported),
      enable: stackEnable,
      setup: inputs['stack-setup-ghc'] !== ''
    }
  };

  // eslint-disable-next-line github/array-foreach
  Object.values(opts)
    .filter(t => t.enable && t.raw !== t.resolved)
    .forEach(t => core.info(`Resolved ${t.raw} to ${t.resolved}`));

  core.debug(`Options are: ${JSON.stringify(opts)}`);
  return opts;
}
