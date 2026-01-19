"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCommands = getAllCommands;
exports.getCommandSubcommands = getCommandSubcommands;
exports.generateBashCompletion = generateBashCompletion;
exports.generateZshCompletion = generateZshCompletion;
exports.installBashCompletion = installBashCompletion;
exports.installZshCompletion = installZshCompletion;
exports.getCommandDescription = getCommandDescription;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const apps_1 = require("./apps");
const macros_1 = require("./macros");
function getAllCommands(program) {
    const commands = [];
    program.commands.forEach(cmd => {
        if (cmd.name()) {
            commands.push(cmd.name());
        }
        if (cmd.aliases()) {
            commands.push(...cmd.aliases());
        }
    });
    try {
        const apps = (0, apps_1.loadAppsConfig)();
        Object.keys(apps).forEach(app => {
            if (!commands.includes(app)) {
                commands.push(app);
            }
        });
    }
    catch {
    }
    try {
        const macros = (0, macros_1.getMacros)();
        Object.keys(macros).forEach(macro => {
            if (!commands.includes(macro)) {
                commands.push(macro);
            }
        });
    }
    catch {
    }
    return [...new Set(commands)].sort();
}
/**
 * 获取命令的子命令或参数
 */
function getCommandSubcommands(program, commandName) {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    if (!command)
        return [];
    const subcommands = [];
    command.commands.forEach(cmd => {
        if (cmd.name()) {
            subcommands.push(cmd.name());
        }
    });
    command.options.forEach(opt => {
        opt.flags.split(/[, ]+/).forEach(flag => {
            if (flag.startsWith('--')) {
                subcommands.push(flag);
            }
            else if (flag.startsWith('-')) {
                subcommands.push(flag);
            }
        });
    });
    return [...new Set(subcommands)].sort();
}
/**
 * 生成 Bash 补全脚本
 */
function generateBashCompletion(program) {
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
function generateZshCompletion(program) {
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
async function installBashCompletion(program) {
    const bashrcPath = path_1.default.join(process.env.HOME || '', '.bashrc');
    const bashCompletionDir = path_1.default.join(process.env.HOME || '', '.bash_completion.d');
    try {
        if (!fs_1.default.existsSync(bashCompletionDir)) {
            fs_1.default.mkdirSync(bashCompletionDir, { recursive: true });
        }
        const completionPath = path_1.default.join(bashCompletionDir, 'yuangs-completion.bash');
        const completionScript = generateBashCompletion(program);
        fs_1.default.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        const sourceLine = `# yuangs completion
if [ -f ~/.bash_completion.d/yuangs-completion.bash ]; then
    source ~/.bash_completion.d/yuangs-completion.bash
fi
`;
        let bashrc = '';
        if (fs_1.default.existsSync(bashrcPath)) {
            bashrc = fs_1.default.readFileSync(bashrcPath, 'utf-8');
        }
        if (!bashrc.includes('yuangs-completion.bash')) {
            fs_1.default.appendFileSync(bashrcPath, `\n${sourceLine}`);
        }
        return true;
    }
    catch (error) {
        console.error('安装 Bash 补全失败:', error);
        return false;
    }
}
async function installZshCompletion(program) {
    const zshrcPath = path_1.default.join(process.env.HOME || '', '.zshrc');
    const zfuncDir = path_1.default.join(process.env.HOME || '', '.zfunctions');
    try {
        if (!fs_1.default.existsSync(zfuncDir)) {
            fs_1.default.mkdirSync(zfuncDir, { recursive: true });
        }
        const completionPath = path_1.default.join(zfuncDir, '_yuangs');
        const completionScript = generateZshCompletion(program);
        fs_1.default.writeFileSync(completionPath, completionScript, { mode: 0o644 });
        let zshrc = '';
        if (fs_1.default.existsSync(zshrcPath)) {
            zshrc = fs_1.default.readFileSync(zshrcPath, 'utf-8');
        }
        const fpathLine = 'fpath=(~/.zfunctions $fpath)';
        const autoloadLine = 'autoload -U compinit && compinit';
        if (!zshrc.includes('fpath=')) {
            fs_1.default.appendFileSync(zshrcPath, `\n${fpathLine}`);
        }
        if (!zshrc.includes('autoload -U compinit')) {
            fs_1.default.appendFileSync(zshrcPath, `\n${autoloadLine}`);
        }
        return true;
    }
    catch (error) {
        console.error('安装 Zsh 补全失败:', error);
        return false;
    }
}
/**
 * 获取命令描述（用于补全提示）
 */
function getCommandDescription(program, commandName) {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    return command?.description() || '';
}
//# sourceMappingURL=completion.legacy.js.map