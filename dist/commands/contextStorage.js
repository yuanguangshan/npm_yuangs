"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContext = loadContext;
exports.saveContext = saveContext;
exports.clearContextStorage = clearContextStorage;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const CONTEXT_DIR = path_1.default.resolve(process.cwd(), '.ai');
const CONTEXT_FILE = path_1.default.join(CONTEXT_DIR, 'context.json');
async function loadContext() {
    try {
        const raw = await promises_1.default.readFile(CONTEXT_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
async function saveContext(items) {
    await promises_1.default.mkdir(CONTEXT_DIR, { recursive: true });
    await promises_1.default.writeFile(CONTEXT_FILE, JSON.stringify(items, null, 2));
}
async function clearContextStorage() {
    await promises_1.default.rm(CONTEXT_FILE, { force: true });
}
//# sourceMappingURL=contextStorage.js.map