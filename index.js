#! /usr/bin/env node
const Fs = require('fs')
const { program } = require('commander');
const Config = require('./config');
const chalk = require('chalk')
const log = require('./log')
const Run =require('./run')
program
    .version('0.0.1')
    .allowUnknownOption(true)

program.command('set-port')
    .argument('port', '调试端口')
    .action((port) => {
        try {
            port = parseInt(port)
        } catch (e) {
            port = 0;
        }
        Config.setPort(port)
    })

program.command('set-debug')
    .argument('debug', '开启主进程调试')
    .action((debug) => {
        Config.setDebug(debug.toLowerCase() === 'true')
    })
program.command('set-brk')
    .argument('brk', '是否在启动后断点')
    .action((brk) => {
        Config.setBrk(brk.toLowerCase() === 'true');
    })

program.command('add-project')
    .description('添加项目路径')
    .argument('project-path', '项目路径')
    .action((projectPath) => {
        const ret = Config.addProject(projectPath);
        if (!ret.success) {
            log.red(ret.msg);
        }
    })
program.command('add-editor')
    .description('添加编辑器路径')
    .argument('editor-name', '编辑器名字')
    .argument('editor-path', '编辑器路径')
    .action((name, editorPath) => {
        const ret = Config.addEditor(name, editorPath);
        if (!ret.success) {
            log.red(ret.msg)
        }
    })
program.command('use-editor')
    .description('使用本地指定的配置')
    .action(() => {
        const choices = Config.data.editors.map(editor => {
            return {
                name: editor.name,
                value: editor.name,
            }
        })
        if (choices.length > 0) {
            const inquirer = require('inquirer');
            inquirer.prompt([
                {
                    name: 'name',
                    message: '请选择使用的Creator版本',
                    type: 'list',
                    choices,
                }
            ]).then(ans => {
                const ret = Config.useEditor(ans.name)
                if (!ret.success) {
                    console.log(ret.msg)
                }
            });
        } else {
            log.red(`请先添加编辑器路径: add-editor`)
        }
    })

program.command('use-project')
    .description('使用的项目')
    .action(() => {
        const choices = Config.data.projects.map(project => {
            return {
                name: project,
                value: project,
            }
        })
        if (choices.length > 0) {
            const inquirer = require('inquirer');
            inquirer.prompt([
                {
                    name: 'name',
                    message: '请选择使用的项目',
                    type: 'list',
                    choices,
                }
            ]).then(ans => {
                const ret = Config.useProject(ans.name)
                if (!ret.success) {
                    console.log(ret.msg)
                }
            });
        } else {
            log.red(`请先添加项目路径： add-project `)
        }
    })


program.command('list')
    .description('列出所有可用版本')
    .action(() => {
        const printf = require('printf')
        const { editors, projects, use } = Config.data
        log.blue()
        log.blue('-- editor --');
        editors.forEach(el => {
            const curFlag = use.editor === el.name ? '*' : '';
            log.blue(printf('%-2s %-10s %-s', curFlag, el.name, el.path))
        })

        log.blue()
        log.blue('-- project --')
        projects.forEach(el => {
            const curFlag = use.project === el ? '*' : '';
            log.blue(printf('%-2s %-10s', curFlag, el))
        })
        log.blue()
    });
program.command('config')
    .description('显示配置文件的数据')
    .action(() => {
        Config.log();
    })

program.command('run')
    .description('启动运行编辑器')
    .action(() => {
        const ret = Config.checkRun();
        if (!ret.success) {
            return log.red(ret.msg)
        }
        Run()
    })


program.parse(process.argv);


