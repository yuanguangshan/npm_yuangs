export interface ChatPreferences {
    verbosity: 'concise' | 'normal' | 'detailed';
    language: 'zh-CN' | 'en-US' | 'auto';
    codeStyle: 'functional' | 'imperative' | 'any';
    explanation: 'technical' | 'beginner' | 'adaptive';
    outputFormat: 'markdown' | 'plain' | 'structured';
    autoConfirm: boolean;
    contextStrategy: 'smart' | 'minimal' | 'full';
}
export declare class PreferencesManager {
    private static preferences;
    static getPreferences(): ChatPreferences;
    static setPreferences(updates: Partial<ChatPreferences>): void;
    static getPreference<K extends keyof ChatPreferences>(key: K): ChatPreferences[K];
    private static savePreferences;
    static loadPreferences(): void;
    static resetPreferences(): void;
}
export declare function buildPersonalizedPrompt(basePrompt: string, preferences?: Partial<ChatPreferences>): string;
export declare function applyOutputFormat(content: string, format: 'markdown' | 'plain' | 'structured'): string;
export declare function buildContextStrategyPrompt(strategy: 'smart' | 'minimal' | 'full'): string;
