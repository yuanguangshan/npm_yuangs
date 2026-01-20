"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDataDir = ensureDataDir;
exports.atomicWrite = atomicWrite;
exports.loadActions = loadActions;
exports.saveActions = saveActions;
exports.deserializeActions = deserializeActions;
exports.auditActions = auditActions;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const DATA_DIR = path_1.default.join(os_1.default.homedir(), ".yuangs");
const STORE_PATH = path_1.default.join(DATA_DIR, "actions.json");
function ensureDataDir() {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
}
function atomicWrite(filePath, data) {
    const tmpPath = `${filePath}.tmp.${Date.now()}`;
    try {
        fs_1.default.writeFileSync(tmpPath, data, "utf-8");
        fs_1.default.renameSync(tmpPath, filePath);
    }
    catch (error) {
        if (fs_1.default.existsSync(tmpPath)) {
            fs_1.default.unlinkSync(tmpPath);
        }
        throw error;
    }
}
function loadActions() {
    ensureDataDir();
    if (!fs_1.default.existsSync(STORE_PATH)) {
        return {};
    }
    try {
        const content = fs_1.default.readFileSync(STORE_PATH, "utf-8");
        const data = JSON.parse(content);
        return deserializeActions(data);
    }
    catch (error) {
        console.error(`Failed to load actions: ${error}`);
        return {};
    }
}
function saveActions(actions) {
    ensureDataDir();
    try {
        const content = JSON.stringify(actions, null, 2);
        atomicWrite(STORE_PATH, content);
    }
    catch (error) {
        console.error(`Failed to save actions: ${error}`);
        throw error;
    }
}
function deserializeActions(data) {
    const result = {};
    for (const [id, raw] of Object.entries(data)) {
        try {
            result[id] = validateAction(raw);
        }
        catch (error) {
            console.warn(`Invalid action ${id}, skipping: ${error}`);
        }
    }
    return result;
}
function validateAction(raw) {
    if (typeof raw.id !== "string" || !raw.id) {
        throw new Error("Action missing valid id");
    }
    const validStates = [
        "DRAFT",
        "PROPOSED",
        "APPROVED",
        "EXECUTED",
        "OBSERVED",
        "VERIFIED",
        "REJECTED",
    ];
    if (!validStates.includes(raw.state)) {
        throw new Error(`Invalid state: ${raw.state}`);
    }
    if (typeof raw.rationale !== "string") {
        throw new Error("Rationale must be a string");
    }
    if (typeof raw.updatedAt !== "number") {
        throw new Error("UpdatedAt must be a number");
    }
    if (raw.state === "EXECUTED" && !raw.executedAt) {
        throw new Error("EXECUTED actions must have executedAt");
    }
    return raw;
}
function auditActions(actions) {
    for (const [id, action] of Object.entries(actions)) {
        try {
            validateAction(action);
        }
        catch (error) {
            throw new Error(`Audit failed for action ${id}: ${error}`);
        }
    }
}
//# sourceMappingURL=store.js.map