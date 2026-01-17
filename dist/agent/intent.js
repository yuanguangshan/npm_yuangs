"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferIntent = inferIntent;
const capabilityInference_1 = require("../core/capabilityInference");
const capabilities_1 = require("../core/capabilities");
function inferIntent(input, mode) {
    if (mode === 'chat') {
        return {
            type: 'chat',
            capabilities: {
                reasoning: true,
                streaming: true,
                longContext: true,
            },
        };
    }
    // For command mode, use the existing capability inference
    const capReq = (0, capabilityInference_1.inferCapabilityRequirement)(input.rawInput);
    return {
        type: 'shell',
        capabilities: {
            reasoning: capReq.required.includes(capabilities_1.AtomicCapability.REASONING),
            code: capReq.required.includes(capabilities_1.AtomicCapability.CODE_GENERATION),
            longContext: capReq.required.includes(capabilities_1.AtomicCapability.LONG_CONTEXT),
        },
    };
}
//# sourceMappingURL=intent.js.map