/**
 * Base error class for all yuangs errors
 */
export class YuangsError extends Error {
    public readonly code: string;
    public readonly suggestions?: string[];

    constructor(message: string, code: string = 'UNKNOWN_ERROR', suggestions?: string[]) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.suggestions = suggestions;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Errors related to Git operations
 */
export class GitError extends YuangsError {
    constructor(message: string, suggestions?: string[]) {
        super(message, 'GIT_ERROR', suggestions);
    }
}

/**
 * Errors related to AI planning
 */
export class PlanError extends YuangsError {
    constructor(message: string, suggestions?: string[]) {
        super(message, 'PLAN_ERROR', suggestions);
    }
}

/**
 * Errors related to AI code review
 */
export class ReviewError extends YuangsError {
    constructor(message: string, suggestions?: string[]) {
        super(message, 'REVIEW_ERROR', suggestions);
    }
}

/**
 * Errors related to configuration
 */
export class ConfigError extends YuangsError {
    constructor(message: string, suggestions?: string[]) {
        super(message, 'CONFIG_ERROR', suggestions);
    }
}

/**
 * Errors related to user policy/safety
 */
export class PolicyError extends YuangsError {
    constructor(message: string, suggestions?: string[]) {
        super(message, 'POLICY_ERROR', suggestions);
    }
}
