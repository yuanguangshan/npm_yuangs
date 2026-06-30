"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAdapter = void 0;
const llm_1 = require("./llm");
const client_1 = require("../ai/client");
const json5_1 = __importDefault(require("json5"));
const protocolV2_2_1 = require("./protocolV2_2");
class LLMAdapter {
    static async think(messages, mode = 'chat', onChunk, model, customSystemPrompt, contextManager) {
        // chat 模式使用轻量 chat prompt（通用助手 + 默认直接回答，不输出 PHASE 标签）；
        // command/workflow/replanning 模式沿用完整 agent 协议。
        const protocol = mode === 'chat'
            ? (0, protocolV2_2_1.buildChatProtocolPrompt)()
            : (() => {
                const v2Config = {
                    mode: 'command',
                    enableStrictOutput: true,
                    enableReasoningTrace: true
                };
                let p = (0, protocolV2_2_1.buildV2_3ProtocolPrompt)(v2Config);
                p += `\n${(0, protocolV2_2_1.buildOutputConstraints)()}`;
                if (mode === 'command' || mode === 'command+exec') {
                    p += `\n\nCOMMAND MODE ACTIVE:
- Prioritize "shell_cmd" for any terminal-based task.
- Minimize "answer" type unless task is purely conversational.
- Direct execution is expected.`;
                }
                return p;
            })();
        const prompt = {
            system: customSystemPrompt ? `${protocol}\n\nGOVERNANCE POLICY:\n${customSystemPrompt}` : protocol,
            messages,
        };
        const config = (0, client_1.getUserConfig)();
        const finalModel = model || config.defaultModel || 'Assistant';
        const result = await (0, llm_1.runLLM)({
            prompt,
            model: finalModel,
            stream: !!onChunk,
            onChunk,
            bypassRouter: !!model // Explicitly requested model bypasses routing
        });
        const thought = this.parseThought(result.rawText);
        thought.modelName = result.modelName || finalModel;
        thought.usedRouter = result.usedRouter;
        return thought;
    }
    // 合法 action_type（与 state.ts ProposedAction.type / llm.ts AgentActionSchema 一致）
    static VALID_ACTION_TYPES = new Set(['tool_call', 'shell_cmd', 'answer', 'code_diff']);
    static parseThought(raw) {
        // CoT V2.3: 提取 PHASE 1: THINK 块或 [THOUGHT] 块
        const thoughtMatch = raw.match(/\[PHASE 1: THINK - 深度推理\]([\s\S]*?)\[PHASE 2/) ||
            raw.match(/\[THOUGHT\]([\s\S]*?)\[\/THOUGHT\]/);
        const thoughtContent = thoughtMatch ? thoughtMatch[1].trim() : '';
        const parsed = this.extractJSON(raw);
        if (!parsed) {
            // 解析失败时，回退到将原始内容作为回答
            return {
                raw,
                parsedPlan: {},
                isDone: true,
                type: 'answer',
                payload: { content: raw },
                reasoning: ''
            };
        }
        // === 校正 action_type ===
        // 弱模型常见错误：把工具名当 action_type（如 "action_type":"search_in_files"），或给出非法值。
        // 统一兜底，避免非法 type 把"本应直接回答"拖入工具死循环。
        const rawActionType = parsed.action_type;
        const hasTool = !!(parsed.tool_name || parsed.tool);
        const hasCommand = !!(parsed.command || parsed.cmd);
        const hasDiff = !!(parsed.diff || parsed.patch);
        let inferredType;
        if (typeof rawActionType === 'string' && LLMAdapter.VALID_ACTION_TYPES.has(rawActionType)) {
            inferredType = rawActionType;
        }
        else if (hasTool) {
            inferredType = 'tool_call';
        }
        else if (hasCommand) {
            inferredType = 'shell_cmd';
        }
        else if (hasDiff) {
            inferredType = 'code_diff';
        }
        else {
            inferredType = 'answer';
        }
        // 合法但语义矛盾：声明要调工具/执行命令，却缺少必要字段 → 当作回答，避免执行失败死循环
        if (inferredType === 'tool_call' && !hasTool)
            inferredType = 'answer';
        if (inferredType === 'shell_cmd' && !hasCommand)
            inferredType = 'answer';
        // 明确 answer 或 is_done → 任务结束
        if (parsed.is_done === true || inferredType === 'answer') {
            return {
                raw,
                parsedPlan: parsed,
                isDone: true,
                type: 'answer',
                payload: {
                    content: parsed.final_answer || parsed.content || parsed.text || raw
                },
                reasoning: thoughtContent
            };
        }
        return {
            raw,
            parsedPlan: parsed,
            isDone: false,
            type: inferredType,
            payload: {
                tool_name: parsed.tool_name || parsed.tool || '',
                parameters: parsed.parameters || parsed.params || {},
                command: parsed.command || parsed.cmd || '',
                diff: parsed.diff || parsed.patch || '',
                content: parsed.content || parsed.text || '',
                risk_level: parsed.risk_level || 'low',
                risk_explanation: parsed.risk_explanation || ''
            },
            reasoning: thoughtContent
        };
    }
    /**
     * 从 AI 响应中鲁棒地提取 JSON
     * 优先级：```json 代码块 > ``` 代码块 > 最外层完整 JSON 对象 > 修复后的 JSON
     */
    static extractJSON(raw) {
        // 1. 尝试 ```json 代码块
        const jsonBlockMatch = raw.match(/```json\s*\n([\s\S]*?)\n\s*```/);
        if (jsonBlockMatch) {
            try {
                return json5_1.default.parse(jsonBlockMatch[1]);
            }
            catch { /* continue */ }
        }
        // 2. 尝试 ``` 代码块（无 json 标记）
        const codeBlockMatch = raw.match(/```\s*\n([\s\S]*?)\n\s*```/);
        if (codeBlockMatch) {
            try {
                return json5_1.default.parse(codeBlockMatch[1]);
            }
            catch { /* continue */ }
        }
        // 3. 使用平衡括号匹配找到最外层 JSON 对象
        const balancedJson = this.findBalancedJSON(raw);
        if (balancedJson) {
            try {
                return json5_1.default.parse(balancedJson);
            }
            catch { /* continue */ }
        }
        // 4. 尝试修复常见的 JSON 格式问题
        const repaired = this.repairAndParse(raw);
        if (repaired) {
            try {
                return json5_1.default.parse(repaired);
            }
            catch { /* give up */ }
        }
        return null;
    }
    /**
     * 使用平衡括号匹配找到 JSON 对象，避免 /\{[\s\S]*\}/ 的贪婪匹配问题
     */
    static findBalancedJSON(raw) {
        let braceCount = 0;
        let start = -1;
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (ch === '\\') {
                escapeNext = true;
                continue;
            }
            if (ch === '"') {
                inString = !inString;
                continue;
            }
            if (inString)
                continue;
            if (ch === '{') {
                if (braceCount === 0)
                    start = i;
                braceCount++;
            }
            else if (ch === '}') {
                braceCount--;
                if (braceCount === 0 && start !== -1) {
                    return raw.slice(start, i + 1);
                }
            }
        }
        return null;
    }
    /**
     * 尝试修复常见的 JSON 格式问题
     */
    static repairAndParse(raw) {
        // 尝试找到 { ... } 范围
        const start = raw.indexOf('{');
        if (start === -1)
            return null;
        let candidate = raw.slice(start);
        // 移除末尾的非 JSON 文本
        const lastBrace = candidate.lastIndexOf('}');
        if (lastBrace !== -1) {
            candidate = candidate.slice(0, lastBrace + 1);
        }
        // 修复尾部逗号
        candidate = candidate.replace(/,(\s*[}\]])/g, '$1');
        // 修复未闭合的字符串（在末尾添加引号）
        const quoteCount = (candidate.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            candidate = candidate.replace(/"$/, ''); // 移除尾部的孤引号
        }
        return candidate;
    }
}
exports.LLMAdapter = LLMAdapter;
//# sourceMappingURL=llmAdapter.js.map