/**
 * 录像帧类型定义
 *
 * 格式遵循 asciinema cast v2 (NDJSON) + yuangs 扩展
 * [time, type, data, meta?]
 */
export type Frame = [number, 'o', string] | [number, 'i', string, any?] | [number, 'r', string] | [number, 'g', string, any?];
/**
 * 录像元数据头
 */
export interface CastHeader {
    version: number;
    width: number;
    height: number;
    timestamp: number;
    title?: string;
    env?: Record<string, string>;
    command?: string;
    theme?: object;
}
/**
 * 录像机
 *
 * 职责:
 * - 以流式 NDJSON 格式记录会话
 * - 记录时间戳 (相对时间)
 * - 保证数据落盘安全性
 */
export declare class Recorder {
    private startTime;
    private stream;
    private filePath;
    private writeQueue;
    private draining;
    constructor(options: {
        user: string;
        host: string;
        width: number;
        height: number;
        command?: string;
    });
    /**
     * 计算相对时间 (秒, 浮点数)
     */
    private now;
    /**
     * 写入帧
     */
    private writeFrame;
    /**
     * 记录输出 (Output)
     */
    recordOutput(data: string | Buffer): void;
    /**
     * 记录输入 (Input)
     */
    recordInput(data: string, meta?: any): void;
    /**
     * 记录窗口调整 (Resize)
     */
    recordResize(cols: number, rows: number): void;
    /**
     * 记录治理事件 (Governance) - yuangs 扩展
     */
    recordGovernance(event: string, details?: any): void;
    /**
     * 结束录制
     */
    close(): void;
    getFilePath(): string;
}
