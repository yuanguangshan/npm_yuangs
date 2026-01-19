import { ExecutionRecord } from './executionRecord';
/**
 * Explain Output Spec v1
 * - Stable, human-readable, diff-friendly
 * - No side effects
 * - Do NOT change without bumping spec version
 */
export declare function explainExecution(record: ExecutionRecord): string;
