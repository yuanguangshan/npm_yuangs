export interface TaskStatus {
    index: number;
    description: string;
    completed: boolean;
    execStatus?: 'pending' | 'in_progress' | 'done' | 'failed';
    reviewScore?: number;
    reviewIssues?: string[];
    attempts?: number;
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
 * 获取下一个待执行的任务
 */
export declare function getNextTask(tasks: TaskStatus[]): TaskStatus | null;
/**
 * 计算进度
 */
export declare function calculateProgress(tasks: TaskStatus[]): {
    completed: number;
    total: number;
};
