"use strict";
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
exports.getBuildCopyToChoice = exports.getGroupChoice = exports.getProjectChoice = exports.getEditorChoice = void 0;
const config_1 = __importDefault(require("./config"));
const inquirer_1 = __importDefault(require("inquirer"));
const printf_1 = __importDefault(require("printf"));
const lodash_1 = require("lodash");
const similarity_1 = __importDefault(require("similarity"));
const util_1 = require("./util");
function ask(choices, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { askMsg } = options;
        if (choices.length > 0) {
            choices = choices.sort((a, b) => {
                return (0, util_1.sortByName)(a.name, b.name);
            });
            const ans = yield inquirer_1.default.prompt([
                {
                    name: 'name',
                    message: askMsg,
                    type: 'list',
                    default: options.default || "",
                    choices,
                    pageSize: 100,
                }
            ]);
            return ans.name;
        }
        return "";
    });
}
function getEditorChoice(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const choices = config_1.default.data.editors.map(editor => {
            return {
                name: editor.name,
                value: editor.name,
            };
        });
        if (options.default) {
            // 如果默认值不在choices中，则选择一个最相似的
            const keys = choices.map(item => item.name);
            if (!keys.find(item => item === options.default)) {
                const target = options.default;
                options.default = (0, lodash_1.maxBy)(keys, (key) => {
                    const sim = (0, similarity_1.default)(key, target);
                    // console.log(`${key} - ${target} : ${sim}`)
                    return sim;
                });
            }
        }
        return yield ask(choices, options);
    });
}
exports.getEditorChoice = getEditorChoice;
function getProjectChoice(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const choices = config_1.default.data.projects.map(project => {
            return {
                name: project,
                value: project,
            };
        });
        return yield ask(choices, options);
    });
}
exports.getProjectChoice = getProjectChoice;
function getGroupChoice(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { groups, use } = config_1.default.data;
        let maxLenName = 0;
        let maxLenEditor = 0;
        let maxLenProject = 0;
        groups.map(group => {
            maxLenName = Math.max(maxLenName, group.name.length);
            maxLenEditor = Math.max(maxLenEditor, group.editor.length);
            maxLenProject = Math.max(maxLenProject, group.project.length);
        });
        const space = 2;
        maxLenEditor += space;
        maxLenName += space;
        maxLenProject += space;
        const choices = groups.map(group => {
            const flag = groupIsUse(group) ? "* " : "  ";
            const key = `${flag}%-${maxLenName}s %${maxLenEditor}s / %-${maxLenProject}s`;
            const value = (0, printf_1.default)(key, group.name, group.editor, group.project);
            return {
                name: value,
                value: group.name,
            };
        });
        return yield ask(choices, options);
    });
}
exports.getGroupChoice = getGroupChoice;
function groupIsUse(group) {
    const { use } = config_1.default.data;
    return use.editor === group.editor && use.project === group.project;
}
function getBuildCopyToChoice(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const choice = config_1.default.data.buildAfter.copyTo.map(item => {
            return { name: item, value: item };
        });
        return yield ask(choice, options);
    });
}
exports.getBuildCopyToChoice = getBuildCopyToChoice;
//# sourceMappingURL=choice.js.map