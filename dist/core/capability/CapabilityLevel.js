"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityLevel = void 0;
exports.capabilityLevelToString = capabilityLevelToString;
exports.stringToCapabilityLevel = stringToCapabilityLevel;
exports.compareCapabilities = compareCapabilities;
exports.isCapabilityHigher = isCapabilityHigher;
exports.isCapabilityLower = isCapabilityLower;
exports.validateCapabilityMonotonicity = validateCapabilityMonotonicity;
exports.validateFallbackChain = validateFallbackChain;
var CapabilityLevel;
(function (CapabilityLevel) {
    CapabilityLevel[CapabilityLevel["SEMANTIC"] = 5] = "SEMANTIC";
    CapabilityLevel[CapabilityLevel["STRUCTURAL"] = 4] = "STRUCTURAL";
    CapabilityLevel[CapabilityLevel["LINE"] = 3] = "LINE";
    CapabilityLevel[CapabilityLevel["TEXT"] = 2] = "TEXT";
    CapabilityLevel[CapabilityLevel["NONE"] = 1] = "NONE";
})(CapabilityLevel || (exports.CapabilityLevel = CapabilityLevel = {}));
function capabilityLevelToString(level) {
    switch (level) {
        case CapabilityLevel.SEMANTIC:
            return 'SEMANTIC';
        case CapabilityLevel.STRUCTURAL:
            return 'STRUCTURAL';
        case CapabilityLevel.LINE:
            return 'LINE';
        case CapabilityLevel.TEXT:
            return 'TEXT';
        case CapabilityLevel.NONE:
            return 'NONE';
    }
}
function stringToCapabilityLevel(str) {
    const upper = str.toUpperCase();
    switch (upper) {
        case 'SEMANTIC':
            return CapabilityLevel.SEMANTIC;
        case 'STRUCTURAL':
            return CapabilityLevel.STRUCTURAL;
        case 'LINE':
            return CapabilityLevel.LINE;
        case 'TEXT':
            return CapabilityLevel.TEXT;
        case 'NONE':
            return CapabilityLevel.NONE;
        default:
            return undefined;
    }
}
function compareCapabilities(a, b) {
    return a - b;
}
function isCapabilityHigher(a, b) {
    return a > b;
}
function isCapabilityLower(a, b) {
    return a < b;
}
function validateCapabilityMonotonicity(levels) {
    if (levels.length <= 1)
        return true;
    for (let i = 0; i < levels.length - 1; i++) {
        if (levels[i] <= levels[i + 1]) {
            return false;
        }
    }
    return true;
}
function validateFallbackChain(minCapability) {
    if (minCapability.fallbackChain.length === 0) {
        return true;
    }
    if (!validateCapabilityMonotonicity([minCapability.minCapability, ...minCapability.fallbackChain])) {
        return false;
    }
    return minCapability.fallbackChain[minCapability.fallbackChain.length - 1] === CapabilityLevel.NONE;
}
//# sourceMappingURL=CapabilityLevel.js.map