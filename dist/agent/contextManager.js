"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ContextManager {
    messages = [];
    maxHistorySize = 50;
    constructor(initialContext) {
        if (initialContext?.history) {
            this.messages = initialContext.history.map(msg => ({
                ...msg,
                timestamp: Date.now()
            }));
        }
        if (initialContext?.input) {
            this.addMessage('user', initialContext.input);
        }
    }
    addMessage(role, content) {
        this.messages.push({
            role,
            content,
            timestamp: Date.now()
        });
        if (this.messages.length > this.maxHistorySize) {
            this.messages = this.messages.slice(-this.maxHistorySize);
        }
    }
    addToolResult(toolName, result) {
        const content = `Tool ${toolName} returned:\n${result}`;
        this.addMessage('tool', content);
    }
    addObservation(observation, kind = 'system_note', originatingActionId) {
        const obsId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        this.addMessage('system', observation);
        this.messages[this.messages.length - 1].metadata = { kind, obsId };
        return obsId;
    }
    getLastAckableObservation() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            if (msg.role === 'system' && msg.metadata?.obsId) {
                return {
                    content: msg.content,
                    metadata: msg.metadata
                };
            }
        }
        return null;
    }
    getMessages() {
        return this.messages.map(({ role, content }) => ({
            role: role,
            content
        }));
    }
    getRecentMessages(count) {
        return this.messages.slice(-count);
    }
    getHash() {
        const content = JSON.stringify(this.messages);
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    getSnapshot() {
        return {
            inputHash: this.getHash(),
            systemPromptVersion: 'v1.0.0',
            toolSetVersion: 'v1.0.0',
            recentMessages: this.getRecentMessages(10)
        };
    }
    clear() {
        this.messages = [];
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=contextManager.js.map