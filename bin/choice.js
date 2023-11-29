"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildCopyToChoice = exports.getGroupChoice = exports.getProjectChoice = exports.getEditorChoice = void 0;
const config_1 = __importDefault(require("./config"));
const inquirer_1 = __importDefault(require("inquirer"));
function ask(choices, options) {
    const { askMsg, noChoice, onChoice } = options;
    if (choices.length > 0) {
        inquirer_1.default.prompt([
            {
                name: 'name',
                message: askMsg,
                type: 'list',
                choices,
            }
        ]).then((ans) => {
            onChoice && onChoice(ans);
        });
    }
    else {
        noChoice && noChoice();
    }
}
function getEditorChoice(options) {
    const choices = config_1.default.data.editors.map(editor => {
        return {
            name: editor.name,
            value: editor.name,
        };
    });
    ask(choices, options);
}
exports.getEditorChoice = getEditorChoice;
function getProjectChoice(options) {
    const choices = config_1.default.data.projects.map(project => {
        return {
            name: project,
            value: project,
        };
    });
    ask(choices, options);
}
exports.getProjectChoice = getProjectChoice;
function getGroupChoice(options) {
    const choices = config_1.default.data.groups.map(group => {
        return {
            name: `${group.name} [${group.editor}]/[${group.project}]`,
            value: group.name,
        };
    });
    ask(choices, options);
}
exports.getGroupChoice = getGroupChoice;
function getBuildCopyToChoice(options) {
    const choice = config_1.default.data.buildAfter.copyTo.map(item => {
        return { name: item, value: item };
    });
    ask(choice, options);
}
exports.getBuildCopyToChoice = getBuildCopyToChoice;
//# sourceMappingURL=choice.js.map