"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyEntrySchema = exports.macroSchema = exports.appsConfigSchema = exports.userConfigSchema = exports.aiFixPlanSchema = exports.aiCommandPlanSchema = exports.DEFAULT_APPS = exports.DEFAULT_ACCOUNT_TYPE = exports.DEFAULT_MODEL = exports.DEFAULT_AI_PROXY_URL = void 0;
exports.extractJSON = extractJSON;
exports.safeParseJSON = safeParseJSON;
exports.parseUserConfig = parseUserConfig;
exports.parseAppsConfig = parseAppsConfig;
exports.parseMacros = parseMacros;
exports.parseCommandHistory = parseCommandHistory;
const zod_1 = require("zod");
exports.DEFAULT_AI_PROXY_URL = 'https://aiproxy.want.biz/v1/chat/completions';
exports.DEFAULT_MODEL = 'Assistant';
exports.DEFAULT_ACCOUNT_TYPE = 'free';
exports.DEFAULT_APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
};
exports.aiCommandPlanSchema = zod_1.z.object({
    plan: zod_1.z.string().describe('Explanation of the command'),
    command: zod_1.z.string().optional().describe('The shell command to execute'),
    macro: zod_1.z.string().optional().describe('Name of an existing macro to reuse'),
    risk: zod_1.z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
}).refine(data => data.command || data.macro, {
    message: 'Either command or macro must be provided'
});
exports.aiFixPlanSchema = zod_1.z.object({
    plan: zod_1.z.string().describe('Fix explanation'),
    command: zod_1.z.string().describe('The fixed shell command (always required for fixes)'),
    risk: zod_1.z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
});
exports.userConfigSchema = zod_1.z.object({
    defaultModel: zod_1.z.string().optional(),
    aiProxyUrl: zod_1.z.string().url().optional(),
    accountType: zod_1.z.enum(['free', 'pro']).optional()
});
exports.appsConfigSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.string());
exports.macroSchema = zod_1.z.object({
    commands: zod_1.z.string(),
    description: zod_1.z.string(),
    createdAt: zod_1.z.string()
});
exports.historyEntrySchema = zod_1.z.object({
    question: zod_1.z.string(),
    command: zod_1.z.string(),
    time: zod_1.z.string()
});
function extractJSON(raw) {
    let jsonContent = raw.trim();
    if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
    }
    else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
    }
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    return jsonContent;
}
function safeParseJSON(raw, schema, fallback) {
    try {
        const jsonContent = extractJSON(raw);
        const result = schema.safeParse(JSON.parse(jsonContent));
        if (result.success) {
            return { success: true, data: result.data };
        }
        else {
            return { success: false, error: result.error };
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { success: false, error };
        }
        return {
            success: false,
            error: new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
                    path: []
                }
            ])
        };
    }
}
function parseUserConfig(content) {
    return exports.userConfigSchema.parse(JSON.parse(content));
}
function parseAppsConfig(content) {
    return exports.appsConfigSchema.parse(JSON.parse(content));
}
function parseMacros(content) {
    const parsed = JSON.parse(content);
    const macros = {};
    for (const [name, value] of Object.entries(parsed)) {
        macros[name] = exports.macroSchema.parse(value);
    }
    return macros;
}
function parseCommandHistory(content) {
    const parsed = JSON.parse(content);
    return zod_1.z.array(exports.historyEntrySchema).parse(parsed);
}
//# sourceMappingURL=validation.js.map