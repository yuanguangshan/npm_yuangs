#!/bin/bash
# 测试上下文添加和查看功能

echo "=== 测试 1: 清空现有上下文 ==="
./dist/cli.js ai ":clear"

echo ""
echo "=== 测试 2: 添加单个文件 ==="
echo "@ src/commands/contextBuffer.ts" | ./dist/cli.js ai

echo ""
echo "=== 测试 3: 查看上下文列表 ==="
echo ":ls" | ./dist/cli.js ai

echo ""
echo "=== 测试 4: 查看上下文内容 ==="
echo ":cat 1" | ./dist/cli.js ai

echo ""
echo "=== 测试 5: 直接查看持久化文件 ==="
echo "--- .ai/context.json 内容 (前50行) ---"
head -50 .ai/context.json

echo ""
echo "=== 测试 6: 添加目录 ==="
echo "# src/utils" | ./dist/cli.js ai

echo ""
echo "=== 测试 7: 再次查看列表 ==="
echo ":ls" | ./dist/cli.js ai
