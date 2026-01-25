#!/bin/bash

# yuangs SSH 功能测试脚本

echo "======================================"
echo "yuangs SSH 功能测试"
echo "======================================"
echo ""

# 检查编译是否成功
echo "1. 检查编译结果..."
if [ ! -f "dist/cli.js" ]; then
    echo "❌ 编译失败: dist/cli.js 不存在"
    exit 1
fi
echo "✅ 编译成功"
echo ""

# 检查 SSH 模块是否存在
echo "2. 检查 SSH 模块..."
if [ ! -f "dist/ssh/SSHSession.js" ]; then
    echo "❌ SSH 模块缺失: dist/ssh/SSHSession.js 不存在"
    exit 1
fi
if [ ! -f "dist/ssh/InputBuffer.js" ]; then
    echo "❌ SSH 模块缺失: dist/ssh/InputBuffer.js 不存在"
    exit 1
fi
if [ ! -f "dist/ssh/GovernedExecutor.js" ]; then
    echo "❌ SSH 模块缺失: dist/ssh/GovernedExecutor.js 不存在"
    exit 1
fi
if [ ! -f "dist/commands/ssh/index.js" ]; then
    echo "❌ SSH 命令缺失: dist/commands/ssh/index.js 不存在"
    exit 1
fi
echo "✅ SSH 模块完整"
echo ""

# 测试 SSH 命令是否注册
echo "3. 测试 SSH 命令注册..."
./dist/cli.js --help | grep -q "ssh"
if [ $? -eq 0 ]; then
    echo "✅ SSH 命令已注册"
else
    echo "⚠️  SSH 命令可能未在帮助中显示"
fi
echo ""

# 显示 SSH 命令帮助
echo "4. 显示 SSH 命令帮助..."
echo "---"
./dist/cli.js ssh --help
echo "---"
echo ""

# 创建测试配置目录
echo "5. 创建测试配置..."
mkdir -p ~/.yuangs
cat > ~/.yuangs/ssh_config.json << 'EOF'
{
  "hosts": {
    "test-local": {
      "host": "localhost",
      "port": 22,
      "username": "$(whoami)",
      "privateKey": "~/.ssh/id_rsa"
    }
  }
}
EOF
echo "✅ 测试配置已创建: ~/.yuangs/ssh_config.json"
echo ""

echo "======================================"
echo "测试完成!"
echo "======================================"
echo ""
echo "下一步测试建议:"
echo ""
echo "1. 测试本地连接 (如果你有 SSH 服务):"
echo "   ./dist/cli.js ssh $(whoami)@localhost"
echo ""
echo "2. 测试远程连接 (替换为你的服务器):"
echo "   ./dist/cli.js ssh user@your-server.com"
echo ""
echo "3. 测试治理功能 (连接后执行):"
echo "   rm -rf /    # 应该被拦截"
echo "   ls -la      # 应该正常执行"
echo "   sudo ls     # 应该进入提权流程"
echo ""
echo "4. 查看详细示例:"
echo "   cat sshclient/EXAMPLES.md"
echo ""
