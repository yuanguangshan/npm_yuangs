#!/usr/bin/env bash
set -e

YU_DIR="$HOME/.yuangs"
YU_FILE="$YU_DIR/yuangs-ai.sh"
MARKER="yuangs-ai.sh"

info() { echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
err()  { echo "❌ $*" >&2; }

# --------------------------------------------------
# Uninstall
# --------------------------------------------------
if [[ "${1:-}" == "--uninstall" ]]; then
  echo "▶ Uninstalling yuangs zero-mode shell AI..."

  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [[ -f "$rc" ]]; then
      sed -i.bak "/$MARKER/d" "$rc" 2>/dev/null || true
      info "Cleaned $rc"
    fi
  done

  rm -rf "$YU_DIR"
  info "Removed $YU_DIR"

  info "Uninstall complete"
  exit 0
fi

echo "▶ Installing yuangs zero-mode shell AI..."

mkdir -p "$YU_DIR"

# --------------------------------------------------
# Write runtime script（你的原逻辑，未破坏）
# --------------------------------------------------
cat > "$YU_FILE" <<'EOF'
# ==================================================
# yuangs zero-mode AI trigger
# bash / zsh compatible
# ==================================================

[[ $- != *i* ]] && return
[[ -t 0 ]] || return

__YU_LAST_CMD=""
__YU_LAST_STATUS=0
__YU_AI_PENDING=0
AI_OFF=0

yu_ai() {
  echo "[ai]"
  if command -v yuangs >/dev/null 2>&1; then
    yuangs ai "$@"
  else
    echo "yuangs command not found"
  fi
}

ai_off() { AI_OFF=1; echo "AI OFF"; }
ai_on()  { AI_OFF=0; echo "AI ON";  }

# ---------------- bash ----------------
if [[ -n "$BASH_VERSION" ]]; then

  __yu_postexec() {
    __YU_LAST_STATUS=$?
    if [[ $__YU_LAST_STATUS -ne 0 ]]; then
      __YU_AI_PENDING=1
      echo "↳ Need help? Press Enter"
    fi
  }

  PROMPT_COMMAND="__yu_postexec"

  __yu_readline() {
    local line
    read -r line

    [[ "$AI_OFF" == "1" ]] && return 0

    if [[ "$line" == "?? "* ]]; then
      yu_ai "${line#?? }"
      return 1
    fi

    if [[ -z "$line" && $__YU_AI_PENDING -eq 1 ]]; then
      yu_ai "$__YU_LAST_CMD"
      __YU_AI_PENDING=0
      return 1
    fi

    __YU_LAST_CMD="$line"
    return 0
  }
fi

# ---------------- zsh ----------------
if [[ -n "$ZSH_VERSION" ]]; then

  preexec() { __YU_LAST_CMD="$1"; }

  precmd() {
    __YU_LAST_STATUS=$?
    if [[ $__YU_LAST_STATUS -ne 0 ]]; then
      __YU_AI_PENDING=1
      echo "↳ Need help? Press Enter"
    fi
  }

  yu_accept_line() {
    [[ "$AI_OFF" == "1" ]] && zle .accept-line && return

    local line="$BUFFER"

    if [[ "$line" == "?? "* ]]; then
      BUFFER=""
      yu_ai "${line#?? }"
      zle reset-prompt
      return
    fi

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
EOF

# --------------------------------------------------
# Inject into rc files
# --------------------------------------------------
inject() {
  local rc="$1"
  if [[ -f "$rc" ]] && ! grep -q "$MARKER" "$rc"; then
    echo "" >> "$rc"
    echo "source \"$YU_FILE\"" >> "$rc"
    info "Updated $rc"
  fi
}

inject "$HOME/.bashrc"
inject "$HOME/.zshrc"

echo
info "yuangs zero-mode installed"
info "Open a new terminal or run: source ~/.bashrc / ~/.zshrc"
