const chalk = require('chalk')
module.exports = {
    green (str) {
        console.log(chalk.green(str || ''))
    },
    red (str) {
        console.log(chalk.red(str || ''))
    },
    blue (str) {
        console.log(chalk.blue(str || ''))
    }
}
