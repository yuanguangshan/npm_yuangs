#!/usr/bin/env bash

# test/test_installer.sh
# 自动化测试 yuangs-install.sh 脚本的安装、卸载及各类环境兼容性

set -euo pipefail

# 1. 环境准备
REPO_ROOT="$(pwd)"
INSTALLER="$REPO_ROOT/scripts/yuangs-install.sh"
TEST_DIR="$(mktemp -d)"
MOCK_HOME="$TEST_DIR/mock_home"
mkdir -p "$MOCK_HOME"

# 设置环境变量，重定向 HOME
export HOME="$MOCK_HOME"

info() { echo "🧪 [TEST] $*"; }
error() { echo "❌ [FAIL] $*" >&2; exit 1; }

# 初始化 mock 的 rc 文件
setup_rc_files() {
    echo "# Existing bash config" > "$MOCK_HOME/.bashrc"
    echo "# Existing zsh config" > "$MOCK_HOME/.zshrc"
}

# 2. 测试用例：Dry-Run 安装
test_dry_run_install() {
    info "Running Dry-Run Install Test..."
    setup_rc_files
    
    "$INSTALLER" --dry-run > "$TEST_DIR/dry_run_output.log"
    
    if [ -d "$MOCK_HOME/.yuangs" ]; then
        error "Dry-run should NOT create .yuangs directory"
    fi
    
    if grep -q "yuangs-ai.sh" "$MOCK_HOME/.bashrc"; then
        error "Dry-run should NOT modify .bashrc"
    fi
    info "✅ Dry-Run Install Test Passed"
}

# 3. 测试用例：标准安装
test_standard_install() {
    info "Running Standard Install Test..."
    setup_rc_files
    
    "$INSTALLER" > /dev/null
    
    # 检查目录和运行脚本
    if [ ! -f "$MOCK_HOME/.yuangs/yuangs-ai.sh" ]; then
        error "Installation failed: yuangs-ai.sh not created"
    fi
    
    # 检查注入
    if ! grep -q "source \".*/.yuangs/yuangs-ai.sh\"" "$MOCK_HOME/.bashrc"; then
        error "Injection failed: .bashrc not updated correctly"
    fi
    
    if ! grep -q "source \".*/.yuangs/yuangs-ai.sh\"" "$MOCK_HOME/.zshrc"; then
        error "Injection failed: .zshrc not updated correctly"
    fi
    
    # 检查脚本内容关键点
    local runtime_script="$MOCK_HOME/.yuangs/yuangs-ai.sh"
    if ! grep -q "alias ??=" "$runtime_script"; then
        error "Runtime script missing ?? alias"
    fi
    if ! grep -q "bind -x '\"\\\\C-g\": __yu_bash_explain'" "$runtime_script"; then
        error "Runtime script missing Ctrl+G binding"
    fi
    if ! grep -q "yu_accept_line()" "$runtime_script"; then
        error "Runtime script missing Zsh yu_accept_line"
    fi
    
    info "✅ Standard Install Test Passed"
}

# 4. 测试用例：重复安装（幂等性）
test_idempotent_install() {
    info "Running Idempotency Test..."
    # 已经运行过一次安装，再次运行
    "$INSTALLER" > "$TEST_DIR/second_install.log"
    
    local count=$(grep -c "yuangs-ai.sh" "$MOCK_HOME/.bashrc")
    if [ "$count" -ne 2 ]; then # 1 for comment, 1 for source
        # 我们的注入逻辑是：
        # # yuangs-ai.sh
        # source "..."
        # 所以应该是 2 条包含 marker 的行（其中一行是注释中的代码路径名可能也匹配）
        # 检查是否重复 source
        local source_count=$(grep -c "source \".*/yuangs-ai.sh\"" "$MOCK_HOME/.bashrc")
        if [ "$source_count" -gt 1 ]; then
            error "Idempotency failed: duplicate source lines in .bashrc"
        fi
    fi
    info "✅ Idempotency Test Passed"
}

# 5. 测试用例：卸载
test_uninstall() {
    info "Running Uninstall Test..."
    
    "$INSTALLER" --uninstall > /dev/null
    
    if [ -d "$MOCK_HOME/.yuangs" ]; then
        error "Uninstallation failed: .yuangs directory still exists"
    fi
    
    if grep -q "yuangs-ai.sh" "$MOCK_HOME/.bashrc"; then
        error "Uninstallation failed: .bashrc still contains references"
    fi
    
    info "✅ Uninstall Test Passed"
}

# 6. 测试用例：带路径修复的重新安装
test_path_fix_install() {
    info "Running Path-Fix Re-installation Test..."
    setup_rc_files
    
    # 手动注入一个错误的路径但保留 Marker
    echo "# yuangs-ai.sh" >> "$MOCK_HOME/.bashrc"
    echo "source \"/wrong/path/yuangs-ai.sh\"" >> "$MOCK_HOME/.bashrc"
    
    # 运行安装
    "$INSTALLER" > /dev/null
    
    # 检查是否修复了路径
    if grep -q "/wrong/path/" "$MOCK_HOME/.bashrc"; then
        error "Re-installation failed to fix incorrect path"
    fi
    if ! grep -q "source \".*/.yuangs/yuangs-ai.sh\"" "$MOCK_HOME/.bashrc"; then
        error "Re-installation failed to inject correct path"
    fi
    
    info "✅ Path-Fix Re-installation Test Passed"
}

# 执行所有测试
main() {
    test_dry_run_install
    test_standard_install
    test_idempotent_install
    test_path_fix_install
    test_uninstall
    
    echo ""
    echo "🎉 ALL INSTALLER TESTS PASSED!"
    # 清理
    rm -rf "$TEST_DIR"
}

main
