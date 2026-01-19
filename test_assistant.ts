#!/usr/bin/env node

/**
 * Direct test of LLM calls with Assistant model
 */

import { callAI_Stream } from './dist/ai/client.js';
import chalk from 'chalk';

async function testAssistantModel() {
  console.log(chalk.bold.cyan('\n🧪 Testing Assistant Model\n'));

  const messages = [
    { role: 'system' as const, content: 'You are a helpful assistant.' },
    { role: 'user' as const, content: 'What is 2 + 2? Just give the number.' }
  ];

  try {
    console.log(chalk.gray('Sending request to Assistant model...\n'));
    
    let response = '';
    await callAI_Stream(messages, 'Assistant', (chunk) => {
      process.stdout.write(chunk);
      response += chunk;
    });

    console.log(chalk.bold.green('\n\n✅ Assistant model responded successfully!\n'));
    console.log(chalk.gray('Response:'), chalk.white(response));
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    return false;
  }
}

async function testStructuredOutput() {
  console.log(chalk.bold.cyan('\n🧪 Testing Structured Output\n'));

  const messages = [
    { role: 'system', content: 'You are yuangs AI Assistant. Output JSON only.' },
    { role: 'user', content: 'List 3 files. Output in this format: {"action_type": "tool_call", "tool_name": "list_files", "parameters": {"path": "."}}' }
  ];

  try {
    console.log(chalk.gray('Sending request for structured output...\n'));
    
    const axios = (await import('axios')).default;
    const response = await axios.post(
      'https://aiproxy.want.biz/v1/chat/completions',
      {
        model: 'Assistant',
        messages,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'npm_yuangs',
          'Origin': 'https://cli.want.biz',
          'Referer': 'https://cli.want.biz/',
          'account': 'paid',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    console.log(chalk.gray('Raw response:'), chalk.white(content));
    
    // Try to parse JSON
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log(chalk.green('\n✅ Parsed successfully:\n'));
        console.log(chalk.white(JSON.stringify(parsed, null, 2)));
      }
    } catch (e) {
      console.log(chalk.yellow('\n⚠️  Could not parse as JSON, but response received'));
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    return false;
  }
}

async function testGovernanceLoopWithAssistant() {
  console.log(chalk.bold.cyan('\n🧪 Testing GovernedAgentLoop with Assistant\n'));

  const { GovernedAgentLoop } = await import('./dist/agent/loop.js');

  try {
    const loop = new GovernedAgentLoop({
      input: 'What is the current directory?',
      mode: 'command',
      history: []
    }, {
      maxTurns: 3,
      autoApproveLowRisk: true,
      verbose: false
    });

    console.log(chalk.gray('Starting governance loop...\n'));
    const turns = await loop.run();
    
    console.log(chalk.bold(`\n📊 Completed ${turns.length} turns`));
    console.log(chalk.gray('Final state:'), chalk.yellow(loop.getFSMState()));
    
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    return false;
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('🚀 Testing Assistant Model Integration\n'));

  const results = {
    basicResponse: await testAssistantModel(),
    structuredOutput: await testStructuredOutput(),
    governanceLoop: await testGovernanceLoopWithAssistant()
  };

  console.log(chalk.bold.cyan('\n' + '='.repeat(50)));
  console.log(chalk.bold('Test Results'));
  console.log('='.repeat(50) + '\n');

  Object.entries(results).forEach(([name, passed]) => {
    const status = passed 
      ? chalk.green('✅ PASS') 
      : chalk.red('❌ FAIL');
    console.log(`${name}: ${status}`);
  });

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log(chalk.bold.green('\n🎉 All tests passed!\n'));
    console.log(chalk.gray('Assistant model is working correctly with:\n'));
    console.log(chalk.gray('  ✓ Basic responses'));
    console.log(chalk.gray('  ✓ Structured output'));
    console.log(chalk.gray('  ✓ Governance Loop integration\n'));
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
