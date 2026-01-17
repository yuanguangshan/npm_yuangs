export type ReplayMode = 'strict' | 'compatible' | 're-evaluate';
export interface ReplayOptions {
    mode: ReplayMode;
    skipAI?: boolean;
    verbose?: boolean;
}
export interface ReplayResult {
    success: boolean;
    message: string;
    executedModel?: string;
    deviationReason?: string;
}
export declare class ReplayEngine {
    replay(recordId: string, options?: ReplayOptions): Promise<ReplayResult>;
    private strictReplay;
    private compatibleReplay;
    private reEvaluate;
}
export declare const replayEngine: ReplayEngine;
