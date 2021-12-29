const OS = require('os')
const Path = require('path')
const FsExtra = require('fs-extra');
const OsEnv = require('osenv')
const FilePath = Path.join(OsEnv.home(), 'cc-editor.json')
const log = require('./log')

class Config {
    data = {
        editors: [
            // { name: '1', path: '' }
        ],
        projects: [],
        use: {
            editor: '',
            project: '',
        },
        debug: true,
        brk: false,
        port: 2021,
    }

    setPort (port) {
        this.data.port = port || this.data.port;
        this.save();
    }

    setDebug (debug) {
        this.data.debug = !!debug;
        this.save();
    }

    setBrk (brk) {
        this.data.brk = !!brk;
        this.save();
    }

    constructor () {
        if (!FsExtra.existsSync(FilePath)) {
            FsExtra.writeJSONSync(FilePath, {});
        }
        this.data = Object.assign(this.data, FsExtra.readJSONSync(FilePath));
    }

    save () {
        FsExtra.writeJSONSync(FilePath, this.data)
    }

    getCurrentEditorPath () {
        const { project, editor } = this.data.use;
        const ret = this.data.editors.find(el => el.name === editor)
        if (ret.path) {
            return ret.path || null;
        }
        return null;
    }

    useProject (project) {
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

    useEditor (name) {
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

    addProject (projectPath) {
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

    addEditor (name, editorPath) {
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

    log () {
        log.blue(`config file path: ${FilePath}`)
        log.green(JSON.stringify(this.data, null, 2))
    }

    checkRun () {
        let success = true, msg = '';
        return { success, msg }
    }
}

module.exports = new Config();
