"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessRisk = assessRisk;
function assessRisk(command, aiRisk) {
    const highRiskCommands = ['rm ', 'sudo ', 'mv ', 'dd ', '> /dev/', ':(){ :|:& };:'];
    const hasHighRisk = highRiskCommands.some(cmd => command.includes(cmd));
    if (hasHighRisk)
        return 'high';
    return aiRisk;
}
//# sourceMappingURL=risk.js.map