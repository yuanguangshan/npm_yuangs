"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectModel = selectModel;
function selectModel(intent, override) {
    if (override)
        return override;
    const caps = intent.capabilities;
    // Long context + reasoning = most powerful model
    if (caps.longContext && caps.reasoning) {
        return 'gemini-2.0-flash-exp';
    }
    // Code-focused tasks
    if (caps.code) {
        return 'gemini-2.5-flash-lite';
    }
    // Default to balanced model
    return 'gemini-2.5-flash-lite';
}
//# sourceMappingURL=selectModel.js.map