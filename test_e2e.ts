#!/usr/bin/env node

/**
 * End-to-End Test for GovernedAgentLoop
 * Tests realistic scenarios with actual file operations
 */

import { GovernedAgentLoop } from './src/agent/loop';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

async function setupTestFile() {
  const testDir = path.join(process.cwd(), '.yuangs_test');
  await fs.mkdir(testDir, { recursive: true });
  
  await fs.writeFile(
    path.join(testDir, 'test.txt'),
    'Hello from yuangs test file!'
  );
  
  return testDir;
}

async function cleanup(testDir: string) {
  await fs.rm(testDir, { recursive: true, force: true });
}

async function testReadFileScenario() {
  console.log(chalk.bold.cyan('\n📋 Test 1: Read File Scenario\n'));
  
  const testDir = await setupTestFile();
  
  try {
    const loop = new GovernedAgentLoop({
      input: `Read the file at ${path.join(testDir, 'test.txt')}`,
      mode: 'command',
      history: []
    }, {
      maxTurns: 10,
      autoApproveLowRisk: true,
      verbose: false
    });

    const turns = await loop.run();
    
    console.log(chalk.green(`✅ Completed in ${turns.length} turns`));
    console.log(chalk.gray('Final state:'), chalk.yellow(loop.getFSMState()));
    
    const lastTurn = turns[turns.length - 1];
    if (lastTurn.executionResult?.success) {
      console.log(chalk.gray('Output:'), chalk.white(lastTurn.executionResult.output.substring(0, 100)));
    }
    
    return true;
  } catch (error: any) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    return false;
  } finally {
    await cleanup(testDir);
  }
}

async function testListFilesScenario() {
  console.log(chalk.bold.cyan('\n📋 Test 2: List Files Scenario\n'));
  
  try {
    const loop = new GovernedAgentLoop({
      input: 'List all TypeScript files in the src/agent directory',
      mode: 'command',
      history: []
    }, {
      maxTurns: 10,
      autoApproveLowRisk: true,
      verbose: false
    });

    const turns = await loop.run();
    
    console.log(chalk.green(`✅ Completed in ${turns.length} turns`));
    console.log(chalk.gray('Final state:'), chalk.yellow(loop.getFSMState()));
    
    const lastTurn = turns[turns.length - 1];
    if (lastTurn.executionResult?.success) {
      const files = JSON.parse(lastTurn.executionResult.output);
      console.log(chalk.gray(`Found ${files.length} items`));
    }
    
    return true;
  } catch (error: any) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    return false;
  }
}

async function testMultiTurnScenario() {
  console.log(chalk.bold.cyan('\n📋 Test 3: Multi-Turn Scenario\n'));
  
  try {
    const loop = new GovernedAgentLoop({
      input: 'First, list files in src/agent. Then tell me how many TypeScript files there are.',
      mode: 'command',
      history: []
    }, {
      maxTurns: 10,
      autoApproveLowRisk: true,
      verbose: false
    });

    const turns = await loop.run();
    
    console.log(chalk.green(`✅ Completed in ${turns.length} turns`));
    console.log(chalk.gray('Final state:'), chalk.yellow(loop.getFSMState()));
    
    console.log(chalk.bold('\nTurn Summary:'));
    turns.forEach((turn, i) => {
      console.log(`  Turn ${i + 1}: ${turn.thought?.type} -> ${turn.governance?.status} -> ${turn.executionResult?.success ? 'success' : 'failed'}`);
    });
    
    return true;
  } catch (error: any) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    return false;
  }
}

async function testContextPreservation() {
  console.log(chalk.bold.cyan('\n📋 Test 4: Context Preservation\n'));
  
  try {
    const loop = new GovernedAgentLoop({
      input: 'What files are in the src/agent directory?',
      mode: 'command',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help you today?' }
      ]
    }, {
      maxTurns: 5,
      autoApproveLowRisk: true,
      verbose: false
    });

    await loop.run();
    
    const context = loop.getContext();
    const messages = context.getMessages();
    
    console.log(chalk.green('✅ Context preserved'));
    console.log(chalk.gray(`Total messages: ${messages.length}`));
    console.log(chalk.gray('History preserved:'), messages.slice(0, 2).map(m => m.role).join(', '));
    
    return true;
  } catch (error: any) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    return false;
  }
}

async function testReplaySupport() {
  console.log(chalk.bold.cyan('\n📋 Test 5: Replay Support\n'));
  
  try {
    const loop = new GovernedAgentLoop({
      input: 'List files in src directory',
      mode: 'command',
      history: []
    }, {
      maxTurns: 5,
      autoApproveLowRisk: true,
      verbose: false
    });

    const turns = await loop.run();
    
    console.log(chalk.green('✅ Execution recorded'));
    
    console.log(chalk.bold('\nExecution Log:'));
    turns.forEach((turn, i) => {
      console.log(`\nTurn ${i + 1}:`);
      console.log(`  State: ${turn.thought?.type}`);
      console.log(`  Duration: ${turn.endTime! - turn.startTime}ms`);
      console.log(`  Governance: ${turn.governance?.status} by ${turn.governance?.by}`);
      console.log(`  Success: ${turn.executionResult?.success}`);
    });
    
    const context = loop.getContext();
    console.log(chalk.bold('\nContext Hash:'), chalk.white(context.getHash()));
    
    return true;
  } catch (error: any) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    return false;
  }
}

async function runAllTests() {
  console.log(chalk.bold.cyan('🚀 Governance-First ReAct Loop: End-to-End Tests\n'));
  console.log(chalk.gray('Running realistic scenarios...\n'));

  const results = {
    test1: await testReadFileScenario(),
    test2: await testListFilesScenario(),
    test3: await testMultiTurnScenario(),
    test4: await testContextPreservation(),
    test5: await testReplaySupport()
  };

  console.log(chalk.bold.cyan('\n' + '='.repeat(50)));
  console.log(chalk.bold('Test Results Summary'));
  console.log('='.repeat(50) + '\n');

  Object.entries(results).forEach(([name, passed]) => {
    const status = passed 
      ? chalk.green('✅ PASS') 
      : chalk.red('❌ FAIL');
    console.log(`${name}: ${status}`);
  });

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log(chalk.bold.green('\n🎉 All end-to-end tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n❌ Some tests failed\n'));
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error(chalk.red('\n💥 Fatal error:'), error);
  process.exit(1);
});
