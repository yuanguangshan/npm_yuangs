import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { loadAppsConfig } from './apps';
import { getMacros } from './macros';
export function getAllCommands(program: Command): string[] {
    const commands: string[] = [];

    program.commands.forEach(cmd => {
        if (cmd.name()) {
            commands.push(cmd.name());
        }
        if (cmd.aliases()) {
            commands.push(...cmd.aliases());
        }
    });

    try {
        const apps = loadAppsConfig();
        Object.keys(apps).forEach(app => {
            if (!commands.includes(app)) {
                commands.push(app);
            }
        });
    } catch {
    }

    try {
        const macros = getMacros();
        Object.keys(macros).forEach(macro => {
            if (!commands.includes(macro)) {
                commands.push(macro);
            }
        });
    } catch {
    }

    return [...new Set(commands)].sort();
}

/**
 * 获取命令的子命令或参数
 */
export function getCommandSubcommands(program: Command, commandName: string): string[] {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    if (!command) return [];

    const subcommands: string[] = [];

    command.commands.forEach(cmd => {
        if (cmd.name()) {
            subcommands.push(cmd.name());
        }
    });

    command.options.forEach(opt => {
        opt.flags.split(/[, ]+/).forEach(flag => {
            if (flag.startsWith('--')) {
                subcommands.push(flag);
            } else if (flag.startsWith('-')) {
                subcommands.push(flag);
            }
        });
    });

    return [...new Set(subcommands)].sort();
}

/**
 * 生成 Bash 补全脚本
 */
export function generateBashCompletion(program: Command): string {
    const commands = getAllCommands(program);

    return `#!/bin/bash
# yuangs bash completion

_yuangs_completion() {
    local cur prev words cword
    _init_completion || return

    # 补全命令名
    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=($(compgen -W '${commands.join(' ')}' -- "\${cur}"))
        return
    fi

    # 补全子命令和参数
    local cmd="\${words[1]}"
    case "\${cmd}" in
        ${commands.map(cmd => `
        ${cmd})
            case "\${prev}" in
                -m|--model)
                    COMPREPLY=($(compgen -W "gemini-2.5-flash-lite gemini-2.5-pro" -- "\${cur}"))
                    ;;
                *)
                    COMPREPLY=($(compgen -W "$(yuangs _complete_subcommand ${cmd})" -- "\${cur}"))
                    ;;
            esac
            ;;
        `).join('\n')}

        *)
            ;;
    esac
}

complete -F _yuangs_completion yuangs
`;
}

/**
 * 生成 Zsh 补全脚本
 */
export function generateZshCompletion(program: Command): string {
    const commands = getAllCommands(program);

    return `#compdef yuangs
# yuangs zsh completion

_yuangs() {
    local -a commands
    commands=(
${commands.map(cmd => `        '${cmd}:$(yuangs _describe ${cmd})'`).join('\n')}
    )

    if (( CURRENT == 2 )); then
        _describe 'command' commands
    else
        local cmd="\${words[2]}"
        case "\${cmd}" in
${commands.map(cmd => `
            ${cmd})
                _values 'options' $(yuangs _complete_subcommand ${cmd})
                ;;
`).join('\n')}
            *)
                ;;
        esac
    fi
}

_yuangs
`;
}

export async function installBashCompletion(program: Command): Promise<boolean> {
    const bashrcPath = path.join(process.env.HOME || '', '.bashrc');
    const bashCompletionDir = path.join(process.env.HOME || '', '.bash_completion.d');

    try {
        if (!fs.existsSync(bashCompletionDir)) {
            fs.mkdirSync(bashCompletionDir, { recursive: true });
        }

        const completionPath = path.join(bashCompletionDir, 'yuangs-completion.bash');
        const completionScript = generateBashCompletion(program);

        fs.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        const sourceLine = `# yuangs completion
if [ -f ~/.bash_completion.d/yuangs-completion.bash ]; then
    source ~/.bash_completion.d/yuangs-completion.bash
fi
`;

        let bashrc = '';
        if (fs.existsSync(bashrcPath)) {
            bashrc = fs.readFileSync(bashrcPath, 'utf-8');
        }

        if (!bashrc.includes('yuangs-completion.bash')) {
            fs.appendFileSync(bashrcPath, `\n${sourceLine}`);
        }

        return true;
    } catch (error) {
        console.error('安装 Bash 补全失败:', error);
        return false;
    }
}

export async function installZshCompletion(program: Command): Promise<boolean> {
    const zshrcPath = path.join(process.env.HOME || '', '.zshrc');
    const zfuncDir = path.join(process.env.HOME || '', '.zfunctions');

    try {
        if (!fs.existsSync(zfuncDir)) {
            fs.mkdirSync(zfuncDir, { recursive: true });
        }

        const completionPath = path.join(zfuncDir, '_yuangs');
        const completionScript = generateZshCompletion(program);

        fs.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        let zshrc = '';
        if (fs.existsSync(zshrcPath)) {
            zshrc = fs.readFileSync(zshrcPath, 'utf-8');
        }

        const fpathLine = 'fpath=(~/.zfunctions $fpath)';
        const autoloadLine = 'autoload -U compinit && compinit';

        if (!zshrc.includes('fpath=')) {
            fs.appendFileSync(zshrcPath, `\n${fpathLine}`);
        }

        if (!zshrc.includes('autoload -U compinit')) {
            fs.appendFileSync(zshrcPath, `\n${autoloadLine}`);
        }

        return true;
    } catch (error) {
        console.error('安装 Zsh 补全失败:', error);
        return false;
    }
}

/**
 * 获取命令描述（用于补全提示）
 */
export function getCommandDescription(program: Command, commandName: string): string {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    return command?.description() || '';
}
