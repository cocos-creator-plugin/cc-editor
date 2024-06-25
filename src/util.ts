import log from './log';
import OS from 'os';
import Path, { join, normalize, sep } from 'path';
import plist from 'plist';
import Fs, { existsSync } from 'fs';
import VersionInfo from 'win-version-info'
import regedit from 'regedit'
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
export async function addOpen2ContextMenu() {
    await changeRegister('HKCR\\directory\\background\\shell\\cc-editor');
    await changeRegister('HKCR\\Folder\\shell\\cc-editor');
}
async function changeRegister(key: string) {
    const key_command = `${key}\\command`;
    const ret = await regedit.promisified.list([key, key_command])
    if (!ret[key].exists) {
        await regedit.promisified.createKey([key])
    }
    if (!ret[key_command].exists) {
        await regedit.promisified.createKey([key_command])
    }
    const icon = join(__dirname, '../doc/1.ico')
    const obj: any = {};
    obj[key] = {
        root: { type: "REG_DEFAULT", value: "cce open" },
        icon: { value: icon, type: "REG_SZ" }
    }
    const cmd = `"${join(__dirname, '../shell/cce-open.bat')}" %V`
    obj[key_command] = {
        root: { type: "REG_DEFAULT", value: cmd }
    }
    await regedit.promisified.putValue(obj)
}

export function sortByName(nameA: string, nameB: string): number {
    const arrayA = nameA.split(".");
    const arrayB = nameB.split(".");
    const len = Math.min(arrayA.length, arrayB.length);
    for (let i = 0; i < len; i++) {
        const a_name = arrayA[i];
        const b_name = arrayB[i];
        if (a_name === b_name) continue;

        const numA = parseFloat(a_name);
        const numB = parseFloat(b_name);
        if (isNaN(numA) || isNaN(numB)) {
            return a_name.localeCompare(b_name);
        } else {
            return numA - numB;
        }
    }
    return 0;
}