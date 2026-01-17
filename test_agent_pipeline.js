#!/usr/bin/env node

/**
 * Agent Pipeline 测试脚本
 * 
 * 用法：
 *   node test_agent_pipeline.js
 */

const { AgentPipeline } = require('./dist/agent');

async function testChatMode() {
    console.log('\n=== 测试 Chat 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "简单解释一下什么是冒泡排序",
                options: {
                    verbose: true
                }
            },
            'chat'
        );

        console.log('\n✅ Chat 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Chat 模式测试失败:', error.message);
    }
}

async function testCommandMode() {
    console.log('\n=== 测试 Command 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "列出当前目录的所有 TypeScript 文件",
                options: {
                    verbose: true,
                    autoYes: false  // 不自动执行，只生成命令
                }
            },
            'command'
        );

        console.log('\n✅ Command 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Command 模式测试失败:', error.message);
    }
}

async function testExecutionRecord() {
    console.log('\n=== 测试执行记录 ===\n');

    const { getRecords } = require('./dist/agent/record');

    const records = getRecords();
    console.log(`当前共有 ${records.length} 条执行记录`);

    if (records.length > 0) {
        const latest = records[records.length - 1];
        console.log('\n最新记录:');
        console.log(`  ID: ${latest.id}`);
        console.log(`  模式: ${latest.mode}`);
        console.log(`  时间: ${new Date(latest.timestamp).toLocaleString()}`);
        console.log(`  模型: ${latest.model}`);
        console.log(`  延迟: ${latest.llmResult.latencyMs}ms`);
    }

    console.log('\n✅ 执行记录测试通过\n');
}

async function main() {
    console.log('🚀 开始测试 Agent Pipeline\n');

    // 注意：这些测试需要有效的 AI API 配置
    // 如果没有配置，测试会失败

    try {
        await testChatMode();
        // await testCommandMode();  // 取消注释以测试命令模式
        await testExecutionRecord();

        console.log('\n🎉 所有测试完成！\n');
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
