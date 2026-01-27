"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdapter = void 0;
const BaseAdapter_1 = require("../BaseAdapter");
const types_1 = require("../types");
/**
 * Gemini CLI 适配器
 * 支持 Gemini 系列模型
 * 使用 https://github.com/google-gemini/gemini-cli
 */
class GoogleAdapter extends BaseAdapter_1.BaseAdapter {
    name = 'google-gemini';
    version = '1.0.0';
    provider = 'Google';
    capabilities = {
        supportedTaskTypes: [
            types_1.TaskType.CODE_GENERATION,
            types_1.TaskType.CODE_REVIEW,
            types_1.TaskType.CONVERSATION,
            types_1.TaskType.TRANSLATION,
            types_1.TaskType.SUMMARIZATION,
            types_1.TaskType.ANALYSIS,
            types_1.TaskType.DEBUG,
            types_1.TaskType.GENERAL,
        ],
        maxContextWindow: 1000000, // Gemini 1M+ context
        avgResponseTime: 2000,
        costLevel: 2,
        supportsStreaming: true,
        specialCapabilities: ['long-context', 'multimodal'],
    };
    /**
     * 健康检查：检查 Gemini CLI 是否安装并已配置
     */
    async healthCheck() {
        try {
            const available = await this.checkCommand('gemini');
            if (!available) {
                console.warn('⚠️  Gemini CLI 未安装');
                return false;
            }
            // 检查版本以确认安装
            const { stdout } = await this.runSpawnCommand('gemini', ['--version'], 30000 // 增加超时时间，gemini cli 启动较慢
            );
            if (!stdout.trim())
                return false;
            // 检查是否配置了 API key 环境变量
            if (!process.env.GEMINI_API_KEY) {
                console.warn('⚠️  未配置 GEMINI_API_KEY 环境变量');
                return false;
            }
            // 基本检查通过，认为可用
            // 实际的 API 调用会在 execute 中进行
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 执行任务
     */
    async execute(prompt, config, onChunk) {
        try {
            const { result, executionTime } = await this.measureExecutionTime(async () => {
                // 根据任务类型选择合适的模型
                const model = this.selectModel(config.type);
                // 构建参数数组
                const args = [
                    '--model', model,
                    '--prompt', prompt,
                    '--output-format', 'json' // 使用 JSON 格式输出
                ];
                const { stdout, stderr } = await this.runSpawnCommand('gemini', args, config.expectedResponseTime || 30000, onChunk);
                // 检查是否有 API key 错误
                if (stdout.includes('GEMINI_API_KEY') || stderr.includes('GEMINI_API_KEY')) {
                    throw new Error('未配置 GEMINI_API_KEY 环境变量。请设置后重试。');
                }
                if (stderr && !stdout) {
                    throw new Error(stderr);
                }
                // 解析输出
                return this.parseGeminiOutput(stdout);
            });
            return this.createSuccessResult(result, executionTime, {
                model: this.selectModel(config.type),
                provider: this.provider,
            });
        }
        catch (error) {
            return this.createErrorResult(`Gemini CLI 执行失败: ${error.message}`, 0);
        }
    }
    /**
     * 根据任务类型选择模型
     */
    selectModel(taskType) {
        switch (taskType) {
            case types_1.TaskType.CODE_GENERATION:
            case types_1.TaskType.CODE_REVIEW:
                return 'gemini-1.5-pro';
            case types_1.TaskType.CONVERSATION:
            case types_1.TaskType.GENERAL:
                return 'gemini-1.5-flash';
            default:
                return 'gemini-1.5-flash';
        }
    }
    /**
     * 解析 Gemini CLI 输出
     */
    parseGeminiOutput(output) {
        try {
            // Gemini CLI 在 JSON 模式下输出结构化数据
            const jsonContent = this.extractJsonContent(output);
            if (jsonContent !== output) {
                try {
                    const parsed = JSON.parse(jsonContent);
                    // Gemini CLI JSON 输出格式: { response: "...", ... }
                    if (parsed.response) {
                        return parsed.response;
                    }
                    // 如果没有 response 字段，尝试其他可能的字段
                    if (parsed.text) {
                        return parsed.text;
                    }
                    if (parsed.content) {
                        return parsed.content;
                    }
                    // 如果是 Google API 格式
                    if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                        return parsed.candidates[0].content.parts[0].text;
                    }
                    return jsonContent;
                }
                catch {
                    // JSON 解析失败，继续处理
                }
            }
            // 如果不是 JSON 格式，直接返回清理后的文本
            const lines = output.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 0 &&
                    !trimmed.startsWith('[') &&
                    !trimmed.startsWith('WARNING') &&
                    !trimmed.startsWith('Updates');
            });
            return lines.join('\n').trim();
        }
        catch {
            return output.trim();
        }
    }
}
exports.GoogleAdapter = GoogleAdapter;
//# sourceMappingURL=GoogleAdapter.js.map