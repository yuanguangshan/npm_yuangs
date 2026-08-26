# yuangs zsh completion — DEPRECATED
# 此文件硬编码已过时，保留仅为兼容旧安装
# 请使用动态生成的补全：`yuangs completion zsh`  (src/core/completion.legacy.ts)
# 下个主版本将移除本文件

# 优先加载动态生成的补全，若无则回退到实时生成
if [ -f "$HOME/.zfunctions/_yuangs" ]; then
    source "$HOME/.zfunctions/_yuangs"
else
    if command -v yuangs >/dev/null 2>&1; then
        eval "$(yuangs completion zsh 2>/dev/null)" 2>/dev/null || true
    fi
    if ! whence _yuangs >/dev/null 2>&1; then
        _yuangs() {
            local -a commands
            commands=($(yuangs _describe all 2>/dev/null | tr '\n' ' '))
            if (( CURRENT == 2 )); then
                _describe 'command' commands
            else
                _values 'options' $(yuangs _complete_subcommand ${words[2]} 2>/dev/null)
            fi
        }
        _yuangs 2>/dev/null || true
    fi
fi
