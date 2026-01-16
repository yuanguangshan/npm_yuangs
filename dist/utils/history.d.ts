import { type HistoryEntry } from '../core/validation';
export type { HistoryEntry };
export declare function getCommandHistory(): HistoryEntry[];
export declare function saveHistory(entry: {
    question: string;
    command: string;
}): void;
