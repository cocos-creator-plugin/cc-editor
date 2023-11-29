import log from "./log";

export class Result {
    success: boolean = true;
    msg: string = '';
    failed(msg: string) {
        this.success = false;
        this.msg = msg;
    }
    log() {
        if (!this.success) {
            return log.red(this.msg)
        }
    }
}