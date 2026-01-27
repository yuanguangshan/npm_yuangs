#!/bin/bash

# =================================================================
# CodeBuddy 完全清理脚本
# 功能：卸载 @tencent-ai/codebuddy-code 并清除所有本地配置与残留进程
# =================================================================

# 辅助函数：打印带颜色的信息
info() { echo -e "\033[34m[INFO]\033[0m $1"; }
success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
warn() { echo -e "\033[33m[WARN]\033[0m $1"; }

info "开始完全清除 CodeBuddy..."

# 1. 卸载 npm 全局包
if npm list -g @tencent-ai/codebuddy-code &>/dev/null; then
    info "检测到全局安装的 CodeBuddy，正在卸载..."
    npm uninstall -g @tencent-ai/codebuddy-code
    success "npm 包已卸载"
else
    warn "未发现全局安装的 @tencent-ai/codebuddy-code"
fi

# 2. 终止残留进程
info "检查并终止相关进程..."
PIDS=$(ps aux | grep -i "codebuddy" | grep -v "grep" | grep -v "clean-codebuddy.sh" | awk '{print $2}')
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null
    success "已终止相关进程: $PIDS"
else
    info "未发现运行中的相关进程"
fi

# 3. 清理配置文件及目录
PATHS=(
    "$HOME/.codebuddy"
    "$HOME/.cb"
    "$HOME/Library/Application Support/codebuddy"
    "$HOME/Library/Caches/codebuddy"
    "$HOME/Library/Logs/codebuddy"
)

info "清理本地文件与配置..."
for path in "${PATHS[@]}"; do
    if [ -d "$path" ] || [ -f "$path" ]; then
        rm -rf "$path"
        success "已删除: $path"
    fi
done

# 4. 最终验证
if ! command -v codebuddy &>/dev/null && [ ! -d "$HOME/.codebuddy" ]; then
    echo "------------------------------------------------"
    success "CodeBuddy 已被完全清理！"
    echo "------------------------------------------------"
else
    warn "清理工作已执行，但可能仍有部分残留，请手动确认。"
fi
