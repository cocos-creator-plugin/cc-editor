import Execa from 'execa'
import OS from 'os'
import Config from './config'
import * as  Path from 'path'
import log from './log'
import open from 'open'
import plist from 'plist'
import * as Fs from 'fs'

export default () => {
    const { project } = Config.data.use;
    const { debug, port, brk } = Config.data;
    const rootPath = Config.getCurrentEditorPath();
    let editorPath = rootPath;
    let version = '2.4.7';
    if (rootPath && OS.platform() === 'darwin') {
        editorPath = Path.join(rootPath, 'Contents/MacOS/CocosCreator')
        const plistFile = Path.join(rootPath, 'Contents/Info.plist');
        const ret = plist.parse(Fs.readFileSync(plistFile, 'utf-8'))
        if (ret) {
            // @ts-ignore
            version = ret.CFBundleVersion || ret.CFBundleShortVersionString;
        }
    } else {
        // todo windows
    }
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
