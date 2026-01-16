import fs from 'fs';
import path from 'path';
import os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.yuangs_cmd_history.json');

export type HistoryEntry = {
    question: string;
    command: string;
    time: string;
};

export function getCommandHistory(): HistoryEntry[] {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) { }
    }
    return [];
}

export function saveHistory(entry: { question: string; command: string }) {
    let history = getCommandHistory();
    const newEntry: HistoryEntry = {
        ...entry,
        time: new Date().toLocaleString()
    };
    // Keep last 5, unique commands
    history = [newEntry, ...history.filter(item => item.command !== entry.command)].slice(0, 5);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}
