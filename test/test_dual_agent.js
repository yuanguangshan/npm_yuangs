const { DualAgentRuntime } = require('./dist/agent/DualAgentRuntime');

async function testDualAgentRuntime() {
  console.log('=== Testing DualAgentRuntime ===\n');

  const testCases = [
    {
      name: 'Simple Task (Fast Path)',
      input: 'list files in current directory',
      expectedPath: 'fast',
      description: 'Should use direct execution, not planner'
    },
    {
      name: 'Complex Task (Planner)',
      input: '重构整个项目，批量优化所有TypeScript文件',
      expectedPath: 'planned',
      description: 'Should trigger planner with multiple steps'
    },
    {
      name: 'Another Complex Task',
      input: '逐个执行测试并生成报告',
      expectedPath: 'planned',
      description: 'Should trigger planner'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);
    console.log(`Expected: ${testCase.expectedPath}`);
    console.log(`Description: ${testCase.description}`);
    console.log('='.repeat(60));

    try {
      const runtime = new DualAgentRuntime({});
      await runtime.run(testCase.input, undefined, 'Assistant');
      console.log('\n✅ Test completed');
    } catch (error) {
      console.error(`\n❌ Test failed:`, error.message);
    }

    console.log();
  }

  console.log('=== All tests completed ===');
}

testDualAgentRuntime().catch(console.error);
