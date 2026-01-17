"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandHistory = getCommandHistory;
exports.saveHistory = saveHistory;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const validation_1 = require("../core/validation");
const HISTORY_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs_cmd_history.json');
function getCommandHistory() {
    if (fs_1.default.existsSync(HISTORY_FILE)) {
        try {
            return (0, validation_1.parseCommandHistory)(fs_1.default.readFileSync(HISTORY_FILE, 'utf8'));
        }
        catch (e) { }
    }
    return [];
}
function saveHistory(entry) {
    let history = getCommandHistory();
    const newEntry = {
        ...entry,
        time: new Date().toLocaleString()
    };
    // Keep last 1000, unique commands
    history = [newEntry, ...history.filter(item => item.command !== entry.command)].slice(0, 1000);
    fs_1.default.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}
//# sourceMappingURL=history.js.map