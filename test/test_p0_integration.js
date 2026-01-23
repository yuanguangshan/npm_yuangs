/**
 * P0级别优化综合测试
 * 验证所有P0功能正常工作
 */

const { buildPrompt } = require('../dist/agent/prompt');
const { LLMAdapter } = require('../dist/agent/llmAdapter');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI P0优化综合测试                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   错误: ${error.message}\n`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

console.log('📦 测试1: 聊天模式增强提示词\n');
test('1.1 聊天模式返回system字段', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system !== undefined, '应该有system字段');
    assert(typeof result.system === 'string', 'system应该是字符串');
});

test('1.2 聊天模式包含角色定义', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('Yuangs AI'), '应包含Yuangs AI标识');
    assert(result.system.includes('软件开发'), '应包含能力描述');
});

test('1.3 聊天模式包含交互原则', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('交互原则'), '应包含交互原则');
    assert(result.system.includes('简洁明了'), '应包含简洁明了原则');
});

test('1.4 聊天模式包含输出格式', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('输出格式'), '应包含输出格式');
    assert(result.system.includes('Markdown'), '应使用Markdown格式');
});

test('1.5 聊天模式包含上下文使用指导', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('上下文使用'), '应包含上下文使用指导');
});

test('1.6 聊天模式包含能力声明', () => {
    const result = buildPrompt(null, {}, 'chat', '测试');
    assert(result.system.includes('当前能力'), '应包含能力声明');
    assert(result.system.includes('读取和分析代码文件'), '应列出具体能力');
});

console.log('\n📦 测试2: 命令模式保持兼容\n');
test('2.1 命令模式返回outputSchema', () => {
    const result = buildPrompt(null, {}, 'command', '测试');
    assert(result.outputSchema !== undefined, '应有outputSchema字段');
});

test('2.2 命令模式返回messages数组', () => {
    const result = buildPrompt(null, {}, 'command', '测试');
    assert(Array.isArray(result.messages), 'messages应该是数组');
});

console.log('\n📦 测试3: CoT (Chain of Thought) 解析\n');
test('3.1 解析完整CoT格式', () => {
    const cot = `[THOUGHT]
测试思考内容
[/THOUGHT]
\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls",
  "risk_level": "low"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'shell_cmd', '应正确解析action_type');
    assert(result.reasoning === '测试思考内容', '应提取THOUGHT内容');
    assert(result.payload.command === 'ls', '应解析command');
    assert(result.payload.risk_level === 'low', '应解析risk_level');
});

test('3.2 解析高风险操作', () => {
    const cot = `[THOUGHT]
删除文件
[/THOUGHT]
\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "rm -rf /tmp/test",
  "risk_level": "high"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.payload.risk_level === 'high', '应识别高风险');
    assert(result.reasoning.includes('删除'), '应提取删除相关的思考');
});

test('3.3 解析answer类型', () => {
    const cot = `[THOUGHT]
提供答案
[/THOUGHT]
\`\`\`json
{
  "action_type": "answer",
  "content": "这是答案"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'answer', '应是answer类型');
    assert(result.isDone === true, 'answer应标记为完成');
    assert(result.payload.content === '这是答案', '应提取content');
});

test('3.4 向后兼容旧JSON格式', () => {
    const oldJson = `{
  "action_type": "shell_cmd",
  "command": "ls",
  "reasoning": "旧格式"
}`;
    
    const result = LLMAdapter.parseThought(oldJson);
    assert(result.type === 'shell_cmd', '旧格式仍应正常工作');
    assert(result.payload.command === 'ls', '应解析command');
});

test('3.5 解析失败时回退', () => {
    const invalid = '不是JSON格式';
    
    const result = LLMAdapter.parseThought(invalid);
    assert(result.type === 'answer', '应回退到answer类型');
    assert(result.isDone === true, '应标记为完成');
    assert(result.payload.content === invalid, '原始内容作为答案');
});

test('3.6 解析tool_call类型', () => {
    const cot = `[THOUGHT]
读取文件
[/THOUGHT]
\`\`\`json
{
  "action_type": "tool_call",
  "tool_name": "read_file",
  "parameters": {
    "path": "test.txt"
  },
  "risk_level": "low"
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'tool_call', '应是tool_call类型');
    assert(result.payload.tool_name === 'read_file', '应解析tool_name');
    assert(result.payload.parameters.path === 'test.txt', '应解析parameters');
});

test('3.7 智能推断action_type', () => {
    const cot = `[THOUGHT]
测试
[/THOUGHT]
\`\`\`json
{
  "tool_name": "list_files",
  "parameters": {}
}
\`\`\``;
    
    const result = LLMAdapter.parseThought(cot);
    assert(result.type === 'tool_call', '应从tool_name推断为tool_call');
});

console.log('\n📦 测试4: 文件上下文注入\n');
test('4.1 文件上下文注入到system消息', () => {
    const result = buildPrompt(null, {
        files: [
            { path: 'test.ts', content: 'function test() {}' }
        ]
    }, 'chat', '分析文件');
    
    const contextMessage = result.messages.find(m => m.role === 'system');
    assert(contextMessage !== undefined, '应有system上下文消息');
    assert(contextMessage.content.includes('test.ts'), '应包含文件路径');
    assert(contextMessage.content.includes('function test()'), '应包含文件内容');
});

test('4.2 user消息正确添加', () => {
    const result = buildPrompt(null, {}, 'chat', '测试问题');
    const userMessage = result.messages[result.messages.length - 1];
    assert(userMessage.role === 'user', '最后一条消息应是user');
    assert(userMessage.content === '测试问题', '应包含用户输入');
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试总结                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);

if (passedTests === totalTests) {
    console.log('🎉 所有P0级别测试通过！\n');
    console.log('✅ 聊天模式提示词增强完成');
    console.log('✅ Agent模式CoT分离完成');
    console.log('✅ 向后兼容性验证通过');
    console.log('✅ 文件上下文注入正常');
    console.log('\n📋 P0级别优化全部完成，可以进行P1级别优化！');
} else {
    console.log('⚠️  部分测试失败，请检查上述错误信息\n');
    process.exit(1);
}
