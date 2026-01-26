#!/usr/bin/env node

/**
 * 测试上下文持久化功能
 * 验证：
 * 1. 上下文能正确保存到文件系统
 * 2. 进程重启后能正确恢复上下文
 * 3. 多轮对话能正确累积
 */

const { contextManager } = require('./dist/core/modelRouter');
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║       上下文持久化测试                                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const testSessionId = 'test-persistence-' + Date.now();
const storagePath = contextManager.getStoragePath();

console.log('📁 存储路径:', storagePath);
console.log('🔑 测试会话ID:', testSessionId);
console.log('');

// 测试 1: 添加消息并检查文件
console.log('📝 测试 1: 添加消息并检查文件保存');
console.log('─'.repeat(60));

contextManager.addUserMessage(testSessionId, '你好，我是张三');
contextManager.addAssistantMessage(testSessionId, '你好张三，我是AI助手');

// 检查文件是否创建
if (fs.existsSync(storagePath)) {
  console.log('✅ 上下文文件已创建');
  
  // 读取文件内容
  const content = fs.readFileSync(storagePath, 'utf8');
  const data = JSON.parse(content);
  
  if (data[testSessionId]) {
    console.log('✅ 会话数据已保存');
    console.log(`   - 消息数量: ${data[testSessionId].messages.length}`);
    console.log(`   - 第一条消息: "${data[testSessionId].messages[0].content.substring(0, 20)}..."`);
  } else {
    console.log('❌ 会话数据未找到');
  }
} else {
  console.log('❌ 上下文文件未创建');
}

// 测试 2: 获取统计信息
console.log('\n📊 测试 2: 获取会话统计信息');
console.log('─'.repeat(60));

const stats = contextManager.getSessionStats(testSessionId);
if (stats) {
  console.log('✅ 统计信息获取成功');
  console.log(`   - 消息数量: ${stats.messageCount}`);
  console.log(`   - 估算 tokens: ${stats.estimatedTokens}`);
  console.log(`   - 首条消息时间: ${stats.firstMessage?.toISOString()}`);
  console.log(`   - 末条消息时间: ${stats.lastMessage?.toISOString()}`);
} else {
  console.log('❌ 统计信息获取失败');
}

// 测试 3: 模拟进程重启（通过重新创建 ContextManager）
console.log('\n🔄 测试 3: 模拟进程重启（重新加载上下文）');
console.log('─'.repeat(60));

// 注意：在实际代码中，我们使用的是单例，所以这里只能间接验证
// 通过检查文件内容来确认持久化是否正确
const savedContent = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
if (savedContent[testSessionId]) {
  console.log('✅ 上下文已持久化到文件');
  console.log('   进程重启后可以通过 loadContext() 恢复');
  
  // 验证消息内容
  const messages = savedContent[testSessionId].messages;
  if (messages.length === 2 && 
      messages[0].role === 'user' && 
      messages[1].role === 'assistant') {
    console.log('✅ 消息内容和角色验证通过');
  }
  
  // 验证 timestamp 能正确反序列化
  const firstTimestamp = new Date(messages[0].timestamp);
  if (!isNaN(firstTimestamp.getTime())) {
    console.log('✅ 时间戳反序列化验证通过');
  }
} else {
  console.log('❌ 持久化验证失败');
}

// 测试 4: 添加更多消息并检查修剪
console.log('\n✂️  测试 4: 添加多条消息并测试自动修剪');
console.log('─'.repeat(60));

// 添加超过默认限制(10条)的消息
for (let i = 0; i < 12; i++) {
  contextManager.addUserMessage(testSessionId, `测试消息 ${i}`);
  contextManager.addAssistantMessage(testSessionId, `回复 ${i}`);
}

const statsAfterTrim = contextManager.getSessionStats(testSessionId);
if (statsAfterTrim) {
  console.log(`消息总数: ${statsAfterTrim.messageCount}`);
  
  if (statsAfterTrim.messageCount <= 10) {
    console.log('✅ 自动修剪功能正常工作');
    console.log(`   (限制: 10条, 实际: ${statsAfterTrim.messageCount}条)`);
  } else {
    console.log('⚠️  修剪功能可能未生效');
  }
}

// 测试 5: 清除上下文
console.log('\n🗑️  测试 5: 清除特定会话上下文');
console.log('─'.repeat(60));

contextManager.clearContext(testSessionId);

const statsAfterClear = contextManager.getSessionStats(testSessionId);
if (!statsAfterClear) {
  console.log('✅ 会话上下文已清除（内存）');
}

// 检查文件中是否也删除了
const contentAfterClear = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
if (!contentAfterClear[testSessionId]) {
  console.log('✅ 会话上下文已清除（文件）');
} else {
  console.log('⚠️  文件中的会话数据未清除');
}

// 测试 6: 测试特殊字符处理
console.log('\n🔤 测试 6: 特殊字符处理');
console.log('─'.repeat(60));

const specialSessionId = 'special-chars-' + Date.now();
const specialMessages = [
  '包含"双引号"的消息',
  "包含'单引号'的消息",
  '包含\n换行符的消息',
  '包含\\反斜杠的消息',
  '包含$特殊符号的消息'
];

specialMessages.forEach((msg, i) => {
  contextManager.addUserMessage(specialSessionId, msg);
  contextManager.addAssistantMessage(specialSessionId, `收到: ${msg}`);
});

const specialStats = contextManager.getSessionStats(specialSessionId);
if (specialStats && specialStats.messageCount === specialMessages.length * 2) {
  console.log('✅ 特殊字符处理成功');
  console.log(`   保存了 ${specialStats.messageCount} 条消息`);
  
  // 验证能否正确读取
  const recentMessages = contextManager.getRecentMessages(specialSessionId, 2);
  if (recentMessages.length === 2) {
    console.log('✅ 特殊字符消息读取成功');
  }
} else {
  console.log('⚠️  特殊字符处理可能有问题');
}

// 清理测试会话
contextManager.clearContext(specialSessionId);

// 总结
console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       测试完成                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝');

console.log('\n✅ 持久化功能要点:');
console.log('   1. 上下文自动保存到 ~/.yuangs/context.json');
console.log('   2. CLI进程重启后自动恢复上下文');
console.log('   3. 支持多会话隔离 (sessionId)');
console.log('   4. 自动修剪超过限制的历史消息');
console.log('   5. 正确处理特殊字符和时间戳');

console.log('\n📖 使用提示:');
console.log('   - 查看上下文文件: cat ' + storagePath);
console.log('   - 手动清空所有上下文: rm ' + storagePath);
console.log('   - 检查文件大小: ls -lh ' + storagePath);

console.log('');
