#!/usr/bin/env bash
set -euo pipefail

YU_DIR="$HOME/.yuangs"
YU_FILE="$YU_DIR/yuangs-ai.sh"
MARKER="yuangs-ai.sh"

info() { echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
err()  { echo "❌ $*" >&2; exit 1; }

# --------------------------------------------------
# Argument Parsing
# --------------------------------------------------
UNINSTALL=false
DRY_RUN=false

while getopts "u-:" opt; do
  case $opt in
    u) UNINSTALL=true ;;
    -)
      case "${OPTARG}" in
        uninstall) UNINSTALL=true ;;
        dry-run) DRY_RUN=true ;;
        *) err "Unknown option --${OPTARG}" ;;
      esac
      ;;
    *) err "Usage: $0 [-u|--uninstall] [--dry-run]" ;;
  esac
done

# --------------------------------------------------
# Uninstall Logic
# --------------------------------------------------
if [ "$UNINSTALL" = true ]; then
  echo "▶ Uninstalling yuangs zero-mode shell AI..."
  if [ "$DRY_RUN" = true ]; then
    info "[Dry-Run] Would remove configuration from ~/.bashrc and ~/.zshrc"
    info "[Dry-Run] Would remove $YU_DIR"
    exit 0
  fi

  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [[ -f "$rc" ]]; then
      # More robust removal using the marker
      sed -i.bak "/$MARKER/d" "$rc" 2>/dev/null || true
      rm -f "$rc.bak"
      info "Cleaned $rc"
    fi
  done
  
  if [ -d "$YU_DIR" ]; then
    rm -rf "$YU_DIR"
    info "Removed $YU_DIR"
  fi
  
  info "Uninstall complete"
  exit 0
fi

# --------------------------------------------------
# Installation Logic
# --------------------------------------------------
echo "▶ Installing yuangs zero-mode shell AI..."

if [ "$DRY_RUN" = true ]; then
  info "[Dry-Run] Would create $YU_DIR"
  info "[Dry-Run] Would write $YU_FILE"
  info "[Dry-Run] Would inject into ~/.bashrc and ~/.zshrc"
  exit 0
fi

mkdir -p "$YU_DIR"

# --------------------------------------------------
# Write runtime script
# --------------------------------------------------
cat > "$YU_FILE" <<'EOF'
# ==================================================
# yuangs zero-mode AI trigger
# ==================================================

# Only run in interactive Bash or Zsh
[[ -n "$BASH_VERSION" || -n "$ZSH_VERSION" ]] || return
[[ $- != *i* ]] && return
[[ -t 0 ]] || return

# Prevent multiple loads
[[ -n "$__YU_LOADED" ]] && return
__YU_LOADED=1

__YU_LAST_CMD=""
__YU_AI_PENDING=0
AI_OFF=0

# Core AI calling function
yu_call() {
  if command -v yuangs >/dev/null 2>&1; then
    yuangs ai "$@"
  else
    echo "❌ yuangs command not found"
  fi
}

ai_off() { AI_OFF=1; echo "🤖 AI OFF"; }
ai_on()  { AI_OFF=0; echo "🤖 AI ON";  }

# --------------------------------------------------
# Bash Implementation
# --------------------------------------------------
if [[ -n "$BASH_VERSION" ]]; then
  # Bash doesn't have ZLE, so we use PROMPT_COMMAND + Ctrl+G
  __yu_bash_prompt() {
    local exit_code=$?
    local last_hist
    # Synchronize history to catch the very last command
    history -a
    last_hist=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')
    
    if [[ $exit_code -ne 0 && "$AI_OFF" -eq 0 && -n "${last_hist// /}" ]]; then
      if [[ ! "$last_hist" =~ ^yuangs && ! "$last_hist" =~ ^ai_ ]]; then
        __YU_LAST_CMD="$last_hist"
        echo "💡 Command failed. Press Ctrl+G to ask AI why."
      fi
    fi
  }
  
  PROMPT_COMMAND="__yu_bash_prompt; $PROMPT_COMMAND"

  __yu_bash_explain() {
    if [[ -n "$__YU_LAST_CMD" ]]; then
      echo 
      yu_call "解释为什么命令失败了：$__YU_LAST_CMD"
      # Clear line after AI response
      READLINE_LINE=""
      READLINE_POINT=0
    else
      echo "No failed command to explain."
    fi
  }

  bind -x '"\C-g": __yu_bash_explain'
  alias ??="yuangs ai"
fi

# --------------------------------------------------
# Zsh Implementation
# --------------------------------------------------
if [[ -n "$ZSH_VERSION" ]]; then
  # 1. Capture command before execution
  preexec() {
    local cmd="$1"
    if [[ ! "$cmd" =~ ^yuangs.* && ! "$cmd" =~ ^ai_.* ]]; then
      __YU_LAST_CMD="$cmd"
    fi
  }

  # 2. Check exit status after execution
  precmd() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 && "$AI_OFF" -eq 0 && -n "$__YU_LAST_CMD" ]]; then
       # 确保最后执行的不是 yuangs
       if [[ ! "$__YU_LAST_CMD" =~ ^yuangs && ! "$__YU_LAST_CMD" =~ ^ai_ ]]; then
         __YU_AI_PENDING=1
         echo -e "\033[2m↳ Command failed. Press Enter to ask AI.\033[0m"
         return
       fi
    fi
    __YU_AI_PENDING=0
  }

  # 3. Handle Enter key
  yu_accept_line() {
    emulate -L zsh
    setopt localoptions noglob

    if [[ "$AI_OFF" == "1" ]]; then
      zle .accept-line
      return
    fi

    local buffer_content="$BUFFER"

    # ?? syntax handler
    if [[ "$buffer_content" == "??"* ]]; then
      echo 
      yu_call "${buffer_content#??}"
      BUFFER=""
      zle reset-prompt
      return
    fi

    # Empty line Enter -> Explain error
    if [[ -z "$buffer_content" && $__YU_AI_PENDING -eq 1 ]]; then
      echo 
      yu_call "解释为什么命令失败了：$__YU_LAST_CMD"
      __YU_AI_PENDING=0
      BUFFER=""
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
# Inject logic
# --------------------------------------------------
inject() {
  local rc="$1"
  [[ -f "$rc" ]] || return 0
  
  if ! grep -q "$MARKER" "$rc"; then
    echo >> "$rc"
    echo "# $MARKER" >> "$rc"
    echo "source \"$YU_FILE\"" >> "$rc"
    info "Updated $rc"
  else
    # Verify if source line is still valid
    if ! grep -q "source \"$YU_FILE\"" "$rc"; then
       warn "Found marker in $rc but source path is outdated. Updating..."
       sed -i.bak "/$MARKER/d" "$rc"
       rm -f "$rc.bak"
       inject "$rc"
    else
       warn "Already installed in $rc"
    fi
  fi
}

inject "$HOME/.bashrc"
inject "$HOME/.zshrc"

echo
info "Installation complete!"
echo "👉 Run 'source ~/.zshrc' or 'source ~/.bashrc' to activate."
