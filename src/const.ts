import log from "./log";

export class Result {
    success: boolean = true;
    msg: string = '';
    failed(msg: string): Result {
        this.success = false;
        this.msg = msg;
        return this;
    }
    log(): Result {
        if (!this.success) {
            log.red(this.msg)
        }
        return this;
    }
}