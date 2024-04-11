import Execa from 'execa';
import OS from 'os';
import Config from './config';
import * as  Path from 'path';
import log from './log';
import open from 'open';
import plist from 'plist';
import * as Fs from 'fs';
import { getEditorRealExecutePath, getEditorVersion } from './util';
import { exec } from 'child_process';

export function Run() {
    const { project } = Config.data.use;
    const rootPath = Config.getCurrentEditorPath();
    openProject(rootPath, project);
}
export function openProject(editor: string | null, project: string) {
    if (!editor) {
        return;
    }
    const { debug, port, brk } = Config.data;
    const editorPath = getEditorRealExecutePath(editor);
    let version = getEditorVersion(editor);
    const projectParam = version.startsWith('2.') ? 'path' : 'project';
    let cmd = `${editorPath} --nologin --${projectParam} ${project}`;
    if (debug) {
        if (brk) {
            cmd += ` --inspect-brk=${port}`;
        } else {
            cmd += ` --inspect=${port}`;
        }
    }
    log.blue(cmd);
    const ret = OS.platform() === 'win32' ? exec(cmd) : Execa.command(cmd);
    ret.stdout?.on('data', (data) => {
        console.log(data.toString());
    });
    if (debug) {
        const url = 'chrome://inspect/#devices';
        log.green(`请使用chrome浏览器打开： ${url}`);
        log.green(`在Configure增加配置 localhost:${port}`);
        const tutorials = 'https://juejin.cn/post/7047050908865134628/';
        log.green(`详细教程: ${tutorials}`);
        // open(url)// chrome限制，无法打开
    }
}
