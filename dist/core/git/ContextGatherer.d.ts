import { GitService } from './GitService';
/**
 * 收集到的项目上下文接口
 */
export interface GatheredContext {
    fileTree: string;
    packageJson?: any;
    relevantFiles: {
        path: string;
        content: string;
    }[];
    summary: string;
}
/**
 * 项目上下文采集器
 * 负责为 LLM 提供项目现状的真实快照
 */
export declare class ContextGatherer {
    private gitService;
    private MAX_FILE_CONTENT_LENGTH;
    private MAX_TOTAL_CONTEXT_LENGTH;
    constructor(gitService: GitService);
    /**
     * 采集项目上下文
     * @param taskDescription 当前任务描述，用于启发式搜索相关文件
     */
    gather(taskDescription: string): Promise<GatheredContext>;
    /**
     * 获取文件树 (git 管理的文件)
     */
    private getFileTree;
    /**
     * 读取 package.json
     */
    private getPackageJson;
    /**
     * 根据任务描述寻找相关文件
     */
    private getRelevantFiles;
}
