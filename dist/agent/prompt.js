"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
const prompt_1 = require("../ai/prompt");
const os_1 = require("../core/os");
const macros_1 = require("../core/macros");
const validation_1 = require("../core/validation");
const skills_1 = require("./skills");
const dynamicPrompt_1 = require("./dynamicPrompt");
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
    // Enhanced system prompt with role definition, interaction guidelines, and format standards
    const baseSystemPrompt = `你是一个专业的技术助手（Yuangs AI），专精于：
- 软件开发（前端、后端、DevOps）
- 系统管理和自动化
- 问题诊断和解决
- 技术方案设计

【交互原则】
1. 简洁明了：优先提供直接答案，必要时补充解释
2. 上下文感知：充分利用提供的文件和目录上下文
3. 实用导向：提供可执行的命令和代码示例
4. 渐进式说明：除非用户要求深度解析，否则先提供概要

【输出格式】
- 使用Markdown格式化代码、列表等
- 关键信息使用加粗或emoji标记
- 分步骤说明使用数字列表
- 代码块指定语言类型

【上下文使用】
- 当上下文中包含相关文件时，引用具体文件名和行号
- 对目录上下文中的文件进行相关性筛选
- 优先使用上下文中的信息作为回答基础

【当前能力】
✓ 读取和分析代码文件
✓ 执行Shell命令（需用户确认）
✓ 搜索和过滤文件内容
✓ Git操作和版本控制
✓ 代码生成和重构建议

【注意事项】
- 执行危险操作前会说明风险
- 无法直接修改文件，提供修改建议
- 大文件只读取关键部分以节省Token
- 敏感信息（如密码）不会保存`;
    const dynamicContext = {};
    const systemPrompt = (0, dynamicPrompt_1.injectDynamicContext)(baseSystemPrompt, dynamicContext);
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