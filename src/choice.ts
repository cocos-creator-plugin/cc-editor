import Config from './config'
import inquirer from 'inquirer'
import * as child_process from 'child_process';

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
    const choices = Config.data.groups.map(group => {
        return {
            name: `${group.name} [${group.editor}]/[${group.project}]`,
            value: group.name,
        }
    })
    ask(choices, options);
}

export function getBuildCopyToChoice(options: ChoiceOptions) {
    const choice = Config.data.buildAfter.copyTo.map(item => {
        return { name: item, value: item }
    })
    ask(choice, options);
}
