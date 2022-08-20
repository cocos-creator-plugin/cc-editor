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
const config_1 = __importDefault(require("./config"));
const util_1 = require("./util");
const log_1 = __importDefault(require("./log"));
const execa_1 = __importDefault(require("execa"));
const FsExtra = __importStar(require("fs-extra"));
const Path = __importStar(require("path"));
const Fs = __importStar(require("fs"));
exports.default = () => {
    var _a;
    const { use, buildAfter } = config_1.default.data;
    log_1.default.green(`编辑器：${use.editor}`);
    log_1.default.green(`项目：${use.project}`);
    const rootPath = config_1.default.getCurrentEditorPath();
    if (!rootPath) {
        return;
    }
    const editorPath = (0, util_1.getEditorRealExecutePath)(rootPath);
    let version = (0, util_1.getEditorVersion)(rootPath);
    const projectParam = version.startsWith('2.') ? 'path' : 'project';
    // todo 后续开放platform的配置
    const platform = 'web-mobile';
    let cmd = `${editorPath} --${projectParam} ${use.project} --build "platform=${platform};debug=true;"`;
    log_1.default.blue(cmd);
    function doCopy() {
        let buildResult = Path.join(use.project, 'build', platform);
        if (!Fs.existsSync(buildResult)) {
            console.log('未找到构建结果，无法执行后续任务');
            return;
        }
        const copy = buildAfter === null || buildAfter === void 0 ? void 0 : buildAfter.copyTo;
        if (copy && Array.isArray(copy)) {
            for (let i = 0; i < copy.length; i++) {
                let item = copy[i];
                if (Fs.existsSync(item)) {
                    FsExtra.copySync(buildResult, item, {
                        filter: (src, dest) => {
                            //  不拷贝的文件
                            const relative = Path.relative(buildResult, src);
                            let isIn = ['index.html'].find(el => el === relative);
                            return !isIn;
                        }
                    });
                    console.log(`copy to : ${item}`);
                }
                else {
                    console.log(`skip copy : ${item}`);
                }
            }
        }
    }
    const ret = execa_1.default.command(cmd);
    (_a = ret.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
        console.log(data.toString());
    });
    ret.on('exit', () => {
        doCopy();
    });
};
