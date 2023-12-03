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
const Path = __importStar(require("path"));
const FsExtra = __importStar(require("fs-extra"));
const osenv_1 = __importDefault(require("osenv"));
const log_1 = __importDefault(require("./log"));
const Fs = __importStar(require("fs"));
const fs_1 = require("fs");
const util_1 = require("./util");
const const_1 = require("./const");
const FilePath = (0, util_1.toMyPath)(Path.join(osenv_1.default.home(), 'cc-editor.json'));
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
        this.ccp = { V2: '', V3: '', enabled: false };
        this.buildAfter = {
            copyTo: [],
        };
    }
}
class Config {
    restInvalidConfig() {
        let change = false;
        // 检查编辑器是否有效
        const invalidEditors = [];
        let { editors, projects } = this.data;
        for (let i = 0; i < editors.length;) {
            const editor = editors[i];
            if (!(0, fs_1.existsSync)(editor.path)) {
                change = true;
                log_1.default.red(`find invalid editor: ${JSON.stringify(editor)}`);
                invalidEditors.push(editor);
                this.data.editors.splice(i, 1);
            }
            else {
                i++;
            }
        }
        // 检查项目是否有效
        const invalidProjects = [];
        for (let i = 0; i < projects.length;) {
            const project = projects[i];
            if (!(0, fs_1.existsSync)(project)) {
                change = true;
                log_1.default.red(`find invalid project:${project}`);
                invalidProjects.push(project);
                this.data.projects.splice(i, 1);
            }
            else {
                i++;
            }
        }
        // 重置与之关联的use
        const { editor, project } = this.data.use;
        const useEditorInvalid = invalidEditors.find(el => el.name === editor);
        const useProjectInvalid = invalidProjects.find(el => el === project);
        if (useEditorInvalid || useProjectInvalid) {
            change = true;
            this.data.use.editor = "";
            this.data.use.project = "";
            log_1.default.red(`reset link use editor&project`);
        }
        // 删除与之关联的group
        for (let i = 0; i < this.data.groups.length;) {
            const group = this.data.groups[i];
            const { editor, project, name } = group;
            const useEditorInvalid = invalidEditors.find(el => el.name === editor);
            const useProjectInvalid = invalidProjects.find(el => el === project);
            if (useEditorInvalid || useProjectInvalid) {
                change = true;
                this.data.groups.splice(i, 1);
                log_1.default.red(`delete link invalid group:\n${JSON.stringify(group, null, 2)}`);
            }
            else {
                i++;
            }
        }
        if (change) {
            this.save();
        }
    }
    get ccpFileName() {
        return "cc-plugin.json";
    }
    ccpData() {
        const { V2, V3 } = this.data.ccp;
        return JSON.stringify({ v2: V2, v3: V3 }, null, 2);
    }
    ccpSet(v2, v3) {
        const ret = new const_1.Result();
        if (!(0, fs_1.existsSync)(v2)) {
            ret.failed(`not exists: ${v2}`);
            return ret;
        }
        if (!(0, fs_1.existsSync)(v3)) {
            ret.failed(`not exists: ${v3}`);
            return ret;
        }
        this.data.ccp.V2 = (0, util_1.toMyPath)(v2);
        this.data.ccp.V3 = (0, util_1.toMyPath)(v3);
        this.save();
        return ret;
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
        const result = new const_1.Result();
        let ret = this.data.groups.find(el => el.name === name);
        if (ret) {
            this.data.use.editor = ret.editor;
            this.data.use.project = ret.project;
            this.save();
            log_1.default.green(`change group ${name} successfully`);
            if (!this.data.ccp.enabled) {
                return result;
            }
            log_1.default.green(`sync ${this.ccpFileName}`);
            // 检查是否和cc-plugin的一致
            const fullPath = Path.join(process.cwd(), this.ccpFileName);
            if (!(0, fs_1.existsSync)(fullPath)) {
                log_1.default.green(`not exist: ${fullPath}`);
                return result;
            }
            let change = false, msg = "";
            const data = JSON.parse(Fs.readFileSync(fullPath, 'utf8'));
            if (ret.editor.startsWith('2') && data.hasOwnProperty('v2')) {
                data.v2 = (0, util_1.toMyPath)(ret.project);
                change = true;
                msg = `${this.ccpFileName} sync v2: ${ret.project}`;
            }
            if (ret.editor.startsWith('3') && data.hasOwnProperty('v3')) {
                data.v3 = (0, util_1.toMyPath)(ret.project);
                change = true;
                msg = `${this.ccpFileName} sync v3: ${ret.project}`;
            }
            if (!change) {
                log_1.default.yellow(`sync ${this.ccpFileName} nothing`);
                return result;
            }
            Fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
            log_1.default.green(msg);
            return result;
        }
        else {
            result.failed('无法找到组合配置项！');
        }
        return result;
    }
    removeGroup(name) {
        const result = new const_1.Result();
        const index = this.data.groups.findIndex(el => el.name === name);
        if (index === -1) {
            result.failed('未找到组合，删除失败');
        }
        else {
            this.data.groups.splice(index, 1);
            this.save();
        }
        return result;
    }
    format() {
        const { use, projects, groups, editors } = this.data;
        if (use.project) {
            use.project = (0, util_1.toMyPath)(use.project);
        }
        for (let i = 0; i < groups.length; i++) {
            groups[i].project = (0, util_1.toMyPath)(groups[i].project);
        }
        for (let i = 0; i < editors.length; i++) {
            editors[i].path = (0, util_1.toMyPath)(editors[i].path);
        }
        for (let i = 0; i < projects.length; i++) {
            projects[i] = (0, util_1.toMyPath)(projects[i]);
        }
        this.save();
    }
    setPort(port) {
        this.data.port = port || this.data.port;
        this.save();
    }
    setDebug(debug) {
        this.data.debug = !!debug;
        this.save();
    }
    enabledCCP(enabled) {
        this.data.ccp.enabled = !!enabled;
        log_1.default.green(!!this.data.ccp.enabled ? `启用${this.ccpFileName}支持` : `禁用${this.ccpFileName}支持`);
        this.save();
    }
    setBrk(brk) {
        this.data.brk = !!brk;
        log_1.default.green(!!this.data.brk ? '启用brk' : '禁用brk');
        this.save();
    }
    constructor() {
        this.data = new ConfigData();
        if (!FsExtra.existsSync(FilePath)) {
            FsExtra.writeJSONSync(FilePath, {});
        }
        this.data = Object.assign(this.data, FsExtra.readJSONSync(FilePath));
    }
    save() {
        FsExtra.writeJSONSync(FilePath, this.data, { spaces: 2 });
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
    _resetUseByEditor(editorName) {
        if (this.data.use.editor === editorName) {
            this.data.use.editor = "";
            this.data.use.project = "";
            log_1.default.blue(`reset link use.editor: ${editorName}`);
        }
    }
    _resetUseByProject(project) {
        if (this.data.use.project === project) {
            this.data.use.editor = "";
            this.data.use.project = "";
            log_1.default.blue(`reset link use.project: ${project}`);
        }
    }
    _deleteGroupByProject(project) {
        for (let i = 0; i < this.data.groups.length;) {
            const group = this.data.groups[i];
            if (group.project === project) {
                log_1.default.blue(`delete link editor group\n: ${JSON.stringify(group)}`);
                this.data.groups.splice(i, 1);
            }
            else {
                i++;
            }
        }
    }
    _deleteGroupByEditor(editor) {
        for (let i = 0; i < this.data.groups.length;) {
            const group = this.data.groups[i];
            if (group.editor === editor) {
                this.data.groups.splice(i, 1);
                log_1.default.blue(`delete link editor group\n: ${JSON.stringify(group)}`);
            }
            else {
                i++;
            }
        }
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
            this._resetUseByProject(projectPath);
            this._deleteGroupByProject(projectPath);
            this.save();
        }
        return { success, msg };
    }
    addProject(projectPath) {
        projectPath = (0, util_1.toMyPath)(projectPath);
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
        editorPath = (0, util_1.toMyPath)(editorPath);
        if (this.data.editors.find(el => el.name === name)) {
            return `重复的编辑器名字：${name}`;
        }
        if (!FsExtra.existsSync(editorPath)) {
            return `无效的编辑器路径: ${editorPath}`;
        }
        if (this.data.editors.find(el => el.path === editorPath)) {
            return `重复的编辑器路径：${editorPath}`;
        }
        this.data.editors.push({ name, path: editorPath });
        this.save();
        return '';
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
            this._resetUseByEditor(name);
            this._deleteGroupByEditor(name);
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
        const { project, editor } = this.data.use;
        // check project
        if (!(0, fs_1.existsSync)(project)) {
            return { success: false, msg: `不存在的项目：${project}，需要重新配置` };
        }
        // check editor
        const editorPath = this.getCurrentEditorPath();
        if (!editorPath || !(0, fs_1.existsSync)(editorPath)) {
            return { success: false, msg: `不存在的编辑器：${project}，需要重新配置` };
        }
        return { success, msg };
    }
}
exports.default = new Config();
//# sourceMappingURL=config.js.map