# yuangs zsh completion

_yuangs() {
    local cur="\${words[2]}"
    local prev="\${words[1]}"

    if (( CURRENT == 2 )); then
        local -a commands
        commands=(
            'ai:向 AI 提问'
            'list:列出所有应用'
            'history:查看及执行命令历史'
            'config:管理本地配置'
            'macros:查看所有快捷指令'
            'save:保存快捷指令'
            'run:执行快捷指令'
            'help:显示帮助信息'
            'completion:安装 Shell 补全'
            'shici:打开古诗词 PWA'
            'dict:打开英语词典'
            'pong:打开 Pong 游戏'
        )

        _describe 'command' commands
    else
        local cmd="\${words[2]}"
        case "\$cmd" in
            ai)
                _values 'options' \$(yuangs _complete_subcommand ai)
                ;;
            *)
                _values 'options' \$(yuangs _complete_subcommand \$cmd)
                ;;
        esac
    fi
}

_yuangs
