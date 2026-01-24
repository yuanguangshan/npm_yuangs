"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
const prompt_1 = require("../ai/prompt");
const os_1 = require("../core/os");
const macros_1 = require("../core/macros");
const validation_1 = require("../core/validation");
const skills_1 = require("./skills");
const dynamicPrompt_1 = require("./dynamicPrompt");
const protocolV2_2_1 = require("./protocolV2_2");
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
    let contextDesc = '';
    if (context.files && context.files.length > 0) {
        contextDesc = context.files.map(f => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
    }
    messages.push({
        role: 'user',
        content: input,
    });
    const v2Config = {
        mode: 'chat',
        enableStrictOutput: false,
        enableReasoningTrace: true
    };
    const baseSystemPrompt = (0, protocolV2_2_1.buildV2_2ProtocolPrompt)(v2Config);
    const outputConstraints = (0, protocolV2_2_1.buildOutputConstraints)();
    const dynamicContext = {};
    const systemPrompt = (0, dynamicPrompt_1.injectDynamicContext)(`${baseSystemPrompt}\n${outputConstraints}`, dynamicContext);
    return {
        system: systemPrompt,
        messages,
    };
}
function buildCommandPromptObject(input, context) {
    const os = (0, os_1.getOSProfile)();
    const macros = (0, macros_1.getMacros)();
    const skills = (0, skills_1.getRelevantSkills)(input);
    let promptText = (0, prompt_1.buildCommandPrompt)(input, os, macros);
    if (skills.length > 0) {
        const skillList = skills.map(s => `- ${s.name}: 当遇到 "${s.whenToUse}" 时，你可以参考计划: ${s.planTemplate.goal}`).join('\n');
        promptText = `【参考技能库】\n${skillList}\n\n${promptText}`;
    }
    const v2Config = {
        mode: 'command',
        enableStrictOutput: true,
        enableReasoningTrace: true
    };
    const systemPrompt = (0, protocolV2_2_1.buildV2_2ProtocolPrompt)(v2Config);
    return {
        system: systemPrompt,
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