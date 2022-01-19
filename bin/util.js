"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditorVersion = exports.getEditorRealPath = exports.logFailed = void 0;
const log_1 = __importDefault(require("./log"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const plist_1 = __importDefault(require("plist"));
const fs_1 = __importDefault(require("fs"));
function isMac() {
    return os_1.default.platform() === 'darwin';
}
function logFailed(ret) {
    if (!ret.success) {
        log_1.default.red(ret.msg || '');
    }
}
exports.logFailed = logFailed;
function getEditorRealPath(rootPath) {
    if (isMac()) {
        return path_1.default.join(rootPath, 'Contents/MacOS/CocosCreator');
    }
    else {
        // todo 适配Windows
    }
    return rootPath;
}
exports.getEditorRealPath = getEditorRealPath;
function getEditorVersion(rootPath) {
    let version = '2.4.7';
    if (rootPath && isMac()) {
        const plistFile = path_1.default.join(rootPath, 'Contents/Info.plist');
        const ret = plist_1.default.parse(fs_1.default.readFileSync(plistFile, 'utf-8'));
        if (ret) {
            // @ts-ignore
            version = ret.CFBundleVersion || ret.CFBundleShortVersionString;
        }
    }
    else {
        // todo windows
    }
    return version;
}
exports.getEditorVersion = getEditorVersion;
