import { TodoMetadata } from './TodoManager';
export interface WorkflowState {
    sessionId: string;
    startTime: string;
    lastUpdateTime: string;
    maxTasks: number;
    tasksExecuted: number;
    currentTaskIndex?: number;
    model: string;
    options: {
        minScore: number;
        skipReview: boolean;
        saveOnly: boolean;
        commit?: boolean;
        commitMessage?: string;
    };
}
export declare class ProgressManager {
    private baseDir;
    private state;
    private stateFilePath;
    constructor(baseDir?: string);
    /**
     * 初始化新的工作流
     */
    initialize(options: WorkflowState['options']): Promise<void>;
    /**
     * 保存当前状态
     */
    save(): Promise<void>;
    /**
     * 加载之前的状态
     */
    load(): Promise<WorkflowState | null>;
    /**
     * 更新任务执行计数
     */
    incrementTaskExecuted(): Promise<void>;
    /**
     * 更新当前任务索引
     */
    updateCurrentTask(index: number): Promise<void>;
    /**
     * 清除状态
     */
    clear(): Promise<void>;
    /**
     * 检查是否有未完成的工作流
     */
    hasIncompleteWorkflow(): Promise<boolean>;
    /**
     * 获取当前状态
     */
    getState(): WorkflowState | null;
    /**
     * 获取工作流摘要
     */
    getSummary(): string | null;
    /**
     * 恢复工作流选项
     */
    resume(): Promise<WorkflowState>;
    /**
     * 导出进度报告
     */
    exportReport(todoMetadata: TodoMetadata): Promise<string>;
}
