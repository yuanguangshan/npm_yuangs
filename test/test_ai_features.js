#!/usr/bin/env node

/**
 * yuangs ai 功能测试套件
 *
 * 测试场景：
 * 1. 简单文件列表查询
 * 2. 读取文件特定字段
 * 3. 查找目录下最小的文件
 * 4. 查找目录下最大的文件
 * 5. 读取文件内容
 * 6. 搜索文件内容
 *
 * 验证点：
 * - 不出现重复工具调用（pre-block 拦截）
 * - 不超过 3 轮完成简单查询
 * - 结果正确展示给用户
 */

const { spawn } = require('child_process');
const path = require('path');

const CLI = path.join(__dirname, '..', 'dist', 'cli.js');

const TEST_CASES = [
  {
    name: '简单文件列表查询',
    query: '当前文件夹下有几个文件',
    expect: { maxTurns: 2, mustContain: '个文件' }
  },
  {
    name: '读取文件特定字段',
    query: '读取 package.json 的 name 和 version 字段',
    expect: { maxTurns: 3, mustContain: 'yuangs' }
  },
  {
    name: '查找目录下最小的文件',
    query: '当前目录下哪个文件最小',
    expect: { maxTurns: 3, mustContain: '.' }
  },
  {
    name: '查找目录下最大的文件',
    query: 'src 目录下最大的文件是什么',
    expect: { maxTurns: 3, mustContain: 'src/' }
  },
  {
    name: '读取文件内容',
    query: 'README.md 里写了什么',
    expect: { maxTurns: 2, mustContain: 'yuangs' }
  },
  {
    name: '搜索文件内容',
    query: '搜索 src 目录下包含 analyzeCommand 的文件',
    expect: { maxTurns: 3, mustContain: 'analyzeCommand' }
  }
];

function runTest(testCase) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${testCase.name}`);
    console.log(`查询: "${testCase.query}"`);
    console.log('='.repeat(60));

    const child = spawn('node', [CLI, 'ai', testCase.query, '--no-planner'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';
    let turnCount = 0;
    let duplicateBlocks = 0;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;

      // Count turns
      const turnMatches = text.match(/--- Turn (\d+) ---/g);
      if (turnMatches) {
        turnCount = Math.max(turnCount, turnMatches.length);
      }

      // Detect duplicate pre-blocks
      const blockMatches = text.match(/Duplicate Pre-Block/g);
      if (blockMatches) {
        duplicateBlocks += blockMatches.length;
      }

      // Print output in real time (streaming)
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      // Parse actual turn count from output
      const allTurns = stdout.match(/--- Turn (\d+) ---/g) || [];
      const maxTurn = allTurns.length > 0
        ? Math.max(...allTurns.map(t => parseInt(t.match(/\d+/)[0])))
        : 1;

      const expectedMax = testCase.expect.maxTurns;
      const hasResult = stdout.includes(testCase.expect.mustContain);

      const issues = [];
      if (maxTurn > expectedMax) {
        issues.push(`超过了预期轮数（实际 ${maxTurn}，预期 <= ${expectedMax}）`);
      }
      if (!hasResult) {
        issues.push(`结果中未包含预期内容: "${testCase.expect.mustContain}"`);
      }

      // Check for duplicate tool calls (pre-blocks)
      const preBlockMatches = stdout.match(/Duplicate Pre-Block/g);
      const forceBreakMatches = stdout.match(/Force Break/g);
      if (preBlockMatches && preBlockMatches.length > 0) {
        issues.push(`检测到 ${preBlockMatches.length} 次重复工具调用拦截`);
      }
      if (forceBreakMatches && forceBreakMatches.length > 0) {
        issues.push(`检测到 force_break（AI 陷入循环）`);
      }

      const passed = issues.length === 0;

      console.log(`\n--- 结果 ---`);
      console.log(`轮数: ${maxTurn} (预期 <= ${expectedMax})`);
      console.log(`包含预期结果: ${hasResult ? '是' : '否'}`);
      console.log(`重复调用拦截: ${preBlockMatches ? preBlockMatches.length : 0}`);
      console.log(`Force Break: ${forceBreakMatches ? forceBreakMatches.length : 0}`);
      console.log(`${passed ? '✅ PASSED' : '❌ FAILED'}`);
      if (!passed) {
        issues.forEach(issue => console.log(`  - ${issue}`));
      }

      resolve({ name: testCase.name, passed, issues, turns: maxTurn });
    });
  });
}

async function main() {
  console.log('\n🧪 yuangs ai 功能测试套件\n');

  const results = [];
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 测试汇总');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name} (${r.turns} 轮)`);
  }

  console.log(`\n总计: ${passed} 通过, ${failed} 失败, ${results.length} 总计`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}:`);
      r.issues.forEach(issue => console.log(`    ${issue}`));
    });
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
