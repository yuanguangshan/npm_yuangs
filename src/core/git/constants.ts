/**
 * Git 模块公共常量
 */

/** todo.md 元数据行前缀 */
export const METADATA_PREFIX = '>';

/** 默认 todo 文件名 */
export const TODO_FILENAME = 'todo.md';

/** 默认规划提示词 */
export const DEFAULT_PLAN_PROMPT = '分析项目现状并规划下一步开发任务';

/** 默认 AI 模型 */
export const DEFAULT_AI_MODEL = 'Assistant';

/** 最大重试次数 */
export const MAX_RETRY_ATTEMPTS = 2;

/** 最低审查分数 */
export const MIN_REVIEW_SCORE = 85;

/** 代码审查失败时的默认分数 */
export const REVIEW_FAILURE_SCORE = 60;
