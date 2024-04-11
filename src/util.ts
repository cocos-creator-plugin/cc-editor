import log from './log';
import OS from 'os';
import Path, { join, normalize, sep } from 'path';
import plist from 'plist';
import Fs, { existsSync } from 'fs';
import VersionInfo from 'win-version-info'

function isMac() {
    return OS.platform() === 'darwin'
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
    if (v) {
        return normalize(v).split(sep).join('/');
    } else {
        return "";
    }
}

export function isCreatorProject(dir: string): boolean {
    const assets = join(dir, 'assets');
    return !!existsSync(assets);
}
export function getCreatorProjectVersion(dir: string): string | null {
    const cfg = [
        {
            file: "project.json",
            getVersion: (data: Record<string, any>) => {
                return data.version || null;
            }
        },
        {
            file: 'package.json',
            getVersion: (data: Record<string, any>) => {
                if (data.creator && data.creator.version) {
                    return data.creator.version;
                }
                return data.version || null;
            }
        }
    ]
    for (let i = 0; i < cfg.length; i++) {
        const { file, getVersion } = cfg[i];
        const flagFile = join(dir, file);
        if (!Fs.existsSync(flagFile)) {
            continue;
        }
        try {
            const data = JSON.parse(Fs.readFileSync(flagFile, "utf-8"));
            return getVersion(data);
        } catch (e) {
            console.log(e);
        }
    }
    return null;
}
export function isNumber(str: string) {
    return /^\d+$/.test(str);
}