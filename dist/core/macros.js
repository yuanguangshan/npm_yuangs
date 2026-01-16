"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMacros = getMacros;
exports.saveMacro = saveMacro;
exports.deleteMacro = deleteMacro;
exports.runMacro = runMacro;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const validation_1 = require("./validation");
const MACROS_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs_macros.json');
function getMacros() {
    if (fs_1.default.existsSync(MACROS_FILE)) {
        try {
            return (0, validation_1.parseMacros)(fs_1.default.readFileSync(MACROS_FILE, 'utf8'));
        }
        catch (e) { }
    }
    return {};
}
function saveMacro(name, commands, description = '') {
    const macros = getMacros();
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs_1.default.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}
function deleteMacro(name) {
    const macros = getMacros();
    if (macros[name]) {
        delete macros[name];
        fs_1.default.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}
function runMacro(name) {
    const macros = getMacros();
    const macro = macros[name];
    if (!macro)
        return false;
    const { spawn } = require('child_process');
    spawn(macro.commands, [], { shell: true, stdio: 'inherit' });
    return true;
}
//# sourceMappingURL=macros.js.map