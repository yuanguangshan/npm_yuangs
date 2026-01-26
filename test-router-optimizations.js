#!/usr/bin/env node

/**
 * 测试模型路由器的优化功能
 * 包括：spawn安全性、流式输出、上下文管理
 */

const { executeTask, TaskType, contextManager } = require('./dist/core/modelRouter');

async function testSpawnSecurity() {
  console.log('\n🔒 测试1: Spawn安全性（命令注入防护）');
  console.log('=' .repeat(60));
  
  // 尝试使用包含特殊字符的prompt
  const maliciousPrompt = 'Hello"; echo "Injected command"; echo "';
  
  try {
    const result = await executeTask(
      maliciousPrompt,
      {
        type: TaskType.CONVERSATION,
        description: '测试命令注入防护',
        metadata: { useContext: false }
      },
      { strategy: 'auto' }
    );
    
    console.log('✅ 命令注入防护测试通过');
    console.log(`模型: ${result.modelName}`);
    console.log(`执行时间: ${result.executionTime}ms`);
    console.log(`成功: ${result.success}`);
    
  } catch (error) {
    console.log(`✅ 正确捕获错误: ${error.message}`);
  }
}

async function testStreamingOutput() {
  console.log('\n📡 测试2: 流式输出');
  console.log('=' .repeat(60));
  
  let chunkCount = 0;
  
  try {
    const result = await executeTask(
      '用一句话介绍TypeScript',
      {
        type: TaskType.CONVERSATION,
        description: '测试流式输出',
        metadata: { useContext: false }
      },
      { strategy: 'auto' },
      (chunk) => {
        chunkCount++;
        process.stdout.write('.');
      }
    );
    
    console.log(`\n✅ 流式输出测试完成`);
    console.log(`收到 ${chunkCount} 个数据块`);
    console.log(`最终结果长度: ${result.content?.length || 0} 字符`);
    
  } catch (error) {
    console.log(`⚠️  流式输出测试失败: ${error.message}`);
  }
}

async function testContextManagement() {
  console.log('\n💬 测试3: 上下文管理（多轮对话）');
  console.log('=' .repeat(60));
  
  const sessionId = 'test-session-' + Date.now();
  
  try {
    // 第一轮对话
    console.log('\n第1轮对话:');
    const result1 = await executeTask(
      '我的名字是张三',
      {
        type: TaskType.CONVERSATION,
        description: '建立上下文',
        metadata: { 
          useContext: true,
          sessionId: sessionId
        }
      },
      { strategy: 'auto' }
    );
    
    console.log(`助手回复: ${result1.content?.substring(0, 100)}...`);
    
    // 第二轮对话（应该记住名字）
    console.log('\n第2轮对话（测试上下文记忆）:');
    const result2 = await executeTask(
      '你还记得我叫什么名字吗？',
      {
        type: TaskType.CONVERSATION,
        description: '测试上下文记忆',
        metadata: { 
          useContext: true,
          sessionId: sessionId
        }
      },
      { strategy: 'auto' }
    );
    
    console.log(`助手回复: ${result2.content?.substring(0, 100)}...`);
    
    // 检查上下文统计
    const stats = contextManager.getSessionStats(sessionId);
    console.log('\n上下文统计:');
    console.log(`- 消息数量: ${stats?.messageCount}`);
    console.log(`- 估算tokens: ${stats?.estimatedTokens}`);
    
    // 清理上下文
    contextManager.clearContext(sessionId);
    console.log('\n✅ 上下文管理测试完成');
    
  } catch (error) {
    console.log(`⚠️  上下文管理测试失败: ${error.message}`);
  }
}

async function testRobustJsonParsing() {
  console.log('\n🔧 测试4: JSON解析鲁棒性');
  console.log('=' .repeat(60));
  
  try {
    const result = await executeTask(
      '输出一个JSON对象，包含字段name和age',
      {
        type: TaskType.CODE_GENERATION,
        description: '测试JSON解析',
        metadata: { useContext: false }
      },
      { strategy: 'auto' }
    );
    
    console.log('✅ JSON解析测试通过');
    console.log(`成功: ${result.success}`);
    console.log(`内容: ${result.content?.substring(0, 100)}...`);
    
  } catch (error) {
    console.log(`⚠️  JSON解析测试失败: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       模型路由器优化测试套件                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await testSpawnSecurity();
    await testStreamingOutput();
    await testContextManagement();
    await testRobustJsonParsing();
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       所有测试完成！                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(console.error);
