/**
 * 测试动态Prompt注入功能
 */

const {
  detectGitContext,
  detectTechStack,
  generateTechStackGuidance,
  generateErrorRecovery,
  buildDynamicContext,
  injectDynamicContext
} = require('../dist/agent/dynamicPrompt');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI 动态Prompt注入测试                     ║');
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

async function runTests() {
    const gitContext = await detectGitContext();
    
    test('1.1 Git上下文检测成功', () => {
        // 当前目录是Git仓库（从环境信息可见）
        assert(gitContext !== null, '应检测到Git仓库');
        assert(typeof gitContext === 'string', '应返回字符串');
    });
    
    test('1.2 Git上下文包含关键指导', () => {
        assert(gitContext.includes('git ls-files'), '应包含git ls-files');
        assert(gitContext.includes('git diff'), '应包含git diff');
        assert(gitContext.includes('git log'), '应包含git log');
    });
    
    console.log('\n📦 测试2: 技术栈检测\n');
    
    const techStack = await detectTechStack();
    
    test('2.1 技术栈检测返回数组', () => {
        assert(Array.isArray(techStack), '应返回数组');
        assert(techStack.length >= 0, '数组长度应>=0');
    });
    
    test('2.2 检测到Node.js项目', () => {
        assert(techStack.includes('Node.js'), '应检测到Node.js（package.json存在）');
    });
    
    console.log('\n📦 测试3: 技术栈指导生成\n');
    
    const guidance = generateTechStackGuidance(['Node.js', 'Docker']);
    
    test('3.1 Node.js指导包含关键信息', () => {
        assert(guidance.includes('npm'), '应包含npm');
        assert(guidance.includes('package.json'), '应包含package.json');
        assert(guidance.includes('TypeScript'), '应包含TypeScript');
    });
    
    test('3.2 Docker指导包含关键信息', () => {
        assert(guidance.includes('Dockerfile'), '应包含Dockerfile');
        assert(guidance.includes('docker-compose'), '应包含docker-compose');
    });
    
    console.log('\n📦 测试4: 错误恢复指导\n');
    
    const errorRecovery = generateErrorRecovery('Command not found: xyz');
    
    test('4.1 错误恢复包含错误信息', () => {
        assert(errorRecovery.includes('Command not found: xyz'), '应包含原始错误');
    });
    
    test('4.2 错误恢复包含恢复选项', () => {
        assert(errorRecovery.includes('检查命令语法'), '应包含语法检查建议');
        assert(errorRecovery.includes('验证文件/路径'), '应包含路径验证建议');
        assert(errorRecovery.includes('使用不同的标志或工具'), '应包含替代方案建议');
    });
    
    console.log('\n📦 测试5: 动态上下文构建\n');
    
    const dynamicContext = await buildDynamicContext('Test error');
    
    test('5.1 动态上下文包含Git信息', () => {
        assert(dynamicContext.gitContext !== undefined, '应包含gitContext');
    });
    
    test('5.2 动态上下文包含技术栈', () => {
        assert(dynamicContext.techStack !== undefined, '应包含techStack');
        assert(Array.isArray(dynamicContext.techStack), 'techStack应是数组');
        assert(dynamicContext.techStack.length > 0, '应检测到至少一个技术栈');
    });
    
    test('5.3 动态上下文包含错误恢复', () => {
        assert(dynamicContext.lastError === 'Test error', '应记录错误');
        assert(dynamicContext.errorRecovery !== undefined, '应生成错误恢复指导');
    });
    
    console.log('\n📦 测试6: Prompt注入\n');
    
    const basePrompt = 'Base prompt content';
    const injectedPrompt = injectDynamicContext(basePrompt, dynamicContext);
    
    test('6.1 注入后的Prompt包含基础内容', () => {
        assert(injectedPrompt.includes('Base prompt content'), '应保留基础prompt');
    });
    
    test('6.2 注入后的Prompt包含Git上下文', () => {
        assert(injectedPrompt.includes('[GIT CONTEXT]'), '应包含Git上下文标识');
        assert(injectedPrompt.includes('git ls-files'), '应包含Git命令');
    });
    
    test('6.3 注入后的Prompt包含技术栈指导', () => {
        assert(injectedPrompt.includes('[TECH STACK: Node.js]'), '应包含Node.js指导');
        assert(injectedPrompt.includes('npm'), '应包含npm命令');
    });
    
    test('6.4 注入后的Prompt包含错误恢复', () => {
        assert(injectedPrompt.includes('[ERROR RECOVERY]'), '应包含错误恢复标识');
        assert(injectedPrompt.includes('Test error'), '应包含错误信息');
    });
    
    console.log('\n📦 测试7: 无错误时的上下文\n');
    
    const noErrorContext = await buildDynamicContext();
    
    test('7.1 无错误时不生成错误恢复', () => {
        assert(noErrorContext.lastError === undefined, '不应记录错误');
        assert(noErrorContext.errorRecovery === undefined, '不应生成错误恢复指导');
    });
    
    console.log('\n╔═════════════════════════════════════════════════════════╗');
    console.log('║                      测试总结                              ║');
    console.log('╚═════════════════════════════════════════════════════════╝');
    console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有动态Prompt注入测试通过！\n');
        console.log('✅ Git上下文检测正常');
        console.log('✅ 技术栈检测正常');
        console.log('✅ 错误恢复指导生成正常');
        console.log('✅ 动态上下文构建正常');
        console.log('✅ Prompt注入正常');
        console.log('\n📋 动态Prompt注入功能已完成！');
    } else {
        console.log('⚠️  部分测试失败，请检查上述错误信息\n');
        process.exit(1);
    }
}

// 执行测试
runTests().catch(err => {
    console.error('测试执行失败:', err);
    process.exit(1);
});
