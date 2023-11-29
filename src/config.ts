import OS from 'os'
import * as Path from 'path'
import * as FsExtra from 'fs-extra'
import OsEnv from 'osenv'
import log from './log'
import * as Fs from 'fs';
import { existsSync } from 'fs'
import { toMyPath } from './util'

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
    addGroup(name: string, editor: string, project: string) {
        let success = true, msg = '';
        if (!this.data.groups.find(el => el.name === name)) {
            this.data.groups.push({
                name,
                editor,
                project,
            })
            this.save();
        } else {
            success = false
            msg = `已经存在组合[${name}]`
        }
        return { success, msg };
    }

    useGroup(name: string) {
        let success = true, msg = '';
        let ret = this.data.groups.find(el => el.name === name)
        if (ret) {
            this.data.use.editor = ret.editor;
            this.data.use.project = ret.project;
            this.save();
        } else {
            success = false;
            msg = '无法找到组合配置项！'
        }
        return { success, msg };
    }

    removeGroup(name: string) {
        let success = true, msg = '';

        const index = this.data.groups.findIndex(el => el.name === name);
        if (index === -1) {
            success = false;
            msg = '未找到组合，删除失败'
        } else {
            this.data.groups.splice(index, 1);
            this.save();
        }
        return { success, msg };
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
        const ret = this.data.editors.find(el => el.name === editor)
        if (ret && ret.path) {
            return ret.path || null;
        }
        return null;
    }

    useProject(project: string) {
        let success = true, msg = '';
        if (FsExtra.existsSync(project)) {
            this.data.use.project = project
            this.save();
        } else {
            success = false;
            msg = `无法使用${name}，路径无效:${project}`;
        }
        return { success, msg };
    }

    useEditor(name: string) {
        let success = true, msg = '';
        const ret = this.data.editors.find(el => el.name === name);
        if (ret) {
            if (FsExtra.existsSync(ret.path)) {
                this.data.use.editor = name;
                this.save();
            } else {
                success = false;
                msg = `无法使用${name}，路径无效:${ret.path}`;
            }
        } else {
            success = false;
            msg = `无效的配置：${name}`;
        }
        return { success, msg };
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
    removeProject(projectPath: string) {
        let success = true, msg = '';
        const index = this.data.projects.findIndex(el => el === projectPath)
        if (index === -1) {
            success = false;
            msg = '未找到项目配置，删除失败 ';
        } else {
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

    addProject(projectPath: string) {
        projectPath = toMyPath(projectPath)
        let success = true, msg = '';
        if (FsExtra.existsSync(projectPath)) {
            if (!this.data.projects.find(el => el === projectPath)) {
                this.data.projects.push(projectPath);
                this.save();
            }
        } else {
            success = false;
            msg = `无效的路径: ${projectPath}`
        }
        return { success, msg };
    }

    addEditor(name: string, editorPath: string): string {
        editorPath = toMyPath(editorPath)
        if (this.data.editors.find(el => el.name === name)) {
            return `重复的编辑器名字：${name}`
        }
        if (!FsExtra.existsSync(editorPath)) {
            return `无效的编辑器路径: ${editorPath}`
        }
        if (this.data.editors.find(el => el.path === editorPath)) {
            return `重复的编辑器路径：${editorPath}`;
        }
        this.data.editors.push({ name, path: editorPath })
        this.save();
        return '';
    }

    removeEditor(name: string) {
        let success = true, msg = '';
        const index = this.data.editors.findIndex(el => el.name === name);
        if (index === -1) {
            success = false;
            msg = '未找到编辑器配置，删除失败';
        } else {
            this.data.editors.splice(index, 1)
            this._resetUseByEditor(name);
            this._deleteGroupByEditor(name);
            this.save();
        }
        return { success, msg };
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

    removeBuildCopyDir(dir: string) {
        let index = this.data.buildAfter.copyTo.findIndex(el => el === dir);
        if (index !== -1) {
            this.data.buildAfter.copyTo.splice(index, 1);
            this.save();
        }
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
