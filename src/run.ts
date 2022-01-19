import Execa from 'execa'
import OS from 'os'
import Config from './config'
import * as  Path from 'path'
import log from './log'
import open from 'open'
import plist from 'plist'
import * as Fs from 'fs'
import { getEditorRealPath, getEditorVersion } from './util';

export default () => {
    const { project } = Config.data.use;
    const { debug, port, brk } = Config.data;
    const rootPath = Config.getCurrentEditorPath();
    if (!rootPath) {
        return;
    }
    const editorPath = getEditorRealPath(rootPath);
    let version = getEditorVersion(rootPath);
    const projectParam = version.startsWith('2.') ? 'path' : 'project'
    let cmd = `${editorPath} --${projectParam} ${project}`
    if (debug) {
        if (brk) {
            cmd += ` --inspect-brk=${port}`
        } else {
            cmd += ` --inspect=${port}`
        }
    }
    log.blue(cmd)
    const ret = Execa.command(cmd)
    ret.stdout?.on('data', (data) => {
        console.log(data.toString())
    })
    if (debug) {
        const url = 'chrome://inspect/#devices';
        log.green(`请使用chrome浏览器打开： ${url}`);
        log.green(`在Configure增加配置 localhost:${port}`)
        const tutorials = 'https://juejin.cn/post/7047050908865134628/'
        log.green(`详细教程: ${tutorials}`)
        // open(url)// chrome限制，无法打开
    }
}
