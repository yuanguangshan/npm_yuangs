#!/usr/bin/env node

/**
 * Demonstration of Governance-First ReAct Loop
 * 
 * This example shows how to use the GovernedAgentLoop to execute
 * tasks with human oversight and risk governance.
 */

import { GovernedAgentLoop } from './dist/agent/loop.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🚀 Governance-First ReAct Loop Demo\n'));

async function demo() {
  // Example 1: Simple file reading task
  console.log(chalk.bold('Example 1: Read package.json\n'));
  
  const loop1 = new GovernedAgentLoop({
    input: 'Read package.json and tell me the project name and version',
    mode: 'command',
    history: []
  }, {
    maxTurns: 10,
    autoApproveLowRisk: true, // Auto-approve read operations
    verbose: false
  });

  await loop1.run();

  // Example 2: List files with approval
  console.log(chalk.bold('\nExample 2: List files (requires approval)\n'));
  
  const loop2 = new GovernedAgentLoop({
    input: 'List all TypeScript files in src/agent directory',
    mode: 'command',
    history: []
  }, {
    maxTurns: 10,
    autoApproveLowRisk: false, // Require approval for all actions
    verbose: false
  });

  await loop2.run();

  console.log(chalk.bold.green('\n✅ Demo completed!\n'));
  console.log(chalk.gray('The GovernedAgentLoop enforces human oversight at every step,'));
  console.log(chalk.gray('ensuring AI never executes actions without explicit approval.\n'));
}

demo().catch(error => {
  console.error(chalk.red('❌ Demo failed:'), error);
  process.exit(1);
});
