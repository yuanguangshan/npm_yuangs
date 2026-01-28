"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YuangsAdapter = void 0;
const BaseAdapter_1 = require("../BaseAdapter");
const types_1 = require("../types");
const client_1 = require("../../../ai/client");
/**
 * Yuangs 内部适配器
 * 调用 yuangs 自带的 AI 客户端，通常对应配置文件中的 "Assistant" 模型
 */
class YuangsAdapter extends BaseAdapter_1.BaseAdapter {
    name = 'yuangs';
    version = '1.0.0';
    provider = 'Internal';
    capabilities = {
        supportedTaskTypes: [
            types_1.TaskType.CODE_GENERATION,
            types_1.TaskType.CODE_REVIEW,
            types_1.TaskType.CONVERSATION,
            types_1.TaskType.TRANSLATION,
            types_1.TaskType.SUMMARIZATION,
            types_1.TaskType.ANALYSIS,
            types_1.TaskType.DEBUG,
            types_1.TaskType.COMMAND_GENERATION,
            types_1.TaskType.GENERAL,
        ],
        maxContextWindow: 128000,
        avgResponseTime: 1000,
        costLevel: 1,
        supportsStreaming: true,
    };
    async isAvailable() {
        return true;
    }
    async healthCheck() {
        return true;
    }
    async execute(prompt, config, onChunk) {
        const startTime = Date.now();
        try {
            const messages = typeof prompt === 'string'
                ? [{ role: 'user', content: prompt }]
                : prompt;
            if (onChunk) {
                let fullContent = '';
                await (0, client_1.callAI_Stream)(messages, undefined, // 使用默认模型 (Assistant)
                (chunk) => {
                    fullContent += chunk;
                    onChunk(chunk);
                });
                return this.createSuccessResult(fullContent, Date.now() - startTime);
            }
            else {
                // askAI 目前只支持 string prompt，我们需要转换回来或者让它支持 messages
                const singlePrompt = typeof prompt === 'string'
                    ? prompt
                    : prompt.map(m => `${m.role}: ${m.content}`).join('\n\n');
                const response = await (0, client_1.askAI)(singlePrompt);
                return this.createSuccessResult(response, Date.now() - startTime);
            }
        }
        catch (error) {
            return this.createErrorResult(error.message, Date.now() - startTime);
        }
    }
}
exports.YuangsAdapter = YuangsAdapter;
//# sourceMappingURL=YuangsAdapter.js.map