"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRecordDir = ensureRecordDir;
exports.saveExecutionRecord = saveExecutionRecord;
exports.loadExecutionRecord = loadExecutionRecord;
exports.listExecutionRecords = listExecutionRecords;
exports.deleteExecutionRecord = deleteExecutionRecord;
exports.clearAllExecutionRecords = clearAllExecutionRecords;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const executionRecord_1 = require("./executionRecord");
const RECORD_DIR = path_1.default.join(os_1.default.homedir(), '.yuangs', 'executions');
function ensureRecordDir() {
    if (!fs_1.default.existsSync(RECORD_DIR)) {
        fs_1.default.mkdirSync(RECORD_DIR, { recursive: true });
    }
}
function saveExecutionRecord(record) {
    ensureRecordDir();
    const filename = `${record.id}.json`;
    const filepath = path_1.default.join(RECORD_DIR, filename);
    fs_1.default.writeFileSync(filepath, (0, executionRecord_1.serializeExecutionRecord)(record), 'utf8');
    return filepath;
}
function loadExecutionRecord(id) {
    ensureRecordDir();
    const filename = `${id}.json`;
    const filepath = path_1.default.join(RECORD_DIR, filename);
    if (!fs_1.default.existsSync(filepath)) {
        return null;
    }
    try {
        const content = fs_1.default.readFileSync(filepath, 'utf8');
        return (0, executionRecord_1.deserializeExecutionRecord)(content);
    }
    catch (error) {
        console.error(`Failed to load execution record ${id}:`, error);
        return null;
    }
}
function listExecutionRecords(limit = 50) {
    ensureRecordDir();
    const files = fs_1.default.readdirSync(RECORD_DIR)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => {
        const statA = fs_1.default.statSync(path_1.default.join(RECORD_DIR, a));
        const statB = fs_1.default.statSync(path_1.default.join(RECORD_DIR, b));
        return statB.mtimeMs - statA.mtimeMs;
    })
        .slice(0, limit);
    const records = [];
    for (const file of files) {
        const record = loadExecutionRecord(file.replace('.json', ''));
        if (record) {
            records.push(record);
        }
    }
    return records;
}
function deleteExecutionRecord(id) {
    ensureRecordDir();
    const filename = `${id}.json`;
    const filepath = path_1.default.join(RECORD_DIR, filename);
    if (!fs_1.default.existsSync(filepath)) {
        return false;
    }
    try {
        fs_1.default.unlinkSync(filepath);
        return true;
    }
    catch (error) {
        console.error(`Failed to delete execution record ${id}:`, error);
        return false;
    }
}
function clearAllExecutionRecords() {
    ensureRecordDir();
    const files = fs_1.default.readdirSync(RECORD_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
        const filepath = path_1.default.join(RECORD_DIR, file);
        try {
            fs_1.default.unlinkSync(filepath);
        }
        catch (error) {
            console.error(`Failed to delete ${filepath}:`, error);
        }
    }
}
//# sourceMappingURL=executionStore.js.map