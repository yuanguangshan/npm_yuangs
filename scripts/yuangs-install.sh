#!/usr/bin/env bash
set -e

YU_DIR="$HOME/.yuangs"
YU_FILE="$YU_DIR/yuangs-ai.sh"

echo "▶ Installing yuangs zero-mode shell AI..."

mkdir -p "$YU_DIR"

cat > "$YU_FILE" <<'EOF'
# ==================================================
# yuangs zero-mode AI trigger
# bash / zsh compatible
# ==================================================

# 仅交互 shell
[[ $- != *i* ]] && return
[[ -t 0 ]] || return

# --------------------------------------------------
# State
# --------------------------------------------------
__YU_LAST_CMD=""
__YU_LAST_STATUS=0
__YU_AI_PENDING=0
AI_OFF=0

# --------------------------------------------------
# AI entry
# --------------------------------------------------
yu_ai() {
  echo "[ai]"
  if command -v yuangs >/dev/null 2>&1; then
    yuangs ai "$@"
  else
    echo "yuangs command not found"
  fi
}

# --------------------------------------------------
# Escape hatch
# --------------------------------------------------
ai_off() { AI_OFF=1; echo "AI OFF"; }
ai_on()  { AI_OFF=0; echo "AI ON";  }

# ==================================================
# bash implementation
# ==================================================
if [ -n "$BASH_VERSION" ]; then

  __yu_postexec() {
    __YU_LAST_STATUS=$?
    if [ $__YU_LAST_STATUS -ne 0 ]; then
      __YU_AI_PENDING=1
      echo "↳ Need help? Press Enter"
    fi
  }

  PROMPT_COMMAND="__yu_postexec"

  # 接管 Enter（空行）
  __yu_readline() {
    local line
    read -r line

    [ "$AI_OFF" = "1" ] && return 0

    # ?? 显式触发
    if [[ "$line" == "?? "* ]]; then
      yu_ai "${line#?? }"
      return 1
    fi

    # 空行 + 失败触发
    if [[ -z "$line" && $__YU_AI_PENDING -eq 1 ]]; then
      yu_ai "$__YU_LAST_CMD"
      __YU_AI_PENDING=0
      return 1
    fi

    __YU_LAST_CMD="$line"
    return 0
  }

fi

# ==================================================
# zsh implementation
# ==================================================
if [ -n "$ZSH_VERSION" ]; then

  preexec() {
    __YU_LAST_CMD="$1"
  }

  precmd() {
    __YU_LAST_STATUS=$?
    if [ $__YU_LAST_STATUS -ne 0 ]; then
      __YU_AI_PENDING=1
      echo "↳ Need help? Press Enter"
    fi
  }

  yu_accept_line() {
    [ "$AI_OFF" = "1" ] && zle .accept-line && return

    local line="$BUFFER"

    # ?? 显式触发
    if [[ "$line" == "?? "* ]]; then
      BUFFER=""
      yu_ai "${line#?? }"
      zle reset-prompt
      return
    fi

    # 空行 + 失败
    if [[ -z "$line" && $__YU_AI_PENDING -eq 1 ]]; then
      BUFFER=""
      yu_ai "$__YU_LAST_CMD"
      __YU_AI_PENDING=0
      zle reset-prompt
      return
    fi

    zle .accept-line
  }

  zle -N yu_accept_line
  bindkey '^M' yu_accept_line
fi

# ==================================================
# Uninstall helper
# ==================================================
yuangs-uninstall() {
  echo "▶ Uninstalling yuangs AI shell integration..."

  sed -i.bak '/yuangs-ai.sh/d' ~/.bashrc 2>/dev/null || true
  sed -i.bak '/yuangs-ai.sh/d' ~/.zshrc 2>/dev/null || true

  rm -rf "$HOME/.yuangs"
  echo "✔ Uninstalled"
}
EOF

# --------------------------------------------------
# Inject into shell rc files
# --------------------------------------------------
inject() {
  local rc="$1"
  if [ -f "$rc" ] && ! grep -q "yuangs-ai.sh" "$rc"; then
    echo "source \"$YU_FILE\"" >> "$rc"
    echo "✔ Updated $rc"
  fi
}

inject "$HOME/.bashrc"
inject "$HOME/.zshrc"

echo
echo "✅ yuangs installed."
echo "→ Open a new terminal or run: source ~/.bashrc / ~/.zshrc"
