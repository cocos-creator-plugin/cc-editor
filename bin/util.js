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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOpen2ContextMenu = exports.isNumber = exports.getCreatorProjectVersion = exports.isCreatorProject = exports.toMyPath = exports.getEditorVersion = exports.getEditorRealExecutePath = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importStar(require("path"));
const plist_1 = __importDefault(require("plist"));
const fs_1 = __importStar(require("fs"));
const win_version_info_1 = __importDefault(require("win-version-info"));
const regedit_1 = __importDefault(require("regedit"));
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
    if (v) {
        return (0, path_1.normalize)(v).split(path_1.sep).join('/');
    }
    else {
        return "";
    }
}
exports.toMyPath = toMyPath;
function isCreatorProject(dir) {
    const assets = (0, path_1.join)(dir, 'assets');
    return !!(0, fs_1.existsSync)(assets);
}
exports.isCreatorProject = isCreatorProject;
function getCreatorProjectVersion(dir) {
    const cfg = [
        {
            file: "project.json",
            getVersion: (data) => {
                return data.version || null;
            }
        },
        {
            file: 'package.json',
            getVersion: (data) => {
                if (data.creator && data.creator.version) {
                    return data.creator.version;
                }
                return data.version || null;
            }
        }
    ];
    for (let i = 0; i < cfg.length; i++) {
        const { file, getVersion } = cfg[i];
        const flagFile = (0, path_1.join)(dir, file);
        if (!fs_1.default.existsSync(flagFile)) {
            continue;
        }
        try {
            const data = JSON.parse(fs_1.default.readFileSync(flagFile, "utf-8"));
            return getVersion(data);
        }
        catch (e) {
            console.log(e);
        }
    }
    return null;
}
exports.getCreatorProjectVersion = getCreatorProjectVersion;
function isNumber(str) {
    return /^\d+$/.test(str);
}
exports.isNumber = isNumber;
function addOpen2ContextMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        yield changeRegister('HKCR\\directory\\background\\shell\\cc-editor');
        yield changeRegister('HKCR\\Folder\\shell\\cc-editor');
    });
}
exports.addOpen2ContextMenu = addOpen2ContextMenu;
function changeRegister(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const key_command = `${key}\\command`;
        const ret = yield regedit_1.default.promisified.list([key, key_command]);
        if (!ret[key].exists) {
            yield regedit_1.default.promisified.createKey([key]);
        }
        if (!ret[key_command].exists) {
            yield regedit_1.default.promisified.createKey([key_command]);
        }
        const icon = (0, path_1.join)(__dirname, '../doc/1.ico');
        const obj = {};
        obj[key] = {
            root: { type: "REG_DEFAULT", value: "cce open" },
            icon: { value: icon, type: "REG_SZ" }
        };
        const cmd = `"${(0, path_1.join)(__dirname, '../shell/cce-open.bat')}" %V`;
        obj[key_command] = {
            root: { type: "REG_DEFAULT", value: cmd }
        };
        yield regedit_1.default.promisified.putValue(obj);
    });
}
//# sourceMappingURL=util.js.map