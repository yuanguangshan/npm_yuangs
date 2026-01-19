/**
 * yuangs Completion Protocol v1.1
 * 终态补全协议 - 唯一、强约束
 */
export interface CompletionRequest {
    /**
     * 完整 argv，不包含 node
     * e.g. ['yuangs', 'ai', 'chat', '--m']
     */
    words: string[];
    /**
     * cursor 所在 index
     */
    currentIndex: number;
}
export interface CompletionItem {
    label: string;
    insertText?: string;
    detail?: string;
}
export interface CompletionResponse {
    items: CompletionItem[];
    isPartial: boolean;
}
