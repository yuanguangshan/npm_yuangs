/**
 * [Action 1] 唯一的上帝视角 Loop
 * 整合了原来的 Loop, Agent, Executor, Context
 */
export declare class Kernel {
    private state;
    /**
     * 核心循环：想 -> 评 -> 行
     */
    step(intent: string): Promise<void>;
    private think;
    private logAudit;
}
