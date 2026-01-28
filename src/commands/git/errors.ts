/**
 * Git 命令自定义错误类型
 * 
 * 提供类型安全的错误处理，避免依赖字符串匹配
 * 携带结构化上下文信息，提升错误处理和日志能力
 */

/**
 * 基础 Git 错误
 */
export class GitError extends Error {
    /** 错误发生的时间戳 */
    readonly timestamp: Date;

    /** 额外的上下文数据 */
    readonly context?: Record<string, any>;

    constructor(message: string, context?: Record<string, any>) {
        super(message);
        this.name = 'GitError';
        this.timestamp = new Date();
        this.context = context;

        // 修复原型链，确保 instanceof 在所有环境下正常工作
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * 获取格式化的错误信息（包含上下文）
     */
    getDetailedMessage(): string {
        let msg = `[${this.name}] ${this.message}`;

        if (this.context && Object.keys(this.context).length > 0) {
            msg += `\\n上下文: ${JSON.stringify(this.context, null, 2)}`;
        }

        return msg;
    }
}

/**
 * 未找到变更错误
 */
export class NoChangesFoundError extends GitError {
    /** 检查的 commit 引用 */
    readonly commitRef?: string;

    /** 检查的文件列表 */
    readonly files?: string[];

    constructor(message: string = 'No changes found', options?: {
        commitRef?: string;
        files?: string[];
        context?: Record<string, any>;
    }) {
        super(message, options?.context);
        this.name = 'NoChangesFoundError';
        this.commitRef = options?.commitRef;
        this.files = options?.files;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Commit 不存在错误
 */
export class CommitNotFoundError extends GitError {
    /** 查找的 commit 引用 */
    readonly commitRef: string;

    /** 仓库路径 */
    readonly repoPath?: string;

    constructor(commitRef: string, options?: {
        repoPath?: string;
        context?: Record<string, any>;
    }) {
        super(`Commit not found: ${commitRef}`, options?.context);
        this.name = 'CommitNotFoundError';
        this.commitRef = commitRef;
        this.repoPath = options?.repoPath;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * 无审查内容错误
 */
export class NoReviewContentError extends GitError {
    /** 尝试审查的文件列表 */
    readonly files?: string[];

    /** 是否检查了 staged 文件 */
    readonly checkedStaged?: boolean;

    /** 是否检查了 unstaged 文件 */
    readonly checkedUnstaged?: boolean;

    constructor(message: string = 'No changes to review', options?: {
        files?: string[];
        checkedStaged?: boolean;
        checkedUnstaged?: boolean;
        context?: Record<string, any>;
    }) {
        super(message, options?.context);
        this.name = 'NoReviewContentError';
        this.files = options?.files;
        this.checkedStaged = options?.checkedStaged;
        this.checkedUnstaged = options?.checkedUnstaged;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * 检查错误是否为特定类型
 */
export function isGitError(error: unknown): error is GitError {
    return error instanceof GitError;
}

export function isNoChangesFoundError(error: unknown): error is NoChangesFoundError {
    return error instanceof NoChangesFoundError;
}

export function isCommitNotFoundError(error: unknown): error is CommitNotFoundError {
    return error instanceof CommitNotFoundError;
}

export function isNoReviewContentError(error: unknown): error is NoReviewContentError {
    return error instanceof NoReviewContentError;
}

/**
 * 从任意错误中提取详细信息
 * 
 * @param error 任意错误对象
 * @returns 格式化的错误信息
 */
export function getErrorDetails(error: unknown): string {
    if (isGitError(error)) {
        return error.getDetailedMessage();
    }

    if (error instanceof Error) {
        return `[${error.name}] ${error.message}`;
    }

    return String(error);
}
