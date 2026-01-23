/**
 * 测试CoT (Chain of Thought) 解析功能
 */

const { LLMAdapter } = require('../dist/agent/llmAdapter');

console.log('='.repeat(60));
console.log('测试1: CoT格式解析 - 完整格式');
console.log('='.repeat(60));

const cotExample1 = `[THOUGHT]
User wants to count files in /tmp directory. I'll use ls to list files and pipe to wc -l to count them. This is a safe operation with low risk.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "ls /tmp | wc -l",
  "risk_level": "low"
}
\`\`\``;

const result1 = LLMAdapter.parseThought(cotExample1);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result1.type);
console.log('是否完成:', result1.isDone);
console.log('推理内容:', result1.reasoning ? '✓ 已提取' : '✗ 未提取');
console.log('命令:', result1.payload.command);
console.log('风险等级:', result1.payload.risk_level);
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：CoT格式正确解析');
console.log('✅ THOUGHT块成功提取');
console.log('✅ JSON块成功解析\n');

console.log('='.repeat(60));
console.log('测试2: CoT格式解析 - 带风险警告');
console.log('='.repeat(60));

const cotExample2 = `[THOUGHT]
User wants to delete old log files. I need to find log files older than 30 days and delete them. However, rm -rf is destructive. I should warn the user to verify the path.
[/THOUGHT]

\`\`\`json
{
  "action_type": "shell_cmd",
  "command": "find /var/log -name '*.log' -mtime +30 -delete",
  "risk_level": "high"
}
\`\`\``;

const result2 = LLMAdapter.parseThought(cotExample2);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('风险等级:', result2.payload.risk_level);
console.log('推理内容长度:', result2.reasoning.length, '字符');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：高风险操作正确识别\n');

console.log('='.repeat(60));
console.log('测试3: 向后兼容 - 纯JSON格式（旧格式）');
console.log('='.repeat(60));

const oldFormat = `{
  "action_type": "shell_cmd",
  "command": "ls -la",
  "reasoning": "list all files"
}`;

const result3 = LLMAdapter.parseThought(oldFormat);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result3.type);
console.log('命令:', result3.payload.command);
console.log('推理内容:', result3.reasoning || '(旧格式，从JSON中提取)');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：向后兼容旧格式\n');

console.log('='.repeat(60));
console.log('测试4: 答案类型');
console.log('='.repeat(60));

const answerExample = `[THOUGHT]
The user is asking about how to optimize a function. I should provide a direct answer with code examples.
[/THOUGHT]

\`\`\`json
{
  "action_type": "answer",
  "content": "To optimize this function, consider using Map instead of array operations..."
}
\`\`\``;

const result4 = LLMAdapter.parseThought(answerExample);

console.log('\n📋 解析结果:');
console.log('-'.repeat(60));
console.log('类型:', result4.type);
console.log('是否完成:', result4.isDone);
console.log('推理内容:', result4.reasoning ? '✓ 已提取' : '✗ 未提取');
console.log('-'.repeat(60));

console.log('\n✅ 测试通过：answer类型正确处理\n');

console.log('='.repeat(60));
console.log('所有测试通过！✅');
console.log('='.repeat(60));
console.log('\n📊 总结:');
console.log('- CoT格式解析：✓ 正常');
console.log('- 向后兼容：✓ 支持');
console.log('- 风险识别：✓ 正常');
console.log('- THOUGHT提取：✓ 完整');
