import OS from 'os'
import * as Path from 'path'
import * as FsExtra from 'fs-extra'
import OsEnv from 'osenv'
import log from './log'
import * as Fs from 'fs';
import { existsSync } from 'fs'
import { toMyPath } from './util'
import { Result } from './const'

const FilePath = toMyPath(Path.join(OsEnv.home(), 'cc-editor.json'))

export interface Group {
    /**
     * 组的名字
     */
    name: string;
    /**
     * 组使用的编辑器别名
     */
    editor: string;
    /**
     * 组使用的项目路径
     */
    project: string;
}
/**
 * 因为commander的原因，默认返回的变量是大写，所以这种统一了一下，但是写入到json统一使用的是小写
 * 这里没必要和cc-plugin的数据结构一致
 */
export interface CCP_Json {
    /**
     * 是否影响cc-plugin
     */
    enabled: boolean;
    /**
     * cc-plugin输出creator v2版本的项目目录
     */
    V2: string;
    /**
     * cc-plugin输出creator v3版本的项目目录
     */
    V3: string;
    /**
     * cc-plugin输出chrome扩展的目录，chrome可以加载这个目录下的扩展
     */
    Chrome: string;
}
class ConfigData {
    editors: Array<{ name: string, path: string }> = [];
    projects: string[] = [];
    use: { editor: string, project: string } = {
        editor: '',
        project: '',
    };
    groups: Array<Group> = [];
    debug: boolean = true;
    brk: boolean = false;
    port: number = 2021;
    ccp: CCP_Json = { V2: '', V3: '', Chrome: '', enabled: false };
    buildAfter: { copyTo: string[] } = {
        copyTo: [],
    }
}


class Config {
    data: ConfigData = new ConfigData();

