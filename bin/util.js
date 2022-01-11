"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFailed = void 0;
const log_1 = __importDefault(require("./log"));
function logFailed(ret) {
    if (!ret.success) {
        log_1.default.red(ret.msg || '');
    }
}
exports.logFailed = logFailed;
