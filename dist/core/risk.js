"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessRisk = assessRisk;
function assessRisk(command, aiRisk) {
    const HIGH_RISK_PATTERNS = [
        /\brm\b/i,
        /\bsudo\b/i,
        /\bmv\b/i,
        /\bdd\b/i,
        /\bchmod\b/i,
        /\bchown\b/i,
        />\s*\/dev\//,
        /:\(\)\s*\{.*\}/, // Fork bomb
        /\bmkfs\b/i,
    ];
    const hasHighRisk = HIGH_RISK_PATTERNS.some(pattern => pattern.test(command));
    if (hasHighRisk)
        return 'high';
    return aiRisk;
}
//# sourceMappingURL=risk.js.map