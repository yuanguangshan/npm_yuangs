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
const USER_MACROS_FILE = path_1.default.join(os_1.default.homedir(), '.yuangs_macros.json');
function loadMacrosFromFile(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        try {
            return (0, validation_1.parseMacros)(fs_1.default.readFileSync(filePath, 'utf8'));
        }
        catch (e) { }
    }
    return {};
}
function findProjectMacros(cwd = process.cwd()) {
    let dir = cwd;
    while (dir && dir !== path_1.default.dirname(dir)) {
        const candidate = path_1.default.join(dir, 'yuangs_macros.json');
        if (fs_1.default.existsSync(candidate)) {
            return candidate;
        }
        dir = path_1.default.dirname(dir);
    }
    // Check root one last time
    const rootCandidate = path_1.default.join(targetRoot(dir), 'yuangs_macros.json');
    if (fs_1.default.existsSync(rootCandidate))
        return rootCandidate;
    return null;
}
// Helper to reliably stop at root (dirname('/') is '/')
function targetRoot(dir) {
    return path_1.default.parse(dir).root;
}
function getMacros() {
    const userMacros = loadMacrosFromFile(USER_MACROS_FILE);
    const projectMacrosPath = findProjectMacros();
    const projectMacros = projectMacrosPath ? loadMacrosFromFile(projectMacrosPath) : {};
    return {
        ...userMacros,
        ...projectMacros // Project overrides User
    };
}
function saveMacro(name, commands, description = '') {
    // Only load USER macros for saving
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs_1.default.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}
function deleteMacro(name) {
    // Only delete from USER macros
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    if (macros[name]) {
        delete macros[name];
        fs_1.default.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
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