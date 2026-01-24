#!/usr/bin/env node

const { handleAIChat } = require('./dist/commands/handleAIChat.js');

console.log('=== 测试 AI 交互 ===\n');

// 测试单次提问
handleAIChat('hi', 'assistant').then(() => {
  console.log('\n✅ 测试完成');
}).catch(err => {
  console.error('❌ 错误:', err);
});