    restInvalidConfig() {
        let change = false;
        // 检查编辑器是否有效
        const invalidEditors: { name: string, path: string }[] = [];
        let { editors, projects } = this.data;
        for (let i = 0; i < editors.length;) {
            const editor = editors[i];
            if (!existsSync(editor.path)) {
                change = true;
                log.red(`find invalid editor: ${JSON.stringify(editor)}`)
                invalidEditors.push(editor);
                this.data.editors.splice(i, 1);
            } else {
                i++;
            }
        }
        // 检查项目是否有效
        const invalidProjects: string[] = []
        for (let i = 0; i < projects.length;) {
            const project = projects[i];
            if (!existsSync(project)) {
                change = true;
                log.red(`find invalid project:${project}`)
                invalidProjects.push(project);
                this.data.projects.splice(i, 1);
            } else {
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
            log.red(`reset link use editor&project`);
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
                log.red(`delete link invalid group:\n${JSON.stringify(group, null, 2)}`)
            } else {
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
    ccpData(): string {
        const { V2, V3, Chrome } = this.data.ccp;
        return JSON.stringify({ v2: V2, v3: V3, chrome: Chrome }, null, 2);
    }
    ccpSet(v2: string, v3: string, chrome: string): Result {
        const ret = new Result();
        if (!existsSync(v2)) {
            ret.failed(`not exists: ${v2}`);
            return ret;
        }
        if (!existsSync(v3)) {
            ret.failed(`not exists: ${v3}`);
            return ret;
        }
        this.data.ccp.V2 = toMyPath(v2);
        this.data.ccp.V3 = toMyPath(v3);
        this.data.ccp.Chrome = toMyPath(chrome);
        this.save();
        return ret;
    }
    addGroup(name: string, editor: string, project: string): Result {
        const result = new Result();
        if (!this.data.groups.find(el => el.name === name)) {
            this.data.groups.push({
                name,
                editor,
                project,
            })
            this.save();
        } else {
            result.failed(`已经存在组合[${name}]`)
        }
        return result;
    }

    useGroup(name: string) {
        const result = new Result();
        let ret = this.data.groups.find(el => el.name === name)
        if (ret) {
            this.data.use.editor = ret.editor;
            this.data.use.project = ret.project;
            this.save();
            log.green(`change group ${name} successfully`);

            if (!this.data.ccp.enabled) {
                return result;
            }
            log.green(`sync ${this.ccpFileName}`);
            // 检查是否和cc-plugin的一致
            const fullPath = Path.join(process.cwd(), this.ccpFileName);
            if (!existsSync(fullPath)) {
                log.green(`not exist: ${fullPath}`)
                return result;
            }
            let change = false, msg = "";
            const data = JSON.parse(Fs.readFileSync(fullPath, 'utf8'));
            if (ret.editor.startsWith('2') && data.hasOwnProperty('v2')) {
                data.v2 = toMyPath(ret.project);
                change = true;
                msg = `${this.ccpFileName} sync v2: ${ret.project}`;
            }
            if (ret.editor.startsWith('3') && data.hasOwnProperty('v3')) {
                data.v3 = toMyPath(ret.project);
                change = true;
                msg = `${this.ccpFileName} sync v3: ${ret.project}`;
            }
            if (!change) {
                log.yellow(`sync ${this.ccpFileName} nothing`);
                return result;
            }
            Fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
            log.green(msg);
            return result;
        } else {
            result.failed('无法找到组合配置项！');
        }
        return result;
    }

    removeGroup(name: string): Result {
        const result = new Result();
        const index = this.data.groups.findIndex(el => el.name === name);
        if (index === -1) {
            result.failed('未找到组合，删除失败');
        } else {
            this.data.groups.splice(index, 1);
            this.save();
        }
        return result;
    }
    format() {
        const { use, projects, groups, editors } = this.data;
        if (use.project) {
            use.project = toMyPath(use.project);
        }
        for (let i = 0; i < groups.length; i++) {
            groups[i].project = toMyPath(groups[i].project);
        }
        for (let i = 0; i < editors.length; i++) {
            editors[i].path = toMyPath(editors[i].path);
        }
        for (let i = 0; i < projects.length; i++) {
            projects[i] = toMyPath(projects[i])
        }
        this.save();
    }
    setPort(port: number) {
        this.data.port = port || this.data.port;
        this.save();
    }

    setDebug(debug: boolean) {
        this.data.debug = !!debug;
        this.save();
    }
    enabledCCP(enabled: boolean) {
        this.data.ccp.enabled = !!enabled;
        log.green(!!this.data.ccp.enabled ? `启用${this.ccpFileName}支持` : `禁用${this.ccpFileName}支持`);
        this.save();
    }
    setBrk(brk: boolean) {
        this.data.brk = !!brk;
        log.green(!!this.data.brk ? '启用brk' : '禁用brk')
        this.save();
    }

    constructor() {
        if (!FsExtra.existsSync(FilePath)) {
            FsExtra.writeJSONSync(FilePath, {});
        }
        this.data = Object.assign(this.data, FsExtra.readJSONSync(FilePath));
    }

    save() {
        FsExtra.writeJSONSync(FilePath, this.data, { spaces: 2 })
    }

    getCurrentEditorPath(): string | null {
        const { project, editor } = this.data.use;
        return this.getEditorPath(editor);
    }
    getEditorPath(editor: string): string | null {
        const ret = this.data.editors.find(el => el.name === editor)
        if (ret && ret.path) {
            return ret.path || null;
        }
        return null;
    }

    useProject(project: string): Result {
        let success = true, msg = '';
        const result = new Result()
        if (FsExtra.existsSync(project)) {
            this.data.use.project = project
            this.save();
        } else {
            result.failed(`无法使用${name}，路径无效:${project}`);
        }
        return result;
    }

    useEditor(name: string): Result {
        const result = new Result();
        let success = true, msg = '';
        const ret = this.data.editors.find(el => el.name === name);
        if (ret) {
            if (FsExtra.existsSync(ret.path)) {
                this.data.use.editor = name;
                this.save();
            } else {
                result.failed(`无法使用${name}，路径无效:${ret.path}`);
            }
        } else {
            result.failed(`无效的配置：${name}`)
        }
        return result;
    }
    private _resetUseByEditor(editorName: string) {
        if (this.data.use.editor === editorName) {
            this.data.use.editor = "";
            this.data.use.project = "";
            log.blue(`reset link use.editor: ${editorName}`)
        }
    }
    private _resetUseByProject(project: string) {
        if (this.data.use.project === project) {
            this.data.use.editor = "";
            this.data.use.project = "";
            log.blue(`reset link use.project: ${project}`)
        }
    }
    private _deleteGroupByProject(project: string) {
        for (let i = 0; i < this.data.groups.length;) {
            const group = this.data.groups[i];
            if (group.project === project) {
                log.blue(`delete link editor group\n: ${JSON.stringify(group)}`)
                this.data.groups.splice(i, 1);
            } else {
                i++;
            }
        }
    }
    private _deleteGroupByEditor(editor: string) {
        for (let i = 0; i < this.data.groups.length;) {
            const group = this.data.groups[i];
            if (group.editor === editor) {
                this.data.groups.splice(i, 1);
                log.blue(`delete link editor group\n: ${JSON.stringify(group)}`)
            } else {
                i++;
            }
        }
    }
    removeProject(projectPath: string): Result {
        const result = new Result();
        const index = this.data.projects.findIndex(el => el === projectPath)
        if (index === -1) {
            result.failed('未找到项目配置，删除失败 ');
        } else {
            this.data.projects.splice(index, 1);
            if (this.data.use.project === projectPath) {
                this.data.use.project = '';
            }
            this._resetUseByProject(projectPath);
            this._deleteGroupByProject(projectPath);
            this.save();
        }
        return result;
    }

    addProject(projectPath: string): Result {
        projectPath = toMyPath(projectPath)
        const result: Result = new Result();
        if (FsExtra.existsSync(projectPath)) {
            if (!this.data.projects.find(el => el === projectPath)) {
                this.data.projects.push(projectPath);
                this.save();
            }
        } else {
            result.failed(`无效的路径: ${projectPath}`)
        }
        return result;
    }

    addEditor(name: string, editorPath: string): Result {
        const result = new Result();
        if (!name) {
            return result.failed(`编辑器别名不能为空`);
        }
        editorPath = toMyPath(editorPath)
        if (this.data.editors.find(el => el.name === name)) {
            return result.failed(`重复的编辑器名字：${name}`);
        }
        if (!FsExtra.existsSync(editorPath)) {
            return result.failed(`无效的编辑器路径: ${editorPath}`)
        }
        if (this.data.editors.find(el => el.path === editorPath)) {
            return result.failed(`重复的编辑器路径：${editorPath}`)
        }
        this.data.editors.push({ name, path: editorPath })
        this.save();
        return result;
    }

    removeEditor(name: string): Result {
        const ret = new Result()
        const index = this.data.editors.findIndex(el => el.name === name);
        if (index === -1) {
            ret.failed('未找到编辑器配置，删除失败');
        } else {
            this.data.editors.splice(index, 1)
            this._resetUseByEditor(name);
            this._deleteGroupByEditor(name);
            this.save();
        }
        return ret;
    }

    addBuildCopyDir(dir: string) {
        let success = true, msg = '';
        if (Fs.existsSync(dir)) {
            this.data.buildAfter.copyTo.push(dir);
            this.save();
        } else {
            success = false;
            msg = `copy目录不存在: ${dir}`
        }
        return { success, msg };
    }

    removeBuildCopyDir(dir: string): Result {
        const result = new Result();
        let index = this.data.buildAfter.copyTo.findIndex(el => el === dir);
        if (index !== -1) {
            this.data.buildAfter.copyTo.splice(index, 1);
            this.save();
        }
        return result;
    }

    log() {
        log.blue(`config file path: ${FilePath}`)
        log.green(JSON.stringify(this.data, null, 2))
    }

    checkRun() {
        let success = true, msg = '';
        const { project, editor } = this.data.use;
        // check project
        if (!existsSync(project)) {
            return { success: false, msg: `不存在的项目：${project}，需要重新配置` }
        }

        // check editor
        const editorPath = this.getCurrentEditorPath()
        if (!editorPath || !existsSync(editorPath)) {
            return { success: false, msg: `不存在的编辑器：${project}，需要重新配置` }
        }
        return { success, msg }
    }
}

export default new Config();
