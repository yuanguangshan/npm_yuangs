"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = exports.FileEventRecorder = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
class FileEventRecorder {
    events = [];
    logFile;
    flushInterval = 1000;
    constructor(logDir = '.yuangs_events') {
        this.logFile = path_1.default.join(logDir, `events_${Date.now()}.jsonl`);
    }
    async record(event) {
        this.events.push(event);
        if (this.events.length >= this.flushInterval) {
            await this.flush();
        }
    }
    async flush() {
        if (this.events.length === 0)
            return;
        const logDir = path_1.default.dirname(this.logFile);
        await promises_1.default.mkdir(logDir, { recursive: true });
        const content = this.events
            .map(e => JSON.stringify(e))
            .join('\n') + '\n';
        await promises_1.default.appendFile(this.logFile, content, 'utf8');
        this.events = [];
    }
    getEvents(executionId) {
        if (!executionId) {
            return [...this.events];
        }
        return this.events.filter(e => e.executionId === executionId);
    }
}
exports.FileEventRecorder = FileEventRecorder;
const createEvent = (executionId, type, data, metadata) => ({
    id: (0, crypto_1.randomUUID)(),
    timestamp: Date.now(),
    executionId,
    type,
    data,
    metadata
});
exports.createEvent = createEvent;
//# sourceMappingURL=recorder.js.map