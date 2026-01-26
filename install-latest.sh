#!/bin/bash

# ==========================================
# yuangs CLI - 一键编译安装脚本
# ==========================================
# 用于快速编译并安装最新开发版本进行测试

# 设置遇到错误立即停止
set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[Step] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[Warn] $1${NC}"
}

error() {
    echo -e "${RED}[Error] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[Info] $1${NC}"
}

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  yuangs CLI - 一键编译安装${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# 解析命令行参数
RUN_TESTS=false
SKIP_BUILD=false
RUN_XRESOLVER_TEST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --test|-t)
            RUN_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --xresolver-test|-x)
            RUN_XRESOLVER_TEST=true
            shift
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --test, -t            安装前运行完整测试套件"
            echo "  --xresolver-test, -x  仅运行 XResolver 相关测试（快速验证）"
            echo "  --skip-build          跳过构建步骤（如果已构建）"
            echo "  --help, -h            显示帮助信息"
            exit 0
            ;;
        *)
            error "未知选项: $1 (使用 --help 查看帮助)"
            ;;
    esac
done

# 1. Node.js 版本检查
log "检查 Node.js 版本..."
NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 版本太低 (当前: $(node -v))，必须 >= 18"
fi
info "Node.js 版本: $(node -v) ✓"

# 2. 环境清理
log "清理旧构建产物..."
rm -rf dist/
rm -f *.tgz

# 3. 安装依赖
log "安装项目依赖..."
npm install

# 4. TypeScript 构建
if [ "$SKIP_BUILD" = false ]; then
    log "执行 TypeScript 构建..."
    npm run build
    
    # 验证构建产物
    if [ ! -f "dist/cli.js" ]; then
        error "构建失败：dist/cli.js 未生成"
    fi
    info "构建完成 ✓"
else
    log "跳过构建步骤（使用现有构建产物）..."
    if [ ! -f "dist/cli.js" ]; then
        error "dist/cli.js 不存在，无法跳过构建"
    fi
fi

# 5. 运行测试（可选）
if [ "$RUN_TESTS" = true ]; then
    log "运行完整测试套件..."
    npm test
    info "测试通过 ✓"
elif [ "$RUN_XRESOLVER_TEST" = true ]; then
    log "运行 XResolver 测试（快速验证）..."
    npm test -- --testPathPattern=XResolver
    info "XResolver 测试通过 ✓"
fi

# 6. 卸载旧版本（如果已安装）
log "检查旧版本..."
if npm list -g yuangs > /dev/null 2>&1; then
    warn "检测到已安装的全局 yuangs，正在卸载..."
    npm uninstall -g yuangs
fi

# 7. 安装到本地（npm link）
log "安装到本地环境（npm link）..."
npm link

# 8. 验证安装
log "验证安装..."
if command -v yuangs &> /dev/null; then
    YUANGS_PATH=$(which yuangs)
    info "yuangs 命令已安装: $YUANGS_PATH"
    
    # 测试版本命令
    YUANGS_VERSION=$(yuangs --version 2>&1)
    echo -e "${GREEN}✓ 版本: $YUANGS_VERSION${NC}"
    
    # 测试 help 命令
    yuangs --help > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        info "Help 命令正常 ✓"
    else
        warn "Help 命令执行失败，但安装可能已完成"
    fi
else
    error "安装验证失败：yuangs 命令不可用"
fi

# 9. 完成
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 安装完成！${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${BLUE}使用方法:${NC}"
echo -e "  ${YELLOW}yuangs --version${NC}   查看版本"
echo -e "  ${YELLOW}yuangs --help${NC}      查看帮助"
echo -e "  ${YELLOW}yuangs <command>${NC}   执行命令"
echo ""
echo -e "${BLUE}卸载方法:${NC}"
echo -e "  ${YELLOW}npm unlink -g yuangs${NC}"
echo ""
