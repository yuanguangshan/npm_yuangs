import { AIRequestMessage } from './validation';
export declare function appendMessageToDB(role: string, content: string): void;
export declare function getRecentMessagesFromDB(limit?: number): AIRequestMessage[];
export declare function clearMessagesInDB(): void;
