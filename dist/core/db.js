"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendMessageToDB = appendMessageToDB;
exports.getRecentMessagesFromDB = getRecentMessagesFromDB;
exports.clearMessagesInDB = clearMessagesInDB;
exports.isSqliteAvailable = isSqliteAvailable;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const DB_DIR = path_1.default.resolve(os_1.default.homedir(), '.yuangs_chat_history');
const DB_FILE = path_1.default.join(DB_DIR, 'history.db');
const JSON_FALLBACK = path_1.default.join(DB_DIR, 'history.json');
// Ensure directory exists
if (!fs_1.default.existsSync(DB_DIR)) {
    try {
        fs_1.default.mkdirSync(DB_DIR, { recursive: true });
    }
    catch { }
}
// Optional native sqlite — 12MB, 可能在部分平台/精简安装时缺失
let Database = null;
let databaseLoadError = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Database = require('better-sqlite3');
}
catch (e) {
    databaseLoadError = e?.message || String(e);
    Database = null;
}
let dbInstance = null;
let warned = false;
function warnOnce(msg) {
    if (!warned) {
        warned = true;
        console.warn(`[db] ${msg}`);
        if (databaseLoadError)
            console.warn(`[db] better-sqlite3 加载失败: ${databaseLoadError}`);
        console.warn(`[db] 已回退到 JSON 文件存储: ${JSON_FALLBACK}`);
    }
}
function getDb() {
    if (!Database)
        return null;
    if (!dbInstance) {
        try {
            dbInstance = new Database(DB_FILE);
            dbInstance.exec(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER DEFAULT (unixepoch())
                );
                CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);
            `);
        }
        catch (e) {
            warnOnce(`SQLite 初始化失败: ${e?.message}`);
            Database = null;
            return null;
        }
    }
    return dbInstance;
}
// ---------- JSON fallback + 内存兜底（沙盒/EPERM 时） ----------
let memoryFallback = [];
let useMemoryOnly = false;
function readJsonHistory() {
    if (useMemoryOnly)
        return [...memoryFallback];
    try {
        if (!fs_1.default.existsSync(JSON_FALLBACK))
            return [...memoryFallback];
        const raw = fs_1.default.readFileSync(JSON_FALLBACK, 'utf-8');
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr))
            return [...memoryFallback];
        // 同步内存，避免文件与内存不一致
        memoryFallback = arr;
        return [...memoryFallback];
    }
    catch {
        return [...memoryFallback];
    }
}
function writeJsonHistory(messages) {
    const sliced = messages.slice(-100);
    memoryFallback = [...sliced];
    if (useMemoryOnly)
        return;
    try {
        fs_1.default.writeFileSync(JSON_FALLBACK, JSON.stringify(sliced, null, 2), 'utf-8');
    }
    catch (e) {
        // EPERM 沙盒或只读文件系统，回退到纯内存
        useMemoryOnly = true;
        console.warn(`[db] JSON 回退写入失败，已切换到纯内存模式: ${e?.message}`);
    }
}
function appendMessageToDB(role, content) {
    const db = getDb();
    if (db) {
        try {
            const stmt = db.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
            stmt.run(role, content, Date.now());
            return;
        }
        catch (e) {
            warnOnce(`SQLite 写入失败: ${e?.message}`);
        }
    }
    // JSON fallback
    const history = readJsonHistory();
    history.push({ role: role, content });
    // 内存也裁到 100
    writeJsonHistory(history);
}
function getRecentMessagesFromDB(limit = 20) {
    const db = getDb();
    if (db) {
        try {
            const stmt = db.prepare('SELECT role, content FROM messages ORDER BY id DESC LIMIT ?');
            const rows = stmt.all(limit);
            return rows.reverse().map(row => ({
                role: row.role,
                content: row.content
            }));
        }
        catch (e) {
            warnOnce(`SQLite 读取失败: ${e?.message}`);
        }
    }
    // JSON fallback
    const history = readJsonHistory();
    return history.slice(-limit);
}
function clearMessagesInDB() {
    const db = getDb();
    if (db) {
        try {
            db.exec('DELETE FROM messages');
        }
        catch (e) {
            warnOnce(`SQLite 清空失败: ${e?.message}`);
        }
    }
    // 同时清理 JSON 回退与内存
    memoryFallback = [];
    try {
        if (fs_1.default.existsSync(JSON_FALLBACK))
            fs_1.default.unlinkSync(JSON_FALLBACK);
    }
    catch { }
}
function isSqliteAvailable() {
    return !!Database && !!getDb();
}
//# sourceMappingURL=db.js.map