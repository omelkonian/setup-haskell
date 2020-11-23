"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpts = exports.getDefaults = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const supported_versions = __importStar(require("./versions.json"));
function getDefaults() {
    const inpts = js_yaml_1.safeLoad(fs_1.readFileSync(path_1.join(__dirname, '..', 'action.yml'), 'utf8')).inputs;
    const mkVersion = (v, vs) => ({
        version: resolve(inpts[v].default, vs),
        supported: vs
    });
    return {
        ghc: mkVersion('ghc-version', supported_versions.ghc),
        cabal: mkVersion('cabal-version', supported_versions.cabal),
        stack: mkVersion('stack-version', supported_versions.stack)
    };
}
exports.getDefaults = getDefaults;
function resolve(version, supported) {
    var _a;
    return version === 'latest'
        ? supported[0]
        : (_a = supported.find(v => v.startsWith(version))) !== null && _a !== void 0 ? _a : version;
}
function getOpts({ ghc, cabal, stack }) {
    const stackNoGlobal = core.getInput('stack-no-global') !== '';
    const stackSetupGhc = core.getInput('stack-setup-ghc') !== '';
    const stackEnable = core.getInput('enable-stack') !== '';
    const verInpt = {
        ghc: core.getInput('ghc-version') || ghc.version,
        cabal: core.getInput('cabal-version') || cabal.version,
        stack: core.getInput('stack-version') || stack.version
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
    const opts = {
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
            setup: core.getInput('stack-setup-ghc') !== ''
        }
    };
    // eslint-disable-next-line github/array-foreach
    Object.values(opts)
        .filter(t => t.enable && t.raw !== t.resolved)
        .forEach(t => core.info(`Resolved ${t.raw} to ${t.resolved}`));
    core.debug(`Options are: ${JSON.stringify(opts)}`);
    return opts;
}
exports.getOpts = getOpts;
