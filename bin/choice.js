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
function ask(choices, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { askMsg } = options;
        if (choices.length > 0) {
            const ans = yield inquirer_1.default.prompt([
                {
                    name: 'name',
                    message: askMsg,
                    type: 'list',
                    default: options.default || "",
                    choices,
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