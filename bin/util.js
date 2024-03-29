"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMyPath = exports.getEditorVersion = exports.getEditorRealExecutePath = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importStar(require("path"));
const plist_1 = __importDefault(require("plist"));
const fs_1 = __importDefault(require("fs"));
const win_version_info_1 = __importDefault(require("win-version-info"));
function isMac() {
    return os_1.default.platform() === 'darwin';
}
function getEditorRealExecutePath(rootPath) {
    const state = fs_1.default.statSync(rootPath);
    if (state.isDirectory()) {
        if (isMac()) {
            return path_1.default.join(rootPath, 'Contents/MacOS/CocosCreator');
        }
        else {
            return path_1.default.join(rootPath, 'CocosCreator.exe');
        }
    }
    else {
        return rootPath;
    }
}
exports.getEditorRealExecutePath = getEditorRealExecutePath;
function getEditorVersion(rootPath) {
    let version = '2.4.7';
    if (!rootPath) {
        return version;
    }
    if (isMac()) {
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
        const exePath = getEditorRealExecutePath(rootPath);
        version = (0, win_version_info_1.default)(exePath).FileVersion || version;
    }
    return version;
}
exports.getEditorVersion = getEditorVersion;
function toMyPath(v) {
    return (0, path_1.normalize)(v).split(path_1.sep).join('/');
}
exports.toMyPath = toMyPath;
//# sourceMappingURL=util.js.map