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
const Path = __importStar(require("path"));
const FsExtra = __importStar(require("fs-extra"));
const osenv_1 = __importDefault(require("osenv"));
const log_1 = __importDefault(require("./log"));
const Fs = __importStar(require("fs"));
const FilePath = Path.join(osenv_1.default.home(), 'cc-editor.json');
class ConfigData {
    constructor() {
        this.editors = [];
        this.projects = [];
        this.use = {
            editor: '',
            project: '',
        };
        this.groups = [];
        this.debug = true;
        this.brk = false;
        this.port = 2021;
        this.buildAfter = {
            copyTo: [],
        };
    }
}
class Config {
    constructor() {
        this.data = new ConfigData();
        if (!FsExtra.existsSync(FilePath)) {
            FsExtra.writeJSONSync(FilePath, {});
        }
        this.data = Object.assign(this.data, FsExtra.readJSONSync(FilePath));
    }
    addGroup(name, editor, project) {
        let success = true, msg = '';
        if (!this.data.groups.find(el => el.name === name)) {
            this.data.groups.push({
                name,
                editor,
                project,
            });
            this.save();
        }
        else {
            success = false;
            msg = `已经存在组合[${name}]`;
        }
        return { success, msg };
    }
    useGroup(name) {
        let success = true, msg = '';
        let ret = this.data.groups.find(el => el.name === name);
        if (ret) {
            this.data.use.editor = ret.editor;
            this.data.use.project = ret.project;
            this.save();
        }
        else {
            success = false;
            msg = '无法找到组合配置项！';
        }
        return { success, msg };
    }
    removeGroup(name) {
        let success = true, msg = '';
        const index = this.data.groups.findIndex(el => el.name === name);
        if (index === -1) {
            success = false;
            msg = '未找到组合，删除失败';
        }
        else {
            this.data.groups.splice(index, 1);
            this.save();
        }
        return { success, msg };
    }
    setPort(port) {
        this.data.port = port || this.data.port;
        this.save();
    }
    setDebug(debug) {
        this.data.debug = !!debug;
        this.save();
    }
    setBrk(brk) {
        this.data.brk = !!brk;
        log_1.default.green(!!this.data.brk ? '启用brk' : '禁用brk');
        this.save();
    }
    save() {
        FsExtra.writeJSONSync(FilePath, this.data);
    }
    getCurrentEditorPath() {
        const { project, editor } = this.data.use;
        const ret = this.data.editors.find(el => el.name === editor);
        if (ret && ret.path) {
            return ret.path || null;
        }
        return null;
    }
    useProject(project) {
        let success = true, msg = '';
        if (FsExtra.existsSync(project)) {
            this.data.use.project = project;
            this.save();
        }
        else {
            success = false;
            msg = `无法使用${name}，路径无效:${project}`;
        }
        return { success, msg };
    }
    useEditor(name) {
        let success = true, msg = '';
        const ret = this.data.editors.find(el => el.name === name);
        if (ret) {
            if (FsExtra.existsSync(ret.path)) {
                this.data.use.editor = name;
                this.save();
            }
            else {
                success = false;
                msg = `无法使用${name}，路径无效:${ret.path}`;
            }
        }
        else {
            success = false;
            msg = `无效的配置：${name}`;
        }
        return { success, msg };
    }
    removeProject(projectPath) {
        let success = true, msg = '';
        const index = this.data.projects.findIndex(el => el === projectPath);
        if (index === -1) {
            success = false;
            msg = '未找到项目配置，删除失败 ';
        }
        else {
            this.data.projects.splice(index, 1);
            if (this.data.use.project === projectPath) {
                this.data.use.project = '';
            }
            this.save();
        }
        return { success, msg };
    }
    addProject(projectPath) {
        let success = true, msg = '';
        if (FsExtra.existsSync(projectPath)) {
            if (!this.data.projects.find(el => el === projectPath)) {
                this.data.projects.push(projectPath);
                this.save();
            }
        }
        else {
            success = false;
            msg = `无效的路径: ${projectPath}`;
        }
        return { success, msg };
    }
    addEditor(name, editorPath) {
        let success = true, msg = '';
        if (FsExtra.existsSync(editorPath)) {
            if (!this.data.editors.find(el => el.path === editorPath)) {
                this.data.editors.push({ name, path: editorPath });
                this.save();
            }
        }
        else {
            success = false;
            msg = `无效的路径: ${editorPath}`;
        }
        return { success, msg };
    }
    removeEditor(name) {
        let success = true, msg = '';
        const index = this.data.editors.findIndex(el => el.name === name);
        if (index === -1) {
            success = false;
            msg = '未找到编辑器配置，删除失败';
        }
        else {
            this.data.editors.splice(index, 1);
            if (name === this.data.use.editor) {
                this.data.use.editor = '';
            }
            this.save();
        }
        return { success, msg };
    }
    addBuildCopyDir(dir) {
        let success = true, msg = '';
        if (Fs.existsSync(dir)) {
            this.data.buildAfter.copyTo.push(dir);
            this.save();
        }
        else {
            success = false;
            msg = `copy目录不存在: ${dir}`;
        }
        return { success, msg };
    }
    removeBuildCopyDir(dir) {
        let index = this.data.buildAfter.copyTo.findIndex(el => el === dir);
        if (index !== -1) {
            this.data.buildAfter.copyTo.splice(index, 1);
            this.save();
        }
    }
    log() {
        log_1.default.blue(`config file path: ${FilePath}`);
        log_1.default.green(JSON.stringify(this.data, null, 2));
    }
    checkRun() {
        let success = true, msg = '';
        return { success, msg };
    }
}
exports.default = new Config();
