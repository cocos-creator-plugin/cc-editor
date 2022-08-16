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
const win_version_info_1 = __importDefault(require("win-version-info"));
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
        return path_1.default.join(rootPath, 'CocosCreator.exe');
    }
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
        // 1. 生成专门的exe，然后使用child_process获取信息
        // 2. 使用node-gyp
        const exePath = getEditorRealPath(rootPath);
        return (0, win_version_info_1.default)(exePath).FileVersion || version;
    }
    return version;
}
exports.getEditorVersion = getEditorVersion;
