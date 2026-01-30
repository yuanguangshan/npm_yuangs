import {
    AgentIntent,
    AgentContext,
    AgentMode,
    AgentPrompt,
} from './types';
import { buildCommandPrompt as buildCommandPromptString } from '../ai/prompt';
import { getOSProfile } from '../core/os';
import { getMacros } from '../core/macros';
import { aiCommandPlanSchema } from '../core/validation';
import { getRelevantSkills } from './skills';
import {
    buildDynamicContext,
    injectDynamicContext,
    DynamicContext
} from './dynamicPrompt';
import {
    buildV2_3ProtocolPrompt,
    buildOutputConstraints,
    ProtocolV2_3Config
} from './protocolV2_2';

export function buildPrompt(
    intent: AgentIntent,
    context: AgentContext,
    mode: AgentMode,
    input: string
): AgentPrompt {
    if (mode === 'chat') {
        return buildChatPrompt(context, input);
    }

    return buildCommandPromptObject(input, context);
}

function buildChatPrompt(
    context: AgentContext,
    input: string
): AgentPrompt {
    const messages: any[] = [
        ...(context.history ?? []),
    ];

    // Add context files if available
    let contextDesc = '';
    if (context.files && context.files.length > 0) {
        contextDesc = context.files.map(f =>
            `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
        ).join('\n\n');
    }

    messages.push({
        role: 'user',
        content: input,
    });

    const v2Config: ProtocolV2_3Config = {
        mode: input.includes('#protocol') ? 'workflow' : 'chat',
        enableStrictOutput: false,
        enableReasoningTrace: true
    };

    const baseSystemPrompt = buildV2_3ProtocolPrompt(v2Config);
    const outputConstraints = buildOutputConstraints();

    const dynamicContext: DynamicContext = {};
    const systemPrompt = injectDynamicContext(
        `${baseSystemPrompt}\n${outputConstraints}`,
        dynamicContext
    );

    return {
        system: systemPrompt,
        messages,
    };
}

function buildCommandPromptObject(
    input: string,
    context: AgentContext
): AgentPrompt {
    const os = getOSProfile();
    const macros = getMacros();
    const skills = getRelevantSkills(input);
    let promptText = buildCommandPromptString(input, os, macros);

    if (skills.length > 0) {
        const skillList = skills.map(s => `- ${s.name}: 当遇到 "${s.whenToUse}" 时，你可以参考计划: ${s.planTemplate.goal}`).join('\n');
        promptText = `【参考技能库】\n${skillList}\n\n${promptText}`;
    }

    const v2Config: ProtocolV2_3Config = {
        mode: input.includes('#chat') ? 'chat' : 'command',
        enableStrictOutput: true,
        enableReasoningTrace: true
    };

    const systemPrompt = buildV2_3ProtocolPrompt(v2Config);

    return {
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: promptText,
            },
        ],
        outputSchema: aiCommandPlanSchema,
    };
}
