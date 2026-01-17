"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferCapabilityRequirement = inferCapabilityRequirement;
const capabilities_1 = require("../core/capabilities");
function inferCapabilityRequirement(userInput) {
    const required = [];
    const input = userInput.toLowerCase();
    if (input.includes('代码') || input.includes('script') || input.includes('文件') || input.includes('create') || input.includes('write')) {
        required.push(capabilities_1.AtomicCapability.CODE_GENERATION);
    }
    if (input.includes('分析') || input.includes('理解') || input.includes('解释') || input.includes('推理')) {
        required.push(capabilities_1.AtomicCapability.REASONING);
    }
    if (input.includes('长') || input.includes('large') || input.includes('仓库') || input.includes('目录') || input.includes('所有文件')) {
        required.push(capabilities_1.AtomicCapability.LONG_CONTEXT);
    }
    return {
        required: Array.from(new Set(required)),
        preferred: [],
    };
}
//# sourceMappingURL=capabilityInference.js.map