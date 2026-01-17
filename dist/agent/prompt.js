"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
const prompt_1 = require("../ai/prompt");
const os_1 = require("../core/os");
const macros_1 = require("../core/macros");
const validation_1 = require("../core/validation");
function buildPrompt(intent, context, mode, input) {
    if (mode === 'chat') {
        return buildChatPrompt(context, input);
    }
    return buildCommandPromptObject(input, context);
}
function buildChatPrompt(context, input) {
    const messages = [
        ...(context.history ?? []),
    ];
    // Add context files if available
    if (context.files && context.files.length > 0) {
        const contextDesc = context.files.map(f => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
        messages.push({
            role: 'system',
            content: `Context:\n${contextDesc}`,
        });
    }
    messages.push({
        role: 'user',
        content: input,
    });
    return {
        system: 'You are a helpful AI assistant with expertise in software development, system administration, and problem-solving.',
        messages,
    };
}
function buildCommandPromptObject(input, context) {
    const os = (0, os_1.getOSProfile)();
    const macros = (0, macros_1.getMacros)();
    const promptText = (0, prompt_1.buildCommandPrompt)(input, os, macros);
    return {
        messages: [
            {
                role: 'user',
                content: promptText,
            },
        ],
        outputSchema: validation_1.aiCommandPlanSchema,
    };
}
//# sourceMappingURL=prompt.js.map