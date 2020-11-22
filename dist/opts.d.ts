export declare type OS = 'linux' | 'darwin' | 'win32';
export declare type Tool = 'cabal' | 'ghc' | 'stack';
export interface ProgramOpt {
    enable: boolean;
    raw: string;
    resolved: string;
}
export interface Options {
    ghc: ProgramOpt;
    cabal: ProgramOpt;
    stack: ProgramOpt & {
        setup: boolean;
    };
}
declare type Version = {
    version: string;
    supported: string[];
};
export declare type Defaults = Record<Tool, Version>;
export declare function getDefaults(): Defaults;
export declare function getOpts({ ghc, cabal, stack }: Defaults): Options;
export {};
