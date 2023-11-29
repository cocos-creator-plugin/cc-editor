"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
const log_1 = __importDefault(require("./log"));
class Result {
    constructor() {
        this.success = true;
        this.msg = '';
    }
    failed(msg) {
        this.success = false;
        this.msg = msg;
    }
    log() {
        if (!this.success) {
            return log_1.default.red(this.msg);
        }
    }
}
exports.Result = Result;
//# sourceMappingURL=const.js.map