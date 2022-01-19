"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa_1 = __importDefault(require("execa"));
const config_1 = __importDefault(require("./config"));
const log_1 = __importDefault(require("./log"));
const util_1 = require("./util");
exports.default = () => {
    var _a;
    const { project } = config_1.default.data.use;
    const { debug, port, brk } = config_1.default.data;
    const rootPath = config_1.default.getCurrentEditorPath();
    if (!rootPath) {
        return;
    }
    const editorPath = (0, util_1.getEditorRealPath)(rootPath);
    let version = (0, util_1.getEditorVersion)(rootPath);
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
