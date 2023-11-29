import Config, { Group } from './config'
import inquirer from 'inquirer'
import * as child_process from 'child_process';
import printf from 'printf';

export interface Choices {
    name: string;
    value: string;
}


export interface ChoiceOptions {
    onChoice: (ans: Choices) => void,
    noChoice?: Function,
    askMsg: string,
}

function ask(choices: Choices[], options: ChoiceOptions) {
    const { askMsg, noChoice, onChoice } = options;

    if (choices.length > 0) {
        inquirer.prompt([
            {
                name: 'name',
                message: askMsg,
                type: 'list',
                choices,
            }
        ]).then((ans) => {
            onChoice && onChoice(ans as Choices);
        });
    } else {
        noChoice && noChoice();
    }
}

export function getEditorChoice(options: ChoiceOptions) {
    const choices = Config.data.editors.map(editor => {
        return {
            name: editor.name,
            value: editor.name,
        }
    })
    ask(choices, options);
}

export function getProjectChoice(options: ChoiceOptions) {
    const choices = Config.data.projects.map(project => {
        return {
            name: project,
            value: project,
        }
    })
    ask(choices, options);
}

export function getGroupChoice(options: ChoiceOptions) {
    const { groups, use } = Config.data;

    let maxLenName = 0;
    let maxLenEditor = 0;
    let maxLenProject = 0;

    groups.map(group => {
        maxLenName = Math.max(maxLenName, group.name.length);
        maxLenEditor = Math.max(maxLenEditor, group.editor.length);
        maxLenProject = Math.max(maxLenProject, group.project.length);
    })
    const space = 2;
    maxLenEditor += space;
    maxLenName += space;
    maxLenProject += space;
    const choices = groups.map(group => {
        const flag = groupIsUse(group) ? "* " : "  ";
        const key = `${flag}%-${maxLenName}s %${maxLenEditor}s / %-${maxLenProject}s`;
        const value = printf(key, group.name, group.editor, group.project);
        return {
            name: value,
            value: group.name,
        }
    })
    ask(choices, options);
}
function groupIsUse(group: Group): boolean {
    const { use } = Config.data;
    return use.editor === group.editor && use.project === group.project;
}
export function getBuildCopyToChoice(options: ChoiceOptions) {
    const choice = Config.data.buildAfter.copyTo.map(item => {
        return { name: item, value: item }
    })
    ask(choice, options);
}
