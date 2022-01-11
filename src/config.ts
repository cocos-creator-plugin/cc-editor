import OS from 'os'
import * as Path from 'path'
import * as FsExtra from 'fs-extra'
import OsEnv from 'osenv'
import log from './log'

const FilePath = Path.join(OsEnv.home(), 'cc-editor.json')

class ConfigData {
    editors: Array<{ name: string, path: string }> = [];
    projects: string[] = [];
    use: { editor: string, project: string } = {
        editor: '',
        project: '',
    }
    debug: boolean = true;
    brk: boolean = false;
    port: number = 2021;
}


class Config {
    data: ConfigData = new ConfigData();

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
        FsExtra.writeJSONSync(FilePath, this.data)
    }

    getCurrentEditorPath():string|null {
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

    removeProject(projectPath: string) {
        let success = true, msg = '';
        const index = this.data.projects.findIndex(el => el === projectPath)
        if (index === -1) {
            success = false;
            msg = '未找到项目配置，删除失败 ';
        } else {
            this.data.projects.splice(index, 1);
        }
        return { success, msg };
    }

    addProject(projectPath: string) {
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

    addEditor(name: string, editorPath: string) {
        let success = true, msg = '';
        if (FsExtra.existsSync(editorPath)) {
            if (!this.data.editors.find(el => el.path === editorPath)) {
                this.data.editors.push({ name, path: editorPath })
                this.save();
            }
        } else {
            success = false;
            msg = `无效的路径: ${editorPath}`
        }
        return { success, msg };
    }

    log() {
        log.blue(`config file path: ${FilePath}`)
        log.green(JSON.stringify(this.data, null, 2))
    }

    checkRun() {
        let success = true, msg = '';
        return { success, msg }
    }
}

export default   new Config();
