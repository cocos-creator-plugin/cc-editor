#! /usr/bin/env node
import { getEditorChoice, getGroupChoice, getProjectChoice } from "./choice"

import * as Fs from 'fs'
import { program } from 'commander'
import Config from './config'
import chalk from 'chalk'
import log from './log'
import Run from './run'
import  inquirer = require('inquirer')
import { logFailed } from './util';

program
    .version('0.0.1')
    .allowUnknownOption(true)

program.command('set-port')
    .argument('port', '调试端口')
    .action((port: string) => {
        let p = 0;
        try {
            p = parseInt(port)
        } catch (e) {
            p = 0;
        }
        Config.setPort(p)
    })

program.command('set-debug')
    .argument('debug', '开启主进程调试')
    .action((debug: string) => {
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
    .action((projectPath: string) => {
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
program.command('add-group')
    .description('将当前使用的的配置保存为一个组合，供下次使用')
    .argument('name', '组合的名字')
    .action((name: string) => {
        getEditorChoice({
            askMsg: '请选择要组合的编辑器',
            onChoice: (editor) => {
                getProjectChoice({
                    askMsg: '请选择要组合的项目',
                    onChoice: (project) => {
                        let ret = Config.addGroup(name, editor.name, project.name)
                        if (!ret.success) {
                            return log.red(ret.msg)
                        }
                    }
                })
            }
        })
    })
program.command('use-editor')
    .description('使用本地指定的配置')
    .action(() => {
        getEditorChoice({
            askMsg: '请选择使用的Creator版本',
            noChoice() {
                log.red(`请先添加编辑器路径: add-editor`)

            },
            onChoice: (ans) => {
                const ret = Config.useEditor(ans.name)
                if (!ret.success) {
                    console.log(ret.msg)
                }
            }
        })
    })

program.command('use-project')
    .description('使用的项目')
    .action(() => {
        getProjectChoice({
            askMsg: '请选择使用的项目',
            noChoice() {
                log.red(`请先添加项目路径： add-project `)
            },
            onChoice: (ans) => {
                const ret = Config.useProject(ans.name)
                if (!ret.success) {
                    console.log(ret.msg)
                }
            }
        })
    })
program.command('use-group')
    .description('')
    .action(() => {
        getGroupChoice({
            askMsg: '请选择要使用的组合',
            onChoice(ans) {
                logFailed(Config.useGroup(ans.name))
            },
            noChoice() {
                log.red('没有可以使用的组合')
            }
        })
    })
program.command('rm-project')
    .description('删除项目配置')
    .action(() => {
        getProjectChoice({
            askMsg: '请选择要删除的项目',
            onChoice: (ans) => {
                let ret = Config.removeProject(ans.name);
                if (!ret.success) {
                    return log.red(ret.msg)
                }
            },
            noChoice() {
                log.red('没有可以删除的项目')
            }
        })
    });

program.command('rm-editor')
    .description('删除编辑器配置')
    .action(() => {
        getEditorChoice({
            askMsg: '请选择要删除的编辑器',
            onChoice: (ans) => {
                let ret = Config.removeEditor(ans.name);
                if (!ret.success) {
                    return log.red(ret.msg)
                }
            },
            noChoice: () => {
                log.red('没有可以删除的编辑器')
            }
        })
    })


program.command('rm-group')
    .description('删除配置组合')
    .action(() => {
        getGroupChoice({
            askMsg: '请选择要删除的组合',
            onChoice(ans) {
                logFailed(Config.removeGroup(ans.name))
            }
        })
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
program.command('cfg')
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


