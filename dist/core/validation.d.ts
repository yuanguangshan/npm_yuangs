import { z } from 'zod';
export type UserConfig = {
    defaultModel?: string;
    aiProxyUrl?: string;
    accountType?: 'free' | 'pro';
    [key: string]: string | undefined;
};
export type AppsConfig = Record<string, string>;
export type AIRequestMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};
export type AIResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
        delta?: {
            content?: string;
        };
    }>;
};
export declare const DEFAULT_AI_PROXY_URL = "https://aiproxy.want.biz/v1/chat/completions";
export declare const DEFAULT_MODEL = "gemini-2.5-flash-lite";
export declare const DEFAULT_ACCOUNT_TYPE: "free";
export declare const DEFAULT_APPS: {
    readonly shici: "https://wealth.want.biz/shici/index.html";
    readonly dict: "https://wealth.want.biz/pages/dict.html";
    readonly pong: "https://wealth.want.biz/pages/pong.html";
};
export declare const aiCommandPlanSchema: z.ZodObject<{
    plan: z.ZodString;
    command: z.ZodOptional<z.ZodString>;
    macro: z.ZodOptional<z.ZodString>;
    risk: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
}, z.core.$strip>;
export type AICommandPlan = z.infer<typeof aiCommandPlanSchema>;
export declare const aiFixPlanSchema: z.ZodObject<{
    plan: z.ZodString;
    command: z.ZodString;
    risk: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
}, z.core.$strip>;
export type AIFixPlan = z.infer<typeof aiFixPlanSchema>;
export declare const userConfigSchema: z.ZodObject<{
    defaultModel: z.ZodOptional<z.ZodString>;
    aiProxyUrl: z.ZodOptional<z.ZodString>;
    accountType: z.ZodOptional<z.ZodEnum<{
        free: "free";
        pro: "pro";
    }>>;
}, z.core.$strip>;
export declare const appsConfigSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const macroSchema: z.ZodObject<{
    commands: z.ZodString;
    description: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type Macro = z.infer<typeof macroSchema>;
export declare const historyEntrySchema: z.ZodObject<{
    question: z.ZodString;
    command: z.ZodString;
    time: z.ZodString;
}, z.core.$strip>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export declare function extractJSON(raw: string): string;
export declare function safeParseJSON<T>(raw: string, schema: z.ZodSchema<T>, fallback: T): {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
export declare function parseUserConfig(content: string): UserConfig;
export declare function parseAppsConfig(content: string): AppsConfig;
export declare function parseMacros(content: string): Record<string, Macro>;
export declare function parseCommandHistory(content: string): HistoryEntry[];
