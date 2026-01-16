#!/bin/bash

# ==========================================
# yuangs CLI - 自动化构建与发布验证脚本
# ==========================================

# 设置遇到错误立即停止
set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# 1. 环境清理
log "1. 清理旧构建产物..."
rm -rf dist/
rm -f *.tgz
# 确保根目录没有残留的 index.js (之前的历史遗留问题)
if [ -f "index.js" ]; then
    warn "发现根目录存在 index.js，正在删除以确保环境纯净..."
    rm index.js
fi

# 2. 安装依赖
log "2. 检查依赖..."
npm install

# 3. TypeScript 构建
log "3. 执行构建 (npm run build)..."
npm run build

# 验证构建产物是否存在
if [ ! -f "dist/cli.js" ]; then
    error "构建失败：dist/cli.js 未生成"
fi

# 4. 单元测试
log "4. 运行单元测试 (npm test)..."
# 注意：你的测试依赖于 dist/ 目录，所以必须在 build 之后运行
npm test

# 5. NPM 打包模拟
log "5. 模拟 NPM 打包 (npm pack)..."
npm pack

# 获取生成的 tgz 文件名
PACKAGE_FILE=$(ls yuangs-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    error "打包失败：未找到 .tgz 文件"
fi

echo -e "📦 生成包文件: ${YELLOW}$PACKAGE_FILE${NC}"

# 6. 包内容验证 (防止源码泄漏)
log "6. 验证包内容结构..."
# 检查是否包含 dist 目录
if ! tar -tf "$PACKAGE_FILE" | grep -q "dist/cli.js"; then
    error "包结构错误：缺少 dist/cli.js"
fi

# 检查是否包含 src 目录 (不应该包含)
if tar -tf "$PACKAGE_FILE" | grep -q "^package/src/"; then
    error "包结构错误：包含了 src/ 源码目录 (请检查 package.json 的 files 字段)"
else
    echo "✅ 源码未泄漏 (src/ 目录未包含)"
fi

# 7. 冒烟测试 (Smoke Test)
log "7. 执行冒烟测试 (运行构建后的 CLI)..."

# 测试 help 命令
echo "Testing: yuangs --help"
node dist/cli.js --help > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Help 命令正常"
else
    error "Help 命令执行失败"
fi

# 测试 version 命令
echo "Testing: yuangs --version"
VERSION_OUTPUT=$(node dist/cli.js --version)
echo "✅ 版本号显示: $VERSION_OUTPUT"

# 8. 完成
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 验证通过！项目状态健康，随时可以发布。${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""