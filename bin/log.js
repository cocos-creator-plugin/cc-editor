"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require('chalk');
exports.default = {
    green(str) {
        console.log(chalk.green(str || ''));
    },
    red(str) {
        console.log(chalk.red(str || ''));
    },
    blue(str) {
        console.log(chalk.blue(str || ''));
    }
};
