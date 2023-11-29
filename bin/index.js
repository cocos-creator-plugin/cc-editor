#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const choice_1 = require("./choice");
const commander_1 = require("commander");
const config_1 = __importDefault(require("./config"));
const log_1 = __importDefault(require("./log"));
const run_1 = __importDefault(require("./run"));
const build_1 = __importDefault(require("./build"));
const util_1 = require("./util");
commander_1.program
    .version('0.0.1')
    .allowUnknownOption(true);
commander_1.program.command('reset')
    .description('校验无效的配置，并自动删除重置数据')
    .action(() => {
    config_1.default.restInvalidConfig();
});
commander_1.program.command('set-port')
    .description('设置主进程调试端口')
    .argument('port', '调试端口')
    .action((port) => {
    let p = 0;
    try {
        p = parseInt(port);
    }
    catch (e) {
        p = 0;
    }
    config_1.default.setPort(p);
});
commander_1.program.command('set-debug')
    .description("是否开启主进程调试")
    .argument('debug', 'true启用，否则不启用')
    .action((debug) => {
    config_1.default.setDebug(debug.toLowerCase() === 'true');
});
commander_1.program.command('set-brk')
    .description('是否在启动后断点')
    .argument('brk', 'true启用，否则不启用')
    .action((brk) => {
    config_1.default.setBrk(brk.toLowerCase() === 'true');
});
commander_1.program.command('add-project')
    .description('添加项目路径')
    .argument('project-path', '项目路径')
    .action((projectPath) => {
    const ret = config_1.default.addProject(projectPath);
    if (!ret.success) {
        log_1.default.red(ret.msg);
    }
});
commander_1.program.command('add-editor')
    .description('添加编辑器路径')
    .argument('editor-name', '编辑器名字')
    .argument('editor-path', '编辑器路径')
    .action((name, editorPath) => {
    const msg = config_1.default.addEditor(name, editorPath);
    if (msg) {
        log_1.default.red(msg);
    }
});
commander_1.program.command('add-group')
    .description('将当前使用的的配置保存为一个组合，供下次使用')
    .argument('name', '组合的名字')
    .action((name) => {
    (0, choice_1.getEditorChoice)({
        askMsg: '请选择要组合的编辑器',
        onChoice: (editor) => {
            (0, choice_1.getProjectChoice)({
                askMsg: '请选择要组合的项目',
                onChoice: (project) => {
                    let ret = config_1.default.addGroup(name, editor.name, project.name);
                    if (!ret.success) {
                        return log_1.default.red(ret.msg);
                    }
                }
            });
        }
    });
});
commander_1.program.command('use-editor')
    .description('使用本地指定的配置')
    .action(() => {
    (0, choice_1.getEditorChoice)({
        askMsg: '请选择使用的Creator版本',
        noChoice() {
            log_1.default.red(`请先添加编辑器路径: add-editor`);
        },
        onChoice: (ans) => {
            const ret = config_1.default.useEditor(ans.name);
            if (!ret.success) {
                console.log(ret.msg);
            }
        }
    });
});
commander_1.program.command('use-project')
    .description('使用的项目')
    .action(() => {
    (0, choice_1.getProjectChoice)({
        askMsg: '请选择使用的项目',
        noChoice() {
            log_1.default.red(`请先添加项目路径： add-project `);
        },
        onChoice: (ans) => {
            const ret = config_1.default.useProject(ans.name);
            if (!ret.success) {
                console.log(ret.msg);
            }
        }
    });
});
commander_1.program.command('use-group')
    .description('使用组合快速切换配置')
    .action(() => {
    (0, choice_1.getGroupChoice)({
        askMsg: '请选择要使用的组合',
        onChoice(ans) {
            (0, util_1.logFailed)(config_1.default.useGroup(ans.name));
        },
        noChoice() {
            log_1.default.red('没有可以使用的组合');
        }
    });
});
commander_1.program.command('rm-project')
    .description('删除项目配置')
    .action(() => {
    (0, choice_1.getProjectChoice)({
        askMsg: '请选择要删除的项目',
        onChoice: (ans) => {
            let ret = config_1.default.removeProject(ans.name);
            if (!ret.success) {
                return log_1.default.red(ret.msg);
            }
        },
        noChoice() {
            log_1.default.red('没有可以删除的项目');
        }
    });
});
commander_1.program.command('rm-editor')
    .description('删除编辑器配置')
    .action(() => {
    (0, choice_1.getEditorChoice)({
        askMsg: '请选择要删除的编辑器',
        onChoice: (ans) => {
            let ret = config_1.default.removeEditor(ans.name);
            if (!ret.success) {
                return log_1.default.red(ret.msg);
            }
        },
        noChoice: () => {
            log_1.default.red('没有可以删除的编辑器');
        }
    });
});
commander_1.program.command('rm-group')
    .description('删除配置组合')
    .action(() => {
    (0, choice_1.getGroupChoice)({
        askMsg: '请选择要删除的组合',
        onChoice(ans) {
            (0, util_1.logFailed)(config_1.default.removeGroup(ans.name));
        }
    });
});
commander_1.program.command('list')
    .description('列出所有可用版本')
    .action(() => {
    const printf = require('printf');
    const { editors, projects, use } = config_1.default.data;
    log_1.default.blue();
    log_1.default.blue('-- editor --');
    editors.forEach(el => {
        const curFlag = use.editor === el.name ? '*' : '';
        log_1.default.blue(printf('%-2s %-10s %-s', curFlag, el.name, (0, util_1.toMyPath)(el.path)));
    });
    log_1.default.blue();
    log_1.default.blue('-- project --');
    projects.forEach(el => {
        const curFlag = use.project === el ? '*' : '';
        log_1.default.blue(printf('%-2s %-10s', curFlag, (0, util_1.toMyPath)(el)));
    });
    log_1.default.blue();
});
commander_1.program.command('cfg')
    .description('显示配置文件的数据')
    .action(() => {
    config_1.default.log();
});
commander_1.program.command('run')
    .description('启动运行编辑器')
    .action(() => {
    const ret = config_1.default.checkRun();
    if (!ret.success) {
        return log_1.default.red(ret.msg);
    }
    (0, run_1.default)();
});
commander_1.program.command('build')
    .description('构建项目')
    .action(() => {
    (0, build_1.default)();
});
commander_1.program.command('add-build-copy')
    .description('设置完成构建后的copy文件夹')
    .argument('dir')
    .action((dir) => {
    const ret = config_1.default.addBuildCopyDir(dir);
    if (!ret.success) {
        return log_1.default.red(ret.msg);
    }
});
commander_1.program.command('rm-build-copy')
    .description('删除完成构建后的copy文件夹')
    .action(() => {
    (0, choice_1.getBuildCopyToChoice)({
        askMsg: '请选择要删除的copy文件夹',
        onChoice(ans) {
            config_1.default.removeBuildCopyDir(ans.name);
        },
        noChoice() {
            log_1.default.red('没有可以删除的文件夹');
        }
    });
});
commander_1.program.command('format')
    .description('格式化，主要是处理路径')
    .action(() => {
    config_1.default.format();
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map