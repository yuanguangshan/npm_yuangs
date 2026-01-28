import readline from 'readline';
import { ContextStore } from './context';
export declare function handleAIChat(initialQuestion: string | null, model?: string): Promise<void>;
/**
 * 管道流水线执行核心引擎
 */
export declare function runPipeline(input: string, rl: readline.Interface, runtime: any, model: string | undefined, contextStore: ContextStore, processInteraction: (q: string) => Promise<void>): Promise<void>;
/**
 * 分发并处理单个管道片段
 */
export declare function processPipelineSegment(segment: string, upstreamData: string | undefined, isLast: boolean, rl: readline.Interface, processInteraction: (q: string) => Promise<void>): Promise<string | undefined>;
