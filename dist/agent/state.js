"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isToolCallPayload = isToolCallPayload;
exports.isShellCmdPayload = isShellCmdPayload;
exports.isAnswerPayload = isAnswerPayload;
/** 类型守卫辅助 */
function isToolCallPayload(payload) {
    return 'tool_name' in payload && typeof payload.tool_name === 'string';
}
function isShellCmdPayload(payload) {
    return 'command' in payload && typeof payload.command === 'string';
}
function isAnswerPayload(payload) {
    return ('content' in payload && typeof payload.content === 'string') ||
        ('text' in payload && typeof payload.text === 'string');
}
//# sourceMappingURL=state.js.map