/**
 * 命令边界探测器
 *
 * 职责:
 * - 从字符流中提取完整命令
 * - 只在 Enter 键时触发治理
 *
 * 设计原则:
 * - 不分析字符
 * - 不分析 stdout
 * - 只在换行符时治理
 */
export declare class InputBuffer {
    private buffer;
    /**
     * 推入字符块
     *
     * @param chunk 输入字符
     * @returns 如果检测到完整命令,返回命令字符串;否则返回 null
     */
    push(chunk: string): string | null;
    /**
     * 处理控制字符 (如 Backspace)
     * 模拟终端行为: \x7f (DEL) 或 \b (BS) 删除前一个字符
     */
    static processBackspace(input: string): string;
    /**
     * 清空缓冲区
     */
    clear(): void;
    /**
     * 获取当前缓冲区内容 (用于调试)
     */
    peek(): string;
    /**
     * 检查是否有未处理的内容
     */
    hasContent(): boolean;
}
