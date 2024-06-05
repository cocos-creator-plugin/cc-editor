#! /usr/bin/env node
import { ChoiceOptions, Choices, getBuildCopyToChoice, getEditorChoice, getGroupChoice, getProjectChoice } from "./choice"
import OS from 'os';
import * as Fs from 'fs'
import { program } from 'commander'
import Config, { CCP_Json } from './config'
import chalk from 'chalk'
import log from './log'
import { Run, openProject } from './run'
import Build from './build'
import inquirer = require('inquirer')
import { addOpen2ContextMenu, getCreatorProjectVersion, isCreatorProject, isNumber, toMyPath } from './util';
import { basename, join, normalize } from "path"

program
    .version('0.0.1')
    .allowUnknownOption(true)
program.command("setup")
    .description("快速配置 (推荐使用)")
    .action(async () => {
        const exitFlag = '(回车退出)'
        // 添加项目
        log.blue('配置creator项目');
        while (true) {
            const ret: Choices = await inquirer.prompt({
                name: 'name',
                message: `请输入有效的creator项目目录 ${exitFlag}`,
                type: 'input',
            });

            if (!ret.name) {
                break
            }
            if (Config.addProject(ret.name).log().success) {
                log.green(`添加项目成功: ${ret.name}`)
            }
        }
        log.blue('配置creator编辑器')
        // 添加编辑器目录
        while (true) {
            const editorPath: Choices = await inquirer.prompt({
                name: "name",
                message: `请输入编辑器的路径 ${exitFlag}`,
                type: "input",
            });
            if (!editorPath.name) {
                break;
            }
            let editorAtlas = basename(editorPath.name);
            if (!editorAtlas) {
                const editorName: Choices = await inquirer.prompt({
                    name: "name",
                    message: `请输入编辑器的别名`,
                    type: "input",
                });
                editorAtlas = editorName.name;
            }
            if (Config.addEditor(editorAtlas, editorPath.name).log().success) {
                log.green(`添加编辑器成功: ${editorAtlas} - ${editorPath.name}`)
            }
        }
        // 添加组合
        log.blue(`配置组合`)
        while (true) {
            const group: Choices = await inquirer.prompt({
                name: "name",
                message: `请输入组合名字： ${exitFlag}`,
                type: "input",
            });
            if (!group.name) {
                break;
            }
            const b = await doAddGroup(group.name);
            if (b) {
                log.green(`添加组合成功:${group.name}`);
            }
        }

        // 使用组合
        await doUseGroup()
        // 启用cc-plugin.json支持
        const enabledCPP = await inquirer.prompt({
            name: "name",
            default: false,
            type: 'confirm',
            message: `是否启用对${Config.ccpFileName}的支持?`
        })
        Config.enabledCCP(!!enabledCPP.name);
        if (enabledCPP.name) {
            if (Config.data.projects.length) {
                // 配置v2/v3使用的项目目录
                const projectList: Choices[] = Config.data.projects.map((project) => {
                    return {
                        name: project,
                        value: project,
                    }
                });
                const v2Project = await inquirer.prompt({
                    name: 'name',
                    message: '请选择creator v2项目路径',
                    type: 'list',
                    choices: projectList,
                });
                const v3Project = await inquirer.prompt({
                    name: 'name',
                    message: '请选择creator v3项目路径',
                    type: 'list',
                    choices: projectList,
                });
                if (Config.ccpSet(v2Project.name, v3Project.name, "").log().success) {
                    log.green(`配置${Config.ccpFileName}对应的项目路径成功`)
                }
            } else {
                log.yellow(`没有找到配置的creator项目，无法配置${Config.ccpFileName}`);
            }
        }
    });
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
        Config.addEditor(name, editorPath).log();
    })


async function doAddGroup(name: string): Promise<boolean> {
    const editor = await getEditorChoice({
        askMsg: '请选择要组合的编辑器',
    })
    if (!editor) {
        return false;
    }
    const project = await getProjectChoice({
        askMsg: '请选择要组合的项目',

    })
    if (!project) {
        return false;
    }
    return Config.addGroup(name, editor, project).log().success;
}
program.command('add-group')
    .description('将当前使用的的配置保存为一个组合，供下次使用')
    .argument('name', '组合的名字')
    .action(async (name: string) => {
        await doAddGroup(name);
    })
program.command('use-editor')
    .description('使用本地指定的配置')
    .action(async () => {
        const ans = await getEditorChoice({
            askMsg: '请选择使用的Creator版本',
        })
        if (ans) {
            Config.useEditor(ans).log()
        } else {
            log.red(`请先添加编辑器路径: add-editor`)
        }

    })

