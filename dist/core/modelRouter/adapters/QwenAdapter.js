"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QwenAdapter = void 0;
const BaseAdapter_1 = require("../BaseAdapter");
const types_1 = require("../types");
/**
 * Qwen CLI 适配器
 * 支持通义千问系列模型
 */
class QwenAdapter extends BaseAdapter_1.BaseAdapter {
    name = 'qwen';
    version = '1.0.0';
    provider = 'Alibaba';
    capabilities = {
        supportedTaskTypes: [
            types_1.TaskType.CODE_GENERATION,
            types_1.TaskType.CODE_REVIEW,
            types_1.TaskType.CONVERSATION,
            types_1.TaskType.TRANSLATION,
            types_1.TaskType.SUMMARIZATION,
            types_1.TaskType.ANALYSIS,
            types_1.TaskType.COMMAND_GENERATION,
            types_1.TaskType.DEBUG,
            types_1.TaskType.GENERAL,
        ],
        maxContextWindow: 32000,
        avgResponseTime: 1500,
        costLevel: 2,
        supportsStreaming: true,
        specialCapabilities: ['chinese-optimized', 'code-specialized'],
    };
    /**
     * 健康检查：检查 qwen CLI 是否安装
     */
    async healthCheck() {
        try {
            await this.checkCommand('qwen');
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
                // 根据任务类型选择模型
                const model = this.selectModel(config.type);
                // 构建带上下文的完整prompt（如果配置中启用了上下文）
                const useContext = config.metadata?.useContext !== false;
                const fullPrompt = useContext ? this.buildPromptWithContext(prompt) : prompt;
                // 构建参数数组，prompt 作为位置参数
                const args = [fullPrompt];
                // 添加模型参数
                if (model) {
                    args.push('-m', model);
                }
                // 使用 spawn 执行命令
                const { stdout, stderr } = await this.runSpawnCommand('qwen', args, config.expectedResponseTime || 30000, onChunk);
                if (stderr && !stdout) {
                    throw new Error(stderr);
                }
                // 解析输出
                const response = this.parseQwenOutput(stdout);
                // 保存到上下文
                if (useContext) {
                    this.saveToContext(prompt, response);
                }
                return response;
            });
            return this.createSuccessResult(result, executionTime, {
                model: this.selectModel(config.type),
                provider: this.provider,
            });
        }
        catch (error) {
            return this.createErrorResult(`Qwen CLI 执行失败: ${error.message}`, 0);
        }
    }
    /**
     * 根据任务类型选择模型
     */
    selectModel(taskType) {
        switch (taskType) {
            case types_1.TaskType.CODE_GENERATION:
            case types_1.TaskType.CODE_REVIEW:
                return 'qwen-coder-plus';
            case types_1.TaskType.CONVERSATION:
            case types_1.TaskType.TRANSLATION:
                return 'qwen-plus';
            case types_1.TaskType.COMMAND_GENERATION:
                return 'qwen-turbo';
            default:
                return 'qwen-plus';
        }
    }
    /**
     * 解析 Qwen CLI 输出
     */
    parseQwenOutput(output) {
        try {
            // 提取 JSON 内容（处理 CLI 干扰日志）
            const jsonContent = this.extractJsonContent(output);
            // 尝试解析 JSON 格式
            const lines = jsonContent.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed.output?.text) {
                            return parsed.output.text;
                        }
                        if (parsed.response) {
                            return parsed.response;
                        }
                        if (parsed.content) {
                            return parsed.content;
                        }
                    }
                    catch {
                        // 继续尝试下一行
                    }
                }
            }
            // 如果不是 JSON，过滤掉可能的日志行
            const filteredLines = output.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 0 &&
                    !trimmed.startsWith('[INFO]') &&
                    !trimmed.startsWith('[DEBUG]') &&
                    !trimmed.startsWith('[WARN]') &&
                    !trimmed.startsWith('Loading');
            });
            return filteredLines.join('\n').trim();
        }
        catch {
            return output.trim();
        }
    }
}
exports.QwenAdapter = QwenAdapter;
//# sourceMappingURL=QwenAdapter.js.map