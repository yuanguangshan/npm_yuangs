import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { AIRequestMessage } from './validation';

const DB_DIR = path.resolve(os.homedir(), '.yuangs_chat_history');
const DB_FILE = path.join(DB_DIR, 'history.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new Database(DB_FILE);
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

export function appendMessageToDB(role: string, content: string) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
    stmt.run(role, content, Date.now());
}

export function getRecentMessagesFromDB(limit: number = 20): AIRequestMessage[] {
    const db = getDb();
    // Get last N messages order by timestamp desc, then reverse to get chronological order
    const stmt = db.prepare('SELECT role, content FROM messages ORDER BY id DESC LIMIT ?');
    const rows = stmt.all(limit) as { role: string; content: string }[];

    // Reverse to return in chronological order (oldest -> newest)
    return rows.reverse().map(row => ({
        role: row.role as 'system' | 'user' | 'assistant',
        content: row.content
    }));
}

export function clearMessagesInDB() {
    const db = getDb();
    db.exec('DELETE FROM messages');
}
