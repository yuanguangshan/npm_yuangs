"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoFixCommand = autoFixCommand;
const prompt_1 = require("../ai/prompt");
const client_1 = require("../ai/client");
async function autoFixCommand(originalCmd, stderr, os, model) {
    const prompt = (0, prompt_1.buildFixPrompt)(originalCmd, stderr, os);
    const raw = await (0, client_1.askAI)(prompt, model);
    try {
        // Extract JSON if AI wrapped it in triple backticks
        let jsonContent = raw;
        if (raw.includes('```json')) {
            jsonContent = raw.split('```json')[1].split('```')[0].trim();
        }
        else if (raw.includes('```')) {
            jsonContent = raw.split('```')[1].split('```')[0].trim();
        }
        return JSON.parse(jsonContent);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=autofix.js.map