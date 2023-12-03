const chalk = require('chalk')
export default {
    green(str: string) {
        console.log(chalk.green(str || ''))
    },
    red(str: string) {
        console.log(chalk.red(str || ''))
    },
    blue(str?: string) {
        console.log(chalk.blue(str || ''))
    },
    yellow(str?: string) {
        console.log(chalk.yellow(str || ''))
    }
}
