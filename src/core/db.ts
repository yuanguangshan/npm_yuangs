import path from 'path';
import os from 'os';
import fs from 'fs';
import { AIRequestMessage } from './validation';

const DB_DIR = path.resolve(os.homedir(), '.yuangs_chat_history');
const DB_FILE = path.join(DB_DIR, 'history.db');
const JSON_FALLBACK = path.join(DB_DIR, 'history.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    try { fs.mkdirSync(DB_DIR, { recursive: true }); } catch {}
}

// Optional native sqlite — 12MB, 可能在部分平台/精简安装时缺失
let Database: any = null;
let databaseLoadError: string | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Database = require('better-sqlite3');
} catch (e: any) {
    databaseLoadError = e?.message || String(e);
    Database = null;
}

let dbInstance: any | null = null;
let warned = false;

function warnOnce(msg: string) {
    if (!warned) {
        warned = true;
        console.warn(`[db] ${msg}`);
        if (databaseLoadError) console.warn(`[db] better-sqlite3 加载失败: ${databaseLoadError}`);
        console.warn(`[db] 已回退到 JSON 文件存储: ${JSON_FALLBACK}`);
    }
}

function getDb(): any | null {
    if (!Database) return null;
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
        } catch (e: any) {
            warnOnce(`SQLite 初始化失败: ${e?.message}`);
            Database = null;
            return null;
        }
    }
    return dbInstance;
}

// ---------- JSON fallback + 内存兜底（沙盒/EPERM 时） ----------
let memoryFallback: AIRequestMessage[] = [];
let useMemoryOnly = false;

function readJsonHistory(): AIRequestMessage[] {
    if (useMemoryOnly) return [...memoryFallback];
    try {
        if (!fs.existsSync(JSON_FALLBACK)) return [...memoryFallback];
        const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [...memoryFallback];
        // 同步内存，避免文件与内存不一致
        memoryFallback = arr as AIRequestMessage[];
        return [...memoryFallback];
    } catch {
        return [...memoryFallback];
    }
}

function writeJsonHistory(messages: AIRequestMessage[]) {
    const sliced = messages.slice(-100);
    memoryFallback = [...sliced];
    if (useMemoryOnly) return;
    try {
        fs.writeFileSync(JSON_FALLBACK, JSON.stringify(sliced, null, 2), 'utf-8');
    } catch (e: any) {
        // EPERM 沙盒或只读文件系统，回退到纯内存
        useMemoryOnly = true;
        console.warn(`[db] JSON 回退写入失败，已切换到纯内存模式: ${e?.message}`);
    }
}

export function appendMessageToDB(role: string, content: string) {
    const db = getDb();
    if (db) {
        try {
            const stmt = db.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
            stmt.run(role, content, Date.now());
            return;
        } catch (e: any) {
            warnOnce(`SQLite 写入失败: ${e?.message}`);
        }
    }
    // JSON fallback
    const history = readJsonHistory();
    history.push({ role: role as any, content });
    // 内存也裁到 100
    writeJsonHistory(history);
}

export function getRecentMessagesFromDB(limit: number = 20): AIRequestMessage[] {
    const db = getDb();
    if (db) {
        try {
            const stmt = db.prepare('SELECT role, content FROM messages ORDER BY id DESC LIMIT ?');
            const rows = stmt.all(limit) as { role: string; content: string }[];
            return rows.reverse().map(row => ({
                role: row.role as 'system' | 'user' | 'assistant',
                content: row.content
            }));
        } catch (e: any) {
            warnOnce(`SQLite 读取失败: ${e?.message}`);
        }
    }
    // JSON fallback
    const history = readJsonHistory();
    return history.slice(-limit);
}

export function clearMessagesInDB() {
    const db = getDb();
    if (db) {
        try {
            db.exec('DELETE FROM messages');
        } catch (e: any) {
            warnOnce(`SQLite 清空失败: ${e?.message}`);
        }
    }
    // 同时清理 JSON 回退与内存
    memoryFallback = [];
    try {
        if (fs.existsSync(JSON_FALLBACK)) fs.unlinkSync(JSON_FALLBACK);
    } catch {}
}

export function isSqliteAvailable(): boolean {
    return !!Database && !!getDb();
}
