export interface TaskStatus {
    index: number;
    description: string;
    completed: boolean;
    execStatus?: 'pending' | 'in_progress' | 'done' | 'failed';
    reviewScore?: number;
    reviewIssues?: string[];
    attempts?: number;
    backupId?: string;
    dependsOn?: number[];
    priority?: 'high' | 'medium' | 'low';
}
export interface TodoMetadata {
    generatedAt?: string;
    context?: string;
    progress?: {
        completed: number;
        total: number;
    };
    currentTask?: number;
}
/**
 * 解析 todo.md 文件
 */
export declare function parseTodoFile(filePath: string): Promise<{
    metadata: TodoMetadata;
    tasks: TaskStatus[];
    rawContent: string;
}>;
/**
 * 更新任务状态
 */
export declare function updateTaskStatus(filePath: string, taskIndex: number, updates: Partial<TaskStatus>): Promise<void>;
/**
 * 更新元数据
 */
export declare function updateMetadata(filePath: string, updates: Partial<TodoMetadata>): Promise<void>;
/**
 * 获取下一个待执行的任务（考虑依赖关系）
 */
export declare function getNextTask(tasks: TaskStatus[]): TaskStatus | null;
/**
 * 验证任务的依赖关系
 */
export declare function validateDependencies(tasks: TaskStatus[]): {
    valid: boolean;
    errors: string[];
};
/**
 * 获取任务的执行顺序
 */
export declare function getExecutionOrder(tasks: TaskStatus[]): number[];
/**
 * 计算进度
 */
export declare function calculateProgress(tasks: TaskStatus[]): {
    completed: number;
    total: number;
};
