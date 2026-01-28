import { CapabilityLevel, MinCapability, canExecute } from './CapabilityLevel';
import { CostProfile, CostProfileCalculator } from './CostProfile';
import { DegradationPolicy, DecisionInput, DegradationDecision, NoOpDegradationPolicy } from './DegradationPolicy';
import { Logger, ConsoleLogger } from './Logger';

/**
 * Pipeline 元数据接口
 * 类型安全，避免使用 Record<string, any>
 */
export interface PipelineMetadata {
    costProfile?: CostProfile;
    [key: string]: unknown;
}

/**
 * Pipeline 阶段接口
 */
export interface PipelineStage {
    name: string;
    minCapability: MinCapability;
    execute: (context: PipelineContext) => Promise<PipelineResult>;
}

/**
 * Pipeline 上下文
 * 包含执行过程中的所有状态信息
 */
export interface PipelineContext {
    /** 任务描述 */
    taskDescription: string;
    /** 涉及的文件列表 */
    files: string[];
    /** 总行数 */
    totalLines: number;
    /** 用户提供的额外数据 */
    metadata?: PipelineMetadata;
    /** 当前能力等级 */
    currentCapability: CapabilityLevel;
    /** 执行历史（用于分析降级原因） */
    executionHistory: ExecutionRecord[];
}

/**
 * 执行记录
 * 包含实际执行时的能力等级
 */
export interface ExecutionRecord {
    stage: string;
    actualCapability: CapabilityLevel;
    startTime: number;
    endTime: number;
    success: boolean;
    confidence: number;
    degradationApplied?: boolean;
    degradationReason?: string;
}

/**
 * Pipeline 执行结果
 * capability 字段明确表示最终达到的能力等级
 */
export interface PipelineResult {
    success: boolean;
    data?: unknown;
    error?: Error;
    confidence: number;
    finalCapability: CapabilityLevel;
    degradation?: {
        applied: boolean;
        originalLevel: CapabilityLevel;
        targetLevel: CapabilityLevel;
        reason: string;
    };
}

/**
 * Pipeline 配置
 */
export interface PipelineConfig {
    /** 阶段列表 */
    stages: PipelineStage[];
    /** 降级策略 */
    degradationPolicy: DegradationPolicy;
    /** 成本计算器 */
    costCalculator: CostProfileCalculator;
    /** 日志记录器 */
    logger: Logger;
    /** 是否启用自动降级 */
    autoDegradation: boolean;
    /** 最大执行时间（毫秒） */
    maxExecutionTime?: number;
    /** 置信度阈值 */
    confidenceThreshold?: number;
}

/**
 * Pipeline 执行统计
 */
export interface PipelineStats {
    /** 总执行时间（毫秒） */
    totalTime: number;
    /** 总 token 消耗 */
    totalTokens: number;
    /** 实际达到的能力等级 */
    finalCapability: CapabilityLevel;
    /** 降级次数 */
    degradationCount: number;
    /** 执行的阶段数 */
    stagesExecuted: number;
    /** 成功的阶段数 */
    stagesSucceeded: number;
}

/**
 * 能力感知的 Pipeline 执行器
 *
 * 核心功能：
 * 1. 根据任务复杂度自动计算能力需求
 * 2. 执行过程中动态调整能力等级
 * 3. 支持优雅降级（Graceful Degradation）
 * 4. 提供完整的执行追踪和统计
 */
export class CapabilityPipeline {
    private config: PipelineConfig;

    constructor(config: Partial<PipelineConfig> = {}) {
        this.config = {
            stages: [],
            degradationPolicy: new NoOpDegradationPolicy(),
            costCalculator: new CostProfileCalculator(),
            logger: new ConsoleLogger(),
            autoDegradation: true,
            maxExecutionTime: 30000,
            confidenceThreshold: 0.7,
            ...config,
        };
    }

    /**
     * 计算任务的成本和能力需求
     */
    calculateCostProfile(files: string[], totalLines: number): CostProfile {
        return this.config.costCalculator.calculate(files, totalLines);
    }

    /**
     * 创建 Pipeline 上下文
     */
    createContext(taskDescription: string, files: string[], totalLines: number): PipelineContext {
        const costProfile = this.calculateCostProfile(files, totalLines);

        return {
            taskDescription,
            files,
            totalLines,
            metadata: {
                costProfile,
            },
            currentCapability: costProfile.requiredCapability,
            executionHistory: [],
        };
    }

