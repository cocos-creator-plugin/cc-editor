import log from './log';

export function logFailed(ret: { success: boolean, msg: string }) {
    if (!ret.success) {
        log.red(ret.msg || '');
    }
}
