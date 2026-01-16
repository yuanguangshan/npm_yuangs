import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseMacros, type Macro } from './validation';

const USER_MACROS_FILE = path.join(os.homedir(), '.yuangs_macros.json');

export type { Macro };

function loadMacrosFromFile(filePath: string): Record<string, Macro> {
    if (fs.existsSync(filePath)) {
        try {
            return parseMacros(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { }
    }
    return {};
}

function findProjectMacros(cwd = process.cwd()): string | null {
    let dir = cwd;
    while (dir && dir !== path.dirname(dir)) {
        const candidate = path.join(dir, 'yuangs_macros.json');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        dir = path.dirname(dir);
    }
    // Check root one last time
    const rootCandidate = path.join(targetRoot(dir), 'yuangs_macros.json');
    if (fs.existsSync(rootCandidate)) return rootCandidate;
    
    return null;
}

// Helper to reliably stop at root (dirname('/') is '/')
function targetRoot(dir: string) {
    return path.parse(dir).root;
}

export function getMacros(): Record<string, Macro> {
    const userMacros = loadMacrosFromFile(USER_MACROS_FILE);
    
    const projectMacrosPath = findProjectMacros();
    const projectMacros = projectMacrosPath ? loadMacrosFromFile(projectMacrosPath) : {};

    return {
        ...userMacros,
        ...projectMacros // Project overrides User
    };
}

export function saveMacro(name: string, commands: string, description: string = '') {
    // Only load USER macros for saving
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}

export function deleteMacro(name: string) {
    // Only delete from USER macros
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    if (macros[name]) {
        delete macros[name];
        fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}

export function runMacro(name: string) {
    const macros = getMacros();
    const macro = macros[name];
    if (!macro) return false;

    const { spawn } = require('child_process');
    spawn(macro.commands, [], { shell: true, stdio: 'inherit' });
    return true;
}