    /**
     * 执行 Pipeline
     */
    async execute(context: PipelineContext): Promise<PipelineResult & { stats: PipelineStats }> {
        const startTime = Date.now();
        const executionHistory: ExecutionRecord[] = [];
        let degradationCount = 0;
        let stagesSucceeded = 0;
        let totalTokens = 0;

        // 获取成本信息（安全校验）
        const costProfile = context.metadata?.costProfile;
        if (!costProfile) {
            throw new Error('Cost profile not found in context metadata. Please use createContext() to initialize.');
        }

        this.config.logger.info(`\n📊 Pipeline 启动`);
        this.config.logger.info(`   任务: ${context.taskDescription}`);
        this.config.logger.info(`   文件: ${context.files.length} 个 (${context.totalLines} 行)`);
        this.config.logger.info(`   要求能力: ${costProfile.requiredCapability} (${this.describeCapability(costProfile.requiredCapability)})`);
        this.config.logger.info(`   预计时间: ${costProfile.estimatedTime}ms`);
        this.config.logger.info(`   预计 Token: ${costProfile.estimatedTokens}\n`);

        for (const stage of this.config.stages) {
            const stageStartTime = Date.now();
            this.config.logger.info(`🔄 执行阶段: ${stage.name}`);

            // 检查当前能力是否满足阶段最低要求
            if (!canExecute(context.currentCapability, stage.minCapability.minCapability)) {
                this.config.logger.warn(`⚠️  当前能力 ${context.currentCapability} 不满足阶段要求 ${stage.minCapability.minCapability}`);
                this.config.logger.warn(`   尝试降级到 ${stage.minCapability.minCapability}\n`);

                // 直接降级到阶段要求的最低能力
                context.currentCapability = stage.minCapability.minCapability;
            }

            try {
                // 执行阶段
                const result = await stage.execute(context);
                const timeElapsed = Date.now() - stageStartTime;

                // 记录执行历史
                const record: ExecutionRecord = {
                    stage: stage.name,
                    actualCapability: context.currentCapability,
                    startTime: stageStartTime,
                    endTime: Date.now(),
                    success: result.success,
                    confidence: result.confidence,
                };
                executionHistory.push(record);

                // 统计 token 使用（从结果中提取）
                if (result.data && typeof result.data === 'object' && 'tokensUsed' in result.data) {
                    totalTokens += (result.data as any).tokensUsed as number || 0;
                }

                if (!result.success) {
                    this.config.logger.error(`❌ 阶段失败: ${stage.name}`);
                    this.config.logger.error(`   错误: ${result.error?.message}\n`);

                    return {
                        success: false,
                        error: result.error,
                        confidence: result.confidence,
                        finalCapability: context.currentCapability,
                        stats: this.buildStats(executionHistory, degradationCount, stagesSucceeded, totalTokens, Date.now() - startTime),
                    };
                }

                stagesSucceeded++;

                // 检查是否需要降级
                if (this.config.autoDegradation) {
                    const decisionInput: DecisionInput = {
                        timeElapsed,
                        confidence: result.confidence,
                    };

                    const decision = this.config.degradationPolicy.decide(decisionInput, stage.minCapability);

                    if (decision.shouldDegrade) {
                        degradationCount++;
                        this.config.logger.warn(`⚠️  降级触发: ${decision.reason}`);
                        this.config.logger.warn(`   ${context.currentCapability} → ${decision.targetLevel}\n`);

                        // 更新上下文能力等级
                        context.currentCapability = decision.targetLevel;
                        record.degradationApplied = true;
                        record.degradationReason = decision.reason;
                    }
                }

                // 如果有数据，传递给下一个阶段
                if (result.data !== undefined) {
                    context.metadata = {
                        ...context.metadata,
                        [`${stage.name}_result`]: result.data,
                    };
                }

                this.config.logger.info(`✅ 阶段完成: ${stage.name} (${timeElapsed}ms, 置信度 ${(result.confidence * 100).toFixed(1)}%)\n`);

            } catch (error) {
                const timeElapsed = Date.now() - stageStartTime;

                // 记录失败历史
                const record: ExecutionRecord = {
                    stage: stage.name,
                    actualCapability: context.currentCapability,
                    startTime: stageStartTime,
                    endTime: Date.now(),
                    success: false,
                    confidence: 0,
                };
                executionHistory.push(record);

                this.config.logger.error(`❌ 阶段异常: ${stage.name}`);
                this.config.logger.error(`   错误: ${(error as Error).message}\n`);

                return {
                    success: false,
                    error: error as Error,
                    confidence: 0,
                    finalCapability: context.currentCapability,
                    stats: this.buildStats(executionHistory, degradationCount, stagesSucceeded, totalTokens, Date.now() - startTime),
                };
            }
        }

        // 所有阶段执行完成
        const finalResult: PipelineResult = {
            success: true,
            data: context.metadata,
            confidence: this.calculateOverallConfidence(executionHistory),
            finalCapability: context.currentCapability,
        };

        if (degradationCount > 0) {
            const firstDegradation = executionHistory.find(r => r.degradationApplied);
            const lastCapability = firstDegradation?.actualCapability || context.currentCapability;
            finalResult.degradation = {
                applied: true,
                originalLevel: lastCapability,
                targetLevel: context.currentCapability,
                reason: `${degradationCount} 次降级，最终达到 ${context.currentCapability}`,
            };
        }

        return {
            ...finalResult,
            stats: this.buildStats(executionHistory, degradationCount, stagesSucceeded, totalTokens, Date.now() - startTime),
        };
    }

    /**
     * 计算总体置信度
     * 使用加权平均策略，而非简单的最小值
     */
    private calculateOverallConfidence(history: ExecutionRecord[]): number {
        if (history.length === 0) return 0;

        // 使用加权平均，最近执行的阶段权重更高
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < history.length; i++) {
            const weight = i + 1; // 后面的阶段权重更高
            weightedSum += history[i].confidence * weight;
            totalWeight += weight;
        }

        return weightedSum / totalWeight;
    }

    /**
     * 构建统计信息
     */
    private buildStats(
        history: ExecutionRecord[],
        degradationCount: number,
        stagesSucceeded: number,
        totalTokens: number,
        totalTime: number
    ): PipelineStats {
        const finalCapability = history.length > 0
            ? history[history.length - 1].actualCapability
            : CapabilityLevel.NONE;

        return {
            totalTime,
            totalTokens,
            finalCapability,
            degradationCount,
            stagesExecuted: history.length,
            stagesSucceeded,
        };
    }

    /**
     * 描述能力等级
     */
    private describeCapability(level: CapabilityLevel): string {
        const labels = {
            [CapabilityLevel.SEMANTIC]: '语义理解',
            [CapabilityLevel.STRUCTURAL]: '结构分析',
            [CapabilityLevel.LINE]: '行级操作',
            [CapabilityLevel.TEXT]: '文本处理',
            [CapabilityLevel.NONE]: '无智能要求',
        };
        return labels[level];
    }
}
