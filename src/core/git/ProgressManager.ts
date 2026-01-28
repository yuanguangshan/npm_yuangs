import fs from 'fs';
import path from 'path';
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

export class ProgressManager {
    private state: WorkflowState | null = null;
    private stateFilePath: string;

    constructor(private baseDir: string = process.cwd()) {
        const stateDir = path.join(baseDir, '.yuangs', 'progress');
        this.stateFilePath = path.join(stateDir, 'workflow-state.json');
    }

    /**
     * 初始化新的工作流
     */
    async initialize(options: WorkflowState['options']): Promise<void> {
        await fs.promises.mkdir(path.dirname(this.stateFilePath), { recursive: true });
        
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        this.state = {
            sessionId,
            startTime: now,
            lastUpdateTime: now,
            maxTasks: options.commit ? parseInt(options.commit as any) || 5 : 5,
            tasksExecuted: 0,
            model: 'Assistant',
            options
        };
        
        await this.save();
    }

    /**
     * 保存当前状态
     */
    async save(): Promise<void> {
        if (!this.state) {
            throw new Error('No workflow state to save');
        }
        
        this.state.lastUpdateTime = new Date().toISOString();
        
        const stateDir = path.dirname(this.stateFilePath);
        await fs.promises.mkdir(stateDir, { recursive: true });
        await fs.promises.writeFile(
            this.stateFilePath,
            JSON.stringify(this.state, null, 2),
            'utf8'
        );
    }

    /**
     * 加载之前的状态
     */
    async load(): Promise<WorkflowState | null> {
        try {
            const content = await fs.promises.readFile(this.stateFilePath, 'utf8');
            this.state = JSON.parse(content) as WorkflowState;
            return this.state;
        } catch (error) {
            return null;
        }
    }

    /**
     * 更新任务执行计数
     */
    async incrementTaskExecuted(): Promise<void> {
        if (!this.state) return;
        
        this.state.tasksExecuted++;
        await this.save();
    }

    /**
     * 更新当前任务索引
     */
    async updateCurrentTask(index: number): Promise<void> {
        if (!this.state) return;
        
        this.state.currentTaskIndex = index;
        await this.save();
    }

    /**
     * 清除状态
     */
    async clear(): Promise<void> {
        try {
            await fs.promises.unlink(this.stateFilePath);
            this.state = null;
        } catch (error) {
            // 忽略文件不存在的错误
        }
    }

    /**
     * 检查是否有未完成的工作流
     */
    async hasIncompleteWorkflow(): Promise<boolean> {
        const state = await this.load();
        if (!state) return false;
        
        // 检查 todo.md 是否存在
        const todoPath = path.join(this.baseDir, 'todo.md');
        if (!fs.existsSync(todoPath)) return false;
        
        return true;
    }

    /**
     * 获取当前状态
     */
    getState(): WorkflowState | null {
        return this.state;
    }

    /**
     * 获取工作流摘要
     */
    getSummary(): string | null {
        if (!this.state) return null;
        
        const elapsed = Date.now() - new Date(this.state.startTime).getTime();
        const elapsedMinutes = Math.floor(elapsed / 60000);
        
        return `
工作流会话: ${this.state.sessionId}
开始时间: ${new Date(this.state.startTime).toLocaleString()}
已运行: ${elapsedMinutes} 分钟
已执行任务: ${this.state.tasksExecuted}/${this.state.maxTasks}
当前任务: ${this.state.currentTaskIndex !== undefined ? `#${this.state.currentTaskIndex + 1}` : 'N/A'}
`;
    }

    /**
     * 恢复工作流选项
     */
    async resume(): Promise<WorkflowState> {
        const state = await this.load();
        if (!state) {
            throw new Error('No workflow state to resume');
        }
        
        return state;
    }

    /**
     * 导出进度报告
     */
    async exportReport(todoMetadata: TodoMetadata): Promise<string> {
        const state = await this.load();
        if (!state) {
            throw new Error('No workflow state found');
        }
        
        const reportPath = path.join(path.dirname(this.stateFilePath), `report-${state.sessionId}.md`);
        
        const report = `# Git Auto Workflow Report

## 会话信息
- **Session ID**: ${state.sessionId}
- **开始时间**: ${new Date(state.startTime).toLocaleString()}
- **最后更新**: ${new Date(state.lastUpdateTime).toLocaleString()}

## 工作流配置
- **最大任务数**: ${state.maxTasks}
- **AI 模型**: ${state.model}
- **最低审查分数**: ${state.options.minScore}
- **跳过审查**: ${state.options.skipReview ? '是' : '否'}

## 执行进度
- **已执行任务**: ${state.tasksExecuted}
- **当前任务**: #${state.currentTaskIndex ? state.currentTaskIndex + 1 : 'N/A'}

## Todo 文件进度
${todoMetadata.progress ? `- 已完成: ${todoMetadata.progress.completed}/${todoMetadata.progress.total}` : '- 未可用'}
${todoMetadata.currentTask ? `- 当前任务: #${todoMetadata.currentTask}` : ''}

## 选项
- **自动提交**: ${state.options.commit ? '是' : '否'}
- **保存模式**: ${state.options.saveOnly ? '仅保存' : '写入文件'}
${state.options.commitMessage ? `- **提交消息**: ${state.options.commitMessage}` : ''}
`;
        
        await fs.promises.writeFile(reportPath, report, 'utf8');
        return reportPath;
    }
}
