/**
 * 回放器
 */
export declare class Replayer {
    private filePath;
    private frames;
    private header?;
    private speed;
    constructor(filePath: string);
    /**
     * 加载录像文件
     */
    load(): Promise<void>;
    /**
     * 播放
     */
    play(speed?: number): Promise<void>;
    private renderFrame;
    private sleep;
}
