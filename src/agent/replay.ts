import { ExecutionRecord } from './record';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { AgentIntent } from './types';

export async function replay(record: ExecutionRecord) {
    console.log(`\nReplaying execution: ${record.id}`);
    console.log(`Original timestamp: ${new Date(record.timestamp).toISOString()}`);
    console.log(`Mode: ${record.mode}\n`);

    const result = await runLLM({
        prompt: record.prompt,
        model: record.model,
        stream: record.mode === 'chat',
        onChunk: record.mode === 'chat'
            ? (s) => process.stdout.write(s)
            : undefined,
    });

    // Create a minimal intent for interpretation
    const intent: AgentIntent = {
        type: record.mode === 'chat' ? 'chat' : 'shell',
        capabilities: {},
    };

    return interpretResultToPlan(result, intent, record.mode);
}
