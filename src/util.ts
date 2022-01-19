import log from './log';
import OS from 'os';
import Path from 'path';
import plist from 'plist';
import Fs from 'fs';

function isMac() {
    return OS.platform() === 'darwin'
}

export function logFailed(ret: { success: boolean, msg: string }) {
    if (!ret.success) {
        log.red(ret.msg || '');
    }
}

export function getEditorRealPath(rootPath: string) {
    if (isMac()) {
        return Path.join(rootPath, 'Contents/MacOS/CocosCreator')
    } else {
        // todo 适配Windows
    }
    return  rootPath;
}

export function getEditorVersion(rootPath: string) {
    let version = '2.4.7';
    if (rootPath && isMac()) {
        const plistFile = Path.join(rootPath, 'Contents/Info.plist');
        const ret = plist.parse(Fs.readFileSync(plistFile, 'utf-8'))
        if (ret) {
            // @ts-ignore
            version = ret.CFBundleVersion || ret.CFBundleShortVersionString;
        }
    } else {
        // todo windows
    }
    return version;
}
