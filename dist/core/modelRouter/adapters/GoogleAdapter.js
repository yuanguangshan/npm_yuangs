"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdapter = void 0;
const BaseAdapter_1 = require("../BaseAdapter");
const types_1 = require("../types");
/**
 * Google CLI 适配器
 * 支持 Gemini 系列模型
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
     * 健康检查：检查 gcloud CLI 是否安装
     */
    async healthCheck() {
        try {
            const available = await this.checkCommand('gcloud');
            if (!available)
                return false;
            // 检查是否已认证
            const { stdout } = await this.runSpawnCommand('gcloud', ['auth', 'list', '--format=value(account)']);
            return stdout.trim().length > 0;
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
                // 构建参数数组，显式指定 JSON 格式输出
                const args = [
                    'ai',
                    'models',
                    'generate-content',
                    model,
                    `--prompt=${prompt}`,
                    '--format=json' // 关键：强制 JSON 输出格式
                ];
                const { stdout, stderr } = await this.runSpawnCommand('gcloud', args, config.expectedResponseTime || 30000, onChunk);
                if (stderr && !stdout) {
                    throw new Error(stderr);
                }
                // 解析输出
                return this.parseGoogleOutput(stdout);
            });
            return this.createSuccessResult(result, executionTime, {
                model: this.selectModel(config.type),
                provider: this.provider,
            });
        }
        catch (error) {
            return this.createErrorResult(`Google CLI 执行失败: ${error.message}`, 0);
        }
    }
    /**
     * 根据任务类型选择模型
     */
    selectModel(taskType) {
        switch (taskType) {
            case types_1.TaskType.CODE_GENERATION:
            case types_1.TaskType.CODE_REVIEW:
                return 'gemini-2.5-pro';
            case types_1.TaskType.CONVERSATION:
            case types_1.TaskType.GENERAL:
                return 'gemini-2.5-flash';
            default:
                return 'gemini-2.5-flash';
        }
    }
    /**
     * 解析 Google CLI 输出
     */
    parseGoogleOutput(output) {
        try {
            // 提取 JSON 内容
            const jsonContent = this.extractJsonContent(output);
            if (jsonContent !== output) {
                try {
                    const parsed = JSON.parse(jsonContent);
                    return parsed.candidates?.[0]?.content?.parts?.[0]?.text || jsonContent;
                }
                catch {
                    // JSON 解析失败，继续处理
                }
            }
            // 过滤掉日志行
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