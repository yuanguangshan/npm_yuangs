#!/usr/bin/env node

/**
 * Simple validation of Governance-First ReAct Loop
 * Tests core functionality without relying on AI
 */

import { GovernedAgentLoop } from './dist/agent/loop.js';
import { GovernanceFSM } from './dist/agent/fsm.js';
import { GovernanceService } from './dist/agent/governance.js';
import { ToolExecutor } from './dist/agent/executor.js';
import { ContextManager } from './dist/agent/contextManager.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🧪 Governance Loop: Core Validation\n'));

function testFSM() {
  console.log(chalk.bold('Test 1: State Machine Transitions\n'));
  
  const fsm = new GovernanceFSM();
  
  const transitions = [
    { from: 'IDLE', to: 'THINKING' },
    { from: 'THINKING', to: 'PROPOSING' },
    { from: 'PROPOSING', to: 'GOVERNING' },
    { from: 'GOVERNING', to: 'EXECUTING', payload: { status: 'approved', by: 'policy', timestamp: Date.now() } as const },
    { from: 'EXECUTING', to: 'OBSERVING' },
    { from: 'OBSERVING', to: 'EVALUATING' },
    { from: 'EVALUATING', to: 'THINKING', payload: { kind: 'continue', reason: 'incomplete' } as const }
  ];

  let passed = 0;
  for (const t of transitions) {
    try {
      fsm.transitionTo(t.to as any, t.payload);
      console.log(chalk.green(`  ✓ ${t.from} → ${t.to}`));
      passed++;
    } catch (e: any) {
      console.log(chalk.red(`  ✗ ${t.from} → ${t.to}: ${e.message}`));
    }
  }

  console.log(chalk.gray(`\nPassed: ${passed}/${transitions.length}\n`));
  return passed === transitions.length;
}

function testRiskEvaluation() {
  console.log(chalk.bold('Test 2: Risk Evaluation\n'));
  
  const tests = [
    { name: 'read_file', risk: 'low' as const },
    { name: 'write_file', risk: 'medium' as const },
    { name: 'list_files', risk: 'low' as const },
    { name: 'rm -rf /', risk: 'high' as const },
    { name: 'ls -la', risk: 'medium' as const }
  ];

  let passed = 0;
  for (const test of tests) {
    const action = {
      id: 'test',
      type: test.name.includes(' ') ? ('shell_cmd' as const) : ('tool_call' as const),
      payload: test.name.includes(' ') ? { command: test.name } : { tool_name: test.name },
      riskLevel: 'low' as const,
      reasoning: 'test'
    };

    const risk = GovernanceService.evaluateRisk(action);
    const expected = test.risk;
    
    if (risk === expected) {
      console.log(chalk.green(`  ✓ ${test.name}: ${risk} (expected: ${expected})`));
      passed++;
    } else {
      console.log(chalk.red(`  ✗ ${test.name}: ${risk} (expected: ${expected})`));
    }
  }

  console.log(chalk.gray(`\nPassed: ${passed}/${tests.length}\n`));
  return passed === tests.length;
}

function testContextManager() {
  console.log(chalk.bold('Test 3: Context Manager\n'));
  
  const context = new ContextManager({
    input: 'Test input',
    mode: 'command',
    history: []
  });

  const tests = [
    { name: 'Add message', fn: () => context.addMessage('user', 'test') },
    { name: 'Add tool result', fn: () => context.addToolResult('read_file', 'output') },
    { name: 'Add observation', fn: () => context.addObservation('test obs') },
    { name: 'Get messages', fn: () => context.getMessages() },
    { name: 'Get hash', fn: () => context.getHash() },
    { name: 'Get snapshot', fn: () => context.getSnapshot() }
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      test.fn();
      console.log(chalk.green(`  ✓ ${test.name}`));
      passed++;
    } catch (e) {
      console.log(chalk.red(`  ✗ ${test.name}: ${e.message}`));
    }
  }

  console.log(chalk.gray(`\nPassed: ${passed}/${tests.length}\n`));
  return passed === tests.length;
}

async function testToolExecutor() {
  console.log(chalk.bold('Test 4: Tool Executor\n'));
  
  const tests = [
    {
      name: 'List files',
      action: {
        id: 'test',
        type: 'tool_call' as const,
        payload: { tool_name: 'list_files', parameters: { path: 'dist/agent' } },
        riskLevel: 'low' as const,
        reasoning: 'test'
      }
    },
    {
      name: 'Shell echo',
      action: {
        id: 'test',
        type: 'shell_cmd' as const,
        payload: { command: 'echo "test"' },
        riskLevel: 'medium' as const,
        reasoning: 'test'
      }
    }
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      const result = await ToolExecutor.execute(test.action);
      if (result.success) {
        console.log(chalk.green(`  ✓ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`  ✗ ${test.name}: ${result.error}`));
      }
    } catch (e) {
      console.log(chalk.red(`  ✗ ${test.name}: ${e.message}`));
    }
  }

  console.log(chalk.gray(`\nPassed: ${passed}/${tests.length}\n`));
  return passed === tests.length;
}

function testGovernanceLoop() {
  console.log(chalk.bold('Test 5: Governance Loop Structure\n'));
  
  const tests = [
    { name: 'Create loop', fn: () => new GovernedAgentLoop({ input: 'test', mode: 'command', history: [] }, { maxTurns: 5, autoApproveLowRisk: true, verbose: false }) },
    { name: 'Get context', fn: () => { const l = new GovernedAgentLoop({ input: 'test', mode: 'command', history: [] }); return l.getContext(); } },
    { name: 'Get FSM state', fn: () => { const l = new GovernedAgentLoop({ input: 'test', mode: 'command', history: [] }); return l.getFSMState(); } },
    { name: 'Get turns', fn: () => { const l = new GovernedAgentLoop({ input: 'test', mode: 'command', history: [] }); return l.getTurns(); } }
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      test.fn();
      console.log(chalk.green(`  ✓ ${test.name}`));
      passed++;
    } catch (e) {
      console.log(chalk.red(`  ✗ ${test.name}: ${e.message}`));
    }
  }

  console.log(chalk.gray(`\nPassed: ${passed}/${tests.length}\n`));
  return passed === tests.length;
}

async function runTests() {
  const results = {
    fsm: testFSM(),
    risk: testRiskEvaluation(),
    context: testContextManager(),
    executor: await testToolExecutor(),
    loop: testGovernanceLoop()
  };

  console.log(chalk.bold.cyan(''.repeat(50)));
  console.log(chalk.bold('Test Results Summary'));
  console.log(''.repeat(50) + '\n');

  Object.entries(results).forEach(([name, passed]) => {
    const status = passed 
      ? chalk.green('✅ PASS') 
      : chalk.red('❌ FAIL');
    console.log(`${name.padEnd(10)}: ${status}`);
  });

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log(chalk.bold.green('\n🎉 All core validation tests passed!\n'));
    console.log(chalk.gray('Governance-First ReAct Loop is ready:\n'));
    console.log(chalk.gray('  ✓ State machine enforces legal transitions'));
    console.log(chalk.gray('  ✓ Risk assessment works correctly'));
    console.log(chalk.gray('  ✓ Context management is functional'));
    console.log(chalk.gray('  ✓ Tool execution is operational'));
    console.log(chalk.gray('  ✓ Loop structure is valid\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n❌ Some tests failed\n'));
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error(chalk.red('\n💥 Fatal error:'), error);
  process.exit(1);
});
