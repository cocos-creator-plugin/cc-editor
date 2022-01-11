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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const os_1 = __importDefault(require("os"));
const config_1 = __importDefault(require("./config"));
const Path = __importStar(require("path"));
const log_1 = __importDefault(require("./log"));
const plist_1 = __importDefault(require("plist"));
const Fs = __importStar(require("fs"));
exports.default = () => {
    var _a;
    const { project } = config_1.default.data.use;
    const { debug, port, brk } = config_1.default.data;
    const rootPath = config_1.default.getCurrentEditorPath();
    let editorPath = rootPath;
    let version = '2.4.7';
    if (rootPath && os_1.default.platform() === 'darwin') {
        editorPath = Path.join(rootPath, 'Contents/MacOS/CocosCreator');
        const plistFile = Path.join(rootPath, 'Contents/Info.plist');
        const ret = plist_1.default.parse(Fs.readFileSync(plistFile, 'utf-8'));
        if (ret) {
            // @ts-ignore
            version = ret.CFBundleVersion || ret.CFBundleShortVersionString;
        }
    }
    else {
        // todo windows
    }
    const projectParam = version.startsWith('2.') ? 'path' : 'project';
    let cmd = `${editorPath} --${projectParam} ${project}`;
    if (debug) {
        if (brk) {
            cmd += ` --inspect-brk=${port}`;
        }
        else {
            cmd += ` --inspect=${port}`;
        }
    }
    log_1.default.blue(cmd);
    const ret = execa_1.default.command(cmd);
    (_a = ret.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
        console.log(data.toString());
    });
    if (debug) {
        const url = 'chrome://inspect/#devices';
        log_1.default.green(`请使用chrome浏览器打开： ${url}`);
        log_1.default.green(`在Configure增加配置 localhost:${port}`);
        const tutorials = 'https://juejin.cn/post/7047050908865134628/';
        log_1.default.green(`详细教程: ${tutorials}`);
        // open(url)// chrome限制，无法打开
    }
};
