import { AgentThought } from './state';
import type { AIRequestMessage } from '../core/validation';
import { ContextManager } from './contextManager';
export declare class LLMAdapter {
    static think(messages: AIRequestMessage[], mode?: 'chat' | 'command' | 'command+exec', onChunk?: (chunk: string, type?: 'thought' | 'json') => void, model?: string, customSystemPrompt?: string, contextManager?: ContextManager): Promise<AgentThought>;
    static parseThought(raw: string): AgentThought;
    /**
     * 从 AI 响应中鲁棒地提取 JSON
     * 优先级：```json 代码块 > ``` 代码块 > 最外层完整 JSON 对象 > 修复后的 JSON
     */
    private static extractJSON;
    /**
     * 使用平衡括号匹配找到 JSON 对象，避免 /\{[\s\S]*\}/ 的贪婪匹配问题
     */
    private static findBalancedJSON;
    /**
     * 尝试修复常见的 JSON 格式问题
     */
    private static repairAndParse;
}
