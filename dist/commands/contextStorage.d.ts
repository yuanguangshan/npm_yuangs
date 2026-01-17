import { ContextItem } from './contextBuffer';
export declare function loadContext(): Promise<ContextItem[]>;
export declare function saveContext(items: ContextItem[]): Promise<void>;
export declare function clearContextStorage(): Promise<void>;
