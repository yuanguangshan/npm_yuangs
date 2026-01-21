"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendMessageToDB = appendMessageToDB;
exports.getRecentMessagesFromDB = getRecentMessagesFromDB;
exports.clearMessagesInDB = clearMessagesInDB;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const DB_DIR = path_1.default.resolve(os_1.default.homedir(), '.yuangs_chat_history');
const DB_FILE = path_1.default.join(DB_DIR, 'history.db');
// Ensure directory exists
if (!fs_1.default.existsSync(DB_DIR)) {
    fs_1.default.mkdirSync(DB_DIR, { recursive: true });
}
let dbInstance = null;
function getDb() {
    if (!dbInstance) {
        dbInstance = new better_sqlite3_1.default(DB_FILE);
        // Initialize schema
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
    return dbInstance;
}
function appendMessageToDB(role, content) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
    stmt.run(role, content, Date.now());
}
function getRecentMessagesFromDB(limit = 20) {
    const db = getDb();
    // Get last N messages order by timestamp desc, then reverse to get chronological order
    const stmt = db.prepare('SELECT role, content FROM messages ORDER BY id DESC LIMIT ?');
    const rows = stmt.all(limit);
    // Reverse to return in chronological order (oldest -> newest)
    return rows.reverse().map(row => ({
        role: row.role,
        content: row.content
    }));
}
function clearMessagesInDB() {
    const db = getDb();
    db.exec('DELETE FROM messages');
}
//# sourceMappingURL=db.js.map