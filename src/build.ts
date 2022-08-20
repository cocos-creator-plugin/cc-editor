import Config from './config';
import { getEditorRealExecutePath, getEditorVersion } from './util';
import log from './log';
import Execa from 'execa';
import * as  FsExtra from 'fs-extra'
import * as Path from 'path';
import * as Fs from 'fs';

export default () => {
    const { use, buildAfter } = Config.data;
    log.green(`编辑器：${use.editor}`)
    log.green(`项目：${use.project}`)
    const rootPath = Config.getCurrentEditorPath();
    if (!rootPath) {
        return;
    }
    const editorPath = getEditorRealExecutePath(rootPath);
    let version = getEditorVersion(rootPath);
    const projectParam = version.startsWith('2.') ? 'path' : 'project'

    // todo 后续开放platform的配置
    const platform = 'web-mobile';
    let cmd = `${editorPath} --${projectParam} ${use.project} --build "platform=${platform};debug=true;"`;

    log.blue(cmd)


    function doCopy() {
        let buildResult = Path.join(use.project, 'build', platform);
        if (!Fs.existsSync(buildResult)) {
            console.log('未找到构建结果，无法执行后续任务');
            return;
        }
        const copy = buildAfter?.copyTo;
        if (copy && Array.isArray(copy)) {
            for (let i = 0; i < copy.length; i++) {
                let item = copy[i]
                if (Fs.existsSync(item)) {
                    FsExtra.copySync(buildResult, item, {
                        filter: (src, dest) => {
                            //  不拷贝的文件
                            const relative = Path.relative(buildResult, src);
                            let isIn = ['index.html'].find(el => el === relative);
                            return !isIn;
                        }
                    })
                    console.log(`copy to : ${item}`)
                } else {
                    console.log(`skip copy : ${item}`)
                }
            }
        }
    }

    const ret = Execa.command(cmd);
    ret.stdout?.on('data', (data) => {
        console.log(data.toString())
    })
    ret.on('exit', () => {
        doCopy();
    })
}
