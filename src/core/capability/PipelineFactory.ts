import {
    CapabilityPipeline,
    PipelineStage,
    PipelineConfig,
    CapabilityLevel,
} from './Pipeline';
import { ThresholdDegradationPolicy, NoOpDegradationPolicy, DegradationPolicy } from './DegradationPolicy';
import { CostProfileCalculator, CostProfileOptions } from './CostProfile';
import { ConsoleLogger } from './Logger';

/**
 * Pipeline 工厂配置
 */
export interface PipelineFactoryOptions {
    /** 降级策略类型 */
    degradationType?: 'threshold' | 'noop';
    /** 成本计算配置 */
    costProfileOptions?: CostProfileOptions;
    /** 是否启用自动降级 */
    autoDegradation?: boolean;
    /** 最大执行时间 */
    maxExecutionTime?: number;
    /** 置信度阈值 */
    confidenceThreshold?: number;
}

/**
 * Pipeline 工厂
 *
 * 提供预定义的 Pipeline 模板，快速创建符合不同场景的 Pipeline
 */
export class PipelineFactory {
    /**
     * 创建代码审查 Pipeline
     */
    static createCodeReviewPipeline(options: PipelineFactoryOptions = {}): CapabilityPipeline {
        const degradationPolicy: DegradationPolicy = options.degradationType === 'noop'
            ? new NoOpDegradationPolicy()
            : new ThresholdDegradationPolicy({
                timeLimit: options.maxExecutionTime ?? 30000,
                confidenceThreshold: options.confidenceThreshold ?? 0.7,
            });

        const stages: PipelineStage[] = [
            {
                name: 'preprocessing',
                minCapability: {
                    minCapability: CapabilityLevel.TEXT,
                    fallbackChain: [CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 预处理阶段：文本清理、格式化
                    console.log('   📝 预处理代码变更...');
                    return {
                        success: true,
                        data: { preprocessed: true },
                        confidence: 1.0,
                        capability: CapabilityLevel.TEXT,
                    };
                },
            },
            {
                name: 'analysis',
                minCapability: {
                    minCapability: CapabilityLevel.STRUCTURAL,
                    fallbackChain: [CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 分析阶段：代码结构分析、依赖分析
                    console.log('   🔍 分析代码结构...');
                    return {
                        success: true,
                        data: { analyzed: true },
                        confidence: 0.9,
                        capability: CapabilityLevel.STRUCTURAL,
                    };
                },
            },
            {
                name: 'review',
                minCapability: {
                    minCapability: CapabilityLevel.SEMANTIC,
                    fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 审查阶段：语义理解、问题发现
                    console.log('   👨‍💻 执行代码审查...');
                    // 实际审查逻辑由外部实现
                    return {
                        success: true,
                        data: { reviewed: true },
                        confidence: 0.85,
                        capability: CapabilityLevel.SEMANTIC,
                    };
                },
            },
        ];

        const config: PipelineConfig = {
            stages,
            degradationPolicy: degradationPolicy ?? new ThresholdDegradationPolicy(),
            costCalculator: new CostProfileCalculator(options.costProfileOptions),
            autoDegradation: options.autoDegradation ?? true,
            maxExecutionTime: options.maxExecutionTime ?? 30000,
            confidenceThreshold: options.confidenceThreshold ?? 0.7,
        };

        return new CapabilityPipeline(config);
    }

    /**
     * 创建代码生成 Pipeline
     */
    static createCodeGenerationPipeline(options: PipelineFactoryOptions = {}): CapabilityPipeline {
        const degradationPolicy: DegradationPolicy = options.degradationType === 'noop'
            ? new NoOpDegradationPolicy()
            : new ThresholdDegradationPolicy({
                timeLimit: options.maxExecutionTime ?? 60000,
                confidenceThreshold: options.confidenceThreshold ?? 0.75,
            });

        const stages: PipelineStage[] = [
            {
                name: 'context_gathering',
                minCapability: {
                    minCapability: CapabilityLevel.TEXT,
                    fallbackChain: [CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 上下文收集阶段
                    console.log('   📚 收集项目上下文...');
                    return {
                        success: true,
                        data: { context: 'gathered' },
                        confidence: 1.0,
                        capability: CapabilityLevel.TEXT,
                    };
                },
            },
            {
                name: 'planning',
                minCapability: {
                    minCapability: CapabilityLevel.STRUCTURAL,
                    fallbackChain: [CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 规划阶段：生成代码结构
                    console.log('   📋 规划代码结构...');
                    return {
                        success: true,
                        data: { plan: 'created' },
                        confidence: 0.9,
                        capability: CapabilityLevel.STRUCTURAL,
                    };
                },
            },
            {
                name: 'generation',
                minCapability: {
                    minCapability: CapabilityLevel.SEMANTIC,
                    fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 生成阶段：生成代码
                    console.log('   ⚙️  生成代码...');
                    return {
                        success: true,
                        data: { code: 'generated' },
                        confidence: 0.85,
                        capability: CapabilityLevel.SEMANTIC,
                    };
                },
            },
            {
                name: 'validation',
                minCapability: {
                    minCapability: CapabilityLevel.STRUCTURAL,
                    fallbackChain: [CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // 验证阶段：代码质量检查
                    console.log('   ✅ 验证代码质量...');
                    return {
                        success: true,
                        data: { validated: true },
                        confidence: 0.9,
                        capability: CapabilityLevel.STRUCTURAL,
                    };
                },
            },
        ];

        const config: PipelineConfig = {
            stages,
            degradationPolicy: degradationPolicy ?? new ThresholdDegradationPolicy(),
            costCalculator: new CostProfileCalculator(options.costProfileOptions),
            autoDegradation: options.autoDegradation ?? true,
            maxExecutionTime: options.maxExecutionTime ?? 60000,
            confidenceThreshold: options.confidenceThreshold ?? 0.75,
        };

        return new CapabilityPipeline(config);
    }

    /**
     * 创建 Commit Message 生成 Pipeline
     */
    static createCommitMessagePipeline(options: PipelineFactoryOptions = {}): CapabilityPipeline {
        const degradationPolicy: DegradationPolicy = options.degradationType === 'noop'
            ? new NoOpDegradationPolicy()
            : new ThresholdDegradationPolicy({
                timeLimit: options.maxExecutionTime ?? 15000,
                confidenceThreshold: options.confidenceThreshold ?? 0.7,
            });

        const stages: PipelineStage[] = [
            {
                name: 'diff_analysis',
                minCapability: {
                    minCapability: CapabilityLevel.TEXT,
                    fallbackChain: [CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // Diff 分析阶段
                    console.log('   📊 分析代码变更...');
                    return {
                        success: true,
                        data: { diff: 'analyzed' },
                        confidence: 1.0,
                        capability: CapabilityLevel.TEXT,
                    };
                },
            },
            {
                name: 'message_generation',
                minCapability: {
                    minCapability: CapabilityLevel.SEMANTIC,
                    fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
                },
                execute: async (context) => {
                    // Message 生成阶段
                    console.log('   ✍️  生成 Commit Message...');
                    return {
                        success: true,
                        data: { message: 'generated' },
                        confidence: 0.9,
                        capability: CapabilityLevel.SEMANTIC,
                    };
                },
            },
        ];

        const config: PipelineConfig = {
            stages,
            degradationPolicy: degradationPolicy ?? new ThresholdDegradationPolicy(),
            costCalculator: new CostProfileCalculator(options.costProfileOptions),
            autoDegradation: options.autoDegradation ?? true,
            maxExecutionTime: options.maxExecutionTime ?? 15000,
            confidenceThreshold: options.confidenceThreshold ?? 0.7,
        };

        return new CapabilityPipeline(config);
    }

    /**
     * 创建自定义 Pipeline
     */
    static createCustomPipeline(
        stages: PipelineStage[],
        options: PipelineFactoryOptions = {}
    ): CapabilityPipeline {
        const degradationPolicy: DegradationPolicy = options.degradationType === 'noop'
            ? new NoOpDegradationPolicy()
            : new ThresholdDegradationPolicy({
                timeLimit: options.maxExecutionTime ?? 30000,
                confidenceThreshold: options.confidenceThreshold ?? 0.7,
            });

        const config: PipelineConfig = {
            stages,
            degradationPolicy: degradationPolicy ?? new ThresholdDegradationPolicy(),
            costCalculator: new CostProfileCalculator(options.costProfileOptions),
            autoDegradation: options.autoDegradation ?? true,
            maxExecutionTime: options.maxExecutionTime ?? 30000,
            confidenceThreshold: options.confidenceThreshold ?? 0.7,
        };

        return new CapabilityPipeline(config);
    }
}
