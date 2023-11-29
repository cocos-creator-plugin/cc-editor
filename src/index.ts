#! /usr/bin/env node
import { getBuildCopyToChoice, getEditorChoice, getGroupChoice, getProjectChoice } from "./choice"

import * as Fs from 'fs'
import { program } from 'commander'
import Config, { CCP_Json } from './config'
import chalk from 'chalk'
import log from './log'
import Run from './run'
import Build from './build'
import inquirer = require('inquirer')
import { logFailed, toMyPath } from './util';
import { join, normalize } from "path"

program
    .version('0.0.1')
    .allowUnknownOption(true)

program.command('reset')
    .description('校验无效的配置，并自动删除重置数据')
    .action(() => {
        Config.restInvalidConfig()
    })

program.command('set-port')
    .description('设置主进程调试端口')
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
    .description("是否开启主进程调试")
    .argument('debug', 'true启用，否则不启用')
    .action((debug: string) => {
        Config.setDebug(debug.toLowerCase() === 'true')
    })
program.command('set-brk')
    .description('是否在启动后断点')
    .argument('brk', 'true启用，否则不启用')
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
        const msg = Config.addEditor(name, editorPath);
        if (msg) {
            log.red(msg)
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
    .description('使用组合快速切换配置')
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
            log.blue(printf('%-2s %-10s %-s', curFlag, el.name, toMyPath(el.path)))
        })

        log.blue()
        log.blue('-- project --')
        projects.forEach(el => {
            const curFlag = use.project === el ? '*' : '';
            log.blue(printf('%-2s %-10s', curFlag, toMyPath(el)))
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
program.command('ccp-set')
    .description('设置cc-plugin构建的creator插件输出目录')
    .option('-v2 <string>', 'creator v2 项目目录')
    .option('-v3 <string>', 'creator v3 项目目录')
    .action((data: CCP_Json) => {
        Config.ccpSet(data.V2, data.V3).log();
    })
program.command('ccp-config')
    .description(`配置当前目录的${Config.ccpFileName}`)
    .action(() => {
        const data = Config.ccpData();
        const curFile = join(process.cwd(), Config.ccpFileName);
        Fs.writeFileSync(curFile, data);
        log.green(`config ${Config.ccpFileName} successfully`);
    })
program.command('build')
    .description('构建项目')
    .action(() => {
        Build();
    })

program.command('add-build-copy')
    .description('设置完成构建后的copy文件夹')
    .argument('dir')
    .action((dir) => {
        const ret = Config.addBuildCopyDir(dir);
        if (!ret.success) {
            return log.red(ret.msg)
        }
    })

program.command('rm-build-copy')
    .description('删除完成构建后的copy文件夹')
    .action(() => {
        getBuildCopyToChoice({
            askMsg: '请选择要删除的copy文件夹',
            onChoice(ans) {
                Config.removeBuildCopyDir(ans.name);
            },
            noChoice() {
                log.red('没有可以删除的文件夹');
            }
        })
    })
program.command('format')
    .description('格式化，主要是处理路径')
    .action(() => {
        Config.format()
    })
program.parse(process.argv);


