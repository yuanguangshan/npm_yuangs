#!/bin/bash

# yuangs SSH 治理功能演示脚本

echo "======================================"
echo "yuangs SSH 治理功能演示"
echo "======================================"
echo ""
echo "这个演示将展示 SSH 智能终端的治理能力"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}功能特性:${NC}"
echo "✅ 所有命令经过 AI 治理审查"
echo "✅ 危险命令自动拦截"
echo "✅ sudo/su 提权状态机"
echo "✅ 密码流保护 (不进入 AI/审计)"
echo "✅ 实时风险评估"
echo ""

echo -e "${YELLOW}注意事项:${NC}"
echo "1. 需要有可访问的 SSH 服务器"
echo "2. 需要配置 SSH 密钥或密码"
echo "3. 建议先在测试环境使用"
echo ""

echo "======================================"
echo "快速测试指南"
echo "======================================"
echo ""

echo -e "${GREEN}方式 1: 测试本地 SSH (如果已启用)${NC}"
echo "命令: ./dist/cli.js ssh $(whoami)@localhost"
echo ""

echo -e "${GREEN}方式 2: 测试远程服务器${NC}"
echo "命令: ./dist/cli.js ssh user@your-server.com"
echo ""

echo -e "${GREEN}方式 3: 使用配置文件${NC}"
echo "1. 编辑配置: ~/.yuangs/ssh_config.json"
echo "2. 添加服务器配置:"
cat << 'EOF'
{
  "hosts": {
    "myserver": {
      "host": "192.168.1.100",
      "username": "admin",
      "privateKey": "/Users/you/.ssh/id_rsa"
    }
  }
}
EOF
echo "3. 连接: ./dist/cli.js ssh myserver"
echo ""

echo "======================================"
echo "治理功能测试命令"
echo "======================================"
echo ""

echo -e "${GREEN}连接成功后,尝试以下命令:${NC}"
echo ""

echo -e "${BLUE}1. 安全命令 (应该正常执行):${NC}"
echo "   ls -la"
echo "   cat /etc/hostname"
echo "   df -h"
echo "   uptime"
echo ""

echo -e "${RED}2. 危险命令 (应该被拦截):${NC}"
echo "   rm -rf /"
echo "   dd if=/dev/zero of=/dev/sda"
echo "   mkfs.ext4 /dev/sda1"
echo ""

echo -e "${YELLOW}3. sudo 提权测试:${NC}"
echo "   sudo ls"
echo "   sudo systemctl status nginx"
echo "   # 注意: 密码输入不会被记录"
echo ""

echo "======================================"
echo "实际演示"
echo "======================================"
echo ""

read -p "是否要进行实际连接测试? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "请输入 SSH 连接字符串 (例: user@host): " ssh_target
    
    if [ -z "$ssh_target" ]; then
        echo -e "${RED}❌ 未输入连接字符串${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}正在连接到 $ssh_target...${NC}"
    echo -e "${YELLOW}提示: 连接后可以测试上述命令${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 退出${NC}"
    echo ""
    
    ./dist/cli.js ssh "$ssh_target"
else
    echo ""
    echo -e "${BLUE}跳过实际测试${NC}"
    echo ""
    echo "你可以随时运行以下命令进行测试:"
    echo "  ./dist/cli.js ssh user@host"
    echo ""
fi

echo ""
echo "======================================"
echo "更多信息"
echo "======================================"
echo ""
echo "📖 快速开始: cat sshclient/QUICKSTART.md"
echo "📖 使用示例: cat sshclient/EXAMPLES.md"
echo "📖 完整文档: cat sshclient/README.md"
echo "📖 实施计划: cat sshclient/IMPLEMENTATION_PLAN.md"
echo ""
