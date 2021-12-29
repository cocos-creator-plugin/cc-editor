const Execa = require('execa')
const OS = require('os')
const Config = require('./config')
const Path = require('path')
const log = require('./log')
const open = require('open')
module.exports = () => {
    const { project } = Config.data.use;
    const { debug, port, brk } = Config.data;
    let editorPath = Config.getCurrentEditorPath();
    if (OS.platform() === 'darwin') {
        editorPath = Path.join(editorPath, 'Contents/MacOS/CocosCreator')
    }
    // todo 有的版本是--path， 有的版本是project
    let cmd = `${editorPath} --path ${project}`
    if (debug) {
        if (brk) {
            cmd += ` --inspect-brk=${port}`
        } else {
            cmd += ` --inspect=${port}`
        }
    }
    log.blue(cmd)
    const ret = Execa.command(cmd)
    ret.stdout.on('data', (data) => {
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
