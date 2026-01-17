"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPABILITY_VERSION = exports.ConstraintCapability = exports.COMPOSITE_CAPABILITIES = exports.AtomicCapability = void 0;
exports.isAtomicCapability = isAtomicCapability;
exports.isConstraintCapability = isConstraintCapability;
exports.resolveCompositeCapability = resolveCompositeCapability;
exports.expandCapabilities = expandCapabilities;
var AtomicCapability;
(function (AtomicCapability) {
    AtomicCapability["TEXT_GENERATION"] = "text_generation";
    AtomicCapability["CODE_GENERATION"] = "code_generation";
    AtomicCapability["TOOL_CALLING"] = "tool_calling";
    AtomicCapability["LONG_CONTEXT"] = "long_context";
    AtomicCapability["REASONING"] = "reasoning";
    AtomicCapability["STREAMING"] = "streaming";
})(AtomicCapability || (exports.AtomicCapability = AtomicCapability = {}));
exports.COMPOSITE_CAPABILITIES = [
    {
        name: 'interactive_agent',
        composedOf: [AtomicCapability.TOOL_CALLING, AtomicCapability.REASONING],
    },
    {
        name: 'large_repo_analysis',
        composedOf: [AtomicCapability.LONG_CONTEXT, AtomicCapability.REASONING],
    },
    {
        name: 'safe_code_editing',
        composedOf: [AtomicCapability.CODE_GENERATION, AtomicCapability.REASONING],
    },
];
var ConstraintCapability;
(function (ConstraintCapability) {
    ConstraintCapability["PREFER_DETERMINISTIC"] = "prefer_deterministic";
    ConstraintCapability["LOW_COST"] = "low_cost";
    ConstraintCapability["FAST_RESPONSE"] = "fast_response";
})(ConstraintCapability || (exports.ConstraintCapability = ConstraintCapability = {}));
exports.CAPABILITY_VERSION = '1.0';
function isAtomicCapability(value) {
    return Object.values(AtomicCapability).includes(value);
}
function isConstraintCapability(value) {
    return Object.values(ConstraintCapability).includes(value);
}
function resolveCompositeCapability(name) {
    const composite = exports.COMPOSITE_CAPABILITIES.find(c => c.name === name);
    if (!composite) {
        throw new Error(`Unknown composite capability: ${name}`);
    }
    return composite.composedOf;
}
function expandCapabilities(capabilities) {
    const result = new Set();
    for (const cap of capabilities) {
        if (isAtomicCapability(cap)) {
            result.add(cap);
        }
        else {
            const atomicCaps = resolveCompositeCapability(cap);
            atomicCaps.forEach(c => result.add(c));
        }
    }
    return result;
}
//# sourceMappingURL=capabilities.js.map