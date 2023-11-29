import log from './log';
import OS from 'os';
import Path, { normalize, sep } from 'path';
import plist from 'plist';
import Fs from 'fs';
import VersionInfo from 'win-version-info'

function isMac() {
    return OS.platform() === 'darwin'
}

export function logFailed(ret: { success: boolean, msg: string }) {
    if (!ret.success) {
        log.red(ret.msg || '');
    }
}

export function getEditorRealExecutePath(rootPath: string) {
    const state = Fs.statSync(rootPath);
    if (state.isDirectory()) {
        if (isMac()) {
            return Path.join(rootPath, 'Contents/MacOS/CocosCreator')
        } else {
            return Path.join(rootPath, 'CocosCreator.exe')
        }
    } else {
        return rootPath;
    }
}

export function getEditorVersion(rootPath: string) {
    let version = '2.4.7';
    if (!rootPath) {
        return version;
    }
    if (isMac()) {
        const plistFile = Path.join(rootPath, 'Contents/Info.plist');
        const ret = plist.parse(Fs.readFileSync(plistFile, 'utf-8'))
        if (ret) {
            // @ts-ignore
            version = ret.CFBundleVersion || ret.CFBundleShortVersionString;
        }
    } else {
        // 1. 生成专门的exe，然后使用child_process获取信息
        // 2. 使用node-gyp
        const exePath = getEditorRealExecutePath(rootPath)
        version = VersionInfo(exePath).FileVersion || version;
    }
    return version;
}
export function toMyPath(v: string): string {
    return normalize(v).split(sep).join('/');
}