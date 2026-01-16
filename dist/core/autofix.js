"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoFixCommand = autoFixCommand;
const prompt_1 = require("../ai/prompt");
const client_1 = require("../ai/client");
const validation_1 = require("./validation");
async function autoFixCommand(originalCmd, stderr, os, model) {
    const prompt = (0, prompt_1.buildFixPrompt)(originalCmd, stderr, os);
    const raw = await (0, client_1.askAI)(prompt, model);
    const parseResult = (0, validation_1.safeParseJSON)(raw, validation_1.aiFixPlanSchema, {});
    if (!parseResult.success) {
        return null;
    }
    return parseResult.data;
}
//# sourceMappingURL=autofix.js.map