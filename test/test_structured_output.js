/**
 * Test script for Native Structured Output implementation
 */

const { runLLM } = require('./dist/agent/llm.js');

async function testNativeStructuredOutput() {
  console.log('Testing Native Structured Output...\n');

  const testCases = [
    {
      name: 'GPT-4o (supports structured output)',
      model: 'gpt-4o',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'count files in /tmp' }]
      }
    },
    {
      name: 'Claude-3.5 (supports structured output)',
      model: 'claude-3.5-sonnet',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'list files' }]
      }
    },
    {
      name: 'Assistant (no structured output)',
      model: 'Assistant',
      prompt: {
        system: '[SYSTEM PROTOCOL V2.2]',
        messages: [{ role: 'user', content: 'test' }]
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    try {
      const result = await runLLM({
        prompt: testCase.prompt,
        model: testCase.model,
        stream: false
      });

      console.log(`Latency: ${result.latencyMs}ms`);
      console.log(`Response length: ${result.rawText?.length || 0} chars`);
      console.log(`Parsed: ${result.parsed ? 'Yes' : 'No'}`);

      if (result.parsed) {
        console.log('Parsed action:', JSON.stringify(result.parsed, null, 2));
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testNativeStructuredOutput().catch(console.error);
