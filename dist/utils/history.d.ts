export type HistoryEntry = {
    question: string;
    command: string;
    time: string;
};
export declare function getCommandHistory(): HistoryEntry[];
export declare function saveHistory(entry: {
    question: string;
    command: string;
}): void;
