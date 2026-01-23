/**
 * 测试风险告知生成功能
 */

const {
  analyzeRiskLevel,
  generateRiskDisclosure,
  formatRiskDisclosureCLI
} = require('../dist/agent/riskDisclosure');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           Yuangs AI 风险告知生成测试                       ║');
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

console.log('📦 测试1: 低风险分析\n');

test('1.1 简单读取操作为低风险', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'low', '应为低风险');
    assert(risk.score < 40, '分数应小于40');
});

console.log('\n📦 测试2: 中风险分析\n');

test('2.1 Shell命令为中风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'ls -la',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
    assert(risk.score >= 40, '分数应>=40');
});

test('2.2 Git操作为中风险', () => {
    const factors = {
        commandType: 'git_operation',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: true,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
});

test('2.3 文件写入为中风险', () => {
    const factors = {
        commandType: 'file_write',
        fileCount: 1,
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', '应为中风险');
});

console.log('\n📦 测试3: 高风险分析\n');

test('3.1 删除操作为高风险', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 1,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 70, '分数应>=70');
});

test('3.2 系统配置修改为高风险', () => {
    const factors = {
        commandType: 'system_config',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
});

test('3.3 rm -rf命令为极高风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf /path',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 100, '分数应接近100');
});

test('3.4 大批量删除为高风险', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 20,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
});

test('3.5 chmod 777为高风险', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'chmod 777 /path',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', '应为高风险');
    assert(risk.score >= 70, '分数应>=70');
});

console.log('\n📦 测试4: 风险告知书生成\n');

test('4.1 生成低风险告知书', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'low', '风险等级应为low');
    assert(disclosure.description !== '', '应有描述');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
    assert(disclosure.requireConfirmation === false, '低风险不需要确认');
});

test('4.2 生成中风险告知书', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'ls -la',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'medium', '风险等级应为medium');
    assert(disclosure.description.includes('【中】'), '描述应包含中风险');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
});

test('4.3 生成高风险告知书', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 5,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    assert(disclosure.riskLevel.level === 'high', '风险等级应为high');
    assert(disclosure.description.includes('【高】'), '描述应包含高风险');
    assert(disclosure.potentialIssues.length > 0, '应有潜在问题');
    assert(disclosure.recommendedActions.length > 0, '应有推荐行动');
    assert(disclosure.requireConfirmation === true, '高风险需要确认');
    assert(disclosure.checkpoint !== undefined, '应有检查点');
});

console.log('\n📦 测试5: CLI格式化\n');

test('5.1 低风险格式化包含图标', () => {
    const factors = {
        commandType: 'file_read',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🟢'), '应包含低风险图标');
    assert(formatted.includes('低风险'), '应包含低风险标签');
});

test('5.2 中风险格式化包含图标', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'npm install',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🟡'), '应包含中风险图标');
    assert(formatted.includes('中风险'), '应包含中风险标签');
});

test('5.3 高风险格式化包含图标', () => {
    const factors = {
        commandType: 'file_delete',
        fileCount: 10,
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('🔴'), '应包含高风险图标');
    assert(formatted.includes('高风险'), '应包含高风险标签');
    assert(formatted.includes('🔐'), '应包含确认提示');
});

test('5.4 格式化包含所有部分', () => {
    const factors = {
        commandType: 'shell_cmd',
        command: 'rm -rf test',
        isDestructive: true,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const disclosure = generateRiskDisclosure(factors);
    const formatted = formatRiskDisclosureCLI(disclosure);
    assert(formatted.includes('📋 操作描述'), '应包含操作描述');
    assert(formatted.includes('⚠️  潜在问题'), '应包含潜在问题');
    assert(formatted.includes('💡 推荐行动'), '应包含推荐行动');
});

console.log('\n📦 测试6: 特定风险场景\n');

test('6.1 Docker操作为中高风险', () => {
    const factors = {
        commandType: 'docker_operation',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'high', 'Docker操作应为高风险');
});

test('6.2 npm install为中风险', () => {
    const factors = {
        commandType: 'npm_install',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: true,
        modifiesGit: false,
    };
    const risk = analyzeRiskLevel(factors);
    assert(risk.level === 'medium', 'npm install应为中风险');
});

test('6.3 sudo操作增加风险', () => {
    const factors1 = {
        commandType: 'shell_cmd',
        command: 'ls',
        isDestructive: false,
        modifiesSystem: false,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const factors2 = {
        commandType: 'shell_cmd',
        command: 'sudo ls',
        isDestructive: false,
        modifiesSystem: true,
        requiresNetwork: false,
        modifiesGit: false,
    };
    const risk1 = analyzeRiskLevel(factors1);
    const risk2 = analyzeRiskLevel(factors2);
    assert(risk2.score > risk1.score, 'sudo操作应增加风险');
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                      测试总结                              ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n📊 通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);

if (passedTests === totalTests) {
    console.log('🎉 所有风险告知测试通过！\n');
    console.log('✅ 风险等级分析正常');
    console.log('✅ 风险告知书生成正常');
    console.log('✅ CLI格式化正常');
    console.log('✅ 低风险处理正常');
    console.log('✅ 中风险处理正常');
    console.log('✅ 高风险处理正常');
    console.log('✅ 特定风险场景识别正常');
    console.log('\n📋 风险告知功能已完成！');
} else {
    console.log('⚠️  部分测试失败，请检查上述错误信息\n');
    process.exit(1);
}