program.command('use-project')
    .description('使用的项目')
    .action(async () => {
        const ans = await getProjectChoice({
            askMsg: '请选择使用的项目',
        })
        if (ans) {
            Config.useProject(ans).log()
        } else {
            log.red(`请先添加项目路径： add-project `)
        }

    })
async function doUseGroup() {
    const groupName = await getGroupChoice({
        askMsg: '请选择要使用的组合',
    })
    if (groupName) {
        Config.useGroup(groupName).log();
    } else {
        log.red('没有可以使用的组合')
    }
}
program.command('use-group')
    .description(`使用组合快速切换配置，支持${Config.ccpFileName}联动`)
    .action(async () => {
        await doUseGroup();
    })
program.command('rm-project')
    .description('删除项目配置')
    .action(async () => {
        const ans = await getProjectChoice({
            askMsg: '请选择要删除的项目',
        })
        if (ans) {
            Config.removeProject(ans);
        } else {
            log.red('没有可以删除的项目')
        }
    });

program.command('rm-editor')
    .description('删除编辑器配置')
    .action(async () => {
        const ans = await getEditorChoice({
            askMsg: '请选择要删除的编辑器',
        })
        if (ans) {
            Config.removeEditor(ans);
        } else {
            log.red('没有可以删除的编辑器')
        }
    })


program.command('rm-group')
    .description('删除配置组合')
    .action(async () => {
        const ans = await getGroupChoice({
            askMsg: '请选择要删除的组合',
        })
        Config.removeGroup(ans).log();
    })

program.command("cur")
    .description("当前的配置")
    .action(() => {
        const { use } = Config.data
        if (use.editor && use.project) {
            log.blue(`${use.editor} - ${use.project}`)
        } else {
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
program.command("reg-context-menu")
    .description("将 cce open 注册到右键菜单上")
    .action(async () => {
        if (OS.platform() === 'win32') {
            addOpen2ContextMenu();
            log.green(`添加到右键菜单成功`);
        } else {
            log.yellow(`暂不支持`);
        }
    })
program.command("open")
    .description("打开当前目录所在的creator项目")
    .action(async () => {
        const dir = process.cwd();
        if (!isCreatorProject(dir)) {
            log.red(`${dir} 不是creator项目, 无法打开`)
            return;
        }
        const version = getCreatorProjectVersion(dir);
        if (!Config.data.editors.length) {
            log.yellow(`请先添加编辑器路径: cce add-editor 编辑器别名 编辑器路径`)
            return;
        }
        const editorName = await getEditorChoice({
            default: version || "",
            askMsg: "请选择打开项目使用的creator编辑器"
        })
        if (!editorName) {
            return;
        }
        if (version) {
            // 使用的编辑器版本和项目的不一致，给出提示
            const a = editorName.split('.')[0];
            const b = version.split('.')[0];
            if (isNumber(a) && isNumber(b) && a !== b) {
                const ensure = await inquirer.prompt([{
                    name: 'ret',
                    message: `当前项目的creator版本是 ${version}, 你确定要使用 ${editorName} 打开么？`,
                    type: 'confirm'
                }])
                if (ensure.ret !== true) {
                    return
                }
            }
        }
        const editorPath = Config.getEditorPath(editorName);
        if (!editorPath) {
            log.red(`未发现${editorName}对应的编辑器路径`);
            return;
        }
        openProject(editorPath, dir);
    });
program.command('ccp-enabled')
    .description(`对${Config.ccpFileName}的联动支持`)
    .argument('enabled', `true启用，其他值为不启用`)
    .action((enabled: string) => {
        Config.enabledCCP(enabled.toLocaleLowerCase() === 'true');
    })
program.command('ccp-set')
    .description('设置cc-plugin构建的creator插件输出目录')
    .option('-v2 <string>', 'creator v2 项目目录')
    .option('-v3 <string>', 'creator v3 项目目录')
    .option('-chrome <string>', 'chrome 目录')
    .action((data: CCP_Json) => {
        Config.ccpSet(data.V2, data.V3, data.Chrome).log();
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
    .action(async () => {
        const ans = await getBuildCopyToChoice({
            askMsg: '请选择要删除的copy文件夹',
        })
        if (ans) {
            Config.removeBuildCopyDir(ans).log();
        } else {
            log.red('没有可以删除的文件夹');
        }
    })
program.command('format')
    .description('格式化，主要是处理路径')
    .action(() => {
        Config.format()
    })
program.parse(process.argv);


