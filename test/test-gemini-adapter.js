#!/usr/bin/env node

/**
 * 测试 Gemini 适配器
 */

// 设置环境变量（如果命令行传入）
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️  未检测到 GEMINI_API_KEY 环境变量');
  console.log('使用方式: GEMINI_API_KEY="your_key" node test-gemini-adapter.js\n');
}

const { GoogleAdapter } = require('./dist/core/modelRouter/adapters/GoogleAdapter');
const { TaskType } = require('./dist/core/modelRouter/types');

async function testGeminiAdapter() {
  console.log('🧪 开始测试 Gemini 适配器...\n');
  console.log('环境变量 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '已设置 ✅' : '未设置 ❌');
  console.log('');
  
  const adapter = new GoogleAdapter();
  
  // 测试 1: 健康检查
  console.log('📋 测试 1: 健康检查');
  console.log('适配器名称:', adapter.name);
  console.log('适配器版本:', adapter.version);
  console.log('提供商:', adapter.provider);
  
  const isHealthy = await adapter.healthCheck();
  console.log('健康检查结果:', isHealthy ? '✅ 通过' : '❌ 失败');
  
  if (!isHealthy) {
    console.log('\n⚠️  Gemini 适配器不可用。可能的原因:');
    console.log('   1. Gemini CLI 未安装 (运行: npm install -g @google/generative-ai-cli)');
    console.log('   2. 未配置 GEMINI_API_KEY 环境变量');
    console.log('   3. 网络连接问题');
    console.log('\n💡 获取 API Key: https://aistudio.google.com/apikey');
    return;
  }
  
  // 测试 2: 执行简单任务
  console.log('\n📋 测试 2: 执行简单任务');
  const prompt = '用一句话介绍什么是 TypeScript';
  console.log('提示词:', prompt);
  
  const result = await adapter.execute(
    prompt,
    {
      type: TaskType.GENERAL,
      description: '测试任务',
    }
  );
  
  console.log('\n执行结果:');
  console.log('- 成功:', result.success ? '✅' : '❌');
  console.log('- 执行时间:', result.executionTime, 'ms');
  
  if (result.success) {
    console.log('- 响应内容:', result.content);
    console.log('- 元数据:', result.metadata);
  } else {
    console.log('- 错误信息:', result.error);
  }
  
  // 测试 3: 能力检查
  console.log('\n📋 测试 3: 适配器能力');
  console.log('支持的任务类型:', adapter.capabilities.supportedTaskTypes);
  console.log('最大上下文窗口:', adapter.capabilities.maxContextWindow);
  console.log('平均响应时间:', adapter.capabilities.avgResponseTime, 'ms');
  console.log('成本等级:', adapter.capabilities.costLevel);
  console.log('支持流式输出:', adapter.capabilities.supportsStreaming ? '✅' : '❌');
  console.log('特殊能力:', adapter.capabilities.specialCapabilities);
  
  console.log('\n✅ 测试完成!');
}

testGeminiAdapter().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
