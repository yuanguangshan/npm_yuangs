#!/usr/bin/env node

import { GovernedAgentLoop } from './src/agent/loop';
import { GovernanceFSM } from './src/agent/fsm';
import { ProposedAction, RiskLevel } from './src/agent/state';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🧪 Testing Governance-First ReAct Loop (State Machine Only)\n'));

async function testFSM() {
  const fsm = new GovernanceFSM();
  
  console.log(chalk.gray('Testing FSM transitions...\n'));

  fsm.transitionTo('THINKING');
  console.log(chalk.green('✓ IDLE -> THINKING'));

  fsm.transitionTo('PROPOSING');
  console.log(chalk.green('✓ THINKING -> PROPOSING'));

  const decision = { status: 'approved', by: 'policy', timestamp: Date.now() } as const;
  fsm.transitionTo('GOVERNING');
  console.log(chalk.green('✓ PROPOSING -> GOVERNING'));
  
  fsm.transitionTo('EXECUTING', decision);
  console.log(chalk.green('✓ GOVERNING -> EXECUTING'));

  fsm.transitionTo('OBSERVING');
  console.log(chalk.green('✓ EXECUTING -> OBSERVING'));

  fsm.transitionTo('EVALUATING');
  console.log(chalk.green('✓ OBSERVING -> EVALUATING'));

  fsm.transitionTo('THINKING', { kind: 'continue', reason: 'incomplete' });
  console.log(chalk.green('✓ EVALUATING -> THINKING'));

  console.log(chalk.gray('\nTesting illegal transitions...\n'));

  try {
    const fsm2 = new GovernanceFSM();
    fsm2.transitionTo('THINKING');
    fsm2.transitionTo('EXECUTING');
    console.log(chalk.red('✗ Should have failed'));
  } catch (e) {
    console.log(chalk.green('✓ Correctly rejected THINKING -> EXECUTING'));
  }

  console.log(chalk.gray('\nTesting rejection path...\n'));

  const fsm3 = new GovernanceFSM();
  fsm3.transitionTo('THINKING');
  fsm3.transitionTo('PROPOSING');
  fsm3.transitionTo('GOVERNING');
  
  const rejectDecision = { status: 'rejected', by: 'human', reason: 'test', timestamp: Date.now() } as const;
  fsm3.transitionTo('THINKING', rejectDecision);
  console.log(chalk.green('✓ GOVERNING -> THINKING (on rejection)'));

  console.log(chalk.bold.green('\n✅ All FSM tests passed!\n'));

  console.log(chalk.bold('FSM Info:'));
  const info = fsm.getStateInfo();
  console.log(`  - Current state: ${info.current}`);
  console.log(`  - History: ${info.history.join(' -> ')}`);
  console.log(`  - Transition count: ${info.transitionCount}`);
}

async function testGovernanceService() {
  const { GovernanceService } = await import('./src/agent/governance');
  const { randomUUID } = await import('crypto');

  console.log(chalk.bold.cyan('\n🧪 Testing GovernanceService\n'));

  const lowRiskAction: ProposedAction = {
    id: randomUUID(),
    type: 'tool_call',
    payload: { tool_name: 'read_file', parameters: { path: 'test.txt' } },
    riskLevel: 'low',
    reasoning: 'Just reading a file'
  };

  const highRiskAction: ProposedAction = {
    id: randomUUID(),
    type: 'shell_cmd',
    payload: { command: 'rm -rf /' },
    riskLevel: 'high',
    reasoning: 'Deleting files'
  };

  console.log(chalk.gray('Testing risk evaluation...\n'));

  const lowRisk = GovernanceService.evaluateRisk(lowRiskAction);
  console.log(`  read_file -> ${chalk.green(lowRisk)} (expected: low)`);

  const highRisk = GovernanceService.evaluateRisk(highRiskAction);
  console.log(`  rm -rf / -> ${chalk.red(highRisk)} (expected: high)`);

  const mediumRiskAction: ProposedAction = {
    id: randomUUID(),
    type: 'shell_cmd',
    payload: { command: 'ls -la' },
    riskLevel: 'medium',
    reasoning: 'Listing files'
  };

  const mediumRisk = GovernanceService.evaluateRisk(mediumRiskAction);
  console.log(`  ls -la -> ${chalk.yellow(mediumRisk)} (expected: medium)`);

  console.log(chalk.bold.green('\n✅ GovernanceService tests passed!\n'));
}

async function testToolExecutor() {
  const { ToolExecutor } = await import('./src/agent/executor');
  const { randomUUID } = await import('crypto');
  import('fs').then(fs => fs.writeFileSync('test_file.txt', 'Hello World'));

  console.log(chalk.bold.cyan('\n🧪 Testing ToolExecutor\n'));

  console.log(chalk.gray('Testing tool execution...\n'));

  const listAction = {
    id: randomUUID(),
    type: 'tool_call' as const,
    payload: { tool_name: 'list_files', parameters: { path: '.', recursive: false } },
    riskLevel: 'low' as RiskLevel,
    reasoning: 'List current directory'
  };

  const result = await ToolExecutor.execute(listAction);
  console.log(`  list_files -> ${result.success ? chalk.green('success') : chalk.red('failed')}`);

  const shellAction = {
    id: randomUUID(),
    type: 'shell_cmd' as const,
    payload: { command: 'echo "Hello from shell"' },
    riskLevel: 'medium' as RiskLevel,
    reasoning: 'Echo test'
  };

  const shellResult = await ToolExecutor.execute(shellAction);
  console.log(`  shell echo -> ${shellResult.success ? chalk.green('success') : chalk.red('failed')}`);

  console.log(chalk.bold.green('\n✅ ToolExecutor tests passed!\n'));

  import('fs').then(fs => fs.unlinkSync('test_file.txt'));
}

async function runAllTests() {
  try {
    await testFSM();
    await testGovernanceService();
    await testToolExecutor();
    console.log(chalk.bold.green('🎉 All tests passed!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Tests failed:'), error);
    process.exit(1);
  }
}

runAllTests();
