import Config, { Group } from './config'
import inquirer from 'inquirer'
import * as child_process from 'child_process';
import printf from 'printf';

export interface Choices {
    /**
     * 和inquirer.prompt({name:'name'})对应着，也可以是其他key
     */
    name: string;
    value: string;
}


export interface ChoiceOptions {
    askMsg: string,
}

async function ask(choices: Choices[], options: ChoiceOptions): Promise<string> {
    const { askMsg } = options;
    if (choices.length > 0) {
        const ans: Choices = await inquirer.prompt([
            {
                name: 'name',
                message: askMsg,
                type: 'list',
                choices,
            }
        ]);
        return ans.name;
    }
    return "";
}

export async function getEditorChoice(options: ChoiceOptions): Promise<string> {
    const choices = Config.data.editors.map(editor => {
        return {
            name: editor.name,
            value: editor.name,
        }
    })
    return await ask(choices, options);
}

export async function getProjectChoice(options: ChoiceOptions): Promise<string> {
    const choices = Config.data.projects.map(project => {
        return {
            name: project,
            value: project,
        }
    })
    return await ask(choices, options);
}

export async function getGroupChoice(options: ChoiceOptions): Promise<string> {
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
    return await ask(choices, options);
}
function groupIsUse(group: Group): boolean {
    const { use } = Config.data;
    return use.editor === group.editor && use.project === group.project;
}
export async function getBuildCopyToChoice(options: ChoiceOptions): Promise<string> {
    const choice = Config.data.buildAfter.copyTo.map(item => {
        return { name: item, value: item }
    })
    return await ask(choice, options);
}
