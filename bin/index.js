#! /usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const choice_1 = require("./choice");
const Fs = __importStar(require("fs"));
const commander_1 = require("commander");
const config_1 = __importDefault(require("./config"));
const log_1 = __importDefault(require("./log"));
const run_1 = __importDefault(require("./run"));
const build_1 = __importDefault(require("./build"));
const inquirer = require("inquirer");
const util_1 = require("./util");
const path_1 = require("path");
commander_1.program
    .version('0.0.1')
    .allowUnknownOption(true);
commander_1.program.command("setup")
    .description("快速配置 (推荐使用)")
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const exitFlag = '(回车退出)';
    // 添加项目
    log_1.default.blue('配置creator项目');
    while (true) {
        const ret = yield inquirer.prompt({
            name: 'name',
            message: `请输入有效的creator项目目录 ${exitFlag}`,
            type: 'input',
        });
        if (!ret.name) {
            break;
        }
        if (config_1.default.addProject(ret.name).log().success) {
            log_1.default.green(`添加项目成功: ${ret.name}`);
        }
    }
    log_1.default.blue('配置creator编辑器');
    // 添加编辑器目录
    while (true) {
        const editorPath = yield inquirer.prompt({
            name: "name",
            message: `请输入编辑器的路径 ${exitFlag}`,
            type: "input",
        });
        if (!editorPath.name) {
            break;
        }
        let editorAtlas = (0, path_1.basename)(editorPath.name);
        if (!editorAtlas) {
            const editorName = yield inquirer.prompt({
                name: "name",
                message: `请输入编辑器的别名`,
                type: "input",
            });
            editorAtlas = editorName.name;
        }
        if (config_1.default.addEditor(editorAtlas, editorPath.name).log().success) {
            log_1.default.green(`添加编辑器成功: ${editorAtlas} - ${editorPath.name}`);
        }
    }
    // 添加组合
    log_1.default.blue(`配置组合`);
    while (true) {
        const group = yield inquirer.prompt({
            name: "name",
            message: `请输入组合名字： ${exitFlag}`,
            type: "input",
        });
        if (!group.name) {
            break;
        }
        const b = yield doAddGroup(group.name);
        if (b) {
            log_1.default.green(`添加组合成功:${group.name}`);
        }
    }
    // 使用组合
    yield doUseGroup();
    // 启用cc-plugin.json支持
    const enabledCPP = yield inquirer.prompt({
        name: "name",
        default: false,
        type: 'confirm',
        message: `是否启用对${config_1.default.ccpFileName}的支持?`
    });
    config_1.default.enabledCCP(!!enabledCPP.name);
    if (enabledCPP.name) {
        if (config_1.default.data.projects.length) {
            // 配置v2/v3使用的项目目录
            const projectList = config_1.default.data.projects.map((project) => {
                return {
                    name: project,
                    value: project,
                };
            });
            const v2Project = yield inquirer.prompt({
                name: 'name',
                message: '请选择creator v2项目路径',
                type: 'list',
                choices: projectList,
            });
            const v3Project = yield inquirer.prompt({
                name: 'name',
                message: '请选择creator v3项目路径',
                type: 'list',
                choices: projectList,
            });
            if (config_1.default.ccpSet(v2Project.name, v3Project.name, "").log().success) {
                log_1.default.green(`配置${config_1.default.ccpFileName}对应的项目路径成功`);
            }
        }
        else {
            log_1.default.yellow(`没有找到配置的creator项目，无法配置${config_1.default.ccpFileName}`);
        }
    }
}));
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
    config_1.default.addEditor(name, editorPath).log();
});
function doAddGroup(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = yield (0, choice_1.getEditorChoice)({
            askMsg: '请选择要组合的编辑器',
        });
        if (!editor) {
            return false;
        }
        const project = yield (0, choice_1.getProjectChoice)({
            askMsg: '请选择要组合的项目',
        });
        if (!project) {
            return false;
        }
        return config_1.default.addGroup(name, editor, project).log().success;
    });
}
commander_1.program.command('add-group')
    .description('将当前使用的的配置保存为一个组合，供下次使用')
    .argument('name', '组合的名字')
    .action((name) => __awaiter(void 0, void 0, void 0, function* () {
    yield doAddGroup(name);
}));
commander_1.program.command('use-editor')
    .description('使用本地指定的配置')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getEditorChoice)({
        askMsg: '请选择使用的Creator版本',
    });
    if (ans) {
        config_1.default.useEditor(ans).log();
    }
    else {
        log_1.default.red(`请先添加编辑器路径: add-editor`);
    }
}));
commander_1.program.command('use-project')
    .description('使用的项目')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getProjectChoice)({
        askMsg: '请选择使用的项目',
    });
    if (ans) {
        config_1.default.useProject(ans).log();
    }
    else {
        log_1.default.red(`请先添加项目路径： add-project `);
    }
}));
function doUseGroup() {
    return __awaiter(this, void 0, void 0, function* () {
        const groupName = yield (0, choice_1.getGroupChoice)({
            askMsg: '请选择要使用的组合',
        });
        if (groupName) {
            config_1.default.useGroup(groupName).log();
        }
        else {
            log_1.default.red('没有可以使用的组合');
        }
    });
}
commander_1.program.command('use-group')
    .description(`使用组合快速切换配置，支持${config_1.default.ccpFileName}联动`)
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    yield doUseGroup();
}));
commander_1.program.command('rm-project')
    .description('删除项目配置')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getProjectChoice)({
        askMsg: '请选择要删除的项目',
    });
    if (ans) {
        config_1.default.removeProject(ans);
    }
    else {
        log_1.default.red('没有可以删除的项目');
    }
}));
commander_1.program.command('rm-editor')
    .description('删除编辑器配置')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getEditorChoice)({
        askMsg: '请选择要删除的编辑器',
    });
    if (ans) {
        config_1.default.removeEditor(ans);
    }
    else {
        log_1.default.red('没有可以删除的编辑器');
    }
}));
commander_1.program.command('rm-group')
    .description('删除配置组合')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getGroupChoice)({
        askMsg: '请选择要删除的组合',
    });
    config_1.default.removeGroup(ans).log();
}));
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
commander_1.program.command('ccp-enabled')
    .description(`对${config_1.default.ccpFileName}的联动支持`)
    .argument('enabled', `true启用，其他值为不启用`)
    .action((enabled) => {
    config_1.default.enabledCCP(enabled.toLocaleLowerCase() === 'true');
});
commander_1.program.command('ccp-set')
    .description('设置cc-plugin构建的creator插件输出目录')
    .option('-v2 <string>', 'creator v2 项目目录')
    .option('-v3 <string>', 'creator v3 项目目录')
    .option('-chrome <string>', 'chrome 目录')
    .action((data) => {
    config_1.default.ccpSet(data.V2, data.V3, data.Chrome).log();
});
commander_1.program.command('ccp-config')
    .description(`配置当前目录的${config_1.default.ccpFileName}`)
    .action(() => {
    const data = config_1.default.ccpData();
    const curFile = (0, path_1.join)(process.cwd(), config_1.default.ccpFileName);
    Fs.writeFileSync(curFile, data);
    log_1.default.green(`config ${config_1.default.ccpFileName} successfully`);
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
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const ans = yield (0, choice_1.getBuildCopyToChoice)({
        askMsg: '请选择要删除的copy文件夹',
    });
    if (ans) {
        config_1.default.removeBuildCopyDir(ans).log();
    }
    else {
        log_1.default.red('没有可以删除的文件夹');
    }
}));
commander_1.program.command('format')
    .description('格式化，主要是处理路径')
    .action(() => {
    config_1.default.format();
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map